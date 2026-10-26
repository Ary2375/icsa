import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, Signal, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';
import { ExperimentPicker } from '../../components/experiment-picker/experiment-picker';
import { Partition } from '../../models/decomposition.model';
import { Result } from '../../models/result.model';
import { DecompositionsService } from '../../services/decompositions/decompositions';
import { ResultsService } from '../../services/results/results';
import {
  decompositionCoverage,
  partitionStats,
  serviceEvolution,
  ServiceEvolutionKind,
} from '../../utils/decomposition-analysis';
import { decompositionPath, literaturePath } from '../../utils/decomposition-source';
import {
  defaultSelections,
  describeConfiguration,
  ExperimentOption,
  findOption,
  parseThesisStrategy,
  Selection,
} from '../../utils/experiment-selection';

interface Experiment extends ExperimentOption {
  caseStudy: string;
  source: string;
  observed: string | null;
}

type Loaded<T> =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'error'; message: string };

type Side = 'reference' | 'selected';

function describeError(error: unknown, path: string): string {
  if (error instanceof HttpErrorResponse) {
    return `Could not load ${path} (${error.status || 'network error'}).`;
  }
  return error instanceof Error ? error.message : `Could not read ${path}.`;
}

@Component({
  selector: 'app-comparator',
  imports: [DecimalPipe, FormsModule, ExperimentPicker],
  templateUrl: './comparator.html',
  styleUrl: './comparator.scss',
})
export class Comparator implements OnInit {
  private readonly resultsService = inject(ResultsService);
  private readonly decompositions = inject(DecompositionsService);
  private readonly destroyRef = inject(DestroyRef);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly experiments = signal<Experiment[]>([]);
  readonly caseStudy = signal('');
  readonly referenceChoice = signal<Selection | null>(null);
  readonly selectedChoice = signal<Selection | null>(null);
  private readonly roleText: Record<ServiceEvolutionKind, Record<Side, [string, string]>> = {
    new: { reference: ['', ''], selected: ['New', ''] },
    removed: { reference: ['Removed', ''], selected: ['', ''] },
    merged: { reference: ['Merged', 'into'], selected: ['Merged', 'combines'] },
    split: { reference: ['Split', 'into'], selected: ['Split part', 'from'] },
    redistributed: { reference: ['Reorganized', 'across'], selected: ['Reorganized', 'from'] },
    modified: { reference: ['Modified', 'now'], selected: ['Modified', 'was'] },
    renamed: { reference: ['Renamed', 'now'], selected: ['Renamed', 'was'] },
    unchanged: { reference: ['Unchanged', ''], selected: ['Unchanged', ''] },
    uncertain: { reference: ['Uncertain', 'overlaps'], selected: ['Uncertain', 'overlaps'] },
  };
  readonly repositories = computed(() =>
    [...new Set(this.experiments().map((experiment) => experiment.caseStudy))].sort(),
  );
  readonly activeCase = computed(() =>
    this.repositories().includes(this.caseStudy())
      ? this.caseStudy()
      : (this.repositories()[0] ?? ''),
  );
  readonly options = computed(() =>
    this.experiments().filter((experiment) => experiment.caseStudy === this.activeCase()),
  );
  readonly defaults = computed(() => defaultSelections(this.options()));
  readonly referenceSelection = computed(() => this.referenceChoice() ?? this.defaults().reference);
  readonly selectedSelection = computed(() => this.selectedChoice() ?? this.defaults().selected);
  readonly first = computed(() => findOption(this.options(), this.referenceSelection()));
  readonly second = computed(() => findOption(this.options(), this.selectedSelection()));
  // The decompositions are read from their files whenever the choice changes.
  private readonly referenceData = this.partitionsOf(this.first);
  private readonly selectedData = this.partitionsOf(this.second);
  private readonly classListData = toSignal(
    toObservable(this.activeCase).pipe(
      switchMap((caseStudy): Observable<Loaded<string[]>> =>
        caseStudy
          ? this.decompositions.classList(caseStudy).pipe(
              map((value): Loaded<string[]> => ({ status: 'ready', value })),
              startWith<Loaded<string[]>>({ status: 'loading' }),
              // Without the class list the comparison still works; coverage is unavailable.
              catchError(() => of<Loaded<string[]>>({ status: 'ready', value: [] })),
            )
          : of<Loaded<string[]>>({ status: 'idle' }),
      ),
    ),
    { initialValue: { status: 'idle' } as Loaded<string[]> },
  );
  readonly loadError = computed(() => {
    for (const data of [this.referenceData(), this.selectedData()]) {
      if (data.status === 'error') return data.message;
    }
    return '';
  });
  readonly evolution = computed(() => {
    const reference = this.referenceData();
    const selected = this.selectedData();
    if (reference.status !== 'ready' || selected.status !== 'ready') return null;
    if (this.classListData().status === 'loading') return null;
    return serviceEvolution(reference.value, selected.value);
  });
  readonly columns = computed(() => {
    const first = this.first();
    const second = this.second();
    const reference = this.referenceData();
    const selected = this.selectedData();
    const classList = this.classListData();
    if (
      !first ||
      !second ||
      reference.status !== 'ready' ||
      selected.status !== 'ready' ||
      !this.evolution()
    ) {
      return [];
    }
    const evolution = this.evolution()!;
    const universe = classList.status === 'ready' ? classList.value : [];
    const build = (
      key: Side,
      experiment: Experiment,
      partitions: Partition[],
      otherPartitions: Partition[],
    ) => {
      const roles = new Map<number, { kind: ServiceEvolutionKind; counterparts: string[] }>();
      for (const event of evolution.events) {
        const own = key === 'reference' ? event.origins : event.destinations;
        const counterparts = (key === 'reference' ? event.destinations : event.origins).map(
          (service) => service.name,
        );
        for (const service of own) roles.set(service.index, { kind: event.kind, counterparts });
      }
      const count = (list: Partition[]) => {
        const map = new Map<string, number[]>();
        list.forEach((partition, index) => {
          for (const name of partition.classes) map.set(name, [...(map.get(name) ?? []), index]);
        });
        return map;
      };
      const own = count(partitions);
      const there = count(otherPartitions);
      return {
        key,
        name: key === 'reference' ? 'Reference experiment' : 'Selected experiment',
        experiment,
        stats: partitionStats(partitions),
        coverage: decompositionCoverage(partitions, universe),
        services: partitions.map((partition, index) => {
          const role = roles.get(index) ?? { kind: 'uncertain' as const, counterparts: [] };
          const [label, relation] = this.roleText[role.kind][key];
          const isRepeated = (name: string) =>
            (own.get(name)?.length ?? 0) > 1 || (there.get(name)?.length ?? 0) > 1;
          // The "home" is the service on the other side that keeps most of this service's classes.
          const shared = new Map<number, number>();
          for (const name of new Set(partition.classes)) {
            const target = there.get(name);
            if (!isRepeated(name) && target)
              shared.set(target[0], (shared.get(target[0]) ?? 0) + 1);
          }
          const home = [...shared].sort(
            ([a, countA], [b, countB]) =>
              countB - countA ||
              Number(otherPartitions[b].name === partition.name) -
                Number(otherPartitions[a].name === partition.name) ||
              a - b,
          )[0]?.[0];
          return {
            name: partition.name,
            kind: role.kind,
            label,
            relation,
            counterparts: role.counterparts,
            classes: partition.classes,
            classItems: [...partition.classes]
              .sort(
                (a, b) =>
                  a.localeCompare(b, undefined, { sensitivity: 'base' }) || a.localeCompare(b),
              )
              .map((name) => {
                const elsewhere = there.get(name) ?? [];
                if (isRepeated(name))
                  return { name, mark: 'ambiguous', note: 'repeated assignment' };
                if (!elsewhere.length)
                  return {
                    name,
                    mark: 'only-here',
                    note: key === 'reference' ? 'not in selected' : 'not in reference',
                  };
                return elsewhere[0] === home
                  ? { name, mark: 'same', note: '' }
                  : {
                      name,
                      mark: 'moved',
                      note: `${key === 'reference' ? '→' : '←'} ${otherPartitions[elsewhere[0]].name}`,
                    };
              }),
          };
        }),
      };
    };
    return [
      build('reference', first, reference.value, selected.value),
      build('selected', second, selected.value, reference.value),
    ];
  });
  readonly coverageChange = computed(() => {
    const [reference, selected] = this.columns();
    if (!reference || !selected || reference.coverage.percent === null) return null;
    const before = new Set(reference.coverage.covered);
    const after = new Set(selected.coverage.covered);
    return {
      reference: reference.coverage.percent,
      selected: selected.coverage.percent!,
      onlyReference: reference.coverage.covered.filter((name) => !after.has(name)).length,
      onlySelected: selected.coverage.covered.filter((name) => !before.has(name)).length,
    };
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.resultsService.getResults().subscribe({
      next: (results) => {
        try {
          this.experiments.set(this.toExperiments(results));
        } catch (error: unknown) {
          this.error.set(error instanceof Error ? error.message : 'Invalid experiment data.');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load the experiments (results.json). Check the network.');
        this.loading.set(false);
      },
    });
  }

  changeRepository(value: string): void {
    this.caseStudy.set(value);
    this.referenceChoice.set(null);
    this.selectedChoice.set(null);
  }

  private partitionsOf(experiment: Signal<Experiment | null>): Signal<Loaded<Partition[]>> {
    return toSignal(
      toObservable(experiment).pipe(
        switchMap((item): Observable<Loaded<Partition[]>> =>
          item
            ? this.decompositions.partitions(item.source).pipe(
                map((value): Loaded<Partition[]> => ({ status: 'ready', value })),
                startWith<Loaded<Partition[]>>({ status: 'loading' }),
                catchError((error: unknown) =>
                  of<Loaded<Partition[]>>({
                    status: 'error',
                    message: describeError(error, item.source),
                  }),
                ),
              )
            : of<Loaded<Partition[]>>({ status: 'idle' }),
        ),
      ),
      { initialValue: { status: 'idle' } as Loaded<Partition[]> },
    );
  }

  // Every evaluated experiment of results.json is comparable: the LLM runs and the
  // state-of-the-art methods, each read from its own decomposition file.
  private toExperiments(results: Result[]): Experiment[] {
    const experiments = results.map((result): Experiment => {
      const observed =
        result.observedEntities != null && result.observedEntitiesPercent != null
          ? `${result.observedEntities} (${result.observedEntitiesPercent.toFixed(1)}%)`
          : null;
      if (result.comparisonGroup === 'literature') {
        const source = literaturePath(result.caseStudy, result.tool, result.strategy);
        if (!source) {
          throw new Error(
            `No data folder is configured for ${result.caseStudy} / ${result.tool}. Add it to decomposition-source.ts.`,
          );
        }
        return {
          id: source,
          kind: 'literature',
          caseStudy: result.caseStudy,
          tool: result.tool,
          chunk: '',
          mode: '',
          variant: result.strategy,
          label: result.toolLabel,
          source,
          observed,
        };
      }
      const parsed = parseThesisStrategy(result.strategy);
      if (!parsed) throw new Error(`Unsupported experiment strategy: ${result.strategy}`);
      const source = decompositionPath(
        result.caseStudy,
        result.tool,
        parsed.chunk,
        parsed.mode,
        parsed.variant,
      );
      if (!source) {
        throw new Error(
          `No data folder is configured for ${result.caseStudy} / ${result.tool}. Add it to decomposition-source.ts.`,
        );
      }
      return {
        id: source,
        kind: 'llm',
        caseStudy: result.caseStudy,
        tool: result.tool,
        ...parsed,
        label: describeConfiguration(result.tool, parsed.chunk, parsed.mode, parsed.variant),
        source,
        observed,
      };
    });
    if (new Set(experiments.map((item) => item.id)).size !== experiments.length) {
      throw new Error('Duplicate experiments in results.json.');
    }
    return experiments;
  }
}

import { Component, computed, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Metric, Result } from '../../models/result.model';
import { compareChunks, compareKinds, isBaseline, parseStrategy, strategyFamily, StrategyFamily } from '../../utils/chart-colors';

interface ComparisonRow {
  readonly result: Result;
  readonly baseline: Result | null;
  readonly isBaseline: boolean;
  // First row of a chunk block (baseline + the variants compared against it).
  readonly blockStart: boolean;
}

interface FamilyGroup {
  readonly family: string;
  readonly label: string;
  readonly rows: ComparisonRow[];
}

interface CaseStudyGroup {
  readonly caseStudy: string;
  readonly families: FamilyGroup[];
}

@Component({
  imports: [DecimalPipe],
  selector: 'app-table-view',
  styleUrl: './table-view.scss',
  templateUrl: './table-view.html',
})
export class TableView {
  readonly results = input<Result[]>([]);
  readonly comparisonResults = input<Result[]>();
  readonly metrics = input<Metric[]>([]);
  readonly comparisonKey = signal('baseline');
  private readonly comparisonSource = computed(() => this.comparisonResults() ?? this.results());
  readonly comparisonOptions = computed(() => {
    const references = new Map<string, string>();
    for (const result of this.comparisonSource()) {
      if (result.comparisonGroup === 'literature') references.set(result.configKey, result.toolLabel);
    }
    return [...references].map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });
  readonly comparisonLabel = computed(() => this.comparisonKey() === 'baseline'
    ? 'matching baseline'
    : this.comparisonOptions().find(option => option.value === this.comparisonKey())?.label ?? this.comparisonKey());
  readonly missingReferences = computed(() => {
    if (this.comparisonKey() === 'baseline') return [];
    return [...new Set(this.results().map(result => result.caseStudy))]
      .filter(caseStudy => !this.selectedReference(caseStudy));
  });
  readonly columnCount = computed(() => 4 + this.metrics().length);
  readonly groupedResults = computed(() => {
    const groups = new Map<string, Result[]>();

    for (const result of this.results()) {
      const group = groups.get(result.caseStudy) ?? [];
      group.push(result);
      groups.set(result.caseStudy, group);
    }

    return [...groups].map(([caseStudy, results]): CaseStudyGroup => {
      const llmResults = results.filter(result => result.comparisonGroup === 'llm');
      const referenceResults = results
        .filter(result => result.comparisonGroup === 'literature')
        .sort((a, b) => a.tool.localeCompare(b.tool) || a.strategy.localeCompare(b.strategy));
      return {
        caseStudy,
        families: [
          ...(['ai', 'concat'] as const)
            .map(family => ({ family, label: `${family} family`, rows: this.familyRows(llmResults, family) }))
            .filter(group => group.rows.length),
          ...(referenceResults.length ? [{
            family: 'literature',
            label: 'State-of-the-art reference results',
            rows: referenceResults.map((result, index) => ({
              result,
              baseline: this.selectedReference(result.caseStudy),
              isBaseline: false,
              blockStart: index === 0 || referenceResults[index - 1].tool !== result.tool,
            })),
          }] : []),
        ],
      };
    });
  });

  // Variants are compared with the plain strategy of the same family, tool and chunk (e.g. 30k_ai_dfg vs 30k_ai).
  private familyRows(results: Result[], family: StrategyFamily): ComparisonRow[] {
    const parsed = results
      .map(result => ({ result, ...parseStrategy(result.strategy) }))
      .filter(p => strategyFamily(p.kind) === family);
    const baselineKey = (tool: string, chunk: string) => `${tool}|${chunk}`;
    const baselines = new Map(this.comparisonSource()
      .filter(result => result.caseStudy === results[0]?.caseStudy && result.comparisonGroup === 'llm')
      .map(result => ({ result, ...parseStrategy(result.strategy) }))
      .filter(p => strategyFamily(p.kind) === family && isBaseline(p.kind))
      .map(p => [baselineKey(p.result.tool, p.chunk), p.result]));

    const ordered = parsed.sort(
      (a, b) =>
        compareChunks(a.chunk, b.chunk) ||
        a.result.tool.localeCompare(b.result.tool) ||
        compareKinds(a.kind, b.kind),
    );

    return ordered.map((p, index) => {
      const previous = ordered[index - 1];
      return {
        result: p.result,
        isBaseline: isBaseline(p.kind),
        baseline: this.comparisonKey() === 'baseline'
          ? isBaseline(p.kind) ? null : baselines.get(baselineKey(p.result.tool, p.chunk)) ?? null
          : this.selectedReference(p.result.caseStudy),
        blockStart: !previous || previous.chunk !== p.chunk || previous.result.tool !== p.result.tool,
      };
    });
  }

  private selectedReference(caseStudy: string): Result | null {
    if (this.comparisonKey() === 'baseline') return null;
    return this.comparisonSource().find(result =>
      result.caseStudy === caseStudy &&
      result.comparisonGroup === 'literature' &&
      result.configKey === this.comparisonKey(),
    ) ?? null;
  }

  metricDelta(row: ComparisonRow, metric: Metric): number | null {
    if (!row.baseline || row.result.configKey === row.baseline.configKey) return null;
    const delta = Math.round((row.result[metric] - row.baseline[metric]) * 10) / 10;
    return delta === 0 ? 0 : delta;
  }
}

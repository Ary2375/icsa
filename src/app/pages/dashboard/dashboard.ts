import { Component, computed, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { BarView } from '../../components/bar-view/bar-view';
import { RadarView } from '../../components/radar-view/radar-view';
import { Filters } from '../../components/filters/filters';
import { TableView } from '../../components/table-view/table-view';
import { Metric, METRICS, Result } from '../../models/result.model';
import { ResultsService } from '../../services/results/results';
import { buildConfigColors, compareChunks, compareVariants, parseStrategy, variantOf } from '../../utils/chart-colors';

@Component({
  imports: [MatCardModule, Filters, BarView, RadarView, TableView],
  selector: 'app-dashboard',
  styleUrls: ['./dashboard.scss'],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {

  readonly results = signal<Result[]>([]);
  readonly viewMode = signal<'table' | 'bar' | 'radar'>('bar');
  // Tabs stay stable even when the config filters exclude everything.
  readonly radarCaseStudies = computed(() => [...new Set(this.results().map(result => result.caseStudy))]);

  readonly selectedConfigs = signal<string[]>([]);
  readonly selectedMetrics = signal<Metric[]>([...METRICS]);

  readonly filteredResults = computed(() => {
    const configs = new Set(this.selectedConfigs());
    return this.results().filter(r => configs.has(r.configKey));
  });

  // Computed on all results so colors stay stable while filtering.
  readonly colors = computed(() => buildConfigColors(this.results()));

  // ai and concat share colors, so the legend lists variants only.
  readonly legendGroups = computed(() => {
    const colors = this.colors();
    const groups = new Map<string, Map<string, string>>();
    for (const r of this.filteredResults()) {
      if (r.comparisonGroup !== 'llm') continue;
      const { chunk, kind } = parseStrategy(r.strategy);
      const variant = variantOf(kind);
      if (!groups.has(variant)) groups.set(variant, new Map());
      groups.get(variant)!.set(chunk, colors[r.configKey]);
    }
    return [...groups]
      .sort(([a], [b]) => compareVariants(a, b))
      .map(([variant, chunks]) => ({
        name: variant || 'baseline',
        baseline: !variant,
        items: [...chunks]
          .map(([chunk, color]) => ({ chunk, color }))
          .sort((a, b) => compareChunks(a.chunk, b.chunk)),
      }));
  });
  readonly referenceTools = computed(() => {
    const tools = new Map<string, string>();
    for (const result of this.filteredResults()) {
      if (result.comparisonGroup === 'literature') tools.set(result.toolLabel, this.colors()[result.configKey]);
    }
    return [...tools].sort(([a], [b]) => a.localeCompare(b)).map(([name, color]) => ({ name, color }));
  });

  readonly selectedRepository = signal('');
  // Falls back to the first repository when the selected one is filtered out.
  readonly activeRepository = computed(() => {
    const repositories = this.radarCaseStudies();
    return repositories.includes(this.selectedRepository()) ? this.selectedRepository() : (repositories[0] ?? '');
  });
  readonly repositoryResults = computed(() =>
    this.filteredResults().filter(r => r.caseStudy === this.activeRepository()),
  );

  constructor(private resultsService: ResultsService) { }

  ngOnInit(): void {
    this.resultsService
      .getResults()
      .subscribe(data => {
        this.results.set(data);
        this.selectedConfigs.set([...new Set(data.map(r => r.configKey))]);
      });
  }
}

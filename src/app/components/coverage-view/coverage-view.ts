import { afterNextRender, Component, computed, DestroyRef, effect, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { Chart, ChartData, Legend, LinearScale, PointElement, ScatterController, Title, Tooltip } from 'chart.js';
import { Metric, Result } from '../../models/result.model';
import { isBaseline, parseStrategy } from '../../utils/chart-colors';

Chart.register(ScatterController, LinearScale, PointElement, Legend, Title, Tooltip);

@Component({
  selector: 'app-coverage-view',
  template: `
    <p>Each point is a configuration. Further right = more observed entities; higher = a higher {{ metric() }} value, not necessarily a better result.</p>
    <ul class="point-legend" aria-label="Point shape legend">
      <li><span aria-hidden="true">●</span> Experiments</li>
      <li><span aria-hidden="true">■</span> Baselines</li>
      <li><span aria-hidden="true">◆</span> State of the art</li>
    </ul>
    <details><summary>How to read this chart</summary>
      <p>Hover over a point to identify its configuration. Use the sidebar filters to select configurations and metrics. Overlapping results may share the same point.</p>
      <p>Coverage follows observed entities in the source dataset, not verified output completeness.</p>
    </details>
    @if (missingCount()) {
      <p role="status">{{ missingCount() }} results excluded because coverage or the selected metric is unavailable.</p>
    }
    @if (!points().length) {
      <p>No results with observed-entity coverage for the selected filters.</p>
    }
    <div class="chart-canvas"><canvas #canvas [attr.aria-label]="'Observed entities (%) vs ' + metric()" role="img"></canvas></div>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    p { color: var(--color-body); font-size: 0.75rem; }
    details { color: var(--color-body); font-size: 0.75rem; margin: 0.75rem 0; }
    summary { cursor: pointer; }
    .point-legend { display: flex; flex-wrap: wrap; gap: 1rem; padding: 0; list-style: none; font-size: 0.8rem; }
    .point-legend span { margin-right: 0.25rem; }
    .chart-canvas { position: relative; width: 100%; height: 440px; }
  `,
})
export class CoverageView {
  readonly results = input<Result[]>([]);
  readonly metric = input<Metric>('CMod');
  readonly colors = input<Record<string, string>>({});
  readonly points = computed(() => this.results().filter(result =>
    result.observedEntitiesPercent != null &&
    Number.isFinite(result.observedEntitiesPercent) && Number.isFinite(result[this.metric()]),
  ));
  readonly missingCount = computed(() => this.results().length - this.points().length);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly rendered = signal(false);
  private chart?: Chart<'scatter'>;

  buildData(): ChartData<'scatter'> {
    return {
      datasets: this.points().map(result => {
        const kind = parseStrategy(result.strategy).kind;
        const baseline = isBaseline(kind);
        const reference = result.comparisonGroup === 'literature';
        const color = this.colors()[result.configKey];
        return {
          label: result.configLabel,
          data: [{ x: result.observedEntitiesPercent!, y: result[this.metric()] }],
          backgroundColor: color,
          borderColor: color,
          pointStyle: reference ? 'rectRot' : baseline ? 'rect' : 'circle',
          pointRadius: 5,
          pointHoverRadius: 7,
        };
      }),
    };
  }

  constructor() {
    afterNextRender(() => this.rendered.set(true));
    effect(() => {
      if (!this.rendered()) return;
      const data = this.buildData();
      const metric = this.metric();
      this.chart?.destroy();
      this.chart = new Chart<'scatter'>(this.canvas().nativeElement, {
        type: 'scatter',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: true, text: `${metric} · ${this.results()[0]?.caseStudy ?? ''}` },
            tooltip: {
              callbacks: {
                label: context => {
                  const result = this.points()[context.datasetIndex];
                  return `${result.configLabel}: observed ${result.observedEntities ?? 'N/A'} entities (${context.parsed.x}%), ${metric} ${context.parsed.y}`;
                },
              },
            },
          },
          scales: {
            x: {
              min: -5, max: 105,
              ticks: { stepSize: 5, autoSkip: false, callback: value => Number(value) >= 0 && Number(value) <= 100 && Number(value) % 10 === 0 ? value : '' },
              title: { display: true, text: 'Observed entities (%)' },
            },
            y: { min: -5, suggestedMax: 105, title: { display: true, text: metric } },
          },
        },
      });
    });
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }
}

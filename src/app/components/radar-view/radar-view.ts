import { afterNextRender, Component, DestroyRef, effect, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { Chart, ChartData, Filler, Legend, LineElement, PointElement, RadarController, RadialLinearScale, Title, Tooltip } from 'chart.js';
import { Metric, METRICS, Result } from '../../models/result.model';
import { parseStrategy, strategyFamily, withAlpha } from '../../utils/chart-colors';

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Legend, Title, Tooltip);

@Component({
  imports: [],
  selector: 'app-radar-view',
  styleUrl: './radar-view.scss',
  templateUrl: './radar-view.html',
})
export class RadarView {
  readonly results = input<Result[]>([]);
  readonly fullResults = input<Result[]>([]);
  readonly metrics = input<Metric[]>([...METRICS]);
  readonly caseStudy = input<string>('');
  readonly colors = input<Record<string, string>>({});

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly rendered = signal(false);
  private chart?: Chart<'radar'>;

  constructor() {
    afterNextRender(() => this.rendered.set(true));
    effect(() => {
      if (!this.rendered()) return;
      const metrics = this.metrics();
      const caseStudy = this.caseStudy();
      const rows = this.results().filter(result => result.caseStudy === caseStudy);
      const colors = this.colors();
      // With many series, filled areas hide each other: draw lines only.
      const crowded = rows.length > 6;
      const datasets = rows.map(result => ({
          label: result.configLabel,
          data: metrics.map(metric => result[metric]),
          borderColor: colors[result.configKey],
          backgroundColor: colors[result.configKey],
          borderWidth: crowded ? 1.5 : 2,
          // Same colors are shared by ai and concat, so concat is dashed.
          borderDash: strategyFamily(parseStrategy(result.strategy).kind) === 'concat' ? [6, 4] : [],
          pointRadius: crowded ? 2 : 3,
          fill: false,
        }));
      // Full integration test: same color, translucent area and dotted outline.
      const fullDatasets = this.fullResults()
        .filter(result => result.caseStudy === caseStudy)
        .map(result => ({
          label: `${result.configLabel} (full integration test)`,
          data: metrics.map(metric => result[metric]),
          borderColor: withAlpha(colors[result.configKey], 0.7),
          backgroundColor: withAlpha(colors[result.configKey], 0.2),
          borderWidth: 1.5,
          borderDash: [2, 3],
          pointRadius: 2,
          pointStyle: 'triangle',
          fill: true,
        }));
      const data: ChartData<'radar'> = { labels: metrics, datasets: [...datasets, ...fullDatasets] };

      if (this.chart) {
        this.chart.data = data;
        this.chart.options.plugins!.title!.text = caseStudy;
        this.chart.update();
      } else {
        this.chart = new Chart<'radar'>(this.canvas().nativeElement, {
          type: 'radar',
          data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: { display: true, text: caseStudy, font: { size: 16 } },
              legend: { display: false },
            },
            scales: { r: { beginAtZero: true, suggestedMax: 100 } },
          },
        });
      }
    });
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }
}

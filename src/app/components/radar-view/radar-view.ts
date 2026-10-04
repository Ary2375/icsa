import { afterNextRender, Component, DestroyRef, effect, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { Chart, ChartData, Filler, Legend, LineElement, PointElement, RadarController, RadialLinearScale, Title, Tooltip } from 'chart.js';
import { Metric, METRICS, Result } from '../../models/result.model';

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Legend, Title, Tooltip);

@Component({
  imports: [],
  selector: 'app-radar-view',
  styleUrl: './radar-view.scss',
  templateUrl: './radar-view.html',
})
export class RadarView {
  readonly results = input<Result[]>([]);
  readonly metrics = input<Metric[]>([...METRICS]);
  readonly caseStudy = input<string>('');

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
      const data: ChartData<'radar'> = {
        labels: metrics,
        datasets: rows.map((result, index) => ({
          label: result.configLabel,
          data: metrics.map(metric => result[metric]),
          borderColor: `hsl(${Math.round(index * 360 / rows.length)}, 65%, 45%)`,
          backgroundColor: `hsla(${Math.round(index * 360 / rows.length)}, 65%, 45%, 0.08)`,
          borderWidth: 2,
          pointRadius: 3,
          fill: true,
        })),
      };

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
              legend: { position: 'bottom', labels: { boxWidth: 12 } },
            },
            scales: { r: { beginAtZero: true, suggestedMax: 100 } },
          },
        });
      }
    });
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }
}

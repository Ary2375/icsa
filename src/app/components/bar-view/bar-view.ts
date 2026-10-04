import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartData,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { Metric, Result } from '../../models/result.model';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Legend, Title, Tooltip);

@Component({
  imports: [],
  selector: 'app-bar-view',
  styleUrl: './bar-view.scss',
  templateUrl: './bar-view.html',
})
export class BarView {
  readonly results = input<Result[]>([]);
  readonly metric = input<Metric>('CMod');

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  // Chart.js needs a real canvas, so wait for the browser render (SSR-safe).
  private readonly rendered = signal(false);
  private chart?: Chart<'bar'>;

  constructor() {
    afterNextRender(() => this.rendered.set(true));

    effect(() => {
      if (!this.rendered()) return;
      this.render(this.buildData(this.results(), this.metric()));
    });

    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }

  // X axis: case studies; one dataset per tool + strategy configuration.
  private buildData(results: Result[], metric: Metric): ChartData<'bar'> {
    const caseStudies = [...new Set(results.map(r => r.caseStudy))];
    const configs = [...new Map(results.map(r => [r.configKey, r.configLabel])).entries()];

    return {
      labels: caseStudies,
      datasets: configs.map(([key, label], i) => {
        const color = `hsl(${Math.round((i * 360) / configs.length)}, 65%, 55%)`;
        return {
          label,
          backgroundColor: color,
          borderColor: color,
          data: caseStudies.map(
            cs => results.find(r => r.caseStudy === cs && r.configKey === key)?.[metric] ?? null,
          ) as number[],
        };
      }),
    };
  }

  private render(data: ChartData<'bar'>): void {
    const title = this.metric();

    if (this.chart) {
      this.chart.data = data;
      this.chart.options.plugins!.title!.text = title;
      this.chart.update();
      return;
    }

    this.chart = new Chart<'bar'>(this.canvas().nativeElement, {
      type: 'bar',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: title, font: { size: 16 } },
          legend: { position: 'bottom', labels: { boxWidth: 12 } },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          y: { beginAtZero: true, suggestedMax: 100 },
        },
      },
    });
  }
}

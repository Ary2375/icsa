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
  readonly legendItems = signal<{ label: string; color: string }[]>([]);

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

    const datasets = configs.map(([key, label], index) => {
        const color = `hsl(${Math.round((index * 360) / configs.length)}, 65%, 55%)`;
        return {
          label,
          backgroundColor: color,
          borderColor: color,
          data: caseStudies.map(
            cs => results.find(r => r.caseStudy === cs && r.configKey === key)?.[metric] ?? null,
          ) as number[],
        };
      });

    this.legendItems.set(datasets.map(dataset => ({
      label: dataset.label ?? '',
      color: String(dataset.backgroundColor),
    })));

    return { labels: caseStudies, datasets };
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
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          y: { beginAtZero: true, suggestedMax: 100 },
        },
      },
    });
  }
}

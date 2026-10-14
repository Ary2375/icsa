import {
  afterNextRender,
  Component,
  computed,
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
  Plugin,
  Title,
  Tooltip,
} from 'chart.js';
import { Metric, Result } from '../../models/result.model';
import { compareChunks, compareKinds, isBaseline, parseStrategy, strategyFamily } from '../../utils/chart-colors';

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
  readonly colors = input<Record<string, string>>({});

  private readonly title = computed(() => {
    const caseStudy = this.results()[0]?.caseStudy;
    return caseStudy ? `${this.metric()} · ${caseStudy}` : this.metric();
  });

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  // Chart.js needs a real canvas, so wait for the browser render (SSR-safe).
  private readonly rendered = signal(false);
  private chart?: Chart<'bar'>;
  // Per x category, read by the plugin below.
  private categories: { baseline: boolean; family: string }[] = [];

  // Shades baseline categories and draws a divider between the ai and concat families.
  private readonly familyPlugin: Plugin<'bar'> = {
    id: 'familyBands',
    beforeDatasetsDraw: chart => {
      const { ctx, chartArea, scales } = chart;
      const x = scales['x'];
      const count = this.categories.length;
      if (!count) return;
      const step = count > 1 ? x.getPixelForValue(1) - x.getPixelForValue(0) : chartArea.width;

      ctx.save();
      this.categories.forEach((category, i) => {
        const left = x.getPixelForValue(i) - step / 2;
        if (category.baseline) {
          ctx.fillStyle = 'rgba(128, 128, 128, 0.14)';
          ctx.fillRect(left, chartArea.top, step, chartArea.height);
        }
        if (i > 0 && this.categories[i - 1].family !== category.family) {
          ctx.strokeStyle = 'rgba(128, 128, 128, 0.8)';
          ctx.setLineDash([6, 4]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(left, chartArea.top);
          ctx.lineTo(left, chartArea.bottom);
          ctx.stroke();
        }
      });
      ctx.restore();
    },
  };

  constructor() {
    afterNextRender(() => this.rendered.set(true));

    effect(() => {
      if (!this.rendered()) return;
      this.render(this.buildData(this.results(), this.metric(), this.colors()));
    });

    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }

  // X axis: strategy kinds; one dataset (bar) per chunk size. Results belong to a single case study.
  private buildData(results: Result[], metric: Metric, colors: Record<string, string>): ChartData<'bar'> {
    const parsed = results.map(r => ({ r, ...parseStrategy(r.strategy) }));
    const multiTool = new Set(results.map(r => r.tool)).size > 1;
    const groupOf = (p: { r: Result; kind: string }) => `${p.r.tool}|${p.kind}`;

    const kindOf = (group: string) => group.split('|')[1];
    const groups = [...new Set(parsed.map(groupOf))].sort(
      (a, b) => compareKinds(kindOf(a), kindOf(b)) || a.localeCompare(b),
    );
    const chunks = [...new Set(parsed.map(p => p.chunk))].sort(compareChunks);
    this.categories = groups.map(g => ({ baseline: isBaseline(kindOf(g)), family: strategyFamily(kindOf(g)) }));
    const labels = groups.map(g => {
      const [tool, kind] = g.split('|');
      const name = multiTool ? `${tool.replace(/^LLM:\s*/, '')} · ${kind}` : kind;
      return isBaseline(kind) ? [name, '(baseline)'] : name;
    });

    const datasets = chunks.map(chunk => {
      const rows = groups.map(g => parsed.find(p => groupOf(p) === g && p.chunk === chunk)?.r);
      return {
        label: chunk,
        backgroundColor: rows.map(r => (r ? colors[r.configKey] : 'transparent')),
        data: rows.map(r => r?.[metric] ?? null) as number[],
      };
    });

    return { labels, datasets };
  }

  private render(data: ChartData<'bar'>): void {
    const title = this.title();

    if (this.chart) {
      this.chart.data = data;
      this.chart.options.plugins!.title!.text = title;
      this.chart.update();
      return;
    }

    this.chart = new Chart<'bar'>(this.canvas().nativeElement, {
      type: 'bar',
      data,
      plugins: [this.familyPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: title, font: { size: 16 } },
          legend: { display: false },
          tooltip: { mode: 'nearest', intersect: true },
        },
        scales: {
          y: { beginAtZero: true, suggestedMax: 100 },
        },
      },
    });
  }
}

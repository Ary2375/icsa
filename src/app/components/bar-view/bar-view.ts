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

const COMPACT_BELOW = 720;

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
  // Narrow screens: horizontal bars, so the many category labels have room.
  readonly compact = signal(false);
  readonly compactHeight = computed(() => {
    const parsed = this.results().map(r => ({ tool: r.tool, ...parseStrategy(r.strategy) }));
    const groups = new Set(parsed.map(p => `${p.tool}|${p.kind}`)).size;
    const chunks = new Set(parsed.map(p => p.chunk)).size;
    return groups * (chunks * 12 + 8) + 80;
  });
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
      const horizontal = chart.options.indexAxis === 'y';
      const category = scales[horizontal ? 'y' : 'x'];
      const count = this.categories.length;
      if (!count) return;
      const step =
        count > 1
          ? Math.abs(category.getPixelForValue(1) - category.getPixelForValue(0))
          : horizontal ? chartArea.height : chartArea.width;

      ctx.save();
      this.categories.forEach((item, i) => {
        const start = category.getPixelForValue(i) - step / 2;
        if (item.baseline) {
          ctx.fillStyle = 'rgba(128, 128, 128, 0.14)';
          if (horizontal) ctx.fillRect(chartArea.left, start, chartArea.width, step);
          else ctx.fillRect(start, chartArea.top, step, chartArea.height);
        }
        if (i > 0 && this.categories[i - 1].family !== item.family) {
          ctx.strokeStyle = 'rgba(128, 128, 128, 0.8)';
          ctx.setLineDash([6, 4]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          if (horizontal) {
            ctx.moveTo(chartArea.left, start);
            ctx.lineTo(chartArea.right, start);
          } else {
            ctx.moveTo(start, chartArea.top);
            ctx.lineTo(start, chartArea.bottom);
          }
          ctx.stroke();
        }
      });
      ctx.restore();
    },
    // A zero-length bar is invisible, so mark real zeros (missing data stays blank).
    afterDatasetsDraw: chart => {
      const { ctx, scales } = chart;
      const horizontal = chart.options.indexAxis === 'y';
      const zero = scales[horizontal ? 'x' : 'y'].getPixelForValue(0);

      ctx.save();
      ctx.strokeStyle = 'rgba(60, 60, 60, 0.9)';
      ctx.lineWidth = 2;
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        chart.getDatasetMeta(datasetIndex).data.forEach((bar, index) => {
          if (dataset.data[index] !== 0) return;
          const { x, y, width, height } = bar.getProps(['x', 'y', 'width', 'height'], true) as Record<string, number>;
          ctx.beginPath();
          if (horizontal) {
            ctx.moveTo(zero, y - height / 2);
            ctx.lineTo(zero, y + height / 2);
          } else {
            ctx.moveTo(x - width / 2, zero);
            ctx.lineTo(x + width / 2, zero);
          }
          ctx.stroke();
        });
      });
      ctx.restore();
    },
  };

  constructor() {
    const destroyRef = inject(DestroyRef);
    const host: HTMLElement = inject(ElementRef).nativeElement;
    afterNextRender(() => {
      // Chart width, not viewport: the filters sidebar eats a good part of the screen.
      this.compact.set(host.getBoundingClientRect().width < COMPACT_BELOW);
      const observer = new ResizeObserver(([entry]) => this.compact.set(entry.contentRect.width < COMPACT_BELOW));
      observer.observe(host);
      destroyRef.onDestroy(() => observer.disconnect());
      this.rendered.set(true);
    });

    effect(() => {
      if (!this.rendered()) return;
      this.render(this.buildData(this.results(), this.metric(), this.colors()), this.compact());
    });

    destroyRef.onDestroy(() => this.chart?.destroy());
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

  private render(data: ChartData<'bar'>, compact: boolean): void {
    const title = this.title();
    const indexAxis = compact ? 'y' : 'x';

    if (this.chart && this.chart.options.indexAxis !== indexAxis) {
      this.chart.destroy();
      this.chart = undefined;
    }

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
        indexAxis,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: title, font: { size: 16 } },
          legend: { display: false },
          tooltip: { mode: 'nearest', intersect: true },
        },
        scales: compact
          ? {
              x: { beginAtZero: true, suggestedMax: 100 },
              y: { ticks: { autoSkip: false } },
            }
          : {
              x: { ticks: { autoSkip: false, minRotation: 60, maxRotation: 90 } },
              y: { beginAtZero: true, suggestedMax: 100 },
            },
      },
    });
  }
}

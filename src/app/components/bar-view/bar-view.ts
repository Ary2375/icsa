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

export function compareBarGroups(a: Result, b: Result): number {
  const groupOrder = (result: Result): number => {
    if (result.comparisonGroup === 'literature') return 0;
    return strategyFamily(parseStrategy(result.strategy).kind) === 'ai' ? 1 : 2;
  };
  const order = groupOrder(a) - groupOrder(b);
  if (order) return order;

  if (a.comparisonGroup === 'literature') {
    return a.toolLabel.localeCompare(b.toolLabel) || a.strategy.localeCompare(b.strategy);
  }

  const aKind = parseStrategy(a.strategy).kind;
  const bKind = parseStrategy(b.strategy).kind;
  return compareKinds(aKind, bKind) || a.toolLabel.localeCompare(b.toolLabel);
}

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
  private readonly slotCount = computed(() => {
    const groups = new Set(this.results().map(result =>
      `${result.tool}|${parseStrategy(result.strategy).kind}`,
    )).size;
    return this.results().length + Math.max(0, groups - 1);
  });
  readonly compactHeight = computed(() => this.slotCount() * 24 + 80);
  private readonly title = computed(() => {
    const caseStudy = this.results()[0]?.caseStudy;
    return caseStudy ? `${this.metric()} · ${caseStudy}` : this.metric();
  });

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  // Chart.js needs a real canvas, so wait for the browser render (SSR-safe).
  private readonly rendered = signal(false);
  private chart?: Chart<'bar', (number | null)[]>;
  private tooltipTitles: string[] = [];
  // Per x category, read by the plugin below.
  private categories: { highlighted: boolean; family: string }[] = [];

  // Shades reference categories and baselines, with dividers between reference, ai and concat groups.
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
        if (item.highlighted) {
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

  // One category per actual result gives references and chunked experiments equal bar widths.
  buildData(results: Result[], metric: Metric, colors: Record<string, string>): ChartData<'bar', (number | null)[]> {
    const ordered = results
      .map(r => ({ r, ...parseStrategy(r.strategy) }))
      .sort((a, b) => compareBarGroups(a.r, b.r) || compareChunks(a.chunk, b.chunk));
    const parsed: (typeof ordered[number] | null)[] = [];
    ordered.forEach((item, index) => {
      const previous = ordered[index - 1];
      if (previous && (previous.r.tool !== item.r.tool || previous.kind !== item.kind)) parsed.push(null);
      parsed.push(item);
    });
    this.categories = parsed.map((item, index) => {
      const result = item ?? parsed[index - 1]!;
      return {
        highlighted: item !== null
          ? item.r.comparisonGroup === 'literature' || isBaseline(item.kind)
          : result.r.comparisonGroup === 'literature' && parsed[index + 1]?.r.comparisonGroup === 'literature',
        family: result.r.comparisonGroup === 'literature' ? 'reference' : strategyFamily(result.kind),
      };
    });
    this.tooltipTitles = parsed.map(item => item?.r.configLabel ?? '');
    const groupIndexes = new Map<string, number[]>();
    parsed.forEach((item, index) => {
      if (!item) return;
      const { r, kind } = item;
      const key = `${r.tool}|${kind}`;
      const indexes = groupIndexes.get(key) ?? [];
      indexes.push(index);
      groupIndexes.set(key, indexes);
    });
    const labels = parsed.map((item, index) => {
      if (!item) return [];
      const { r, kind } = item;
      if (r.comparisonGroup === 'literature') return r.toolLabel;
      const indexes = groupIndexes.get(`${r.tool}|${kind}`)!;
      if (index !== indexes[Math.floor((indexes.length - 1) / 2)]) return [];
      return isBaseline(kind) ? `${kind} (baseline)` : kind;
    });

    const datasets = [{
      label: metric,
      categoryPercentage: 1,
      barPercentage: 0.9,
      backgroundColor: parsed.map(item => item ? colors[item.r.configKey] : 'transparent'),
      data: parsed.map(item => item ? item.r[metric] : null),
    }];

    return { labels, datasets };
  }

  private render(data: ChartData<'bar', (number | null)[]>, compact: boolean): void {
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

    this.chart = new Chart<'bar', (number | null)[]>(this.canvas().nativeElement, {
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
          tooltip: {
            mode: 'nearest',
            intersect: true,
            callbacks: {
              title: items => items.length ? this.tooltipTitles[items[0].dataIndex] : '',
            },
          },
        },
        scales: compact
          ? {
              x: { beginAtZero: true, suggestedMax: 100 },
              y: { ticks: { autoSkip: false } },
            }
          : {
              x: { ticks: { autoSkip: false, minRotation: 90, maxRotation: 90, font: { size: 12 } } },
              y: { beginAtZero: true, suggestedMax: 100 },
            },
      },
    });
  }
}

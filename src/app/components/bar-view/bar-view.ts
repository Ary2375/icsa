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

function barCategoryKey(result: Result): string {
  if (result.comparisonGroup === 'literature') return result.configKey;
  return `${result.tool}|${parseStrategy(result.strategy).kind}`;
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
  private readonly metricMax = computed(() =>
    Math.max(100, ...this.results().map(result => result[this.metric()])),
  );
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
    afterNextRender(() => {
      this.rendered.set(true);
    });

    effect(() => {
      if (!this.rendered()) return;
      this.render(this.buildData(this.results(), this.metric(), this.colors()));
    });

    destroyRef.onDestroy(() => this.chart?.destroy());
  }

  // Group chunk sizes within each model/strategy category so all runs remain visible without repeating labels.
  buildData(results: Result[], metric: Metric, colors: Record<string, string>): ChartData<'bar', (number | null)[]> {
    const parsed = results.map(r => ({ r, ...parseStrategy(r.strategy) }));
    const categoryResults = new Map<string, Result>();
    for (const item of parsed) categoryResults.set(barCategoryKey(item.r), item.r);
    const categories = [...categoryResults.keys()].sort((a, b) => {
      const left = categoryResults.get(a)!;
      const right = categoryResults.get(b)!;
      return compareBarGroups(left, right) ||
        compareChunks(parseStrategy(left.strategy).chunk, parseStrategy(right.strategy).chunk);
    });
    const valuesByChunk = new Map<string, Map<string, Result>>();
    const references = new Map<string, Result>();
    for (const { r, chunk } of parsed) {
      if (r.comparisonGroup === 'literature') {
        references.set(barCategoryKey(r), r);
      } else {
        const values = valuesByChunk.get(chunk) ?? new Map<string, Result>();
        values.set(barCategoryKey(r), r);
        valuesByChunk.set(chunk, values);
      }
    }

    this.categories = categories.map(key => {
      const result = categoryResults.get(key)!;
      const kind = parseStrategy(result.strategy).kind;
      return {
        highlighted: result.comparisonGroup === 'literature' || isBaseline(kind),
        family: result.comparisonGroup === 'literature' ? 'reference' : strategyFamily(kind),
      };
    });
    this.tooltipTitles = categories.map(key => {
      const result = categoryResults.get(key)!;
      return result.comparisonGroup === 'literature'
        ? result.toolLabel
        : `${result.toolLabel} · ${parseStrategy(result.strategy).kind}`;
    });
    const multiTool = new Set(results.filter(result => result.comparisonGroup === 'llm').map(result => result.tool)).size > 1;
    const labels = categories.map(key => {
      const result = categoryResults.get(key)!;
      if (result.comparisonGroup === 'literature') return result.toolLabel;
      const { kind } = parseStrategy(result.strategy);
      const strategyLabel = isBaseline(kind) ? `${kind} (baseline)` : kind;
      return multiTool ? `${result.toolLabel} · ${strategyLabel}` : strategyLabel;
    });

    const datasets = [...valuesByChunk]
      .sort(([a], [b]) => compareChunks(a, b))
      .map(([chunk, values]) => ({
        label: chunk,
        skipNull: true,
        maxBarThickness: 16,
        categoryPercentage: 0.75,
        barPercentage: 0.85,
        backgroundColor: categories.map(key => {
          const result = values.get(key);
          return result ? colors[result.configKey] : 'transparent';
        }),
        data: categories.map(key => values.get(key)?.[metric] ?? null),
      }));
    if (references.size) {
      datasets.push({
        label: 'Reference',
        skipNull: true,
        maxBarThickness: 16,
        categoryPercentage: 0.75,
        barPercentage: 0.85,
        backgroundColor: categories.map(key => {
          const result = references.get(key);
          return result ? colors[result.configKey] : 'transparent';
        }),
        data: categories.map(key => references.get(key)?.[metric] ?? null),
      });
    }

    return { labels, datasets };
  }

  private render(data: ChartData<'bar', (number | null)[]>): void {
    const title = this.title();

    if (this.chart) {
      this.chart.data = data;
      this.chart.options.plugins!.title!.text = title;
      this.chart.options.scales!['y']!.max = this.metricMax();
      this.chart.update();
      return;
    }

    this.chart = new Chart<'bar', (number | null)[]>(this.canvas().nativeElement, {
      type: 'bar',
      data,
      plugins: [this.familyPlugin],
      options: {
        indexAxis: 'x',
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
        scales: {
          x: { ticks: { autoSkip: false, minRotation: 60, maxRotation: 90, font: { size: 11 } } },
          y: { beginAtZero: true, max: this.metricMax() },
        },
      },
    });
  }
}

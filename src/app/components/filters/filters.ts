import { Component, computed, effect, input, model, signal } from '@angular/core';
import { Metric, METRICS, Result } from '../../models/result.model';
import { compareChunks, parseStrategy, strategyFamily, variantOf } from '../../utils/chart-colors';

type Dimension = 'tool' | 'family' | 'chunk' | 'variant';

interface Option {
  value: string;
  label: string;
}

const DIMENSIONS: Dimension[] = ['tool', 'family', 'chunk', 'variant'];

function dimensionValues(r: Result): Record<Dimension, string> {
  const { chunk, kind } = parseStrategy(r.strategy);
  return { tool: r.tool, family: strategyFamily(kind), chunk, variant: variantOf(kind) };
}

@Component({
  imports: [],
  selector: 'app-filters',
  styleUrls: ['./filters.scss'],
  templateUrl: './filters.html',
})
export class Filters {
  readonly results = input<Result[]>([]);

  readonly selectedConfigs = model<string[]>([]);
  readonly selectedMetrics = model<Metric[]>([]);

  readonly metrics = METRICS;

  // Values switched off per dimension; new values default to on.
  private readonly excluded = signal<Record<Dimension, string[]>>({ tool: [], family: [], chunk: [], variant: [] });

  readonly options = computed<Record<Dimension, Option[]>>(() => {
    const rows = this.results().map(dimensionValues);
    const unique = (dimension: Dimension) => [...new Set(rows.map(row => row[dimension]))];
    return {
      tool: unique('tool').map(value => ({ value, label: value.replace(/^LLM:\s*/, '') })),
      family: unique('family').sort().map(value => ({ value, label: value })),
      chunk: unique('chunk').sort(compareChunks).map(value => ({ value, label: value })),
      variant: unique('variant')
        .sort((a, b) => a.localeCompare(b))
        .map(value => ({ value, label: value || 'baseline' })),
    };
  });

  readonly totalConfigs = computed(() => new Set(this.results().map(r => r.configKey)).size);

  // The tool section is only useful when there is more than one tool.
  readonly sections = computed(() => {
    const titles: Record<Dimension, string> = { tool: 'LLM', family: 'Strategy', chunk: 'Chunk size', variant: 'Variant' };
    return DIMENSIONS.filter(dimension => dimension !== 'tool' || this.options().tool.length > 1).map(dimension => ({
      dimension,
      title: titles[dimension],
      options: this.options()[dimension],
    }));
  });

  constructor() {
    effect(() => {
      const excluded = this.excluded();
      const keys = this.results()
        .filter(r => {
          const values = dimensionValues(r);
          return DIMENSIONS.every(dimension => !excluded[dimension].includes(values[dimension]));
        })
        .map(r => r.configKey);
      this.selectedConfigs.set([...new Set(keys)]);
    });
  }

  isOn(dimension: Dimension, value: string): boolean {
    return !this.excluded()[dimension].includes(value);
  }

  toggle(dimension: Dimension, value: string): void {
    this.excluded.update(state => ({ ...state, [dimension]: toggle(state[dimension], value) }));
  }

  setDimension(dimension: Dimension, on: boolean): void {
    const values = this.options()[dimension].map(option => option.value);
    this.excluded.update(state => ({ ...state, [dimension]: on ? [] : values }));
  }

  toggleMetric(metric: Metric): void {
    // Keep metrics in canonical order.
    this.selectedMetrics.update(list => METRICS.filter(m => (m === metric ? !list.includes(m) : list.includes(m))));
  }

  setMetrics(on: boolean): void {
    this.selectedMetrics.set(on ? [...METRICS] : []);
  }

  selectAll(): void {
    DIMENSIONS.forEach(dimension => this.setDimension(dimension, true));
    this.setMetrics(true);
  }

  deselectAll(): void {
    DIMENSIONS.forEach(dimension => this.setDimension(dimension, false));
    this.setMetrics(false);
  }
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
}

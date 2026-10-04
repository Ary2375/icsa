import { Component, computed, input, model } from '@angular/core';
import { Metric, METRICS, Result } from '../../models/result.model';

interface ToolNode {
  tool: string;
  label: string;
  configs: { key: string; strategy: string }[];
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
  readonly selectedCaseStudies = model<string[]>([]);
  readonly selectedMetrics = model<Metric[]>([]);

  readonly metrics = METRICS;

  readonly tree = computed<ToolNode[]>(() => {
    const byTool = new Map<string, Map<string, string>>();
    for (const r of this.results()) {
      if (!byTool.has(r.tool)) byTool.set(r.tool, new Map());
      byTool.get(r.tool)!.set(r.configKey, r.strategy);
    }
    return [...byTool].map(([tool, configs]) => ({
      tool,
      label: tool.replace(/^LLM:\s*/, ''),
      configs: [...configs].map(([key, strategy]) => ({ key, strategy })),
    }));
  });

  readonly caseStudies = computed(() => [...new Set(this.results().map(r => r.caseStudy))]);

  isSelected(key: string): boolean {
    return this.selectedConfigs().includes(key);
  }

  toolState(node: ToolNode): 'all' | 'some' | 'none' {
    const n = node.configs.filter(c => this.isSelected(c.key)).length;
    return n === 0 ? 'none' : n === node.configs.length ? 'all' : 'some';
  }

  toggleConfig(key: string): void {
    this.selectedConfigs.update(list => toggle(list, key));
  }

  toggleTool(node: ToolNode): void {
    const keys = node.configs.map(c => c.key);
    const selectAll = this.toolState(node) !== 'all';
    this.selectedConfigs.update(list =>
      selectAll ? [...new Set([...list, ...keys])] : list.filter(k => !keys.includes(k)),
    );
  }

  toggleCaseStudy(cs: string): void {
    this.selectedCaseStudies.update(list => toggle(list, cs));
  }

  toggleMetric(metric: Metric): void {
    // Keep metrics in canonical order.
    this.selectedMetrics.update(list => METRICS.filter(m => (m === metric ? !list.includes(m) : list.includes(m))));
  }

  selectAll(): void {
    this.selectedConfigs.set(this.tree().flatMap(n => n.configs.map(c => c.key)));
    this.selectedCaseStudies.set(this.caseStudies());
    this.selectedMetrics.set([...METRICS]);
  }

  deselectAll(): void {
    this.selectedConfigs.set([]);
    this.selectedCaseStudies.set([]);
    this.selectedMetrics.set([]);
  }
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
}

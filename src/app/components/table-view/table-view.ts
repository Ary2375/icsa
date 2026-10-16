import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Metric, Result } from '../../models/result.model';
import { compareChunks, compareKinds, isBaseline, parseStrategy, strategyFamily, StrategyFamily } from '../../utils/chart-colors';

interface ComparisonRow {
  readonly result: Result;
  readonly baseline: Result | null;
  readonly isBaseline: boolean;
  // First row of a chunk block (baseline + the variants compared against it).
  readonly blockStart: boolean;
}

interface FamilyGroup {
  readonly family: StrategyFamily;
  readonly rows: ComparisonRow[];
}

interface CaseStudyGroup {
  readonly caseStudy: string;
  readonly families: FamilyGroup[];
}

@Component({
  imports: [DecimalPipe],
  selector: 'app-table-view',
  styleUrl: './table-view.scss',
  templateUrl: './table-view.html',
})
export class TableView {
  readonly results = input<Result[]>([]);
  readonly metrics = input<Metric[]>([]);
  // With a single tool the column is redundant: the tool goes in the heading instead.
  readonly singleTool = computed(() => {
    const tools = new Set(this.results().map(result => result.tool));
    return tools.size === 1 ? [...tools][0].replace(/^LLM:\s*/, '') : null;
  });
  readonly columnCount = computed(() => (this.singleTool() ? 1 : 2) + this.metrics().length);
  readonly groupedResults = computed(() => {
    const groups = new Map<string, Result[]>();

    for (const result of this.results()) {
      const group = groups.get(result.caseStudy) ?? [];
      group.push(result);
      groups.set(result.caseStudy, group);
    }

    return [...groups].map(([caseStudy, results]): CaseStudyGroup => ({
      caseStudy,
      families: (['ai', 'concat'] as const)
        .map(family => ({ family, rows: this.familyRows(results, family) }))
        .filter(group => group.rows.length),
    }));
  });

  // Variants are compared with the plain strategy of the same family, tool and chunk (e.g. 30k_ai_dfg vs 30k_ai).
  private familyRows(results: Result[], family: StrategyFamily): ComparisonRow[] {
    const parsed = results
      .map(result => ({ result, ...parseStrategy(result.strategy) }))
      .filter(p => strategyFamily(p.kind) === family);
    const baselineKey = (tool: string, chunk: string) => `${tool}|${chunk}`;
    const baselines = new Map(
      parsed.filter(p => isBaseline(p.kind)).map(p => [baselineKey(p.result.tool, p.chunk), p.result]),
    );

    const ordered = parsed.sort(
      (a, b) =>
        compareChunks(a.chunk, b.chunk) ||
        a.result.tool.localeCompare(b.result.tool) ||
        compareKinds(a.kind, b.kind),
    );

    return ordered.map((p, index) => {
      const previous = ordered[index - 1];
      return {
        result: p.result,
        isBaseline: isBaseline(p.kind),
        baseline: isBaseline(p.kind) ? null : baselines.get(baselineKey(p.result.tool, p.chunk)) ?? null,
        blockStart: !previous || previous.chunk !== p.chunk || previous.result.tool !== p.result.tool,
      };
    });
  }

  metricDelta(row: ComparisonRow, metric: Metric): number | null {
    return row.baseline ? row.result[metric] - row.baseline[metric] : null;
  }
}

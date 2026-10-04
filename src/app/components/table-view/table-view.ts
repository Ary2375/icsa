import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Metric, Result } from '../../models/result.model';

interface ComparisonRow {
  readonly result: Result;
  readonly baseline: Result | null;
}

interface CaseStudyGroup {
  readonly caseStudy: string;
  readonly rows: ComparisonRow[];
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
  readonly groupedResults = computed(() => {
    const groups = new Map<string, Result[]>();

    for (const result of this.results()) {
      const group = groups.get(result.caseStudy) ?? [];
      group.push(result);
      groups.set(result.caseStudy, group);
    }

    return [...groups].map(([caseStudy, results]): CaseStudyGroup => {
      const baselines = new Map(
        results
          .filter(result => result.strategy === '80k_ai')
          .map(result => [result.tool, result]),
      );
      const orderedResults = [...results].sort(
        (left, right) => Number(right.strategy === '80k_ai') - Number(left.strategy === '80k_ai'),
      );

      return {
        caseStudy,
        rows: orderedResults.map(result => ({
          result,
          baseline: result.strategy === '80k_ai' ? null : baselines.get(result.tool) ?? null,
        })),
      };
    });
  });

  metricDelta(row: ComparisonRow, metric: Metric): number | null {
    return row.baseline ? row.result[metric] - row.baseline[metric] : null;
  }
}

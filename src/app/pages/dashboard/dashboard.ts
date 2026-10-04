import { Component, computed, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { BarView } from '../../components/bar-view/bar-view';
import { Filters } from '../../components/filters/filters';
import { Findings } from '../../components/findings/findings';
import { TableView } from '../../components/table-view/table-view';
import { Metric, METRICS, Result } from '../../models/result.model';
import { ResultsService } from '../../services/results/results';

@Component({
  imports: [MatCardModule, Filters, BarView, TableView, Findings],
  selector: 'app-dashboard',
  styleUrls: ['./dashboard.scss'],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {

  readonly results = signal<Result[]>([]);

  readonly selectedConfigs = signal<string[]>([]);
  readonly selectedCaseStudies = signal<string[]>([]);
  readonly selectedMetrics = signal<Metric[]>([...METRICS]);

  readonly filteredResults = computed(() => {
    const configs = new Set(this.selectedConfigs());
    const caseStudies = new Set(this.selectedCaseStudies());
    return this.results().filter(r => configs.has(r.configKey) && caseStudies.has(r.caseStudy));
  });

  constructor(private resultsService: ResultsService) { }

  ngOnInit(): void {
    this.resultsService
      .getResults()
      .subscribe(data => {
        this.results.set(data);
        this.selectedConfigs.set([...new Set(data.map(r => r.configKey))]);
        this.selectedCaseStudies.set([...new Set(data.map(r => r.caseStudy))]);
      });
  }
}

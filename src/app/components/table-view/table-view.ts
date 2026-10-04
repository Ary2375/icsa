import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Metric, Result } from '../../models/result.model';

@Component({
  imports: [DecimalPipe],
  selector: 'app-table-view',
  styleUrl: './table-view.scss',
  templateUrl: './table-view.html',
})
export class TableView {
  readonly results = input<Result[]>([]);
  readonly metrics = input<Metric[]>([]);
}

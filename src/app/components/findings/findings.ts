import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { MatListModule } from '@angular/material/list';
@Component({
  imports: [MatCardModule, MatListModule],
  selector: 'app-findings',
  styleUrls: ['./findings.scss'],
  templateUrl: './findings.html',
})
export class Findings { }

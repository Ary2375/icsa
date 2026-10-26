import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';
import { Partition } from '../../models/decomposition.model';
import { parsePartitions, parseReference, referencePath } from '../../utils/decomposition-source';

// Reads the decompositions straight from the data files every time they are needed, so the
// Comparator always reflects the current files. `no-cache` makes the browser revalidate them
// instead of serving an old copy.
@Injectable({
  providedIn: 'root',
})
export class DecompositionsService {
  private readonly http = inject(HttpClient);
  private readonly headers = { 'Cache-Control': 'no-cache' };

  partitions(path: string): Observable<Partition[]> {
    return this.http
      .get<unknown>(path, { headers: this.headers })
      .pipe(map((raw) => parsePartitions(raw, path)));
  }

  classList(caseStudy: string): Observable<string[]> {
    const path = referencePath(caseStudy);
    if (!path) return throwError(() => new Error(`No data folder is configured for ${caseStudy}.`));
    return this.http
      .get<unknown>(path, { headers: this.headers })
      .pipe(map((raw) => parseReference(raw, path)));
  }
}

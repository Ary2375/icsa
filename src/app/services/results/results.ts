import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Result } from '../../models/result.model';
import { RawRow, SOURCES, toResult } from './results-schema';

@Injectable({
    providedIn: 'root'
})
export class ResultsService {

    constructor(private readonly httpClient: HttpClient) { }

    /** Reads results.json as exported by the analysis and keeps only the rows and fields the site uses. */
    getResults(): Observable<Result[]> {
        return this.httpClient
            .get<Record<string, Record<string, RawRow[]> | undefined>>('assets/data/results.json')
            .pipe(
                map(data =>
                    SOURCES.flatMap(({ section, group, accepts }) =>
                        Object.values(data[section] ?? {})
                            .flat()
                            .filter(accepts)
                            .map(row => toResult(row, group)),
                    ),
                ),
            );
    }
}

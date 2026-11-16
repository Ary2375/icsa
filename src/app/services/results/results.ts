import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Result } from '../../models/result.model';
import { RawRow, SOURCES, toResult } from './results-schema';

export const RESULTS_URL = 'assets/data/results.json';
/** Run with every LLM-generated integration test, compared with the standard results in the dashboard. */
export const FULL_INTEGRATION_RESULTS_URL = 'assets/data/full_integration_test/results.json';

@Injectable({
    providedIn: 'root'
})
export class ResultsService {

    constructor(private readonly httpClient: HttpClient) { }

    /**
     * Reads results.json as exported by the analysis and keeps only the rows and fields the site uses.
     * `lenient` leaves unreadable values unavailable instead of rejecting the file.
     */
    getResults(url = RESULTS_URL, lenient = false): Observable<Result[]> {
        return this.httpClient
            .get<Record<string, Record<string, RawRow[]> | undefined>>(url)
            .pipe(
                map(data =>
                    SOURCES.flatMap(({ section, group, accepts }) =>
                        Object.values(data[section] ?? {})
                            .flat()
                            .filter(accepts)
                            .map(row => toResult(row, group, lenient)),
                    ),
                ),
            );
    }
}

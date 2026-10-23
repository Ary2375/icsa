import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ComparisonGroup, Result } from '../../models/result.model';

interface RawResult {
    'Case Study': string;
    Tool: string;
    Strategy: string;
    Type?: string;
    CiD: number;
    CMod: number;
    BCP: number;
    DI: number;
    DTP: number;
    TC: number;
    LC: number;
    MoJoFM: number;
    'c2c_cvg 10%': number;
    'c2c_cvg 33%': number;
    'c2c_cvg 50%': number;
}

interface ResultsPayload {
    llm_comparison: Record<string, RawResult[]>;
    variant_comparison?: Record<string, RawResult[]>;
}

@Injectable({
    providedIn: 'root'
})
export class ResultsService {

    constructor(private readonly httpClient: HttpClient) { }

    getResults(): Observable<Result[]> {
        return this.httpClient
            .get<ResultsPayload>('assets/data/results.json')
            .pipe(
                map(data => [
                    ...Object.values(data.llm_comparison)
                        .flat()
                        .map(row => this.toResult(row, 'llm')),
                    ...Object.values(data.variant_comparison ?? {})
                        .flat()
                        .filter(row => row.Type !== 'LLM')
                        .map(row => this.toResult(row, 'literature')),
                ]),
            );
    }

    private toResult(row: RawResult, comparisonGroup: ComparisonGroup): Result {
        return Result.clone({
            caseStudy: row['Case Study'],
            tool: row.Tool,
            strategy: row.Strategy,
            comparisonGroup,
            CiD: row.CiD,
            CMod: row.CMod,
            BCP: row.BCP,
            DI: row.DI,
            DTP: row.DTP,
            TC: row.TC,
            LC: row.LC,
            MoJoFM: row.MoJoFM,
            'c2c_cvg 10%': row['c2c_cvg 10%'],
            'c2c_cvg 33%': row['c2c_cvg 33%'],
            'c2c_cvg 50%': row['c2c_cvg 50%'],
        });
    }
}

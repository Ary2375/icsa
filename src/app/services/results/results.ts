import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Result } from '../../models/result.model';

@Injectable({
    providedIn: 'root'
})
export class ResultsService {

    constructor(private readonly httpClient: HttpClient) { }

    getResults(): Observable<Result[]> {
        return this.httpClient
            .get<{ llm_comparison: Record<string, any[]> }>('assets/data/results.json')
            .pipe(
                map(data =>
                    Object.values(data.llm_comparison).flat().map(r => Result.clone({
                        caseStudy: r['Case Study'],
                        tool: r['Tool'],
                        strategy: r['Strategy'],
                        CiD: r['CiD'],
                        CMod: r['CMod'],
                        BCP: r['BCP'],
                        DI: r['DI'],
                        DTP: r['DTP'],
                        TC: r['TC'],
                        LC: r['LC'],
                        MoJoFM: r['MoJoFM'],
                        'c2c_cvg 10%': r['c2c_cvg 10%'],
                        'c2c_cvg 33%': r['c2c_cvg 33%'],
                        'c2c_cvg 50%': r['c2c_cvg 50%'],
                    } as Result))
                )
            );
    }

    getDeepSeekByRepository(
        data: any,
        repository: string
    ) {

        const strategies = [

            '80k_ai',

            '80k_ai_all',

            '80k_ai_dfg',

            '80k_ai_gfsm',

            '80k_ai_inductive_miner',

            '80k_ai_split_miner'

        ];

        return strategies.map(strategy => {

            return data.llm_comparison[strategy]
                .find(
                    (r: any) =>

                        r['Case Study'] === repository

                        &&

                        r['Tool'] ===
                        'LLM: Deepseek 32 Terminus'

                );

        });

    }
}

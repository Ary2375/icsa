import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { METRICS, Result } from '../../models/result.model';
import { ResultsService } from './results';

describe('ResultsService', () => {
  let service: ResultsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ResultsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('preserves c2c coverage metrics when loading results', () => {
    const coverageMetrics = ['c2c_cvg 10%', 'c2c_cvg 33%', 'c2c_cvg 50%'] as const;
    let loaded: Result[] = [];
    service.getResults().subscribe(results => loaded = results);

    http.expectOne('assets/data/results.json').flush({
      llm_comparison: {
        '80k_ai': [{
          'Case Study': '7ep-demo',
          Tool: 'LLM: Deepseek 32 Terminus',
          Strategy: '80k_ai',
          'c2c_cvg 10%': 100,
          'c2c_cvg 33%': 80,
          'c2c_cvg 50%': 0,
        }],
      },
    });

    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toBeInstanceOf(Result);
    expect(coverageMetrics.map(metric => loaded[0][metric])).toEqual([100, 80, 0]);
    for (const metric of coverageMetrics) {
      expect(METRICS).toContain(metric);
    }
  });
});

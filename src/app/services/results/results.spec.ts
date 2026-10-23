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
          '# Obs. Ents. (%)': '0 (0.0%)',
          '#Partitions': 5,
          'Partition Size Min': 1,
          'Partition Size Med': 4.8,
          'Partition Size Max': 8,
          'c2c_cvg 10%': 100,
          'c2c_cvg 33%': 80,
          'c2c_cvg 50%': 0,
        }],
      },
    });

    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toBeInstanceOf(Result);
    expect(loaded[0].observedEntities).toBe(0);
    expect(loaded[0].observedEntitiesPercent).toBe(0);
    expect([loaded[0].partitions, loaded[0].partitionSizeMin, loaded[0].partitionSizeMed, loaded[0].partitionSizeMax])
      .toEqual([5, 1, 4.8, 8]);
    expect(coverageMetrics.map(metric => loaded[0][metric])).toEqual([100, 80, 0]);
    for (const metric of coverageMetrics) {
      expect(METRICS).toContain(metric);
    }
  });

  it('loads literature tools without duplicating LLM rows', () => {
    let loaded: Result[] = [];
    service.getResults().subscribe(results => loaded = results);

    http.expectOne('assets/data/results.json').flush({
      llm_comparison: {
        baseline: [{
          'Case Study': '7ep-demo',
          Tool: 'LLM: Deepseek 32 Terminus',
          Strategy: '80k_ai',
          Type: 'LLM',
          CiD: 1,
          CMod: 2,
          BCP: 3,
          DI: 4,
          DTP: 5,
          TC: 6,
          LC: 7,
          MoJoFM: 8,
          'c2c_cvg 10%': 9,
          'c2c_cvg 33%': 10,
          'c2c_cvg 50%': 11,
        }],
      },
      variant_comparison: {
        'MONO2MICRO': [
          {
            'Case Study': '7ep-demo',
            Tool: 'MONO2MICRO',
            Strategy: 'business',
            Type: 'Traditional',
            CiD: 1,
            CMod: 2,
            BCP: 3,
            DI: 4,
            DTP: 5,
            TC: 6,
            LC: 7,
            MoJoFM: 8,
            'c2c_cvg 10%': 9,
            'c2c_cvg 33%': 10,
            'c2c_cvg 50%': 11,
          },
          {
            'Case Study': '7ep-demo',
            Tool: 'MONO2MICRO',
            Strategy: 'natural',
            Type: 'Traditional',
            CiD: 1,
            CMod: 2,
            BCP: 3,
            DI: 4,
            DTP: 5,
            TC: 6,
            LC: 7,
            MoJoFM: 8,
            'c2c_cvg 10%': 9,
            'c2c_cvg 33%': 10,
            'c2c_cvg 50%': 11,
          },
        ],
        'LLM: Deepseek 32 Terminus': [{
          'Case Study': '7ep-demo',
          Tool: 'LLM: Deepseek 32 Terminus',
          Strategy: '80k_ai',
          Type: 'LLM',
          CiD: 1,
          CMod: 2,
          BCP: 3,
          DI: 4,
          DTP: 5,
          TC: 6,
          LC: 7,
          MoJoFM: 8,
          'c2c_cvg 10%': 9,
          'c2c_cvg 33%': 10,
          'c2c_cvg 50%': 11,
        }],
      },
    });

    expect(loaded).toHaveLength(3);
    expect(loaded.map(result => result.comparisonGroup)).toEqual(['llm', 'literature', 'literature']);
    expect(loaded.slice(1).map(result => result.toolLabel)).toEqual([
      'MONO2MICRO (business)',
      'MONO2MICRO (natural)',
    ]);
  });
});

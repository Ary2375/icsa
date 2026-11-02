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

  it('keeps only the sections and columns the site uses', () => {
    let loaded: Result[] = [];
    service.getResults().subscribe(results => loaded = results);
    const row = { 'Case Study': '7ep-demo', Tool: 'LLM: Glm 46', Strategy: '30k_ai', CiD: 1, 'Unused column': 'x' };

    http.expectOne('assets/data/results.json').flush({
      llm_comparison: { '30k_ai': [row] },
      raw_data: [row, row, row],
      other_section: { x: [row] },
    });

    expect(loaded).toHaveLength(1);
    expect(Object.keys(loaded[0])).not.toContain('Unused column');
    expect(loaded[0]).toMatchObject({ caseStudy: '7ep-demo', tool: 'LLM: Glm 46', CiD: 1, partitions: null });
  });

  it('drops the models, strategies and tools the site does not show', () => {
    let loaded: Result[] = [];
    service.getResults().subscribe(results => loaded = results);
    const row = (tool: string, strategy: string, type = 'LLM') =>
      ({ 'Case Study': '7ep-demo', Tool: tool, Strategy: strategy, Type: type });

    http.expectOne('assets/data/results.json').flush({
      llm_comparison: {
        kept: [row('LLM: Deepseek 32 Terminus', '30k_ai_dfg'), row('LLM: Glm 46', '80k_concat')],
        models: [row('LLM: Gemini 25 Pro', '30k_ai'), row('LLM: Gpt 5', '30k_ai')],
        strategies: [row('LLM: Glm 46', 'Hierarchical'), row('LLM: Glm 46', 'zero_shot')],
      },
      variant_comparison: {
        literature: [row('HyDec', 'n/a', 'Traditional'), row('NEW_TOOL', 'default', 'Traditional')],
        duplicated: [row('LLM: Glm 46', '30k_ai')],
      },
    });

    expect(loaded.map(result => `${result.tool} | ${result.strategy}`)).toEqual([
      'LLM: Deepseek 32 Terminus | 30k_ai_dfg',
      'LLM: Glm 46 | 80k_concat',
      'HyDec | n/a',
    ]);
  });

  it('names the row and column of an invalid value', () => {
    let error: Error | undefined;
    service.getResults().subscribe({ error: e => error = e });

    http.expectOne('assets/data/results.json').flush({
      llm_comparison: { x: [{ 'Case Study': '7ep-demo', Tool: 'LLM: Glm 46', Strategy: '30k_ai', CiD: 'high' }] },
    });

    expect(error?.message).toContain('"CiD" for 7ep-demo / LLM: Glm 46 / 30k_ai');
  });
});

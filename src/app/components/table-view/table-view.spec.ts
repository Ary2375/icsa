import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Result } from '../../models/result.model';
import { TableView } from './table-view';

describe('TableView', () => {
  let component: TableView;
  let fixture: ComponentFixture<TableView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableView],
    }).compileComponents();

    fixture = TestBed.createComponent(TableView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('normalizes rounded negative deltas to positive zero', () => {
    const baseline = makeResult('LLM: Deepseek 32 Terminus', '80k_ai', 'llm');
    const variant = makeResult('LLM: Deepseek 32 Terminus', '80k_ai_dfg', 'llm');
    baseline.CMod = 2.01;
    fixture.componentRef.setInput('results', [baseline, variant]);
    fixture.detectChanges();

    const row = component.groupedResults()[0].families[0].rows[1];
    expect(Object.is(component.metricDelta(row, 'CMod'), 0)).toBe(true);
  });

  it('shows LLM strategies and literature references in the same case study', () => {
    fixture.componentRef.setInput('results', [
      makeResult('LLM: Deepseek 32 Terminus', '80k_ai', 'llm'),
      makeResult('LLM: Deepseek 32 Terminus', '80k_ai_dfg', 'llm'),
      makeResult('GROUND_TRUTH', 'default', 'literature'),
      makeResult('MONO2MICRO', 'business', 'literature'),
    ]);
    fixture.detectChanges();

    const groups = component.groupedResults();
    expect(groups).toHaveLength(1);
    expect(groups[0].families.map(family => family.label)).toEqual([
      'ai family',
      'State-of-the-art reference results',
    ]);
    expect(groups[0].families[0].rows[0].isBaseline).toBe(true);
    expect(groups[0].families[1].rows.map(row => row.result.toolLabel)).toEqual([
      'Ground Truth',
      'MONO2MICRO (business)',
    ]);
    expect(groups[0].families[1].rows.every(row => !row.baseline)).toBe(true);
  });

  it('compares baseline and variant rows with a literature reference hidden by filters', () => {
    const baseline = makeResult('LLM: Deepseek 32 Terminus', '80k_ai', 'llm');
    const variant = makeResult('LLM: Deepseek 32 Terminus', '80k_ai_dfg', 'llm');
    const reference = makeResult('GROUND_TRUTH', 'default', 'literature');
    reference.CMod = 12;
    fixture.componentRef.setInput('results', [baseline, variant]);
    fixture.componentRef.setInput('comparisonResults', [baseline, variant, reference]);
    component.comparisonKey.set(reference.configKey);
    fixture.detectChanges();

    const rows = component.groupedResults()[0].families[0].rows;
    expect(rows.map(row => component.metricDelta(row, 'CMod'))).toEqual([-10, -10]);
    expect(component.missingReferences()).toEqual([]);
    expect(component.comparisonOptions()).toContainEqual({ value: reference.configKey, label: 'Ground Truth' });
  });

  it('warns when the selected reference is missing in the displayed case study', () => {
    const result = makeResult('LLM: Deepseek 32 Terminus', '80k_ai_dfg', 'llm');
    const reference = makeResult('LOG2MS', 'default', 'literature');
    reference.caseStudy = 'JPetStore';
    fixture.componentRef.setInput('results', [result]);
    fixture.componentRef.setInput('comparisonResults', [result, reference]);
    component.comparisonKey.set(reference.configKey);
    fixture.detectChanges();

    const row = component.groupedResults()[0].families[0].rows[0];
    expect(component.metricDelta(row, 'CMod')).toBeNull();
    expect(component.missingReferences()).toEqual(['7ep-demo']);
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('[role="status"]')?.textContent).toContain('LOG2MS is not available');
  });

  it('compares literature rows but does not calculate a delta against themselves', () => {
    const reference = makeResult('MONO2MICRO', 'business', 'literature');
    const natural = makeResult('MONO2MICRO', 'natural', 'literature');
    natural.CMod = 7;
    fixture.componentRef.setInput('results', [reference, natural]);
    component.comparisonKey.set(reference.configKey);
    fixture.detectChanges();

    const rows = component.groupedResults()[0].families[0].rows;
    expect(rows.map(row => component.metricDelta(row, 'CMod'))).toEqual([null, 5]);
    component.comparisonKey.set('baseline');
    expect(component.groupedResults()[0].families[0].rows.every(row => row.baseline === null)).toBe(true);
  });
});

function makeResult(tool: string, strategy: string, comparisonGroup: 'llm' | 'literature'): Result {
  return Result.clone({
    caseStudy: '7ep-demo',
    tool,
    strategy,
    comparisonGroup,
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
  });
}

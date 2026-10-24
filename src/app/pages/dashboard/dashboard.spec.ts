import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Dashboard } from './dashboard';
import { ResultsService } from '../../services/results/results';
import { Result } from '../../models/result.model';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [{ provide: ResultsService, useValue: { getResults: () => of([]) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows one model with all its strategies and the same references', () => {
    const makeResult = (tool: string, strategy: string, comparisonGroup: 'llm' | 'literature') =>
      Object.assign(new Result(), { caseStudy: 'demo', tool, strategy, comparisonGroup });
    const deepseek = [
      makeResult('LLM: Deepseek', '30k_ai', 'llm'),
      makeResult('LLM: Deepseek', '50k_ai', 'llm'),
      makeResult('LLM: Deepseek', '30k_concat', 'llm'),
    ];
    const glm = makeResult('LLM: GLM', '30k_ai', 'llm');
    const reference = makeResult('DATACENTRIC', 'default', 'literature');
    const results = [...deepseek, glm, reference];
    component.results.set(results);
    component.selectedConfigs.set(results.map(result => result.configKey));

    expect(component.barResults()).toEqual([...deepseek, reference]);
    component.selectedBarModel.set('LLM: GLM');
    expect(component.barResults()).toEqual([glm, reference]);
    component.selectedConfigs.set([...deepseek, reference].map(result => result.configKey));
    expect(component.activeBarModel()).toBe('LLM: Deepseek');
    expect(component.barResults()).toEqual([...deepseek, reference]);
    component.selectedConfigs.set([reference.configKey]);
    expect(component.barModels()).toEqual([]);
    expect(component.barResults()).toEqual([reference]);
    component.selectedConfigs.set([]);
    expect(component.barResults()).toEqual([]);
  });
});

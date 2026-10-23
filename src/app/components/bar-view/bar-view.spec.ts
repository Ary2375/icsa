import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Result } from '../../models/result.model';
import { BarView, compareBarGroups } from './bar-view';

describe('BarView', () => {
  let component: BarView;
  let fixture: ComponentFixture<BarView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarView],
    }).compileComponents();

    fixture = TestBed.createComponent(BarView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('orders reference tools before AI and concat strategy groups', () => {
    const references = makeResult('DATACENTRIC', 'default', 'literature');
    const ai = makeResult('LLM: Deepseek 32 Terminus', '30k_ai', 'llm');
    const concat = makeResult('LLM: Deepseek 32 Terminus', '30k_concat', 'llm');

    expect([concat, ai, references].sort(compareBarGroups)).toEqual([references, ai, concat]);
  });

  it('allocates one equal-width category per reference or actual chunk result', () => {
    const reference = makeResult('DATACENTRIC', 'default', 'literature');
    const chunks = ['80k', '30k', '50k'].map(chunk =>
      makeResult('LLM: Deepseek 32 Terminus', `${chunk}_ai`, 'llm'),
    );
    const data = component.buildData([chunks[0], reference, chunks[1], chunks[2]], 'CMod', {});

    expect(data.datasets).toHaveLength(1);
    expect(data.datasets[0].data).toEqual([2, null, 2, 2, 2]);
    expect(data.datasets[0].categoryPercentage).toBe(1);
    expect(data.datasets[0].barPercentage).toBe(0.9);
    expect(data.labels).toEqual([
      'DATACENTRIC',
      [],
      [],
      'ai (baseline)',
      [],
    ]);
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

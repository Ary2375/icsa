import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Result } from '../../models/result.model';
import { Filters } from './filters';

describe('Filters', () => {
  let component: Filters;
  let fixture: ComponentFixture<Filters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Filters],
    }).compileComponents();

    fixture = TestBed.createComponent(Filters);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('groups state-of-the-art tools before LLM tools without changing selection', async () => {
    const results = [
      Object.assign(new Result(), {
        tool: 'LLM: Deepseek 32 Terminus', strategy: '30k_ai', comparisonGroup: 'llm',
      }),
      Object.assign(new Result(), {
        tool: 'MONO2MICRO', strategy: 'natural', comparisonGroup: 'literature',
      }),
      Object.assign(new Result(), {
        tool: 'DATACENTRIC', strategy: 'default', comparisonGroup: 'literature',
      }),
      Object.assign(new Result(), {
        tool: 'MONO2MICRO', strategy: 'business', comparisonGroup: 'literature',
      }),
    ];
    fixture.componentRef.setInput('results', results);
    await fixture.whenStable();

    expect(component.toolGroups().map(group => group.label)).toEqual(['State of the art', 'LLM']);
    expect(component.toolGroups()[0].options.map(option => option.label)).toEqual([
      'DATACENTRIC', 'MONO2MICRO (business)', 'MONO2MICRO (natural)',
    ]);
    const host: HTMLElement = fixture.nativeElement;
    expect([...host.querySelectorAll('.tool-group legend')].map(legend => legend.textContent?.trim()))
      .toEqual(['State of the art', 'LLM']);
    expect(component.selectedConfigs()).toHaveLength(4);

    component.toggle('tool', 'MONO2MICRO (business)');
    await fixture.whenStable();
    expect(component.selectedConfigs()).not.toContain(results[3].configKey);
    expect(component.selectedConfigs()).toContain(results[1].configKey);

    component.setDimension('tool', false);
    await fixture.whenStable();
    expect(component.selectedConfigs()).toEqual([]);

    component.setDimension('tool', true);
    await fixture.whenStable();
    expect(component.selectedConfigs()).toHaveLength(4);
  });
});

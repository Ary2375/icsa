import { TestBed } from '@angular/core/testing';
import { Result } from '../../models/result.model';
import { CoverageView } from './coverage-view';

describe('CoverageView', () => {
  it('preserves zero coverage, excludes missing data, and distinguishes references', () => {
    const fixture = TestBed.createComponent(CoverageView);
    const reference = Object.assign(new Result(), {
      tool: 'GROUND_TRUTH', strategy: 'default', comparisonGroup: 'literature',
      observedEntitiesPercent: 0, CMod: 0,
    });
    const missing = Object.assign(new Result(), {
      tool: 'LLM: Deepseek 32 Terminus', strategy: '80k_ai', comparisonGroup: 'llm',
      observedEntitiesPercent: null, CMod: 50,
    });
    fixture.componentRef.setInput('results', [reference, missing]);
    fixture.componentRef.setInput('colors', { [reference.configKey]: 'hsl(120, 65%, 52%)' });
    const component = fixture.componentInstance;
    expect(component.missingCount()).toBe(1);
    const data = component.buildData();
    expect(data.datasets).toHaveLength(1);
    expect(data.datasets[0].data).toEqual([{ x: 0, y: 0 }]);
    expect(data.datasets[0].pointStyle).toBe('rectRot');
    expect(data.datasets[0].backgroundColor).toBe('hsl(120, 65%, 52%)');
    fixture.destroy();
  });
});

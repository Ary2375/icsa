import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  defaultSelections,
  describeConfiguration,
  ExperimentOption,
  findOption,
  Selection,
} from '../../utils/experiment-selection';
import { ExperimentPicker } from './experiment-picker';

const option = (tool: string, chunk: string, mode: string, variant: string): ExperimentOption => ({
  id: [tool, chunk, mode, variant].join('|'),
  tool,
  chunk,
  mode,
  variant,
  label: describeConfiguration(tool, chunk, mode, variant),
});

describe('ExperimentPicker', () => {
  let fixture: ComponentFixture<ExperimentPicker>;
  let component: ExperimentPicker;
  let emitted: Selection[];
  const options = [
    option('LLM: A', '30k', 'ai', ''),
    option('LLM: A', '30k', 'ai', 'dfg'),
    option('LLM: A', '50k', 'ai', ''),
    option('LLM: A', '30k', 'concat', ''),
    option('LLM: B', '30k', 'ai', ''),
  ];
  const selection = defaultSelections(options).reference;

  function render(chosen: Selection = selection): void {
    fixture.componentRef.setInput('label', 'Reference experiment');
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('selection', chosen);
    fixture.componentRef.setInput('current', findOption(options, chosen));
    fixture.detectChanges();
  }
  const el = () => fixture.nativeElement as HTMLElement;
  const buttons = (group: string) => [
    ...el().querySelectorAll<HTMLButtonElement>(`[aria-label="${group}"] button`),
  ];

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentPicker);
    component = fixture.componentInstance;
    emitted = [];
    component.selectionChange.subscribe((value) => emitted.push(value));
    render();
  });

  it('shows one control per factor and describes the chosen experiment in words', () => {
    expect(el().querySelector('legend')?.textContent).toContain('Reference experiment');
    expect(buttons('Chunk size').map((b) => b.textContent!.trim())).toEqual(['30k', '50k']);
    expect(buttons('Artifact preparation').map((b) => b.textContent!.trim())).toEqual([
      'AI',
      'CONCAT',
    ]);
    expect(el().querySelectorAll('select')).toHaveLength(2);
    expect(el().querySelector('.current')?.textContent).toContain('A · 30k · AI · Static only');
  });

  it('offers no source switch: only the thesis experiments can be chosen', () => {
    expect(el().textContent).not.toContain('Source');
    expect(el().textContent).not.toContain('Original-study');
  });

  it('marks the active chunk and preparation, and emits only the changed factor', () => {
    expect(buttons('Chunk size')[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons('Chunk size')[1].getAttribute('aria-pressed')).toBe('false');
    buttons('Chunk size')[1].click();
    buttons('Artifact preparation')[1].click();
    expect(emitted[0]).toEqual({ ...selection, chunk: '50k' });
    expect(emitted[1]).toEqual({ ...selection, mode: 'concat' });
  });

  it('disables values that no experiment combines with the current choices', () => {
    expect(buttons('Artifact preparation').map((b) => b.disabled)).toEqual([false, false]);
    render({ ...selection, chunk: '50k' });
    expect(buttons('Artifact preparation').map((b) => b.disabled)).toEqual([false, true]);
    const variantSelect = el().querySelectorAll('select')[1] as HTMLSelectElement;
    const dfg = [...variantSelect.options].find((o) => o.textContent!.includes('DFG'))!;
    expect(dfg.disabled).toBe(true);
  });

  it('groups the behavioral inputs and emits the chosen one', () => {
    const variantSelect = el().querySelectorAll('select')[1] as HTMLSelectElement;
    expect([...variantSelect.querySelectorAll('optgroup')].map((g) => g.label)).toEqual([
      'Static artifacts only',
      'Static + one behavioral model',
    ]);
    variantSelect.value = 'dfg';
    variantSelect.dispatchEvent(new Event('change'));
    expect(emitted.at(-1)).toEqual({ ...selection, variant: 'dfg' });
  });

  it('emits the chosen LLM', () => {
    const toolSelect = el().querySelectorAll('select')[0] as HTMLSelectElement;
    toolSelect.value = 'LLM: B';
    toolSelect.dispatchEvent(new Event('change'));
    expect(emitted.at(-1)).toEqual({ ...selection, tool: 'LLM: B' });
  });

  it('says so when no experiment matches the combination', () => {
    render({ ...selection, tool: 'LLM: B', chunk: '50k' });
    expect(el().querySelector('.current')?.textContent).toContain(
      'No experiment matches this combination',
    );
  });
});

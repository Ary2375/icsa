import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  defaultSelections,
  describeConfiguration,
  ExperimentOption,
  findOption,
  Selection,
  selectionOf,
  toolLabel,
} from '../../utils/experiment-selection';
import { ExperimentPicker } from './experiment-picker';

const option = (tool: string, chunk: string, mode: string, variant: string): ExperimentOption => ({
  id: [tool, chunk, mode, variant].join('|'),
  kind: 'llm',
  tool,
  chunk,
  mode,
  variant,
  label: describeConfiguration(tool, chunk, mode, variant),
});
const literature = (tool: string, variant = 'default'): ExperimentOption => ({
  id: [tool, variant].join('|'),
  kind: 'literature',
  tool,
  chunk: '',
  mode: '',
  variant,
  label: toolLabel(tool),
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
    literature('DATACENTRIC'),
    literature('MONO2MICRO', 'business'),
    literature('MONO2MICRO', 'natural'),
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

  it('groups the LLMs and the state-of-the-art methods in the approach menu', () => {
    const approach = el().querySelector('select[aria-label="Approach"]') as HTMLSelectElement;
    expect([...approach.querySelectorAll('optgroup')].map((g) => g.label)).toEqual([
      'LLM',
      'State of the art',
    ]);
    expect([...approach.options].map((o) => o.value)).toEqual([
      'LLM: A',
      'LLM: B',
      'DATACENTRIC',
      'MONO2MICRO',
    ]);
    expect([...approach.options].every((o) => !o.disabled)).toBe(true);
  });

  it('moves to a state-of-the-art method and only shows what applies to it', () => {
    const approach = el().querySelector('select[aria-label="Approach"]') as HTMLSelectElement;
    approach.value = 'DATACENTRIC';
    approach.dispatchEvent(new Event('change'));
    expect(emitted.at(-1)).toEqual({
      tool: 'DATACENTRIC',
      chunk: '',
      mode: '',
      variant: 'default',
    });
    render(emitted.at(-1)!);
    expect(buttons('Chunk size')).toHaveLength(0);
    expect(buttons('Artifact preparation')).toHaveLength(0);
    expect(el().textContent).not.toContain('Behavioral input');
    expect(el().querySelector('select[aria-label="Configuration"]')).toBeNull();
    expect(el().querySelector('.current')?.textContent).toContain('DATACENTRIC');
  });

  it('lets the configuration of a method be chosen when it has several', () => {
    render({ tool: 'MONO2MICRO', chunk: '', mode: '', variant: 'business' });
    const configuration = el().querySelector(
      'select[aria-label="Configuration"]',
    ) as HTMLSelectElement;
    expect([...configuration.options].map((o) => o.value)).toEqual(['business', 'natural']);
    configuration.value = 'natural';
    configuration.dispatchEvent(new Event('change'));
    expect(emitted.at(-1)).toEqual({
      tool: 'MONO2MICRO',
      chunk: '',
      mode: '',
      variant: 'natural',
    });
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

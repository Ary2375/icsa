import {
  defaultSelections,
  describeConfiguration,
  ExperimentOption,
  facetValues,
  findOption,
  isAvailable,
  kindOf,
  modeLabel,
  parseThesisStrategy,
  selectionForTool,
  selectionOf,
  toolGroups,
  toolLabel,
  variantGroup,
  variantLabel,
  variantsOfTool,
} from './experiment-selection';

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

describe('experiment selection', () => {
  const grid = [
    option('LLM: B', '50k', 'concat', 'dfg'),
    option('LLM: A', '80k', 'ai', ''),
    option('LLM: A', '30k', 'concat', 'only_behavior'),
    option('LLM: A', '30k', 'ai', 'dfg'),
    option('LLM: A', '30k', 'ai', ''),
    option('LLM: A', '30k', 'ai', 'gfsm'),
  ];

  it('parses strategies and rejects names that are not chunk/mode/variant strategies', () => {
    expect(parseThesisStrategy('30k_ai')).toEqual({ chunk: '30k', mode: 'ai', variant: '' });
    expect(parseThesisStrategy('80k_concat_only_split_miner')).toEqual({
      chunk: '80k',
      mode: 'concat',
      variant: 'only_split_miner',
    });
    expect(parseThesisStrategy('hierarchical')).toBeNull();
    expect(parseThesisStrategy('30k_other')).toBeNull();
  });

  it('labels every behavioral input in plain language and groups them', () => {
    expect(variantLabel('')).toBe('Static only');
    expect(variantLabel('inductive_miner')).toBe('Static + Inductive Miner');
    expect(variantLabel('only_dfg')).toBe('DFG only');
    expect(variantLabel('some_new_model')).toBe('some new model');
    expect(modeLabel('ai')).toBe('AI');
    expect(modeLabel('concat')).toBe('CONCAT');
    expect([
      variantGroup(''),
      variantGroup('dfg'),
      variantGroup('all'),
      variantGroup('only_dfg'),
    ]).toEqual([
      'Static artifacts only',
      'Static + one behavioral model',
      'Static + all behavioral models',
      'Behavioral models only',
    ]);
    expect(variantGroup('some_new_model')).toBe('Other');
    expect(describeConfiguration('LLM: GLM 4.6', '50k', 'concat', 'dfg')).toBe(
      'GLM 4.6 · 50k · CONCAT · Static + DFG',
    );
  });

  it('orders the facet values in a stable, meaningful order', () => {
    expect(facetValues(grid)).toEqual({
      tools: ['LLM: A', 'LLM: B'],
      chunks: ['30k', '50k', '80k'],
      modes: ['ai', 'concat'],
      variants: ['', 'gfsm', 'dfg', 'only_behavior'],
    });
    expect(
      facetValues([option('x', '30k', 'ai', 'zeta'), option('x', '30k', 'ai', 'alpha')]).variants,
    ).toEqual(['alpha', 'zeta']);
  });

  it('finds an experiment by its four factors', () => {
    const selection = selectionOf(grid[3]);
    expect(findOption(grid, selection)).toBe(grid[3]);
    expect(findOption(grid, { ...selection, variant: 'all' })).toBeNull();
    expect(findOption([], selection)).toBeNull();
  });

  it('marks a value as unavailable when no experiment combines it with the other choices', () => {
    const selection = selectionOf(grid[3]);
    expect(isAvailable(grid, selection, 'variant', 'gfsm')).toBe(true);
    expect(isAvailable(grid, selection, 'variant', 'only_behavior')).toBe(false);
    expect(isAvailable(grid, selection, 'chunk', '50k')).toBe(false);
    expect(isAvailable(grid, selection, 'mode', 'concat')).toBe(false);
    expect(isAvailable(grid, selection, 'tool', 'LLM: B')).toBe(false);
    expect(isAvailable(grid, selection, 'chunk', '30k')).toBe(true);
  });

  it('starts from the static baseline and adds a DFG to the selected experiment', () => {
    const { reference, selected } = defaultSelections(grid);
    expect(reference).toEqual({ tool: 'LLM: A', chunk: '30k', mode: 'ai', variant: '' });
    expect(selected).toEqual({ tool: 'LLM: A', chunk: '30k', mode: 'ai', variant: 'dfg' });
  });

  it('falls back to another variant, another experiment, or an empty selection', () => {
    const noDfg = [option('A', '30k', 'ai', ''), option('A', '30k', 'ai', 'gfsm')];
    expect(defaultSelections(noDfg).selected.variant).toBe('gfsm');
    const single = [option('A', '30k', 'ai', '')];
    expect(defaultSelections(single).selected).toEqual(defaultSelections(single).reference);
    expect(defaultSelections([]).reference).toEqual({
      tool: '',
      chunk: '',
      mode: '',
      variant: '',
    });
  });

  describe('state-of-the-art methods', () => {
    const mixed = [
      literature('DATACENTRIC'),
      literature('GROUND_TRUTH'),
      literature('MONO2MICRO', 'natural'),
      literature('MONO2MICRO', 'business'),
      ...grid,
    ];

    it('groups the approaches by kind and labels the ground truth', () => {
      expect(toolGroups(mixed)).toEqual([
        { label: 'LLM', tools: ['LLM: A', 'LLM: B'] },
        { label: 'State of the art', tools: ['DATACENTRIC', 'GROUND_TRUTH', 'MONO2MICRO'] },
      ]);
      expect(toolGroups(grid).map((group) => group.label)).toEqual(['LLM']);
      expect(toolLabel('GROUND_TRUTH')).toBe('Ground Truth');
      expect(kindOf(mixed, 'MONO2MICRO')).toBe('literature');
      expect(kindOf(mixed, 'LLM: A')).toBe('llm');
    });

    it('lists the configurations of a method', () => {
      expect(variantsOfTool(mixed, 'MONO2MICRO')).toEqual(['business', 'natural']);
      expect(variantsOfTool(mixed, 'DATACENTRIC')).toEqual(['default']);
    });

    it('never starts from a state-of-the-art method', () => {
      const { reference, selected } = defaultSelections(mixed);
      expect(reference.tool).toBe('LLM: A');
      expect(selected.tool).toBe('LLM: A');
      expect(defaultSelections([literature('HyDec', 'n/a')]).reference.tool).toBe('HyDec');
    });

    it('moves between an LLM and a method without ending in a dead end', () => {
      const llm = selectionOf(grid[3]);
      expect(selectionForTool(mixed, llm, 'DATACENTRIC')).toEqual({
        tool: 'DATACENTRIC',
        chunk: '',
        mode: '',
        variant: 'default',
      });
      expect(findOption(mixed, selectionForTool(mixed, llm, 'MONO2MICRO'))).toBe(mixed[3]);
      const method = selectionOf(literature('DATACENTRIC'));
      expect(findOption(mixed, selectionForTool(mixed, method, 'LLM: A'))).not.toBeNull();
      // Keeps the other choices when the new LLM has the same experiment.
      expect(selectionForTool(grid, llm, 'LLM: A')).toEqual(llm);
      // Several experiments share one choice: the first in the usual order wins.
      expect(selectionForTool(grid, selectionOf(grid[0]), 'LLM: A')).toEqual({
        tool: 'LLM: A',
        chunk: '30k',
        mode: 'ai',
        variant: 'dfg',
      });
      expect(selectionForTool([], llm, 'Unknown')).toEqual({ ...llm, tool: 'Unknown' });
    });
  });
});

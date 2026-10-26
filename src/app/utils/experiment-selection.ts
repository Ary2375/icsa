export type ExperimentKind = 'llm' | 'literature';

export interface ExperimentOption {
  id: string;
  kind: ExperimentKind;
  tool: string;
  chunk: string;
  mode: string;
  variant: string;
  label: string;
}

export interface Selection {
  tool: string;
  chunk: string;
  mode: string;
  variant: string;
}

export type Facet = keyof Selection;

const VARIANT_LABELS: Record<string, string> = {
  '': 'Static only',
  gfsm: 'Static + GFSM',
  dfg: 'Static + DFG',
  inductive_miner: 'Static + Inductive Miner',
  split_miner: 'Static + Split Miner',
  all: 'Static + all models',
  only_behavior: 'All behavioral models only',
  only_gfsm: 'GFSM only',
  only_dfg: 'DFG only',
  only_inductive_miner: 'Inductive Miner only',
  only_split_miner: 'Split Miner only',
};
const VARIANT_ORDER = Object.keys(VARIANT_LABELS);
const MODE_ORDER = ['ai', 'concat'];

export function parseThesisStrategy(
  strategy: string,
): { chunk: string; mode: string; variant: string } | null {
  const match = /^(\d+k)_(ai|concat)(?:_(.+))?$/.exec(strategy);
  return match ? { chunk: match[1], mode: match[2], variant: match[3] ?? '' } : null;
}

export function toolLabel(tool: string): string {
  return tool === 'GROUND_TRUTH' ? 'Ground Truth' : tool.replace(/^LLM:\s*/, '');
}

export function modeLabel(mode: string): string {
  return mode === 'ai' ? 'AI' : mode === 'concat' ? 'CONCAT' : mode;
}

export function variantLabel(variant: string): string {
  return VARIANT_LABELS[variant] ?? variant.replace(/_/g, ' ');
}

export function variantGroup(variant: string): string {
  if (variant === '') return 'Static artifacts only';
  if (variant === 'all') return 'Static + all behavioral models';
  if (variant.startsWith('only_')) return 'Behavioral models only';
  return VARIANT_ORDER.includes(variant) ? 'Static + one behavioral model' : 'Other';
}

export function describeConfiguration(
  tool: string,
  chunk: string,
  mode: string,
  variant: string,
): string {
  return [toolLabel(tool), chunk, modeLabel(mode), variantLabel(variant)].join(' · ');
}

const rank = (order: string[], value: string) => {
  const index = order.indexOf(value);
  return index === -1 ? order.length : index;
};
const compareChunks = (a: string, b: string) =>
  parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b);
const compareVariants = (a: string, b: string) =>
  rank(VARIANT_ORDER, a) - rank(VARIANT_ORDER, b) || a.localeCompare(b);
const compareModes = (a: string, b: string) =>
  rank(MODE_ORDER, a) - rank(MODE_ORDER, b) || a.localeCompare(b);

export function facetValues(options: ExperimentOption[]) {
  const unique = (pick: (option: ExperimentOption) => string) => [...new Set(options.map(pick))];
  return {
    tools: unique((option) => option.tool).sort((a, b) => a.localeCompare(b)),
    chunks: unique((option) => option.chunk).sort(compareChunks),
    modes: unique((option) => option.mode).sort(compareModes),
    variants: unique((option) => option.variant).sort(compareVariants),
  };
}

export function selectionOf(option: ExperimentOption): Selection {
  return {
    tool: option.tool,
    chunk: option.chunk,
    mode: option.mode,
    variant: option.variant,
  };
}

export function kindOf(options: ExperimentOption[], tool: string): ExperimentKind {
  return options.find((option) => option.tool === tool)?.kind ?? 'llm';
}

const TOOL_GROUP_LABELS: Record<ExperimentKind, string> = {
  llm: 'LLM',
  literature: 'State of the art',
};

export function toolGroups(options: ExperimentOption[]): { label: string; tools: string[] }[] {
  const { tools } = facetValues(options);
  return (['llm', 'literature'] as const)
    .map((kind) => ({
      label: TOOL_GROUP_LABELS[kind],
      tools: tools.filter((tool) => kindOf(options, tool) === kind),
    }))
    .filter((group) => group.tools.length);
}

// The experiments of one tool, in a stable order. For a state-of-the-art method these are its
// configurations (for example the MONO2MICRO strategies).
export function variantsOfTool(options: ExperimentOption[], tool: string): string[] {
  return [...new Set(options.filter((o) => o.tool === tool).map((o) => o.variant))].sort((a, b) =>
    a.localeCompare(b),
  );
}

// Changing the tool keeps the other choices when the new tool has such an experiment; otherwise it
// moves to the experiment of the new tool that shares most of them, so it never ends in a dead end.
export function selectionForTool(
  options: ExperimentOption[],
  selection: Selection,
  tool: string,
): Selection {
  const exact = findOption(options, { ...selection, tool });
  if (exact) return selectionOf(exact);
  const shared = (o: ExperimentOption) =>
    Number(o.chunk === selection.chunk) +
    Number(o.mode === selection.mode) +
    Number(o.variant === selection.variant);
  const best = options
    .filter((o) => o.tool === tool)
    .sort(
      (a, b) =>
        shared(b) - shared(a) ||
        compareChunks(a.chunk, b.chunk) ||
        compareModes(a.mode, b.mode) ||
        compareVariants(a.variant, b.variant),
    )[0];
  return best ? selectionOf(best) : { ...selection, tool };
}

export function findOption<T extends ExperimentOption>(
  options: T[],
  selection: Selection,
): T | null {
  return (
    options.find(
      (o) =>
        o.tool === selection.tool &&
        o.chunk === selection.chunk &&
        o.mode === selection.mode &&
        o.variant === selection.variant,
    ) ?? null
  );
}

// A value is available when at least one experiment combines it with the other current choices.
export function isAvailable(
  options: ExperimentOption[],
  selection: Selection,
  facet: Facet,
  value: string,
): boolean {
  return findOption(options, { ...selection, [facet]: value }) !== null;
}

// The reference starts as the static baseline; the selected experiment adds a DFG to it.
// State-of-the-art methods are never a default: they are chosen on purpose.
export function defaultSelections(allOptions: ExperimentOption[]): {
  reference: Selection;
  selected: Selection;
} {
  const llm = allOptions.filter((option) => option.kind === 'llm');
  const options = llm.length ? llm : allOptions;
  const sorted = [...options].sort(
    (a, b) =>
      a.tool.localeCompare(b.tool) ||
      compareChunks(a.chunk, b.chunk) ||
      compareModes(a.mode, b.mode) ||
      compareVariants(a.variant, b.variant),
  );
  if (!sorted.length) {
    const empty = { tool: '', chunk: '', mode: '', variant: '' };
    return { reference: empty, selected: empty };
  }
  const reference = sorted[0];
  const sameSetting = (o: ExperimentOption) =>
    o.tool === reference.tool && o.chunk === reference.chunk && o.mode === reference.mode;
  const selected =
    sorted.find((o) => sameSetting(o) && o.variant === 'dfg') ??
    sorted.find((o) => sameSetting(o) && o !== reference) ??
    sorted[1] ??
    reference;
  return { reference: selectionOf(reference), selected: selectionOf(selected) };
}

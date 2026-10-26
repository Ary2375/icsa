export interface ExperimentOption {
  id: string;
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
  return tool.replace(/^LLM:\s*/, '');
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
export function defaultSelections(options: ExperimentOption[]): {
  reference: Selection;
  selected: Selection;
} {
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

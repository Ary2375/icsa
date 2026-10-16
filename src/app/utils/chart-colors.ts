import { Result } from '../models/result.model';

// Strategies look like "<chunk>_<kind>", e.g. "30k_ai" or "80k_ai_split_miner".
export function parseStrategy(strategy: string): { chunk: string; kind: string } {
  const match = /^(\d+k)_(.+)$/.exec(strategy);
  return match ? { chunk: match[1], kind: match[2] } : { chunk: '', kind: strategy };
}

export function compareChunks(a: string, b: string): number {
  return parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b);
}

export type StrategyFamily = 'ai' | 'concat';

export function strategyFamily(kind: string): StrategyFamily {
  return kind.startsWith('concat') ? 'concat' : 'ai';
}

// Plain "ai" and "concat" (no behavioral model) are the baselines.
export function isBaseline(kind: string): boolean {
  return kind === 'ai' || kind === 'concat';
}

// ai family first, then concat; within a family see compareVariants.
export function compareKinds(a: string, b: string): number {
  return strategyFamily(a).localeCompare(strategyFamily(b)) || compareVariants(variantOf(a), variantOf(b));
}

// "ai_dfg" and "concat_dfg" are the same variant; the baseline has an empty variant.
export function variantOf(kind: string): string {
  return kind.replace(/^(ai|concat)_?/, '');
}

// Baseline first, then the classic variants, then the "only_*" ones.
export function compareVariants(a: string, b: string): number {
  const rank = (variant: string) => (!variant ? 0 : variant.startsWith('only_') ? 2 : 1);
  return rank(a) - rank(b) || a.localeCompare(b);
}

// Hue encodes the variant (shared by ai and concat), lightness the chunk size (smaller chunk = lighter).
export function buildConfigColors(results: Result[]): Record<string, string> {
  const parsed = results.map(r => ({ r, ...parseStrategy(r.strategy) }));
  const variants = [...new Set(parsed.map(p => variantOf(p.kind)))].sort(compareVariants);
  const chunks = [...new Set(parsed.map(p => p.chunk))].sort(compareChunks);
  const colors: Record<string, string> = {};

  for (const { r, kind, chunk } of parsed) {
    const hue = Math.round((variants.indexOf(variantOf(kind)) * 360) / variants.length);
    const step = chunks.length > 1 ? chunks.indexOf(chunk) / (chunks.length - 1) : 0.5;
    colors[r.configKey] = `hsl(${hue}, 65%, ${Math.round(72 - step * 36)}%)`;
  }
  return colors;
}

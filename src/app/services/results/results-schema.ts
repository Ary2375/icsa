import { ComparisonGroup, Result } from '../../models/result.model';
import { parseThesisStrategy } from '../../utils/experiment-selection';

/** A row of results.json, with the column names of the original study. */
export type RawRow = Record<string, unknown>;

// ---------------------------------------------------------------------------
// WHAT THE SITE SHOWS. Everything not matched here (e.g. Gemini, GPT-5, the
// Hierarchical runs, a new tool) is dropped when results.json is loaded.
// ---------------------------------------------------------------------------

/** LLMs shown, spelled exactly as `Tool` in results.json. Add a model here to show it. */
export const INCLUDED_LLMS: readonly string[] = [
    'LLM: Deepseek 32 Terminus',
    'LLM: GLM 4.6',
    'LLM: Glm 46',
];

/** State-of-the-art methods shown, spelled exactly as `Tool` in results.json. */
export const INCLUDED_LITERATURE: readonly string[] = [
    'DATACENTRIC',
    'GROUND_TRUTH',
    'HyDec',
    'LOG2MS',
    'MONO2MICRO',
];

/** LLM strategies shown: `<chunk>_<ai|concat>[_<input>]`, e.g. `30k_ai_dfg`. Excludes e.g. `Hierarchical`. */
export const isIncludedLlmStrategy = (strategy: unknown): boolean =>
    typeof strategy === 'string' && parseThesisStrategy(strategy) !== null;

/** Sections of results.json read by the site. Any other section (e.g. `raw_data`) is ignored. */
export const SOURCES: readonly {
    section: string;
    group: ComparisonGroup;
    accepts: (row: RawRow) => boolean;
}[] = [
    {
        section: 'llm_comparison',
        group: 'llm',
        accepts: row => INCLUDED_LLMS.includes(row['Tool'] as string) && isIncludedLlmStrategy(row['Strategy']),
    },
    {
        // LLM rows repeated here are already in llm_comparison.
        section: 'variant_comparison',
        group: 'literature',
        accepts: row => row['Type'] !== 'LLM' && INCLUDED_LITERATURE.includes(row['Tool'] as string),
    },
];

type FieldKey = keyof Omit<Result, 'configKey' | 'toolLabel' | 'configLabel' | 'comparisonGroup'>;

interface Field {
    key: FieldKey;
    /** Column of results.json; any column not listed here is ignored. */
    column: string;
    parse: (value: unknown) => unknown;
}

const text = (value: unknown): string => {
    if (typeof value !== 'string' || !value) throw new Error(`expected a text, got ${JSON.stringify(value)}`);
    return value;
};

// A missing value stays undefined: the pages show it as unavailable instead of zero.
const metric = (value: unknown): number => {
    if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value))) {
        throw new Error(`expected a number, got ${JSON.stringify(value)}`);
    }
    return value as number;
};

const optionalMetric = (value: unknown): number | null =>
    value === undefined || value === null ? null : metric(value);

function observed(value: unknown): { count: number; percent: number } | null {
    if (value === undefined || value === null) return null;
    const match = typeof value === 'string' ? /^(\d+)\s+\((\d+(?:\.\d+)?)%\)$/.exec(value) : null;
    if (!match || Number(match[2]) > 100) throw new Error(`invalid observed-entity coverage: ${JSON.stringify(value)}`);
    return { count: Number(match[1]), percent: Number(match[2]) };
}

/**
 * To show a new piece of information on the site:
 * 1. add its column here, mapped to a field of `Result`;
 * 2. declare the field in `result.model.ts` (property and `Result.clone`).
 */
export const FIELDS: readonly Field[] = [
    { key: 'caseStudy', column: 'Case Study', parse: text },
    { key: 'tool', column: 'Tool', parse: text },
    { key: 'strategy', column: 'Strategy', parse: text },
    { key: 'observedEntities', column: '# Obs. Ents. (%)', parse: v => observed(v)?.count ?? null },
    { key: 'observedEntitiesPercent', column: '# Obs. Ents. (%)', parse: v => observed(v)?.percent ?? null },
    { key: 'partitions', column: '#Partitions', parse: optionalMetric },
    { key: 'partitionSizeMin', column: 'Partition Size Min', parse: optionalMetric },
    { key: 'partitionSizeMed', column: 'Partition Size Med', parse: optionalMetric },
    { key: 'partitionSizeMax', column: 'Partition Size Max', parse: optionalMetric },
    { key: 'CiD', column: 'CiD', parse: metric },
    { key: 'CMod', column: 'CMod', parse: metric },
    { key: 'BCP', column: 'BCP', parse: metric },
    { key: 'DI', column: 'DI', parse: metric },
    { key: 'DTP', column: 'DTP', parse: metric },
    { key: 'TC', column: 'TC', parse: metric },
    { key: 'LC', column: 'LC', parse: metric },
    { key: 'MoJoFM', column: 'MoJoFM', parse: metric },
    { key: 'c2c_cvg 10%', column: 'c2c_cvg 10%', parse: metric },
    { key: 'c2c_cvg 33%', column: 'c2c_cvg 33%', parse: metric },
    { key: 'c2c_cvg 50%', column: 'c2c_cvg 50%', parse: metric },
];

/** Keeps from a results.json row only what the site needs, and names it as the site does. */
export function toResult(row: RawRow, comparisonGroup: ComparisonGroup): Result {
    const values: Record<string, unknown> = { comparisonGroup };
    for (const field of FIELDS) {
        try {
            values[field.key] = field.parse(row[field.column]);
        } catch (error) {
            const where = `${row['Case Study']} / ${row['Tool']} / ${row['Strategy']}`;
            throw new Error(`Invalid "${field.column}" for ${where}: ${(error as Error).message}`);
        }
    }
    return Result.clone(values as unknown as Parameters<typeof Result.clone>[0]);
}

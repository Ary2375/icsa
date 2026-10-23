export const METRICS = ['CiD', 'CMod', 'BCP', 'DI', 'DTP', 'TC', 'LC', 'MoJoFM', 'c2c_cvg 10%', 'c2c_cvg 33%', 'c2c_cvg 50%'] as const;
export type Metric = (typeof METRICS)[number];
export type ComparisonGroup = 'llm' | 'literature';

export class Result {
    /** Unique identifier of a tool + strategy configuration. */
    get configKey(): string {
        return `${this.tool}|${this.strategy}`;
    }

    get toolLabel(): string {
        if (this.tool === 'GROUND_TRUTH') return 'Ground Truth';
        if (this.tool === 'MONO2MICRO' && this.comparisonGroup === 'literature') {
            return `${this.tool} (${this.strategy})`;
        }
        return this.tool.replace(/^LLM:\s*/, '');
    }

    get configLabel(): string {
        return this.comparisonGroup === 'literature' ? this.toolLabel : `${this.toolLabel} · ${this.strategy}`;
    }

    caseStudy!: string;
    tool!: string;
    strategy!: string;
    comparisonGroup!: ComparisonGroup;
    observedEntities?: number | null;
    observedEntitiesPercent?: number | null;
    partitions?: number | null;
    partitionSizeMin?: number | null;
    partitionSizeMed?: number | null;
    partitionSizeMax?: number | null;
    CiD!: number;
    CMod!: number;
    BCP!: number;
    DI!: number;
    DTP!: number;
    TC!: number;
    LC!: number;
    MoJoFM!: number;
    'c2c_cvg 10%'!: number;
    'c2c_cvg 33%'!: number;
    'c2c_cvg 50%'!: number;

    static clone(results: Omit<Result, 'configKey' | 'toolLabel' | 'configLabel'>): Result {
        const clone: Result = new Result();

        clone.caseStudy = results.caseStudy;
        clone.tool = results.tool;
        clone.strategy = results.strategy;
        clone.comparisonGroup = results.comparisonGroup;
        clone.observedEntities = results.observedEntities;
        clone.observedEntitiesPercent = results.observedEntitiesPercent;
        clone.partitions = results.partitions;
        clone.partitionSizeMin = results.partitionSizeMin;
        clone.partitionSizeMed = results.partitionSizeMed;
        clone.partitionSizeMax = results.partitionSizeMax;
        clone.CiD = results.CiD;
        clone.CMod = results.CMod;
        clone.BCP = results.BCP;
        clone.DI = results.DI;
        clone.DTP = results.DTP;
        clone.TC = results.TC;
        clone.LC = results.LC;
        clone.MoJoFM = results.MoJoFM;
        clone['c2c_cvg 10%'] = results['c2c_cvg 10%'];
        clone['c2c_cvg 33%'] = results['c2c_cvg 33%'];
        clone['c2c_cvg 50%'] = results['c2c_cvg 50%'];

        return clone;
    }
}
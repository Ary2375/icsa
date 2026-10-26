import { Partition } from '../models/decomposition.model';

const DATA_ROOT = 'assets/data/monoliths';

// Folder of each monolith and LLM under src/assets/data/monoliths. A new monolith or
// LLM in results.json needs its folder here, otherwise the Comparator reports it.
export const MONOLITH_FOLDERS: Record<string, string> = {
  '7ep-demo': '7ep-demo',
  JPetStore: 'jpetstore-6',
  PartsUnlimitedMRP: 'PartsUnlimitedMRP',
  'Spring-PetClinic': 'spring-petclinic',
};

export const LLM_FOLDERS: Record<string, string> = {
  'LLM: Deepseek 32 Terminus': 'deepseek-3.2-terminus',
  'LLM: GLM 4.6': 'glm-4.6',
};

// An empty variant is the static baseline, stored directly in the artifacts folder.
export function decompositionPath(
  caseStudy: string,
  tool: string,
  chunk: string,
  mode: string,
  variant: string,
): string | null {
  const monolith = MONOLITH_FOLDERS[caseStudy];
  const llm = LLM_FOLDERS[tool];
  if (!monolith || !llm) return null;
  return [
    DATA_ROOT,
    monolith,
    'summaries',
    llm,
    chunk,
    `artifacts_${mode}`,
    variant,
    'decomposition.json',
  ]
    .filter(Boolean)
    .join('/');
}

export function referencePath(caseStudy: string): string | null {
  const monolith = MONOLITH_FOLDERS[caseStudy];
  return monolith ? `${DATA_ROOT}/${monolith}/reference_decomposition.json` : null;
}

export function parsePartitions(raw: unknown, source: string): Partition[] {
  const partitions = (raw as { tool?: { decomposition?: unknown } } | null)?.tool?.decomposition;
  if (!partitions || typeof partitions !== 'object' || Array.isArray(partitions)) {
    throw new Error(`Invalid decomposition: ${source}`);
  }
  return Object.entries(partitions).map(([name, members]) => {
    if (
      !Array.isArray(members) ||
      members.some((member) => typeof member?.id !== 'string' || !member.id.trim())
    ) {
      throw new Error(`Invalid members in ${source} / ${name}`);
    }
    return { name, classes: members.map((member) => member.id as string) };
  });
}

// The class list of a monolith: the distinct classes of its reference decomposition.
export function parseReference(raw: unknown, source: string): string[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`Invalid reference: ${source}`);
  }
  const services = Object.values(raw);
  if (
    services.some(
      (members) => !Array.isArray(members) || members.some((name) => typeof name !== 'string'),
    )
  ) {
    throw new Error(`Invalid reference: ${source}`);
  }
  return [...new Set((services as string[][]).flat())].sort();
}

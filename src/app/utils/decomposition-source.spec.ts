import {
  decompositionPath,
  literaturePath,
  parsePartitions,
  parseReference,
  referencePath,
} from './decomposition-source';

describe('state-of-the-art decomposition paths', () => {
  const folder = (monolith: string, method: string) =>
    `assets/data/monoliths/${monolith}/summaries/${method}/class_decomposition.json`;

  it('locates the class decomposition of each method', () => {
    expect(literaturePath('7ep-demo', 'DATACENTRIC', 'default')).toBe(
      folder('7ep-demo', 'datacentric/n_partitions'),
    );
    expect(literaturePath('JPetStore', 'GROUND_TRUTH', 'default')).toBe(
      folder('jpetstore-6', 'ground_truth/n_partitions'),
    );
    expect(literaturePath('Spring-PetClinic', 'HyDec', 'n/a')).toBe(
      folder('spring-petclinic', 'hydec/n_partitions'),
    );
    expect(literaturePath('JPetStore', 'LOG2MS', 'default')).toBe(
      folder('jpetstore-6', 'log2ms/n_partitions'),
    );
  });

  it('stores MONO2MICRO by number of partitions and strategy', () => {
    expect(literaturePath('7ep-demo', 'MONO2MICRO', 'business')).toBe(
      folder('7ep-demo', 'mono2micro/4_partitions/business'),
    );
    expect(literaturePath('PartsUnlimitedMRP', 'MONO2MICRO', 'natural')).toBe(
      folder('PartsUnlimitedMRP', 'mono2micro/5_partitions/natural'),
    );
  });

  it('returns null, never a guessed folder, for an unknown monolith, method or strategy', () => {
    expect(literaturePath('Unknown app', 'DATACENTRIC', 'default')).toBeNull();
    expect(literaturePath('JPetStore', 'UNKNOWN', 'default')).toBeNull();
    expect(literaturePath('JPetStore', 'MONO2MICRO', '../business')).toBeNull();
  });
});

describe('decomposition source paths', () => {
  const deepseek = 'LLM: Deepseek 32 Terminus';

  it('builds the folder of an experiment from monolith, LLM, chunk, preparation and input', () => {
    expect(decompositionPath('JPetStore', deepseek, '30k', 'ai', 'dfg')).toBe(
      'assets/data/monoliths/jpetstore-6/summaries/deepseek-3.2-terminus/30k/artifacts_ai/dfg/decomposition.json',
    );
    expect(
      decompositionPath('Spring-PetClinic', 'LLM: GLM 4.6', '80k', 'concat', 'only_behavior'),
    ).toBe(
      'assets/data/monoliths/spring-petclinic/summaries/glm-4.6/80k/artifacts_concat/only_behavior/decomposition.json',
    );
  });

  it('stores the static baseline directly in the artifacts folder', () => {
    expect(decompositionPath('7ep-demo', deepseek, '50k', 'ai', '')).toBe(
      'assets/data/monoliths/7ep-demo/summaries/deepseek-3.2-terminus/50k/artifacts_ai/decomposition.json',
    );
  });

  it('returns null, never a guessed folder, for an unknown monolith or LLM', () => {
    expect(decompositionPath('Unknown app', deepseek, '30k', 'ai', '')).toBeNull();
    expect(decompositionPath('JPetStore', 'LLM: Unknown', '30k', 'ai', '')).toBeNull();
    expect(referencePath('Unknown app')).toBeNull();
  });

  it('locates the reference decomposition of each monolith', () => {
    expect(referencePath('PartsUnlimitedMRP')).toBe(
      'assets/data/monoliths/PartsUnlimitedMRP/reference_decomposition.json',
    );
  });
});

describe('decomposition parsing', () => {
  it('keeps empty services, repeated IDs and the emitted identifiers', () => {
    expect(
      parsePartitions(
        { tool: { decomposition: { Empty: [], Service: [{ id: 'A' }, { id: 'A' }] } } },
        'file.json',
      ),
    ).toEqual([
      { name: 'Empty', classes: [] },
      { name: 'Service', classes: ['A', 'A'] },
    ]);
  });

  it('rejects invalid shapes and names the offending file', () => {
    expect(() => parsePartitions({ Service: ['A'] }, 'file.json')).toThrow(
      'Invalid decomposition: file.json',
    );
    expect(() => parsePartitions(null, 'file.json')).toThrow('Invalid decomposition: file.json');
    expect(() =>
      parsePartitions({ tool: { decomposition: { Service: [{ name: 'A' }] } } }, 'file.json'),
    ).toThrow('Invalid members in file.json / Service');
    expect(() =>
      parsePartitions({ tool: { decomposition: { Service: [{ id: ' ' }] } } }, 'file.json'),
    ).toThrow('Invalid members');
  });

  it('reads the class list of a reference as sorted, distinct classes', () => {
    expect(parseReference({ account: ['b.B', 'a.A'], order: ['a.A', 'c.C'] }, 'ref.json')).toEqual([
      'a.A',
      'b.B',
      'c.C',
    ]);
    expect(parseReference({}, 'ref.json')).toEqual([]);
  });

  it('rejects an invalid reference', () => {
    expect(() => parseReference(null, 'ref.json')).toThrow('Invalid reference: ref.json');
    expect(() => parseReference([], 'ref.json')).toThrow('Invalid reference');
    expect(() => parseReference({ a: 'x' }, 'ref.json')).toThrow('Invalid reference');
    expect(() => parseReference({ a: [1] }, 'ref.json')).toThrow('Invalid reference');
  });
});

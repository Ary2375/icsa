import { Partition } from '../models/decomposition.model';
import { decompositionCoverage, partitionStats, serviceEvolution } from './decomposition-analysis';

const service = (name: string, ...classes: string[]): Partition => ({ name, classes });

describe('partition statistics', () => {
  it('computes the median, duplicates, imbalance and singletons from raw assignments', () => {
    expect(partitionStats([service('A', 'A'), service('B', 'A', 'B', 'C')])).toMatchObject({
      services: 2,
      entities: 3,
      assignments: 4,
      duplicateAssignments: 1,
      min: 1,
      median: 2,
      max: 3,
      singletons: 1,
      largestShare: 75,
      cv: 0.5,
    });
    expect(partitionStats([])).toMatchObject({
      min: null,
      median: null,
      max: null,
      cv: null,
      largestShare: null,
    });
  });
});

describe('decomposition coverage of the monolith', () => {
  const universe = ['app.Account', 'app.Order', 'app.Cart', 'a.Dup', 'b.Dup'];

  it('matches fully-qualified IDs and unambiguous simple names, and lists what is missing', () => {
    const result = decompositionCoverage(
      [service('One', 'app.Account', 'Order'), service('Two', 'Order', 'AccountTest')],
      universe,
    );
    expect(result.covered).toEqual(['app.Account', 'app.Order']);
    expect(result.missing).toEqual(['a.Dup', 'app.Cart', 'b.Dup']);
    expect(result.percent).toBeCloseTo(40);
    expect(result.outside).toBe(1);
  });

  it('does not guess ambiguous simple names, and does not count outside IDs as covered', () => {
    const result = decompositionCoverage(
      [service('One', 'Dup', 'other.Library', 'Unknown')],
      universe,
    );
    expect(result).toMatchObject({ unresolved: 1, outside: 2 });
    expect(result.covered).toEqual([]);
  });

  it('handles empty decompositions and an unknown monolith class list', () => {
    expect(decompositionCoverage([], universe)).toMatchObject({ percent: 0, outside: 0 });
    expect(decompositionCoverage([service('One', 'A')], [])).toMatchObject({
      percent: null,
      total: 0,
      outside: 1,
    });
  });
});

describe('directional microservice evolution', () => {
  it('recognizes genuinely new and removed services, never just renamed ones', () => {
    const result = serviceEvolution(
      [service('Old', 'X'), service('Keep', 'A')],
      [service('New', 'Y'), service('Renamed', 'A')],
    );
    expect(result).toMatchObject({ newServices: 1, removedServices: 1, merges: 0, splits: 0 });
    expect(result.events.map((event) => event.kind)).toEqual(['new', 'removed', 'renamed']);
  });

  it('groups multiple reference services into one successor rather than reporting deletions', () => {
    const result = serviceEvolution(
      [service('Account', 'A'), service('Order', 'B')],
      [service('Commerce', 'A', 'B', 'NewClass')],
    );
    expect(result).toMatchObject({ newServices: 0, removedServices: 0, merges: 1, splits: 0 });
    expect(result.events[0]).toMatchObject({ kind: 'merged', added: ['NewClass'], removed: [] });
    expect(result.events[0].flows.map((flow) => flow.classes)).toEqual([['A'], ['B']]);
  });

  it('recognizes a split and reverses it to a merge when the direction changes', () => {
    const reference = [service('Commerce', 'A', 'B', 'Lost')];
    const selected = [service('Account', 'A'), service('Order', 'B')];
    const forward = serviceEvolution(reference, selected);
    expect(forward).toMatchObject({ newServices: 0, removedServices: 0, merges: 0, splits: 1 });
    expect(forward.events[0].removed).toEqual(['Lost']);
    expect(serviceEvolution(selected, reference).merges).toBe(1);
  });

  it('does not mislabel many-to-many redistribution as a pure merge or split', () => {
    const result = serviceEvolution(
      [service('One', 'A', 'B'), service('Two', 'C', 'D')],
      [service('First', 'A', 'C'), service('Second', 'B', 'D')],
    );
    expect(result).toMatchObject({ newServices: 0, removedServices: 0, merges: 0, splits: 0 });
    expect(result.events).toHaveLength(1);
    expect(result.events[0].kind).toBe('redistributed');
  });

  it('distinguishes a modified class set, a rename and an unchanged service', () => {
    const result = serviceEvolution(
      [service('Modified', 'A', 'Lost'), service('OldName', 'B'), service('Same', 'C')],
      [service('Modified', 'A', 'Added'), service('NewName', 'B'), service('Same', 'C')],
    );
    expect(result.events.map((event) => event.kind)).toEqual(['modified', 'renamed', 'unchanged']);
    expect(result.events[0]).toMatchObject({ added: ['Added'], removed: ['Lost'] });
  });

  it('does not infer continuity from equal names with disjoint classes', () => {
    const result = serviceEvolution([service('Same name', 'A')], [service('Same name', 'B')]);
    expect(result.newServices).toBe(1);
    expect(result.removedServices).toBe(1);
  });

  it('flags repeated assignments as uncertain, not as merges or new services', () => {
    const result = serviceEvolution(
      [service('One', 'A'), service('Two', 'A')],
      [service('Combined', 'A')],
    );
    expect(result).toMatchObject({
      newServices: 0,
      removedServices: 0,
      merges: 0,
      splits: 0,
      ambiguousClasses: ['A'],
    });
    expect(result.events.every((event) => event.kind === 'uncertain')).toBe(true);
    expect(result.events.every((event) => event.flows.length === 0)).toBe(true);
    expect(
      serviceEvolution([service('Repeated', 'A', 'A')], [service('Once', 'A')]).events[0].kind,
    ).toBe('uncertain');
  });

  it('handles empty decompositions and empty services without inventing matches', () => {
    expect(serviceEvolution([], []).events).toEqual([]);
    expect(serviceEvolution([], [service('Empty')]).events[0].kind).toBe('uncertain');
    expect(serviceEvolution([], [service('New', 'A')]).newServices).toBe(1);
  });
});

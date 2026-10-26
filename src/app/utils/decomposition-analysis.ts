import { Partition } from '../models/decomposition.model';

function mean(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export function partitionStats(partitions: Partition[]) {
  const sizes = partitions.map((partition) => partition.classes.length).sort((a, b) => a - b);
  const unique = new Set(partitions.flatMap((partition) => partition.classes));
  const average = mean(sizes);
  const total = sizes.reduce((sum, size) => sum + size, 0);
  return {
    sizes,
    services: partitions.length,
    assignments: total,
    entities: unique.size,
    duplicateAssignments: total - unique.size,
    min: sizes[0] ?? null,
    max: sizes.at(-1) ?? null,
    median: sizes.length
      ? (sizes[Math.floor((sizes.length - 1) / 2)] + sizes[Math.floor(sizes.length / 2)]) / 2
      : null,
    singletons: sizes.filter((size) => size === 1).length,
    largestShare: total ? (Math.max(...sizes) / total) * 100 : null,
    cv: average
      ? Math.sqrt(sizes.reduce((sum, size) => sum + (size - average) ** 2, 0) / sizes.length) /
        average
      : null,
  };
}

function memberships(partitions: Partition[]) {
  const map = new Map<string, Partition[]>();
  for (const partition of partitions) {
    for (const name of partition.classes) map.set(name, [...(map.get(name) ?? []), partition]);
  }
  return map;
}

export type ServiceEvolutionKind =
  | 'new'
  | 'removed'
  | 'split'
  | 'merged'
  | 'redistributed'
  | 'modified'
  | 'renamed'
  | 'unchanged'
  | 'uncertain';

export function serviceEvolution(reference: Partition[], selected: Partition[]) {
  const before = memberships(reference);
  const after = memberships(selected);
  const ambiguous = new Set(
    [...new Set([...before.keys(), ...after.keys()])].filter(
      (name) => (before.get(name)?.length ?? 0) > 1 || (after.get(name)?.length ?? 0) > 1,
    ),
  );
  const sources = reference.map((partition, index) => ({
    ...partition,
    index,
    side: 'reference' as const,
  }));
  const targets = selected.map((partition, index) => ({
    ...partition,
    index,
    side: 'selected' as const,
  }));
  const nodes = [...sources, ...targets];
  const edges = sources.flatMap((source) =>
    targets.flatMap((target) => {
      const targetClasses = new Set(target.classes);
      const classes = [...new Set(source.classes)]
        .filter((name) => !ambiguous.has(name) && targetClasses.has(name))
        .sort();
      return classes.length ? [{ source: source.index, target: target.index, classes }] : [];
    }),
  );
  const adjacency = nodes.map(() => new Set<number>());
  for (const edge of edges) {
    const target = sources.length + edge.target;
    adjacency[edge.source].add(target);
    adjacency[target].add(edge.source);
  }
  const visited = new Set<number>();
  const events = nodes.flatMap((_, start) => {
    if (visited.has(start)) return [];
    const pending = [start];
    const component: number[] = [];
    while (pending.length) {
      const current = pending.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      component.push(current);
      pending.push(...adjacency[current]);
    }
    const origins = component
      .filter((index) => index < sources.length)
      .sort((a, b) => a - b)
      .map((index) => sources[index]);
    const destinations = component
      .filter((index) => index >= sources.length)
      .sort((a, b) => a - b)
      .map((index) => targets[index - sources.length]);
    const referenceClasses = new Set(origins.flatMap((service) => service.classes));
    const selectedClasses = new Set(destinations.flatMap((service) => service.classes));
    const ambiguousClasses = [...new Set([...referenceClasses, ...selectedClasses])]
      .filter((name) => ambiguous.has(name))
      .sort();
    const empty = [...origins, ...destinations].some((service) => !service.classes.length);
    const added = [...selectedClasses].filter((name) => !before.has(name)).sort();
    const removed = [...referenceClasses].filter((name) => !after.has(name)).sort();
    const sameSet =
      referenceClasses.size === selectedClasses.size &&
      [...referenceClasses].every((name) => selectedClasses.has(name));
    const kind: ServiceEvolutionKind =
      ambiguousClasses.length || empty
        ? 'uncertain'
        : !origins.length
          ? 'new'
          : !destinations.length
            ? 'removed'
            : origins.length === 1 && destinations.length > 1
              ? 'split'
              : origins.length > 1 && destinations.length === 1
                ? 'merged'
                : origins.length > 1 && destinations.length > 1
                  ? 'redistributed'
                  : !sameSet
                    ? 'modified'
                    : origins[0].name === destinations[0].name
                      ? 'unchanged'
                      : 'renamed';
    return [
      {
        kind,
        origins,
        destinations,
        added,
        removed,
        ambiguousClasses,
        empty,
        flows: edges.filter(
          (edge) =>
            origins.some((service) => service.index === edge.source) &&
            destinations.some((service) => service.index === edge.target),
        ),
      },
    ];
  });
  const order: ServiceEvolutionKind[] = [
    'new',
    'removed',
    'merged',
    'split',
    'redistributed',
    'modified',
    'renamed',
    'uncertain',
    'unchanged',
  ];
  return {
    events: events.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind)),
    newServices: events
      .filter((event) => event.kind === 'new')
      .flatMap((event) => event.destinations).length,
    removedServices: events
      .filter((event) => event.kind === 'removed')
      .flatMap((event) => event.origins).length,
    splits: events.filter((event) => event.kind === 'split').length,
    merges: events.filter((event) => event.kind === 'merged').length,
    ambiguousClasses: [...ambiguous].sort(),
  };
}

export function decompositionCoverage(partitions: Partition[], universe: string[]) {
  const known = new Set(universe);
  const bySimpleName = new Map<string, string[]>();
  for (const name of universe) {
    const simple = name.split('.').at(-1)!;
    bySimpleName.set(simple, [...(bySimpleName.get(simple) ?? []), name]);
  }
  const covered = new Set<string>();
  let outside = 0;
  let unresolved = 0;
  for (const id of new Set(partitions.flatMap((partition) => partition.classes))) {
    if (known.has(id)) covered.add(id);
    else if (id.includes('.')) outside++;
    else {
      const matches = bySimpleName.get(id) ?? [];
      if (matches.length === 1) covered.add(matches[0]);
      else if (matches.length > 1) unresolved++;
      else outside++;
    }
  }
  return {
    total: universe.length,
    covered: [...covered].sort(),
    missing: universe.filter((name) => !covered.has(name)).sort(),
    outside,
    unresolved,
    percent: universe.length ? (covered.size / universe.length) * 100 : null,
  };
}

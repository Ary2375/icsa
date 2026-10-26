import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Partition } from '../../models/decomposition.model';
import { selectionOf } from '../../utils/experiment-selection';
import { Comparator } from './comparator';

const TOOL = 'LLM: Deepseek 32 Terminus';
const RESULTS = 'assets/data/results.json';
const CLASSES = ['example.A', 'example.B', 'example.C', 'example.D'];

function urlOf(folder: string, strategy: string): string {
  const match = /^(\d+k)_(ai|concat)(?:_(.+))?$/.exec(strategy)!;
  return [
    'assets/data/monoliths',
    folder,
    'summaries/deepseek-3.2-terminus',
    match[1],
    `artifacts_${match[2]}`,
    match[3] ?? '',
    'decomposition.json',
  ]
    .filter(Boolean)
    .join('/');
}
const referenceUrl = (folder: string) =>
  `assets/data/monoliths/${folder}/reference_decomposition.json`;
const body = (partitions: Partition[]) => ({
  tool: {
    decomposition: Object.fromEntries(
      partitions.map((partition) => [partition.name, partition.classes.map((id) => ({ id }))]),
    ),
  },
});
const row = (caseStudy: string, strategy: string, tool = TOOL) => ({
  'Case Study': caseStudy,
  Tool: tool,
  Strategy: strategy,
  Type: 'LLM',
  '#Partitions': 2,
  '# Obs. Ents. (%)': '3 (75.0%)',
});

const DEFAULT_DATA: Record<string, Partition[]> = {
  '30k_ai': [
    { name: 'Account', classes: ['A', 'B'] },
    { name: 'Catalog', classes: ['C', 'OnlyA'] },
  ],
  '30k_ai_dfg': [
    { name: 'Account and Catalog', classes: ['A', 'C'] },
    { name: 'Other', classes: ['B', 'OnlyB'] },
  ],
  '50k_concat_gfsm': [{ name: 'All', classes: ['A', 'B', 'C'] }],
};

interface Setup {
  data?: Record<string, Partition[]>;
  rows?: unknown[];
  variantRows?: unknown[];
  classes?: string[] | 'missing';
}

describe('Comparator page', () => {
  let fixture: ComponentFixture<Comparator>;
  let component: Comparator;
  let http: HttpTestingController;
  let files: Map<string, unknown>;
  let requested: string[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Comparator],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Comparator);
    component = fixture.componentInstance;
    files = new Map();
    requested = [];
    fixture.detectChanges();
  });
  afterEach(() => http.verify());

  const respond = (request: TestRequest) => {
    requested.push(request.request.url);
    const content = files.get(request.request.url);
    if (content === undefined) request.flush('Not found', { status: 404, statusText: 'Not Found' });
    else request.flush(content as object);
  };

  // Answers every pending request of the page from `files`, until the page stops asking.
  function settle(): void {
    for (let round = 0; round < 6; round++) {
      fixture.detectChanges();
      const pending = http.match(() => true);
      if (!pending.length) break;
      pending.forEach(respond);
    }
    fixture.detectChanges();
  }

  function publish(setup: Setup = {}, respondToDecompositions = true): void {
    const data = setup.data ?? DEFAULT_DATA;
    for (const [strategy, partitions] of Object.entries(data)) {
      files.set(urlOf('7ep-demo', strategy), body(partitions));
    }
    files.set(
      urlOf('jpetstore-6', '30k_ai'),
      body([{ name: 'Other application', classes: ['X'] }]),
    );
    if (setup.classes !== 'missing') {
      files.set(referenceUrl('7ep-demo'), { service: setup.classes ?? CLASSES });
      files.set(referenceUrl('jpetstore-6'), { service: ['example.X'] });
    }
    http.expectOne(RESULTS).flush({
      llm_comparison: {
        all: setup.rows ?? [
          ...Object.keys(data).map((strategy) => row('7ep-demo', strategy)),
          row('JPetStore', '30k_ai'),
        ],
      },
      variant_comparison: { literature: setup.variantRows ?? [] },
    });
    if (respondToDecompositions) settle();
    else fixture.detectChanges();
  }

  const optionOf = (strategy: string, folder = '7ep-demo') =>
    component.options().find((option) => option.id === urlOf(folder, strategy))!;
  const chooseReference = (strategy: string) => {
    component.referenceChoice.set(selectionOf(optionOf(strategy)));
    settle();
  };
  const chooseSelected = (strategy: string) => {
    component.selectedChoice.set(selectionOf(optionOf(strategy)));
    settle();
  };
  const text = () => fixture.nativeElement.textContent as string;

  it('shows only the side-by-side comparison, with no extra sections or actions', () => {
    publish();
    expect(component.options()).toHaveLength(3);
    expect(fixture.nativeElement.querySelectorAll('.side-by-side .experiment-panel')).toHaveLength(
      2,
    );
    expect(fixture.nativeElement.querySelectorAll('app-experiment-picker')).toHaveLength(2);
    expect(
      fixture.nativeElement.querySelector('table, .technical-details, .evolution-card'),
    ).toBeNull();
    expect(text()).not.toContain('Copy reference');
    expect(text()).not.toContain('Original-study');
    expect(text()).not.toContain('Source');
  });

  it('presents itself as a comparator', () => {
    publish();
    expect(fixture.nativeElement.querySelector('.eyebrow')?.textContent).toContain('Comparator');
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Compare two');
    expect(text()).not.toContain('Analysis');
    expect(fixture.nativeElement.querySelector('main.comparator-page')).not.toBeNull();
  });

  it('starts from the static baseline against the same setting with a DFG', () => {
    publish();
    expect(component.first()).toMatchObject({ chunk: '30k', mode: 'ai', variant: '' });
    expect(component.second()).toMatchObject({ chunk: '30k', mode: 'ai', variant: 'dfg' });
    expect(component.first()?.label).toBe('Deepseek 32 Terminus · 30k · AI · Static only');
    expect(text()).toContain('Deepseek 32 Terminus · 30k · AI · Static + DFG');
  });

  it('only compares the evaluated LLM experiments, not the literature references', () => {
    publish({
      variantRows: [
        { ...row('7ep-demo', 'default', 'GROUND_TRUTH'), Type: 'Traditional' },
        { ...row('7ep-demo', 'business', 'MONO2MICRO'), Type: 'Traditional' },
      ],
    });
    expect(component.options()).toHaveLength(3);
    expect(component.options().every((option) => option.tool === TOOL)).toBe(true);
  });

  it('shows the observed entities of the experiment from results.json', () => {
    publish();
    expect(component.columns()[0].experiment.observed).toBe('3 (75.0%)');
    expect(text()).toContain('Entities observed by the evaluation: 3 (75.0%)');
  });

  describe('data is read from the files, never from a generated index', () => {
    it('requests only the two chosen decompositions and the class list of the monolith', () => {
      publish();
      expect(requested.sort()).toEqual(
        [
          urlOf('7ep-demo', '30k_ai'),
          urlOf('7ep-demo', '30k_ai_dfg'),
          referenceUrl('7ep-demo'),
        ].sort(),
      );
      expect(requested.some((url) => url.includes('analysis.json'))).toBe(false);
    });

    it('reads the file of an experiment when it is chosen, and no other', () => {
      publish();
      requested.length = 0;
      chooseSelected('50k_concat_gfsm');
      expect(requested).toEqual([urlOf('7ep-demo', '50k_concat_gfsm')]);
    });

    it('shows the current content of a file every time the experiment is chosen again', () => {
      publish();
      expect(component.columns()[0].services.map((service) => service.name)).toEqual([
        'Account',
        'Catalog',
      ]);
      chooseReference('50k_concat_gfsm');
      // The file changes on disk between two visits: the next choice shows the new content.
      files.set(urlOf('7ep-demo', '30k_ai'), body([{ name: 'Edited service', classes: ['A'] }]));
      chooseReference('30k_ai');
      expect(component.columns()[0].services.map((service) => service.name)).toEqual([
        'Edited service',
      ]);
      expect(text()).toContain('Edited service');
    });

    it('reads the class list again after the monolith changes', () => {
      publish();
      requested.length = 0;
      component.changeRepository('JPetStore');
      settle();
      expect(requested).toContain(referenceUrl('jpetstore-6'));
      expect(requested).toContain(urlOf('jpetstore-6', '30k_ai'));
    });

    it('shows a loading state until both decompositions have arrived', () => {
      publish({}, false);
      expect(component.evolution()).toBeNull();
      expect(text()).toContain('Loading decompositions...');
      expect(fixture.nativeElement.querySelector('.side-by-side')).toBeNull();
      settle();
      expect(text()).not.toContain('Loading decompositions...');
      expect(fixture.nativeElement.querySelector('.side-by-side')).not.toBeNull();
    });
  });

  describe('choosing the experiments', () => {
    it('lets both experiments be chosen independently', () => {
      publish();
      chooseReference('50k_concat_gfsm');
      chooseSelected('30k_ai');
      expect(component.first()).toMatchObject({ chunk: '50k', mode: 'concat', variant: 'gfsm' });
      expect(component.second()).toMatchObject({ chunk: '30k', mode: 'ai', variant: '' });
      expect(component.evolution()?.splits).toBe(1);
    });

    it('keeps the selected experiment unchanged when the reference is changed', () => {
      publish();
      const selected = component.second()!.id;
      chooseReference('50k_concat_gfsm');
      expect(component.first()?.chunk).toBe('50k');
      expect(component.second()?.id).toBe(selected);
    });

    it('keeps the reference fixed while exploring several selected experiments', () => {
      publish();
      const reference = component.first();
      chooseSelected('50k_concat_gfsm');
      expect(component.first()).toBe(reference);
      expect(component.evolution()?.merges).toBe(1);
      chooseSelected('30k_ai_dfg');
      expect(component.first()).toBe(reference);
    });

    it('resets both experiments when changing monolith and cannot compare across applications', () => {
      publish();
      chooseReference('50k_concat_gfsm');
      chooseSelected('30k_ai');
      component.changeRepository('JPetStore');
      settle();
      expect(component.referenceChoice()).toBeNull();
      expect(component.selectedChoice()).toBeNull();
      expect(component.first()?.caseStudy).toBe('JPetStore');
      expect(component.second()?.caseStudy).toBe('JPetStore');
      expect(component.options()).toHaveLength(1);
      expect(text()).toContain('You selected the same experiment');
    });

    it('explains when a combination has no experiment instead of showing stale columns', () => {
      publish();
      component.selectedChoice.set({ ...component.selectedSelection(), chunk: '80k' });
      settle();
      expect(component.second()).toBeNull();
      expect(component.columns()).toEqual([]);
      expect(fixture.nativeElement.querySelector('.side-by-side')).toBeNull();
      expect(text()).toContain('no experiment matches one of the');
      expect(text()).toContain('No experiment matches this combination');
    });
  });

  describe('the columns', () => {
    it('shows the reference and selected columns with highlighted classes', () => {
      publish();
      const [reference, selected] = component.columns();
      expect(reference.name).toBe('Reference experiment');
      expect(selected.name).toBe('Selected experiment');
      const account = reference.services[0];
      expect(account.kind).toBe('redistributed');
      expect(account.counterparts).toEqual(['Account and Catalog', 'Other']);
      expect(account.classItems.map((item) => [item.name, item.mark])).toEqual([
        ['A', 'same'],
        ['B', 'moved'],
      ]);
      expect(reference.services[1].classItems.find((item) => item.name === 'OnlyA')).toMatchObject({
        mark: 'only-here',
        note: 'not in selected',
      });
      expect(selected.services[1].classItems.find((item) => item.name === 'OnlyB')).toMatchObject({
        mark: 'only-here',
        note: 'not in reference',
      });
    });

    it('tags new, removed, merged and split services', () => {
      publish({
        data: {
          '30k_ai': [
            { name: 'Customer', classes: ['A'] },
            { name: 'Order', classes: ['B'] },
            { name: 'Legacy', classes: ['L'] },
            { name: 'Combined', classes: ['D', 'E'] },
          ],
          '30k_ai_dfg': [
            { name: 'Commerce', classes: ['A', 'B'] },
            { name: 'Fresh', classes: ['N'] },
            { name: 'First part', classes: ['D'] },
            { name: 'Second part', classes: ['E'] },
          ],
        },
      });
      const [reference, selected] = component.columns();
      expect(reference.services.map((service) => service.kind)).toEqual([
        'merged',
        'merged',
        'removed',
        'split',
      ]);
      expect(selected.services.map((service) => service.kind)).toEqual([
        'merged',
        'new',
        'split',
        'split',
      ]);
      expect(reference.services[0]).toMatchObject({
        label: 'Merged',
        relation: 'into',
        counterparts: ['Commerce'],
      });
      expect(selected.services[0]).toMatchObject({
        relation: 'combines',
        counterparts: ['Customer', 'Order'],
      });
      expect(selected.services[1]).toMatchObject({ label: 'New', counterparts: [] });
      expect(reference.services[2]).toMatchObject({ label: 'Removed', counterparts: [] });
    });

    it('does not mark classes as moved when they stay in the main flow of their service', () => {
      publish({
        data: {
          '30k_ai': [
            { name: 'Math', classes: ['A', 'B'] },
            { name: 'Other', classes: ['C'] },
          ],
          '30k_ai_dfg': [{ name: 'Math', classes: ['A', 'B', 'C'] }],
        },
      });
      const [reference, selected] = component.columns();
      expect(reference.services[0].classItems.map((item) => item.mark)).toEqual(['same', 'same']);
      expect(
        selected.services[0].classItems.map((item) => [item.name, item.mark, item.note]),
      ).toEqual([
        ['A', 'same', ''],
        ['B', 'same', ''],
        ['C', 'moved', '← Other'],
      ]);
    });

    it('flags repeated assignments instead of marking them as moves, without warning boxes', () => {
      publish({
        data: {
          '30k_ai': [
            { name: 'One', classes: ['A'] },
            { name: 'Two', classes: ['A', 'B'] },
            { name: 'Empty', classes: [] },
          ],
          '30k_ai_dfg': [{ name: 'All', classes: ['A', 'B'] }],
        },
      });
      const [reference] = component.columns();
      expect(reference.services[0].classItems[0]).toMatchObject({
        mark: 'ambiguous',
        note: 'repeated assignment',
      });
      expect(reference.services[0].kind).toBe('uncertain');
      expect(fixture.nativeElement.querySelector('.experiment-panel .notice')).toBeNull();
      expect(text()).not.toContain('repeated class assignments');
    });

    it('places the legend below the two columns and explains every tag', () => {
      publish();
      const columns = fixture.nativeElement.querySelector('.side-by-side') as HTMLElement;
      const legend = fixture.nativeElement.querySelector('.legend') as HTMLElement;
      expect(
        columns.compareDocumentPosition(legend) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(columns.contains(legend)).toBe(false);
      for (const tag of [
        'New',
        'Removed',
        'Merged',
        'Split',
        'Split part',
        'Reorganized',
        'Modified',
        'Renamed',
        'Unchanged',
        'Uncertain',
        'not in selected',
        'not in reference',
        'repeated assignment',
      ]) {
        expect(legend.textContent).toContain(tag);
      }
      const shown = new Set(
        component.columns().flatMap((side) => side.services.map((service) => service.label)),
      );
      for (const label of shown) if (label) expect(legend.textContent).toContain(label);
    });
  });

  describe('coverage of the monolith', () => {
    it('reports it for each column and its change', () => {
      publish({
        data: {
          '30k_ai': [
            { name: 'Account', classes: ['A', 'B'] },
            { name: 'Catalog', classes: ['C', 'OnlyA'] },
          ],
          '30k_ai_dfg': [{ name: 'Everything', classes: ['A', 'B', 'C', 'D'] }],
        },
      });
      const [reference, selected] = component.columns();
      expect(reference.coverage).toMatchObject({ total: 4, outside: 1, percent: 75 });
      expect(reference.coverage.missing).toEqual(['example.D']);
      expect(selected.coverage.covered).toEqual(CLASSES);
      expect(component.coverageChange()).toEqual({
        reference: 75,
        selected: 100,
        onlyReference: 0,
        onlySelected: 1,
      });
      expect(text()).toContain('75% → 100%');
      expect(text()).toContain('1 classes not covered');
    });

    it('is shown as unavailable, never as zero, when the class list cannot be read', () => {
      publish({ classes: 'missing' });
      expect(component.evolution()).not.toBeNull();
      expect(component.coverageChange()).toBeNull();
      expect(component.columns()[0].coverage.percent).toBeNull();
      expect(text()).toContain('class list unavailable');
      expect(text()).not.toContain('0 / 0');
    });
  });

  describe('when the data cannot be read', () => {
    it('names the missing decomposition file instead of showing partial columns', () => {
      publish({}, false);
      files.delete(urlOf('7ep-demo', '30k_ai_dfg'));
      settle();
      expect(component.evolution()).toBeNull();
      expect(component.columns()).toEqual([]);
      const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
      expect(alert.textContent).toContain(urlOf('7ep-demo', '30k_ai_dfg'));
      expect(alert.textContent).toContain('404');
      expect(text()).not.toContain('Loading decompositions...');
    });

    it('recovers when the user chooses an experiment whose file is available', () => {
      publish({}, false);
      files.delete(urlOf('7ep-demo', '30k_ai_dfg'));
      settle();
      chooseSelected('50k_concat_gfsm');
      expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
      expect(component.evolution()).not.toBeNull();
    });

    it('reports a file that is not a decomposition', () => {
      publish({}, false);
      files.set(urlOf('7ep-demo', '30k_ai'), { unexpected: true });
      settle();
      expect(component.evolution()).toBeNull();
      expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
        `Invalid decomposition: ${urlOf('7ep-demo', '30k_ai')}`,
      );
    });

    it('reports a monolith or LLM without a configured data folder', () => {
      publish({ rows: [row('Unknown app', '30k_ai'), row('7ep-demo', '30k_ai')] }, false);
      expect(component.error()).toContain('No data folder is configured for Unknown app');
      expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
      expect(component.experiments()).toEqual([]);
    });

    it('reports an unsupported strategy name, and duplicate experiments', () => {
      publish({ rows: [row('7ep-demo', 'hierarchical')] }, false);
      expect(component.error()).toContain('Unsupported experiment strategy: hierarchical');
      component.load();
      http
        .expectOne(RESULTS)
        .flush({ llm_comparison: { x: [row('7ep-demo', '30k_ai'), row('7ep-demo', '30k_ai')] } });
      expect(component.error()).toContain('Duplicate experiments');
    });

    it('does not invent experiments when results.json lists none', () => {
      publish({ rows: [] }, false);
      expect(component.first()).toBeNull();
      expect(text()).toContain('No experiments are available in results.json');
    });

    it('surfaces a network failure of results.json and permits a retry', () => {
      http.expectOne(RESULTS).flush({}, { status: 500, statusText: 'Error' });
      fixture.detectChanges();
      expect(component.error()).toContain('Unable to load');
      fixture.nativeElement.querySelector('[role="alert"] button').click();
      publish();
      expect(component.error()).toBe('');
      expect(component.loading()).toBe(false);
      expect(component.evolution()).not.toBeNull();
    });
  });
});

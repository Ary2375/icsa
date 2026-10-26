import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DecompositionsService } from './decompositions';

describe('DecompositionsService', () => {
  let service: DecompositionsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DecompositionsService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('reads the decomposition file every time and asks the browser to revalidate it', () => {
    let partitions: unknown;
    service
      .partitions('assets/data/x/decomposition.json')
      .subscribe((value) => (partitions = value));
    const request = http.expectOne('assets/data/x/decomposition.json');
    expect(request.request.headers.get('Cache-Control')).toBe('no-cache');
    request.flush({ tool: { decomposition: { Service: [{ id: 'A' }] } } });
    expect(partitions).toEqual([{ name: 'Service', classes: ['A'] }]);

    service.partitions('assets/data/x/decomposition.json').subscribe();
    http.expectOne('assets/data/x/decomposition.json').flush({ tool: { decomposition: {} } });
  });

  it('fails with the file name when the content is not a decomposition', () => {
    let error: unknown;
    service.partitions('assets/data/x/decomposition.json').subscribe({ error: (e) => (error = e) });
    http.expectOne('assets/data/x/decomposition.json').flush({ unexpected: true });
    expect((error as Error).message).toContain(
      'Invalid decomposition: assets/data/x/decomposition.json',
    );
  });

  it('propagates a missing file as an HTTP error', () => {
    let status = 0;
    service.partitions('assets/data/missing.json').subscribe({ error: (e) => (status = e.status) });
    http.expectOne('assets/data/missing.json').flush('', { status: 404, statusText: 'Not Found' });
    expect(status).toBe(404);
  });

  it('reads the class list of a monolith from its reference decomposition', () => {
    let classes: string[] = [];
    service.classList('JPetStore').subscribe((value) => (classes = value));
    const request = http.expectOne(
      'assets/data/monoliths/jpetstore-6/reference_decomposition.json',
    );
    expect(request.request.headers.get('Cache-Control')).toBe('no-cache');
    request.flush({ account: ['b.B', 'a.A'], order: ['a.A'] });
    expect(classes).toEqual(['a.A', 'b.B']);
  });

  it('does not request anything for a monolith without a configured folder', () => {
    let message = '';
    service.classList('Unknown app').subscribe({ error: (e) => (message = e.message) });
    expect(message).toContain('No data folder is configured for Unknown app');
    http.expectNone(() => true);
  });
});

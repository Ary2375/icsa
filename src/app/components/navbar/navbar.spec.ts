import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Navbar } from './navbar';
import { provideRouter } from '@angular/router';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('links to the comparator page', () => {
    const link = fixture.nativeElement.querySelector('a[href="/comparator"]');
    expect(link?.textContent).toContain('Comparator');
  });

  it('lists the sections in order: Results, Comparator, Methodology, Artifacts', () => {
    const labels = [...fixture.nativeElement.querySelectorAll('nav a')].map((a) =>
      (a as HTMLElement).textContent!.trim(),
    );
    expect(labels).toEqual(['Results', 'Comparator', 'Methodology', 'Artifacts']);
  });
});

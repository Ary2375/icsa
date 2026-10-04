import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BarView } from './bar-view';

describe('BarView', () => {
  let component: BarView;
  let fixture: ComponentFixture<BarView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarView],
    }).compileComponents();

    fixture = TestBed.createComponent(BarView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

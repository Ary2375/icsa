import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RadarView } from './radar-view';

describe('RadarView', () => {
  let component: RadarView;
  let fixture: ComponentFixture<RadarView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RadarView],
    }).compileComponents();

    fixture = TestBed.createComponent(RadarView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

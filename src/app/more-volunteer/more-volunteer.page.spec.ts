import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { providePageTesting } from '../../testing/page-testing.providers';

import { MoreVolunteerPage } from './more-volunteer.page';

describe('MoreVolunteerPage', () => {
  let component: MoreVolunteerPage;
  let fixture: ComponentFixture<MoreVolunteerPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MoreVolunteerPage],
      providers: [providePageTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(MoreVolunteerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

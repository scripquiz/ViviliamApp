import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { providePageTesting } from '../../testing/page-testing.providers';

import { MoreReportbugPage } from './more-reportbug.page';

describe('MoreReportbugPage', () => {
  let component: MoreReportbugPage;
  let fixture: ComponentFixture<MoreReportbugPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MoreReportbugPage],
      providers: [providePageTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(MoreReportbugPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

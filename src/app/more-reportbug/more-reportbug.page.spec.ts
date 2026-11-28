import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PageTestingModule } from '../../testing/page-testing.module';

import { MoreReportbugPage } from './more-reportbug.page';

describe('MoreReportbugPage', () => {
  let component: MoreReportbugPage;
  let fixture: ComponentFixture<MoreReportbugPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MoreReportbugPage, PageTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MoreReportbugPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

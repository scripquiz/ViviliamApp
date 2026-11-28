import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { providePageTesting } from '../../testing/page-testing.providers';

import { MoreTermsPage } from './more-terms.page';

describe('MoreTermsPage', () => {
  let component: MoreTermsPage;
  let fixture: ComponentFixture<MoreTermsPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MoreTermsPage],
      providers: [providePageTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(MoreTermsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

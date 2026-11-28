import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { providePageTesting } from '../../testing/page-testing.providers';

import { MorePrivatePolicyPage } from './more-private-policy.page';

describe('MorePrivatePolicyPage', () => {
  let component: MorePrivatePolicyPage;
  let fixture: ComponentFixture<MorePrivatePolicyPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MorePrivatePolicyPage],
      providers: [providePageTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(MorePrivatePolicyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

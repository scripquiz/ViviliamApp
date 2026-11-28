import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { providePageTesting } from '../../testing/page-testing.providers';

import { MoreContactPage } from './more-contact.page';

describe('MoreContactPage', () => {
  let component: MoreContactPage;
  let fixture: ComponentFixture<MoreContactPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MoreContactPage],
      providers: [providePageTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(MoreContactPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

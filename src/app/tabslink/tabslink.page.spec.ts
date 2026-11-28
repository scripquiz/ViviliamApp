import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { providePageTesting } from '../../testing/page-testing.providers';

import { TabslinkPage } from './tabslink.page';

describe('TabslinkPage', () => {
  let component: TabslinkPage;
  let fixture: ComponentFixture<TabslinkPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TabslinkPage],
      providers: [providePageTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(TabslinkPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

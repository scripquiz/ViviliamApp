import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { providePageTesting } from '../../testing/page-testing.providers';

import { StartupDefaultBiblePage } from './startup-default-bible.page';

describe('StartupDefaultBiblePage', () => {
  let component: StartupDefaultBiblePage;
  let fixture: ComponentFixture<StartupDefaultBiblePage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [StartupDefaultBiblePage],
      providers: [providePageTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(StartupDefaultBiblePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

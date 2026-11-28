import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { providePageTesting } from '../../testing/page-testing.providers';

import { StartupLanguagePage } from './startup-language.page';

describe('StartupLanguagePage', () => {
  let component: StartupLanguagePage;
  let fixture: ComponentFixture<StartupLanguagePage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [StartupLanguagePage],
      providers: [providePageTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(StartupLanguagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

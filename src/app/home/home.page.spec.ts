import { ComponentFixture, TestBed, fakeAsync, flush, discardPeriodicTasks } from '@angular/core/testing';
import { providePageTesting } from '../../testing/page-testing.providers';

import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(fakeAsync(() => {
    spyOn(HomePage.prototype, 'getAppVersionInfo').and.resolveTo();
    spyOn(window, 'fetch').and.resolveTo(new Response(JSON.stringify([{ bibleids: '2,3,5' }])));
    TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [providePageTesting()],
      errorOnUnknownElements: true,
      errorOnUnknownProperties: true
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    flush();
    discardPeriodicTasks();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

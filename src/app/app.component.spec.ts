import { TestBed, waitForAsync } from '@angular/core/testing';

import { AppComponent } from './app.component';
import { providePageTesting } from '../testing/page-testing.providers';

describe('AppComponent', () => {

  beforeEach(waitForAsync(() => {

    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [providePageTesting()],
    });
    spyOn(AppComponent.prototype, 'initializeCapacitor').and.resolveTo();
    spyOn(AppComponent.prototype, 'connectDB');
    TestBed.compileComponents();
  }));

  it('should create the app', waitForAsync(async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
    expect(app.initializeCapacitor).toHaveBeenCalled();
    expect(app.connectDB).toHaveBeenCalled();
  }));

});

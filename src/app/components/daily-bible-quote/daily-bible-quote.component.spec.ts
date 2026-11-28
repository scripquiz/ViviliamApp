import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { providePageTesting } from '../../../testing/page-testing.providers';

import { DailyBibleQuoteComponent } from './daily-bible-quote.component';

describe('DailyBibleQuoteComponent', () => {
  let component: DailyBibleQuoteComponent;
  let fixture: ComponentFixture<DailyBibleQuoteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DailyBibleQuoteComponent],
      providers: [providePageTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(DailyBibleQuoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

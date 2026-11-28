import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { providePageTesting } from '../../../testing/page-testing.providers';

import { DailyBibleVerseComponent } from './daily-bible-verse.component';

describe('DailyBibleVerseComponent', () => {
  let component: DailyBibleVerseComponent;
  let fixture: ComponentFixture<DailyBibleVerseComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DailyBibleVerseComponent],
      providers: [providePageTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(DailyBibleVerseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

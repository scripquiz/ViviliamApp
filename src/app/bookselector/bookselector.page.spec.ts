import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { providePageTesting } from '../../testing/page-testing.providers';

import { BookselectorPage } from './bookselector.page';

describe('BookselectorPage', () => {
  let component: BookselectorPage;
  let fixture: ComponentFixture<BookselectorPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BookselectorPage],
      providers: [providePageTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(BookselectorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

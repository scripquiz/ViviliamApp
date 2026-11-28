import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { providePageTesting } from '../../testing/page-testing.providers';

import { SetdefaultbiblePage } from './setdefaultbible.page';

describe('SetdefaultbiblePage', () => {
  let component: SetdefaultbiblePage;
  let fixture: ComponentFixture<SetdefaultbiblePage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SetdefaultbiblePage],
      providers: [providePageTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(SetdefaultbiblePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

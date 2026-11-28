import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PageTestingModule } from '../../testing/page-testing.module';

import { SetdefaultbiblePage } from './setdefaultbible.page';

describe('SetdefaultbiblePage', () => {
  let component: SetdefaultbiblePage;
  let fixture: ComponentFixture<SetdefaultbiblePage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SetdefaultbiblePage, PageTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SetdefaultbiblePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

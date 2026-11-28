import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PageTestingModule } from '../../testing/page-testing.module';

import { MorePage } from './more.page';

describe('MorePage', () => {
  let component: MorePage;
  let fixture: ComponentFixture<MorePage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MorePage, PageTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MorePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

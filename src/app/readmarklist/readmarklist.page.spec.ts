import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { providePageTesting } from '../../testing/page-testing.providers';
import { AppComponent } from '../app.component';

import { ReadmarklistPage } from './readmarklist.page';

describe('ReadmarklistPage', () => {
  let component: ReadmarklistPage;
  let fixture: ComponentFixture<ReadmarklistPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ReadmarklistPage],
      providers: [providePageTesting(), { provide: AppComponent, useFactory: () => ({ drawer: 'drawerhide' }) }]
    }).compileComponents();

    fixture = TestBed.createComponent(ReadmarklistPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

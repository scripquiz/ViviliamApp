import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { providePageTesting } from '../../testing/page-testing.providers';
import { AppComponent } from '../app.component';

import { AddnotesPage } from './addnotes.page';

describe('AddnotesPage', () => {
  let component: AddnotesPage;
  let fixture: ComponentFixture<AddnotesPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AddnotesPage],
      providers: [providePageTesting(), { provide: AppComponent, useFactory: () => ({ drawer: 'drawerhide' }) }]
    }).compileComponents();

    fixture = TestBed.createComponent(AddnotesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

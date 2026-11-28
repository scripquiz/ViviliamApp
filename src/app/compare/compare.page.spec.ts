import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { providePageTesting } from '../../testing/page-testing.providers';
import { AppComponent } from '../app.component';

import { ComparePage } from './compare.page';

describe('ComparePage', () => {
  let component: ComparePage;
  let fixture: ComponentFixture<ComparePage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ComparePage],
      providers: [providePageTesting(), { provide: AppComponent, useFactory: () => jasmine.createSpyObj<AppComponent>('AppComponent', ['hidedrawermenu']) }]
    }).compileComponents();

    fixture = TestBed.createComponent(ComparePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

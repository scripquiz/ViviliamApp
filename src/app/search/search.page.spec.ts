import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { providePageTesting } from '../../testing/page-testing.providers';
import { AppComponent } from '../app.component';

import { SearchPage } from './search.page';

describe('SearchPage', () => {
  let component: SearchPage;
  let fixture: ComponentFixture<SearchPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SearchPage],
      providers: [providePageTesting(), { provide: AppComponent, useFactory: () => jasmine.createSpyObj<AppComponent>('AppComponent', ['initializeData']) }]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

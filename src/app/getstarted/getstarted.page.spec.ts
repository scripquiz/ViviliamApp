import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { providePageTesting } from '../../testing/page-testing.providers';
import { AppComponent } from '../app.component';

import { GetstartedPage } from './getstarted.page';

describe('GetstartedPage', () => {
  let component: GetstartedPage;
  let fixture: ComponentFixture<GetstartedPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [GetstartedPage],
      providers: [providePageTesting(), { provide: AppComponent, useFactory: () => ({ play_speed: '1' }) }]
    }).compileComponents();

    fixture = TestBed.createComponent(GetstartedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

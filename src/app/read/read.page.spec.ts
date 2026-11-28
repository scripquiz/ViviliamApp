import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { providePageTesting } from '../../testing/page-testing.providers';
import { AppComponent } from '../app.component';

import { ReadPage } from './read.page';

describe('ReadPage', () => {
  let component: ReadPage;
  let fixture: ComponentFixture<ReadPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ReadPage],
      providers: [providePageTesting(), { provide: AppComponent, useFactory: () => jasmine.createSpyObj<AppComponent>('AppComponent', ['hidedrawermenu', 'closeAudio', 'hideAudioPanel']) }]
    }).compileComponents();

    fixture = TestBed.createComponent(ReadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

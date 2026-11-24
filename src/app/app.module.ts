import { NgModule, importProvidersFrom } from '@angular/core';
import { DatabaseImportService } from 'src/app/services/database-import.service';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthserviceProvider } from '../providers/authservice/authservice';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { CoreModule } from './core/core.module';
import { DatabaseService } from 'src/app/services/database.service';
import { NetworkService } from './services/network.service';
import { DeviceService } from './services/device.service';
import { ScreenOrientationService } from './services/screen-orientation.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Import startup module instead of the component directly
import { StartupPageModule } from './startup/startup.module';

@NgModule({
  declarations: [
    // Remove both AppComponent and StartupPage from here
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent], // Keep this - it specifies the bootstrap component
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      innerHTMLTemplatesEnabled: true,
    }),
    AppRoutingModule,
    CoreModule,
    CommonModule,
    FormsModule,
    // Import the module containing StartupPage
    StartupPageModule,
    // Remove AppComponent from imports
    // Remove DailyBibleVerseComponent & DailyBibleQuoteComponent if they're standalone
  ],
  providers: [
    AuthserviceProvider,
    DatabaseService,
    DatabaseImportService,
    NetworkService,
    DeviceService,
    ScreenOrientationService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
  ],
})
export class AppModule {}

// Keep the appConfig unchanged except remove AppComponent
export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      BrowserModule,
      IonicModule.forRoot({
        innerHTMLTemplatesEnabled: true,
      }),
      CoreModule,
      CommonModule,
      FormsModule,
      StartupPageModule // Add the StartupPageModule here too
    ),
    AuthserviceProvider,
    DatabaseService,
    NetworkService,
    DeviceService,
    ScreenOrientationService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    provideAnimations(),
  ],
};

import {
  enableProdMode,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { provideAnimations } from '@angular/platform-browser/animations';

// For compatibility with existing NgModules
import { AppModule } from './app/app.module';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

if (environment.production) {
  enableProdMode();
}

// Check if the app uses standalone components or still uses modules
try {
  // Try standalone bootstrapping first
  bootstrapApplication(AppComponent, {
    providers: [
      provideZoneChangeDetection(),
      { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
      importProvidersFrom(IonicModule.forRoot({})),
      provideRouter(routes),
      provideAnimations(),
    ],
  }).catch((err) => {
    console.log('Fallback to module-based bootstrapping', err);
    // Fall back to module-based bootstrapping if standalone components are not set up
    platformBrowserDynamic()
      .bootstrapModule(AppModule, {
        applicationProviders: [provideZoneChangeDetection()],
      })
      .catch((err) => console.log(err));
  });
} catch (err) {
  // Fallback to module-based bootstrapping if standalone components are not set up
  platformBrowserDynamic()
    .bootstrapModule(AppModule, {
      applicationProviders: [provideZoneChangeDetection()],
    })
    .catch((err) => console.log(err));
}

import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
} from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { routes } from './app.routes';
import { SelectivePreloadingStrategy } from './core/selective-preloading.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    importProvidersFrom(
      IonicModule.forRoot({
        innerHTMLTemplatesEnabled: true,
      })
    ),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideRouter(routes, withPreloading(SelectivePreloadingStrategy)),
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    provideAnimations(),
  ],
};

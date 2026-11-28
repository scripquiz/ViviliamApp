import {
  ApplicationConfig,
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
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';

import { routes } from './app.routes';
import { SelectivePreloadingStrategy } from './core/selective-preloading.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideRouter(routes, withPreloading(SelectivePreloadingStrategy)),
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    provideIonicAngular({
      innerHTMLTemplatesEnabled: true,
    }),
  ],
};

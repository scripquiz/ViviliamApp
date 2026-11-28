import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import {
  DatabaseConnection,
  DatabaseRows,
  DatabaseService,
} from '../app/services/database.service';
import {
  DarkModeService,
  DarkModeState,
} from '../app/services/dark-mode.service';
import { NetworkService } from '../app/services/network.service';
import { ScreenOrientationService } from '../app/services/screen-orientation.service';

function createDatabaseService(): jasmine.SpyObj<DatabaseService> {
  const connection = jasmine.createSpyObj<DatabaseConnection>(
    'DatabaseConnection',
    ['executeSql']
  );
  connection.executeSql.and.resolveTo({
    rows: new DatabaseRows([]),
    rowsAffected: 0,
  });
  const service = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
    'create',
  ]);
  service.create.and.resolveTo(connection);
  return service;
}

function createDarkModeService(): jasmine.SpyObj<DarkModeService> {
  const state: DarkModeState = {
    globalDarkMode: false,
    readDarkMode: false,
    compareDarkMode: false,
    searchDarkMode: false,
  };
  const service = jasmine.createSpyObj<DarkModeService>(
    'DarkModeService',
    [
      'applyPageDarkMode',
      'updateStatusBar',
      'getCurrentState',
      'toggleGlobalDarkMode',
    ],
    { darkModeState$: of(state) }
  );
  service.getCurrentState.and.returnValue(state);
  service.updateStatusBar.and.resolveTo();
  return service;
}

function createNetworkService(): jasmine.SpyObj<NetworkService> {
  const service = jasmine.createSpyObj<NetworkService>(
    'NetworkService',
    ['verifyConnectivity'],
    {
      connected$: of(true),
      disconnected$: of(false),
      actualConnectivity$: of(true),
      connectionType$: of('wifi'),
      isConnected: true,
      connectionType: 'wifi',
    }
  );
  service.verifyConnectivity.and.resolveTo(true);
  return service;
}

function createScreenOrientationService(): jasmine.SpyObj<ScreenOrientationService> {
  const service = jasmine.createSpyObj<ScreenOrientationService>(
    'ScreenOrientationService',
    ['onChange', 'lock', 'unlock'],
    { type: 'portrait-primary' }
  );
  service.onChange.and.returnValue(of('portrait-primary'));
  service.lock.and.resolveTo();
  service.unlock.and.resolveTo();
  return service;
}

/**
 * Shared providers for page/component specs: Ionic, router, HTTP testing and
 * spies for native-backed services. Scope these to component tests, not
 * service unit tests.
 */
export function providePageTesting(): (Provider | EnvironmentProviders)[] {
  return [
    provideIonicAngular(),
    provideHttpClient(withXhr()),
    provideHttpClientTesting(),
    provideRouter([]),
    { provide: DatabaseService, useFactory: createDatabaseService },
    { provide: DarkModeService, useFactory: createDarkModeService },
    { provide: NetworkService, useFactory: createNetworkService },
    { provide: ScreenOrientationService, useFactory: createScreenOrientationService },
  ];
}

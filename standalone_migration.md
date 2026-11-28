# NgModule → Standalone Migration Plan

## Current state

| Area | State |
|---|---|
| `main.ts` | Tries `bootstrapApplication(AppComponent, …)` first; if that throws, falls back to `bootstrapModule(AppModule)` |
| `AppComponent` | Already standalone (`IonicModule`, Eager change detection) |
| `AppModule` | Has providers the standalone bootstrap lacks: `innerHTMLTemplatesEnabled: true`, `provideHttpClient(withXhr(), withInterceptorsFromDi())`, `AuthserviceProvider` |
| Routing | `app.routes.ts` is used. `AppRoutingModule` (with `SelectivePreloadingStrategy`) is effectively dead. Route lists differ by one extra `addnotes` path. |
| Pages | ~35 pages, all `standalone: false`, each with `X.module.ts` + `X-routing.module.ts`, loaded via `loadChildren` |
| `CoreModule` / `SharedModule` | Empty shells. All `CoreModule` services are already `providedIn: 'root'`. |
| Services | All `providedIn: 'root'` except `AuthserviceProvider` (plain `@Injectable()`) |
| Shared bits | `ExploreContainerComponent` (NgModule, used by tab1–3). Daily verse/quote components already standalone. |
| Custom elements | `<swiper-container>` in `login` and `forgot-password` → need `CUSTOM_ELEMENTS_SCHEMA` |
| Tests | 38 specs; most use `declarations: [XPage]` + `PageTestingModule`, a few use `IonicModule.forRoot()` |

**Latent risk:** the standalone bootstrap path doesn't provide `HttpClient`, `AuthserviceProvider` or `innerHTMLTemplatesEnabled`. Pages injecting `HttpClient` (home, getstarted, bible-topics, life-events, life-event-detail) would throw `NullInjectorError` unless the app is really running on the `AppModule` fallback. Phase 1 fixes this either way.

## Phases

### Phase 0 — Baseline
- Work on the `standalone` branch.
- Record `ionic build`, `npm test`, `npm run lint` results.
- Smoke-test on an Android device.

### Phase 1 — Single bootstrap path
- Create `src/app/app.config.ts`:
  - `provideZoneChangeDetection()` (keep Zone.js)
  - `importProvidersFrom(IonicModule.forRoot({ innerHTMLTemplatesEnabled: true }))` + `{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }`
  - `provideRouter(routes, withPreloading(SelectivePreloadingStrategy))` (strategy moved to `core/selective-preloading.strategy.ts`)
  - `provideHttpClient(withXhr(), withInterceptorsFromDi())`
  - `provideAnimations()`
  - `AuthserviceProvider` → `providedIn: 'root'`
- `main.ts` → plain `bootstrapApplication(AppComponent, appConfig)`, no fallback.
- Delete `AppModule`, `AppRoutingModule`, `CoreModule`, `SharedModule`. Remove duplicate route.
- Remove unused `NgModule` import from `app.component.ts`.

### Phase 2 — Convert pages in batches
Each page → `standalone: true`, `imports: [CommonModule, FormsModule, IonicModule]` (matches `AppComponent`; never mix with `@ionic/angular/standalone`).
1. Static: `more-*`, `settings`, `tabslink`
2. Startup/auth: `startup*`, `getstarted`, `login`, `signup`, `forgot-password`, `change-password`, `myaccount` (swiper pages get `CUSTOM_ELEMENTS_SCHEMA`)
3. Topics: `bible-topics`, `bible-topic-detail`, `life-events`, `bookselector`, `setdefaultbible`, `search`, `readmarklist`, `addnotes`
4. Tabs + `ExploreContainerComponent`
5. Risky, one at a time with device test: `home`, `read`, `compare`, `life-event-detail`

### Phase 3 — Routes & module cleanup
- `loadChildren: () => import('./x/x.module')…` → `loadComponent: () => import('./x/x.page').then(m => m.XPage)`
- Tabs → `tabs.routes.ts` with `component: TabsPage` and `loadComponent` children
- Delete all `X.module.ts` / `X-routing.module.ts`

### Phase 4 — Tests
- `PageTestingModule` → `providePageTesting()` provider function
- Specs: `declarations: [XPage]` → `imports: [XPage]`; `IonicModule.forRoot()` → providers
- Done alongside each page batch to keep tests green

### Phase 5 — Optional, later
- `@ionic/angular/standalone` per-component imports (whole component at a time)
- `inject()` and `@if`/`@for` control-flow migrations
- No OnPush / zoneless changes in this effort

## Guidelines
- Ship Phase 1 on its own.
- Keep `IonicModule` for now.
- Commit per batch; `ionic build` → `npx cap sync android` → device test after each.
- Estimate: 2–4 focused days.

## Progress log
- [x] Phase 0 — baseline: build OK, 46/46 tests, lint 394 errors / 8 warnings (pre-existing)
- [x] Phase 1 — single `bootstrapApplication` path via `app.config.ts`; AppModule, AppRoutingModule, CoreModule and SharedModule removed; `SelectivePreloadingStrategy` extracted; `AuthserviceProvider` is now `providedIn: 'root'`; duplicate `addnotes` route removed. Verified: build OK, 46/46 tests, lint unchanged (394 / 8). Still needs a device smoke test.
- [ ] Phase 2
- [ ] Phase 3
- [ ] Phase 4

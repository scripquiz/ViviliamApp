# NgModule → Standalone Migration Plan

## Current state (before migration — see progress log for what has changed)

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
| Custom elements | None left (the `<swiper-container>` pages `login` / `forgot-password` were removed) |
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
2. Startup: `startup`, `startup-language`, `startup-default-bible`, `getstarted` (the unused auth pages `login`, `signup`, `forgot-password`, `change-password` and `myaccount` were removed instead)
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
- ~~Keep `IonicModule` for now.~~ (superseded by 5c)
- Commit per batch; `ionic build` → `npx cap sync android` → device test after each.
- Estimate: 2–4 focused days.

## Progress log
- [x] Phase 0 — baseline: build OK, 46/46 tests, lint 394 errors / 8 warnings (pre-existing)
- [x] Phase 1 — single `bootstrapApplication` path via `app.config.ts`; AppModule, AppRoutingModule, CoreModule and SharedModule removed; `SelectivePreloadingStrategy` extracted; `AuthserviceProvider` is now `providedIn: 'root'`; duplicate `addnotes` route removed. Verified: build OK, 46/46 tests, lint unchanged (394 / 8). Still needs a device smoke test.
- [x] Lint cleanup (small): ignore `src/assets`, `www`, `android` (data/build output); OnPush lint rule off (CLAUDE.md: keep Eager); 7 missing `OnDestroy`/`OnChanges` interfaces added; unused disable comment removed. Lint 394/8 → 331/0. Build OK, 46/46.
  - Deferred: `prefer-inject` (192) + `prefer-control-flow` → Phase 5; `template/eqeqeq` (~104) → separate careful pass (values often strings) — **done**: 93 template comparisons in 11 files changed to `===`/`!==`. Where a value's type was mixed, the literal was changed to match the real runtime type (`isTextSpanAvailable`/`maximize_screen` are numbers; `show_notes_pop` is a string; `paragraphMode`/`versenumberShow`/`CompareShowLabel` are now always strings, with their authservice defaults and settings setters changed to match; book/chapter numbers are compared via unary `+`; `vnumber` checks both `0` and `'0'`). Lint 0 errors, build OK, 41/41; `prefer-standalone` (35) → fixed by Phase 2.
- [x] Phase 2 — every page/component is standalone (0 `prefer-standalone`). Page modules remain only as lazy-load shells until Phase 3.
  - [x] Batch 1 — `more`, `more-about`, `more-contact`, `more-private-policy`, `more-reportbug`, `more-terms`, `more-volunteer`, `settings`, `tabslink` → standalone (`CommonModule, FormsModule, IonicModule`). Page modules now import the page (removed in Phase 3); specs use `imports: [XPage, …]`. Lint 331 → 322, build OK, 46/46. Needs device smoke test.
  - [x] Batch 2 — `startup`, `startup-language`, `startup-default-bible`, `getstarted` → standalone. Unused auth pages (`login`, `signup`, `forgot-password`, `change-password`, `myaccount`) deleted with their routes, plus the dead signup/account popup and its methods/styles in `AppComponent` (`AuthserviceProvider` kept; account-field cleanup is a later task). Lint 322 → 276, build OK, 41/41 (5 specs removed with the pages). Needs device smoke test.
  - [x] Batch 3 — `bible-topics`, `bible-topic-detail`, `life-events`, `bookselector`, `setdefaultbible`, `search`, `readmarklist`, `addnotes` → standalone. Page modules import the page; specs use `imports: [XPage, …]`. Lint 276 → 268 (9 `prefer-standalone` left for Batches 4–5), build OK, 41/41. Needs device smoke test.
  - [x] Batch 4 — `tabs`, `tab1`, `tab2`, `tab3`, `ExploreContainerComponent` → standalone. `ExploreContainerComponentModule` deleted (tab2/tab3 import the component directly). Tab modules import the page; specs use `imports: [XPage, PageTestingModule]` (`CUSTOM_ELEMENTS_SCHEMA` dropped from tabs spec). Lint 268 → 263 (4 `prefer-standalone` left for Batch 5), build OK, 41/41. Needs device smoke test.
  - [x] Batch 5 — `home` (imports `DailyBibleVerseComponent`, `DailyBibleQuoteComponent`), `read`, `compare`, `life-event-detail` → standalone. `ViewEncapsulation.None` and Eager CD kept; `AppComponent` injection in read/compare unchanged. Lint 263 → 259 (0 `prefer-standalone`), build OK, 41/41. Device smoke test passed.
- [x] Phase 3 — all routes use `loadComponent`; `tabs` and `tabslink` use `loadChildren` → `tabs.routes.ts` / `tabslink.routes.ts` (same paths, incl. nested `/tabs/tabs/tabN`; `preload` data kept on `''` and `home`). All 58 `X.module.ts` / `X-routing.module.ts` files deleted (`src/testing/page-testing.module.ts` kept for Phase 4). Build OK, 41/41, lint unchanged (259). Needs device navigation test.
- [x] Phase 4 — `PageTestingModule` replaced by `providePageTesting()` (`src/testing/page-testing.providers.ts`: Ionic, HTTP testing, router, and spies for DB/dark-mode/network/orientation services). All 28 page/component specs use `imports: [XPage]` + `providers: [providePageTesting()]`; no `IonicModule.forRoot()` left in specs; `CUSTOM_ELEMENTS_SCHEMA` dropped from `app.component.spec.ts`. `page-testing.module.ts` deleted. Build OK, 41/41, lint unchanged (259).
- [x] Phase 5 — optional modernisation, in three commits
  - [x] 5a — constructor injection → `inject()` via `ng generate @angular/core:inject` on `src/app` and `src/providers` (33 files, incl. `AuthserviceProvider`). Constructor bodies kept; no logic changes. Lint 259 → 93 (0 `prefer-inject`; the rest is `template/eqeqeq`), build OK, 41/41. Needs device smoke test.
  - [x] 5b — `ng generate @angular/core:control-flow` on `src/app`. No live `*ngIf`/`*ngFor`/`ngSwitch` remained (the 7 earlier matches are all inside HTML comments), so it only removed the now-unused `CommonModule` from 19 pages. Pages still using `ngStyle`/pipes (`home`, `read`, `compare`, `search`, `tab1`, …) keep `CommonModule`. Build OK, 41/41, lint unchanged (93, all `template/eqeqeq`). Needs device smoke test.
  - [x] 5c — `IonicModule` → `@ionic/angular/standalone` via the Ionic codemod (re-applied by hand to keep CRLF and 2-space indent). `app.config.ts` uses standalone `provideIonicAngular`/`IonicRouteStrategy`; `providePageTesting()` uses `provideIonicAngular()`. Every component imports its own `Ion*` components and registers icons with `addIcons()`; `angular.json` drops the ionicons SVG asset glob. Unused imports from commented-out markup removed (FABs in read/readmarklist). 0 `IonicModule` left. Build OK (only the existing bundle-budget warning), 41/41, lint unchanged (93). Needs device smoke test.

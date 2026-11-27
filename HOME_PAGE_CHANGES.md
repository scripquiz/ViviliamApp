# Home Page: Suggested Code Improvements

Review of `src/app/home/`. These are suggestions only; no code has been changed.

`home.page.ts` is 1,118 lines in the committed version (`fcd6658`). The findings come from reading the code. The app and tests were not run, and the contents of `home.page.scss` were not reviewed.

In the references below, `ts` means `src/app/home/home.page.ts` and `html` means `src/app/home/home.page.html`.

## 1. Fix these first (bugs)

- [ ] **1. Errors show a blank area.** The loading, empty and audio blocks all require `!audioLoadError` (`html:48,64,88`), and there is no error block. `APIMessage` and `stableErrorDetected` are set (`ts:689-715`) but never displayed. Add an error card with a Retry button.
- [ ] **2. An empty API response never shows "No audio today".** `processNewAudioData` sets `audioLoadError = true` for it (`ts:1081`), so that card is hidden. The response is also cached before it is validated (`ts:1024`).
- [ ] **3. Going offline can hide a list that already loaded** (`ts:786-801`). It sets `audioLoadError = true`, even though audio may still be playing.
- [ ] **4. Yesterday's audio can stay after midnight.** Loading is skipped whenever the list is non-empty (`ts:988`). Compare the loaded date with today's.
- [ ] **5. Subscriptions and timers pile up.**
  - Each `ionViewWillEnter` subscribes to connectivity again (`ts:376,735`).
  - The 1-second `setInterval` (`ts:177`) is never cleared.
  - The orientation subscription (`ts:155`) is never unsubscribed.
- [ ] **6. Track progress depends on the database.** The interval starts only after the database opens (`ts:170-213`). It also treats "within 0.5s of the end" as finished, competing with `onended`, so it can clip tracks. Use the audio element's `timeupdate` and `ended` events instead.
- [ ] **7. The "repeat off" style never applies.** The template compares with the string `'0'`, but the values are numbers (`html:121-122,195-196`).
- [ ] **8. The seek bar ignores input** during Play All or when nothing is playing (`ts:644`).
- [ ] **9. Smaller issues:**
  - Losing audio focus doesn't release the wake lock (`ts:319-336`).
  - The 15s timeout doesn't cancel the HTTP request (`ts:1000`); use RxJS `timeout`.

## 2. Delete dead code

- [ ] `openURLWeb`, `padLeadingZeros`, and the debug logs in `ngAfterViewInit`
- [ ] `init_loadNotifications` and its call: it only shows and dismisses a loader
- [ ] `slideOpts` and the `promoslide` logic: the template has no slider
- [ ] The `.row-tab-home` styling block (`ts:365-375`): the class isn't in the template
- [ ] `_skipNetworkCheck`, the empty `pause` subscription, and the unused parameters of `playAudioDirect`
- [ ] The `audio_played_<id>` localStorage writes: nothing in `src` reads them, and the keys accumulate

## 3. Split the TS file

| Move out | Contents | Approx. current lines |
|---|---|---|
| `DailyAudioService` | API call, cache, date, a typed `AudioItem` | `ts` 952-1090 |
| `AudioPlayerService` | play, stop, repeat, seek, wake lock, audio focus | `ts` 238-337, 507-660 |
| `NetworkService` (existing) | debounce, connectivity checks, timeouts | `ts` 726-951, 1092-1117 |
| Standalone `DailyAudioComponent` | audio card template and styles | `html` 47-215 |
| Standalone link-list component | link cards and URL opening | `ts` 661-688 |
| Pipe or utility | `convertHMS` | `ts` 468-484 |

This should bring `HomePage` down to roughly 150 lines. While extracting, merge the three overlapping stop methods and the duplicated reset loop into one of each.

## 4. Template and module

- [ ] Replace the 15 near-identical link cards with a data array and `@for`. This is the biggest HTML reduction.
- [ ] Use `@if` instead of `[ngStyle]` display toggling. Keep `<audio>` outside any `@if`, because `@ViewChild` depends on it.
- [ ] Replace the `playAllText == 'Play All'` state check with a boolean.
- [ ] Fix `background-color: --ion-color-theme1` on `html` line 1; it needs `var(...)`.
- [ ] Make the clickable icons `ion-button`s for accessibility.
- [ ] Try removing `CUSTOM_ELEMENTS_SCHEMA` (`src/app/home/home.module.ts:23`), which can hide template errors.
- [ ] Split `home.page.scss` (1,683 lines) along with the components. With `ViewEncapsulation.None`, its styles can leak app-wide.

## Suggested order

1. Fix bugs 1-7.
2. Delete the dead code.
3. Add tests around playback and loading.
4. Extract the services, then the components.

Keep `HomePage` as an NgModule page with `Eager` change detection during this work. Write the new components as standalone with signals, as `CLAUDE.md` asks, and make sure service callbacks update signals.

Line numbers refer to commit `fcd6658` and will shift as changes are made.

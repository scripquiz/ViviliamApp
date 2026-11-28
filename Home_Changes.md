# Home Page: Review and Suggested Changes

Scope: `src/app/home` and the services it depends on. These findings come from reading the code; they were not run or tested when written. Line numbers refer to the code before any fixes.

## 1. Likely bugs (fix first)

1. ✅ **Done.** **Audio errors and pauses aren't handled.** The `<audio>` element (`src/app/home/home.page.html:112-120`) has no `(error)`, `(play)` or `(pause)` handlers. If a track fails, the rejection is only logged (`home.page.ts:466-469`). The row still shows "playing", the wake lock stays held and Play All stalls. A phone call or headphone pause would leave the UI wrong too.
2. ✅ **Done.** **The screen can sleep during long tracks.**
   - The wake lock releases after 300s of inactivity (`services/wake-lock.service.ts:401-404`), but the page only resets that timer when a track starts (`home.page.ts:471`).
   - After the app is backgrounded, the lock isn't reacquired (`wake-lock.service.ts:154-167`).
   - Consider replacing the service with `@capacitor/keep-awake`.
3. ✅ **Done.** **Online users may be treated as offline.** `connectionType === 'unknown'` counts as offline (`home.page.ts:190`, `586`). `NetworkService` returns `connected: true, connectionType: 'unknown'` when its status check fails (`network.service.ts:184`). Use `isConnected` instead.
4. ✅ **Done.** **The "Using cached data" notice never appears.** `home.page.ts:894-897` passes the message, but `setStableErrorState` (`617-622`) doesn't assign it, and the template only shows messages when the list is empty.
5. **Smaller issues:**
   - Resume only checks `landscape-primary`, not `landscape-secondary` (`home.page.ts:141` vs `156-159`).
   - `convertHMS` can produce `01:5:03` (`home.page.ts:381-397`).
   - The seek slider only handles touch events (`home.page.html:205-207`). Use `ionKnobMoveStart` and `ionKnobMoveEnd`.
   - `style="background-color: --ion-color-theme1"` is invalid without `var()` (`home.page.html:1`).

## 2. Redundant work and dead code

- `loadAudioDirectly` is called twice in `ionViewDidEnter` (`home.page.ts:317`, `333`).
- The database is created in the constructor and again on every view entry (`home.page.ts:167-178`, `341-352`). **Check before removing this:** reassigning it may be what refreshes the daily verse and quote through `ngOnChanges`.
- `checkNetwork` (`home.page.ts:725-845`) adds its own cache, timeout and debounce on top of `NetworkService`, and can be much simpler.
- Several fields are set but appear never to be used, including `isDarkMode` and its subscription, `isServerError`, `hasInternetConnection`, `unread` and `notificationsHomeCount`.
- There is commented-out HTML at `home.page.html:441-476`.

## 3. Structure

- Split the 1052-line component into a daily-audio API/cache service and an audio player service.
- Move the `App.getInfo` and `Browser.open` calls into services, as CLAUDE.md asks.
- Move the hardcoded URLs into config; one already exists in `config.service.ts:35`. Also check `res.ok` on fetches.
- Add a `DailyAudioTrack` interface in place of `any`.
- Keep `Eager` change detection and Zone.js unless the state is first moved to signals.
- In `ion-loader.service.ts:30-32`, the 10s safety timeout is never cleared, so it can close a later loader.

## 4. Template and UX

- Replace the roughly 15 near-identical link cards (`home.page.html:249-579`) with a data array and `@for`.
- Make play, pause and repeat real buttons with `aria-label`s, and add `button="true"` to clickable cards.
- Use `track audioItem.id`, and plain interpolation instead of `[innerHTML]` for API text (`home.page.html:192`).
- Let `ion-content` handle scrolling instead of the `calc(100vh - …)` nested scroller. This should also stop the tabs sharing a scroll position.
- Consider pull-to-refresh and lock-screen media controls.

## 5. Styles and tests

- `ViewEncapsulation.None` makes rules like `body`, `.card` and `.title` apply across the app.
- Much of the 1709-line SCSS looks unused or duplicated. Search other templates before deleting, since those styles are global.
- The spec only has "should create". Add tests for Play All, repeat, seek and caching.
- Remove `CUSTOM_ELEMENTS_SCHEMA` (`home.module.ts:23`), which can hide template mistakes.

## Suggested order

1. ✅ Fix the audio and network bugs (items 1–4).
2. Add tests around playback and caching.
3. Remove dead code and duplicate calls.
4. Extract the services.
5. Convert the link cards, then clean up the SCSS.

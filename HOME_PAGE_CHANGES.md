# Home Page: Code Improvements

Review of `src/app/home/`.

## Status (2026-11-27)

| Section | Status |
|---|---|
| 1. Bugs (1-9) | **All fixed and committed** on branch `home-changes` |
| 2. Delete dead code | **Done**, not committed yet |
| 3. Split the TS file | Not started |
| 4. Template and module | Not started |

- **Commits:** `9b81cd8`, `79ba10a`, `2b6c0eb`, `abf9d81`.
- **Checks:** the development build passes. Lint on `home.page.ts` and `home.page.html` shows 22 problems (21 errors, 1 warning), none added by this work.
- **Testing:** `npm test` has not been run. The bug 5, 7, 8 and 9 changes still need a recorded device test.
- **Open:** other issues found in device testing have not been written down yet.

The original findings were made against commit `fcd6658`, when `home.page.ts` was 1,118 lines. They come from reading the code. Line numbers below refer to that commit and have since shifted. Current sizes: `home.page.ts` 1,052 lines, `home.page.html` 582, `home.page.scss` 1,708.

In the references below, `ts` means `src/app/home/home.page.ts` and `html` means `src/app/home/home.page.html`.

## 1. Bugs (all fixed)

- [x] **1. Errors showed a blank area.** The loading, empty and audio blocks all required `!audioLoadError`, and there was no error block.
  - Fix: added an error card that shows the message, with a Retry button.
- [x] **2. An empty API response never showed "No audio today".** It set `audioLoadError = true`, and the response was cached before it was validated.
  - Fix: an empty list is now a valid result. Only a validated, non-empty response is cached.
- [x] **3. Going offline could hide a list that had already loaded.**
  - Fix: a loaded list is never replaced or hidden when offline. The cache is used only when nothing is loaded.
- [x] **4. Yesterday's audio could stay after midnight.**
  - Fix: the loaded date is compared with today's date. The list is not swapped during playback.
- [x] **5. Subscriptions and timers piled up.**
  - Fix: the connectivity subscription is removed before a new one is made and on leaving the page. The 1-second timer is gone, and the orientation subscription is unsubscribed.
- [x] **6. Track progress depended on the database.**
  - Fix: progress now comes from the audio element's `timeupdate` and `ended` events, so tracks are no longer cut short. The database is still used for the daily verse and quote.
- [x] **7. Repeat buttons.** The "repeat off" style never applied, and the Play All repeat number stayed after the playlist finished.
  - Fix: off is a grey icon with no number; on is the card's accent colour (orange in light mode, green in dark) with the number.
  - Fix: the Play All number clears when the playlist and its repeats finish. Stopping or pausing keeps it.
  - Fix: tapping a track's repeat button no longer pauses a single playing track. It still stops Play All.
  - The number means extra plays: 0 plays once, 1 plays twice, up to 3.
- [x] **8. The seek bar ignored input** during Play All or when nothing was playing.
  - Fix: seeking works in both cases, and jumping to another track starts it from the chosen position.
- [x] **9. Smaller issues.**
  - Fix: losing audio focus now releases the wake lock.
  - Fix: the 15s timeout uses RxJS `timeout`, which cancels the HTTP request.

### Device test checklist (bugs 5, 7, 8, 9)

- [ ] Leave and re-enter the home page several times, then go offline and online.
- [ ] Repeat buttons are readable in light and dark mode.
- [ ] Play All with repeat 1 plays the list twice, then clears the number.
- [ ] Track repeat 2 set during playback keeps playing, then plays twice more.
- [ ] Seek while stopped, during Play All, and on a track that is not playing.
- [ ] Start other audio in the app while home audio plays; the screen can sleep afterwards.

## 2. Delete dead code (done)

Removed on 2026-11-27. The development build passes. Not tested on a device.

- [x] `openURLWeb`, `padLeadingZeros`, and the debug logs in `ngAfterViewInit`
- [x] `init_loadNotifications` and its call: it dismissed a loader and set network error state that the connectivity-restored branch already sets
- [x] `slideOpts` and the `promoslide` logic (also `promoslide` in `authservice.ts`): the template has no slider
- [x] The `.row-tab-home` styling block: the class isn't in the template
- [x] `_skipNetworkCheck`, the empty `pause` subscription, and the unused parameters of `playAudioDirect`
- [x] The `audio_played_<id>` localStorage writes: nothing in `src` read them. Keys already stored on devices are left in place

## 3. Split the TS file (not started)

| Move out | Contents | Approx. lines at `fcd6658` |
|---|---|---|
| `DailyAudioService` | API call, cache, date, a typed `AudioItem` | `ts` 952-1090 |
| `AudioPlayerService` | play, stop, repeat, seek, wake lock, audio focus | `ts` 238-337, 507-660 |
| `NetworkService` (existing) | debounce, connectivity checks, timeouts | `ts` 726-951, 1092-1117 |
| Standalone `DailyAudioComponent` | audio card template and styles | `html` 47-215 |
| Standalone link-list component | link cards and URL opening | `ts` 661-688 |
| Pipe or utility | `convertHMS` | `ts` 468-484 |

This should bring `HomePage` down to roughly 150 lines. While extracting, merge the three overlapping stop methods and the duplicated reset loop into one of each.

## 4. Template and module (not started)

- [ ] Replace the 15 near-identical link cards with a data array and `@for`. This is the biggest HTML reduction.
- [ ] Use `@if` instead of `[ngStyle]` display toggling. Keep `<audio>` outside any `@if`, because `@ViewChild` depends on it.
- [ ] Replace the `playAllText == 'Play All'` state check with a boolean.
- [ ] Fix `background-color: --ion-color-theme1` on `html` line 1; it needs `var(...)`.
- [ ] Make the clickable icons `ion-button`s for accessibility.
- [ ] Try removing `CUSTOM_ELEMENTS_SCHEMA` (`src/app/home/home.module.ts`), which can hide template errors.
- [ ] Split `home.page.scss` along with the components. With `ViewEncapsulation.None`, its styles can leak app-wide.

## Suggested order for the remaining work

1. Run the device test checklist above.
2. Add tests around playback and loading.
3. Extract the services, then the components.

Keep `HomePage` as an NgModule page with `Eager` change detection during this work. Write the new components as standalone with signals, as `CLAUDE.md` asks, and make sure service callbacks update signals.

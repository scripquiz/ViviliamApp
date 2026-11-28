# Home page cleanup (`src/app/home`)

Audit of unused and dead code. Items are cleaned one at a time and ticked off here.
Line numbers refer to the files as they were **before** cleanup started.

## 1. `home.page.ts`: unused or never read

- [x] 1.1 `content` ViewChild (30) and the `IonContent` import (10)
- [x] 1.2 `isServerError` getter (75-77)
- [x] 1.3 `todayDate` (42, 97)
- [x] 1.4 `unread` (44, 369)
- [x] 1.5 `todayTabSelected`, `notificationsTabSelected` (45-46, 365-378)
- [x] 1.6 `isNetworkAvailable` (49), `notificationsHomeCount` (50, 1094)
- [x] 1.7 `notificationUpdateIndex` (57, 123, 340)
- [x] 1.8 `showNetworkOrAPIErrorMessage` (62), `hasInternetConnection` (66)
- [x] 1.9 `stableErrorDetected`, `errorStateTimer` and its timeout (67-68, 95-96, 404-406, 698-717)
- [x] 1.10 `isDarkMode`, `darkModeSubscription`, `DarkModeService` (19, 79-80, 92, 104-109, 413-415)
- [x] 1.11 `authservice.showsign = 1` (339). Only reader is commented out in `app.component.html`
- [x] 1.12 Audio item properties `id`, `subtitle` (1070, 1072)

## 2. `home.page.ts`: parameters, no-ops, repeats

- [x] 2.1 Unused params: `repeat_state` (265, html 240); `title`, `urlplace` (670)
- [x] 2.2 No-ops: `minutes = minutes` (390-392); log-only `if` (373-375); `tempdta` (428-432)
- [x] 2.3 `checkNetwork`: `showLoader` / `timeout` options are never passed (816-827, 861-863, 872, 927). The local `timeout` shadows the rxjs import
- [x] 2.4 `selectedAudioSource` (51, 455) and `<source>` (html 122)
- [x] 2.5 Repeated stop/start logic (201-203, 218, 222-225, 603-604)
- [x] 2.6 Second `currentPage = 'HOME'` (341)
- [x] 2.7 **Check first:** repeated `databaseService.create` (342-353) and segment sync (355)

## 3. HTML and module

- [x] 3.1 Invalid `background-color: --ion-color-theme1` (html 1)
- [x] 3.2 Commented-out cards calling `openPoll()` / `openWhatsApp()` (html 452-487)
- [x] 3.3 Stale "Empty Placeholder" comment (html 358)
- [x] 3.4 `CUSTOM_ELEMENTS_SCHEMA` (`home.module.ts`). Confirm with a build

## 4. `home.page.scss`: unused rules

This file is global (`ViewEncapsulation.None`). Keep `.title`, `.card`, `.card-item-daiy-header`.
`.subtitle` is uncertain. Names built at runtime would not show in a search.

- [x] 4.1 `QUIZ`, `POLL`, `SURVEY`, `SPIN`, `LEADERBOARD`, `CROSSWORD`, `PUZZLE`, `GAME`, `WORD` (+ `-colorTemp`, `-transparent`), `EVENT_*`
- [x] 4.2 `event-*`, `modern-event-card`, `schedule-*`, `countdown-*`, `time-container`
- [x] 4.3 `card-avatar`, `card-content-base`, `card-footer*`, `card-item`, `button-card`, `button-container`, `home-card*`, `home-banner-image-*`, `home-video-*`, `home-dynamic-content`
- [x] 4.4 `no-internet*`, `server-*`, `connection-message`, `pulse-dot`, `refresh-button*`
- [x] 4.5 `notification-*`, `audio-control-icon`, `audio-controls`, `audio-title`, `repeat-all`, `daily-audio-header`, `active-button`, `inactive-button`, `announcement-notes`, `grey-text`, `no-comments`, `setbottom`, `smaller-text`
- [x] 4.6 Dark-mode counterparts of the above (1205-1339) and the 360px media query (1132-1143)
- [x] 4.7 `.card-item-header ion-button.play/.stop` (80-85, 556-559); segment `ion-badge` (1187-1200)
- [x] 4.8 `$midnight`, `$clouds`; `@keyframes server-pulse` and `pulse`; `ion-refresher` (768-770)

## 5. `home.page.scss`: duplicates and conflicts (needs a visual check)

- [ ] 5.1 Blocks defined twice or three times (`.card-item-audio table`, `.event-header`, ...)
- [ ] 5.2 Older audio player rules superseded by `.daily-audio-card` (1355+)
- [ ] 5.3 `!important` dark rules (1273-1294) defeating later ones (1659-1687)

## Keep (used elsewhere)

`authservice.audio_bibles`, `authservice.currentPage`, `authservice.orientation`.

## Side note (possible bug, not cleanup)

The resume handler (143) checks only `landscape-primary`; `onChange` (158-160) also checks `landscape-secondary`.

# HANDOFF: shorten daily-bible-verse and daily-bible-quote

Goal: reduce the number of lines in these two files.

- `src/app/components/daily-bible-verse/daily-bible-verse.component.ts`
- `src/app/components/daily-bible-quote/daily-bible-quote.component.ts`

| File  | Start | After step 1 | After step 4 |
| ----- | ----- | ------------ | ------------ |
| verse | 995   | 852          | 634          |
| quote | 975   | 921          | 703          |

## Done

### Step 1: remove dead code
Committed as `0e77da9`.

### Step 4: simplify canvas font, logo and wrapping code
**Not committed yet.** Applied to both files:

- `ctx.font` is now one string with a fallback list, replacing the font loops.
- Text is drawn from the lines returned by `calculateWrappedLines`; `wrapTextCentered` is removed.
- `addLogoToCanvas` is async and uses `await img.decode()`, with `addFallbackText` on error.
- `ensureFontLoaded` uses `Promise.allSettled` over `document.fonts.load`, then waits 500 ms; `loadFontViaElement` is removed.

Checks: `npx tsc --noEmit -p tsconfig.app.json` and `npx ng build` passed.
`npm run lint` and `npm test` were not run.

Still to test on a device (`npx cap sync android`, then `ionic cap run android`):

- [ ] Verse and quote images, in Tamil and English
- [ ] Ratios 1:1, 3:4 and 9:16
- [ ] Fonts, line wrapping and logo (only a device can confirm that removing `loadFontViaElement` is safe)

## Remaining

Suggested order: **5, then 2, then 3**.

### Step 5 (next): simplify language switching

- Quote: have `setLanguage` swap the already loaded `tamilQuote` / `englishQuote`, and remove `updateQuoteContent`, which repeats the query in `getQuoteOfTheDay`.
  - In the no-data and error states both strings are `''`. Do not overwrite the message with an empty string.
  - Behavior change: switching language would no longer re-query, so it would not pick up a new day's quote after midnight.
- Verse: add one `applyLanguage()` shared by `ngOnInit`, `getVerseOfTheDay` and `setLanguage`. `setLanguage` then no longer needs to query the database again (same midnight caveat).

### Step 2: shared image service

- New file, for example `src/app/services/verse-image.service.ts`, with `createImage({ text, reference, filePrefix, theme, ratio })`.
- Move `createImageWithRatio`, `addLogoToCanvas`, `addFallbackText`, `ensureFontLoaded` and `calculateWrappedLines` into it.
- The two `createImageWithRatio` methods differ only in the text, the reference/author line and the filename prefix (`daily-verse-`, `daily-quote-`).
- `colorThemes` is identical in both components, so share it too.

### Step 3: shared ratio dialog

- Replace the DOM-built `showRatioSelectionMenu` / `removeRatioMenu` in both components with one standalone component (`inject()`, signals, `@if` / `@for`).
- The element ids differ today: `ratio-selection-menu` and `quote-ratio-selection-menu`.

## Separate issue to decide on: menu language is not remembered

Found by reading the code, not tested in the app. Fixing it changes behavior, so it is not part of step 5 unless you choose to include it.

- Verse: `setLanguage` writes `bibleVerseLanguage` to localStorage, but nothing reads it. `ngOnInit` reads `authservice.dailyVerse`.
- Quote: `ngOnInit` reads `authservice.dailyQuote` before the `quoteLanguage` localStorage value. `dailyQuote` defaults to `'TAMIL'`, so the saved value is likely never used.
- `authservice.dailyVerse` / `dailyQuote` are also set in `settings.page.ts`, `read.page.ts` and `getstarted.page.ts`.

## Notes for the next session

- Keep each component's existing patterns: standalone, `OnPush` with `cdr.detectChanges()`, `IonicModule` from `@ionic/angular`.
- Do not bring back the font loops. Setting `ctx.font` never throws, so they always stopped at the first entry.
- After each step, build and compare the generated images in all three ratios, Tamil and English.
- Next files to edit: the two component `.ts` files, starting with step 5.

# HANDOFF: shorten daily-bible-verse and daily-bible-quote

Goal: reduce the number of lines in these two files.

- `src/app/components/daily-bible-verse/daily-bible-verse.component.ts`
- `src/app/components/daily-bible-quote/daily-bible-quote.component.ts`

| File  | Start | Step 1 | Step 4 | Step 5 | Step 2 | Step 3 |
| ----- | ----- | ------ | ------ | ------ | ------ | ------ |
| verse | 995   | 852    | 634    | 629    | 385    | 174    |
| quote | 975   | 921    | 703    | 650    | 406    | 196    |

**All planned steps are done. Only device testing and one open decision remain.**

## Done

- Step 1, remove dead code: committed as `0e77da9`.
- Step 4, simplify canvas font, logo and wrapping code: committed as `81461ef`.
- Step 5, simplify language switching: **not committed.**
- Step 2, shared `src/app/services/verse-image.service.ts`: **not committed.**
- Step 3, shared `src/app/shared/ratio-dialog/` (`app-ratio-dialog`): **not committed.**

Behavior changes:

- Switching language no longer queries the database again. It will not pick up a new day's content after midnight, and no longer retries a failed or empty load.
- The image text and color theme are read when the ratio is tapped, not after the fonts load.

Checks after step 3: `npx tsc --noEmit -p tsconfig.app.json` and `npx ng build` passed, and all 46 unit tests passed.
`npm run lint` fails across the project (404 problems). The changed component files have the same 10 as their committed versions; the new files have none.

## Still to test

Nothing has been checked visually. On a device (`npx cap sync android`, then `ionic cap run android`):

- [ ] Ratio dialog on both cards: opens above the page, color selection, Cancel, tap outside to close
- [ ] Verse and quote images, in Tamil and English
- [ ] Ratios 1:1, 3:4 and 9:16
- [ ] Fonts, line wrapping and logo (only a device can confirm that removing `loadFontViaElement` is safe)
- [ ] Language switching on both cards, including with no data

## Open decision: menu language is not remembered

Found by reading the code, not tested in the app. Not changed, because fixing it changes behavior.

- Verse: `setLanguage` writes `bibleVerseLanguage` to localStorage, but nothing reads it. `ngOnInit` reads `authservice.dailyVerse`.
- Quote: `ngOnInit` reads `authservice.dailyQuote` before the `quoteLanguage` localStorage value. `dailyQuote` defaults to `'TAMIL'`, so the saved value is likely never used.
- `authservice.dailyVerse` / `dailyQuote` are also set in `settings.page.ts`, `read.page.ts` and `getstarted.page.ts`.

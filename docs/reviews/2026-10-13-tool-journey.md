# Playground tool journey review — 2026-10-13

## Changes

- Focus controls now target the timer workbench. Starting the timer no longer disables the theme button or changes its pressed state. A paused, unfinished session retains its original task and duration; Reset unlocks editing.
- Bilingual feedback retains the active result, error or recovery instruction when language changes. JSON results remain invalidated after input/options change, so old results cannot be copied or downloaded.
- Backup validation survives language switching. Restore still merges into existing work and rejects invalid data.
- StudyFlow asks before replacing a plan that has completion checks. Cancel restores the previous settings, and saved plans remain available in My Work. Changing only a target retains the existing checks.
- Text Compare shows original/updated line references with separately directed user text. Reports include a localized summary. Empty-input and limit errors explain how to recover.
- URL Inspector distinguishes unsupported protocols from malformed input and keeps its local-only, structure-only scope. Embedded credentials are omitted from results.
- All seven web tools support favorites. Existing five-tool backups remain valid.
- Downloads use a shared attached anchor and retain the Blob URL for 60 seconds.
- Compact phone navigation now uses the same five-column arrangement in both themes. Feedback panels and line references have deliberate light-theme colors.

## Verification

- 49 automated tests pass, including feedback translation/invalidation, paused timer protection, old/new favorite backup compatibility, schedule invariants, quota failures and safe URL parsing.
- Public build stages only the ten-page browser application and its assets.
- Local browser: seven tools exercised with synthetic data. Checked malformed/valid JSON, result invalidation, SHA-256 of `abc`, bad expected digest, text cleaning/undo, URL parsing and unsupported protocol, comparison filtering/copy and a real TXT download.
- Local browser: opt-in saving, a saved plan with a completed session, replacement cancel, bilingual rescheduling, reload restoration, invalid backup rejection, valid preview across language change and merge restoration.
- All ten pages checked at 390 × 844: Arabic/dark and English/light. No page-level horizontal overflow; no captured browser console errors in this pass.

## Limits

This is a functional and visual review using synthetic data, not a study with external users. Full focus-session completion timing is covered by the timer/model tests; the browser pass used start, pause and reset. No external AI, billing, account permissions or backend settings were changed.

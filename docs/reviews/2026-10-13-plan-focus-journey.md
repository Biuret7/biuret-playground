# Saved plan → Focus Room — 2026-10-13

## User journey

1. Open a saved plan in My Work or StudyFlow.
2. Choose Focus on the next unfinished session.
3. Focus Room prepares that session's task, part and duration. It remains idle until Start is pressed.
4. Completing the timer records focus time; the learner checks the learning session after doing the work.

Focus links open a separate tab, retaining the original preview. An unsaved or changed preview opens the generic room with an explanation; saving the preview enables automatic preparation. The focus link includes only a local plan reference and session index. Plan names and topics are read from the opted-in browser workspace, rather than placed in the link.

## Changes

- A shared model validates saved plans and resolves only existing, unfinished sessions. Malformed references, completed sessions and unavailable local data show recovery instructions.
- Both My Work and StudyFlow link to the next overdue, current or upcoming session.
- Saving a preview immediately upgrades its Focus link to the saved-session link.
- A bilingual context card explains the source, duration, return path and difference between focus time and learning completion.
- Automatically generated task labels translate; text edited by the learner stays as entered. No timer starts automatically.
- The landing position accommodates the fixed header and font loading; the context stays above the timer. Phone card actions stack consistently.

## Evidence

- 54 automated tests pass. New cases cover immutable handoffs, language identity, custom topics, malformed references, completed sessions, altered saved configuration and rescheduled dates.
- Local browser verified preparation of a 30-minute saved session, language changes, preservation of a user-written task and links from both entry points.
- A real one-minute synthetic session completed and persisted once. My Work showed one focus minute, while both plans retained their previous learning check counts.
- The preview's Focus link retains its tab and explains saving. The new saved link appeared immediately after saving.
- The completed-session recovery message was verified with an idle generic timer.
- Phone checks at 390 × 844 in Arabic and English, dark and light; no horizontal overflow in the new session card. The timer does not assign XP, Academy credit or verified achievements.

The in-app browser did not expose a new controlled tab after a target-blank click. The new-tab markup was inspected, and the exact visible link was opened as a second controlled tab to test its destination. No external user research or backend changes were performed.

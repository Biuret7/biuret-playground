# Biuret Playground

Useful small tools and working application previews at **https://demos.biuret.dev**.

## Available tools

- **StudyFlow**: prerequisite-aware scheduling, six templates or a custom goal with 1–8 ordered topics, spaced review, self-reported checklist and progress. An optional target date is checked against estimated completion without reducing the workload. Preview and apply rescheduling of unfinished sessions while retaining completion checks, completed-session dates, daily budget and review gaps. Changing only the target preserves progress; changes to workload settings create a new plan. Custom text stays as entered in either interface language; no lessons are generated. Export JSON, a text checklist or iCalendar all-day reminders. Calendar lines follow [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545), with UTF-8 folding and escaped text. Remove obsolete calendar reminders yourself after rescheduling. Name and optionally save plans on this device and view today’s next unfinished step. Completion is never an Academy credential. Desktop and CLI previews remain accurate; executable distribution is not included. Custom goals and rescheduling extend the browser edition only.
- **Focus Room**: focus, short and long breaks, quick duration presets, pause/resume, daily goal and completed-session log with JSON export. Only fully elapsed focus sessions count. Remains accurate after delayed background updates. Reloading clears the active task and timer. Optional device saving preserves completed sessions and the daily goal; daily and last-seven-day summaries use local calendar days.
- **JSON Studio**: local file import, validation, indentation settings, compacting, optional recursive key sorting (array order retained), structural statistics and export. Input limit 1 MiB; sorting depth limit 200. Native parsing's precision and duplicate-key limits remain disclosed.
- **File Fingerprint**: local SHA-256, SHA-384 or SHA-512 for files up to 100 MiB or exact UTF-8 text. Trusted-digest comparison and downloadable report (file name, size, algorithm and result; original bytes/text excluded). Not an antivirus tool.
- **Text Studio**: Arabic/English word and character counts, reading-time estimate, whitespace cleanup, exact duplicate-line removal, case conversion, one-step undo and TXT export. Text limit 200,000 characters.

The catalog offers bilingual search combined with category filters and a clear empty state. Portfolio navigation and its homepage toolkit section link directly to these applications.

Every tool supports Arabic/English and logical RTL layout. JSON, text and file inputs remain in tab memory. Language preference is local. Device saving is optional and off by default: plans, self-reported checks, completed focus sessions, favorites and daily goal can be saved in localStorage after explicit consent. Nothing is uploaded or automatically synced. No purchase, account requirement, telemetry or external model is enabled.

**Biuret Guide** retrieves curated public website topics. It does not execute commands, read accounts, answer exams or claim an AI model is connected. Future provider integration is prepared separately as a server-only gateway; no secrets or backend exam material belong in this repository.

## My Work and backups

`workspace.html` combines saved plans, next unfinished sessions, target-date feedback, focus summaries and favorite tools. Storage is limited to 20 plans and 1,000 completed focus sessions per browser profile. Workspace backups use a versioned, validated JSON schema (up to 1 MiB), regenerated schedule signatures and bounded indices. Engine 1 plans remain compatible; engine 2 adds custom goals, targets and validated rescheduling metadata, keeping the original session indices. Import previews counts before merging, keeps existing plans and their saved schedules, and combines completion checks without duplicating focus records. Unsupported formats, altered schedules, conflicting records or capacity overflow leave existing data unchanged. Quota and blocked/corrupt-storage errors do not silently overwrite data. A confirmed device-data delete disables saving; downloaded backups are unaffected.

This is not a desktop StudyFlow database, an Academy progress record or an external AI integration. Clearing browser storage can erase saved work; download a backup first. Backups contain plan names and task labels, so keep them private.

## Development and release

Node 22+; no runtime npm dependencies. `npm run check`, then `npm run build`. The build stages only public assets into `_site/`. GitHub Actions deploys that directory to Pages. The Pages custom domain is `demos.biuret.dev`; DNS CNAME should target `biuret7.github.io`.

The browser scheduler was compared against the Python planner across 36 cases, covering both languages, all templates, levels, sparse study days and a leap-day boundary. Tool tests cover invalid input, UTF-8 size limits and delayed timer updates. Review both languages on desktop and mobile before release.

Original Biuret assets belong to Adam Hamdan. Bundled font licenses are included alongside their assets.

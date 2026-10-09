# Biuret Playground

Useful small tools and working application previews at **https://demos.biuret.dev**.

## Available tools

- **StudyFlow**: prerequisite-aware scheduling, six templates, spaced review, self-reported completion checklist and progress. Export JSON, a text checklist or an iCalendar file of all-day reminders. Calendar lines follow [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545), with UTF-8 folding and escaped text. Completion is tab-local, never an Academy credential. Desktop and CLI previews remain accurate; executable distribution is not included.
- **Focus Room**: focus, short and long breaks, quick duration presets, pause/resume, daily goal and completed-session log with JSON export. Only fully elapsed focus sessions count. Remains accurate after delayed background updates. Reloading clears task, timer and log.
- **JSON Studio**: local file import, validation, indentation settings, compacting, optional recursive key sorting (array order retained), structural statistics and export. Input limit 1 MiB; sorting depth limit 200. Native parsing's precision and duplicate-key limits remain disclosed.
- **File Fingerprint**: local SHA-256, SHA-384 or SHA-512 for files up to 100 MiB or exact UTF-8 text. Trusted-digest comparison and downloadable report (file name, size, algorithm and result; original bytes/text excluded). Not an antivirus tool.
- **Text Studio**: Arabic/English word and character counts, reading-time estimate, whitespace cleanup, exact duplicate-line removal, case conversion, one-step undo and TXT export. Text limit 200,000 characters.

The catalog offers bilingual search combined with category filters and a clear empty state. Portfolio navigation and its homepage toolkit section link directly to these applications.

Every tool supports Arabic/English and logical RTL layout. Inputs remain in tab memory, not a server or persistent learner database. Only language preference is stored. No purchase, account requirement, telemetry or external model is enabled.

**Biuret Guide** retrieves curated public website topics. It does not execute commands, read accounts, answer exams or claim an AI model is connected. Future provider integration is prepared separately as a server-only gateway; no secrets or backend exam material belong in this repository.

## Development and release

Node 22+; no runtime npm dependencies. `npm run check`, then `npm run build`. The build stages only public assets into `_site/`. GitHub Actions deploys that directory to Pages. The Pages custom domain is `demos.biuret.dev`; DNS CNAME should target `biuret7.github.io`.

The browser scheduler was compared against the Python planner across 36 cases, covering both languages, all templates, levels, sparse study days and a leap-day boundary. Tool tests cover invalid input, UTF-8 size limits and delayed timer updates. Review both languages on desktop and mobile before release.

Original Biuret assets belong to Adam Hamdan. Bundled font licenses are included alongside their assets.

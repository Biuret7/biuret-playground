# Biuret Playground

Useful small tools and working application previews at **https://demos.biuret.dev**.

## Available tools

- **StudyFlow**: browser edition of the Python application's prerequisite-aware scheduler. Six introductory templates, workload splitting, spaced review and JSON preview export. The bilingual PyQt6 desktop application and English CLI are shown accurately; executable distribution is not included.
- **Focus Room**: focus and break timer, pause/resume and task label. Remains accurate when background ticks are delayed. Reloading clears it.
- **JSON Studio**: syntax validation, formatting, compacting, copying and downloading. Input limit 1 MiB. Native JavaScript parsing has ordinary numeric precision and duplicate-key limitations, explained in the interface.
- **File Fingerprint**: local SHA-256 for files up to 100 MiB and comparison with a trusted publisher digest. Not an antivirus tool.

Every tool supports Arabic/English and logical RTL layout. Inputs remain in tab memory, not a server or persistent learner database. Only language preference is stored. No purchase, account requirement, telemetry or external model is enabled.

**Biuret Guide** retrieves curated public website topics. It does not execute commands, read accounts, answer exams or claim an AI model is connected. Future provider integration is prepared separately as a server-only gateway; no secrets or backend exam material belong in this repository.

## Development and release

Node 22+; no runtime npm dependencies. `npm run check`, then `npm run build`. The build stages only public assets into `_site/`. GitHub Actions deploys that directory to Pages. The Pages custom domain is `demos.biuret.dev`; DNS CNAME should target `biuret7.github.io`.

The browser scheduler was compared against the Python planner across 36 cases, covering both languages, all templates, levels, sparse study days and a leap-day boundary. Tool tests cover invalid input, UTF-8 size limits and delayed timer updates. Review both languages on desktop and mobile before release.

Original Biuret assets belong to Adam Hamdan. Bundled font licenses are included alongside their assets.

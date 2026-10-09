# CryFox

CryFox is a privacy-focused web browser based on Mozilla Firefox. It ships with
telemetry, AI features, sponsored content and onboarding turned off, and with
strict privacy settings turned on.

CryFox is not affiliated with or endorsed by Mozilla.

### What is different from Firefox

* Telemetry, studies, crash reporting and the updater are disabled.
* The new tab page has no stories, sponsored content or default shortcuts.
* AI features are blocked, and the AI Controls settings page is removed.
* Onboarding, "What's New" pages and feature recommendations are disabled.
* Strict tracking protection, HTTPS-Only mode, DNS over HTTPS and Global
  Privacy Control are enabled.
* Brave Search is the default search engine.
* uBlock Origin is installed on first launch.

Most of these settings are in `browser/app/distribution/policies.json`.
Branding is in `browser/branding/cryfox`.

### Building

The build options are in `mozconfig`. To build and run CryFox:

```
./mach bootstrap
./mach build
./mach run
```

For more about the build system, see the
[Firefox Source Docs](https://firefox-source-docs.mozilla.org/).

### Updating to a new Firefox release

CryFox follows Firefox's stable releases. The repository is one commit with
the source of a Firefox release, and a small stack of commits on top, each
with a subject starting with `CryFox:`. Keep that prefix on every CryFox
commit.

When Mozilla publishes a new release, move the stack onto it and rebuild:

```
cryfox/update-firefox.sh
./mach build
```

The script picks the newest `FIREFOX_*_RELEASE` tag, or takes one as an
argument, and saves the previous state as a branch first. If a change
conflicts, it explains how to finish. Recolored Kit mascot images that changed
upstream can be regenerated with `cryfox/recolor-kit.py` (requires Pillow).

### License

CryFox is distributed under the terms of the
[Mozilla Public License 2.0](https://www.mozilla.org/MPL/2.0/), the same as
Firefox. See `LICENSE` for details.

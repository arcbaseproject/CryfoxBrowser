/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const lazy = {};

ChromeUtils.defineESModuleGetters(lazy, {
  BrowserWindowTracker: "resource:///modules/BrowserWindowTracker.sys.mjs",
});

const PREF_ENABLED = "cryfox.update.check";
const PREF_VERSION = "cryfox.version";
const LATEST_RELEASE_URL =
  "https://api.github.com/repos/arcbaseproject/CryfoxBrowser/releases/latest";

/**
 * Checks GitHub for a newer CryFox release on startup and offers to open its
 * download page.
 */
export const CryFoxUpdateChecker = {
  async check() {
    if (!Services.prefs.getBoolPref(PREF_ENABLED, true)) {
      return;
    }
    try {
      let release = await this.fetchNewerRelease();
      if (release) {
        await this.prompt(release);
      }
    } catch (e) {
      console.warn("CryFox update check failed:", e);
    }
  },

  /**
   * @returns {Promise<{version: string, url: string} | null>}
   *   The latest release if it is newer than this build.
   */
  async fetchNewerRelease() {
    let response = await fetch(LATEST_RELEASE_URL, {
      headers: { Accept: "application/vnd.github+json" },
      credentials: "omit",
    });
    if (!response.ok) {
      throw new Error(`GitHub returned ${response.status}`);
    }
    let { tag_name, html_url } = await response.json();
    let version = String(tag_name).replace(/^v/i, "");
    let current = Services.prefs.getStringPref(PREF_VERSION, "");
    if (!current || Services.vc.compare(version, current) <= 0) {
      return null;
    }
    return { version, url: html_url };
  },

  async prompt({ version, url }) {
    let win = lazy.BrowserWindowTracker.getTopWindow();
    if (!win) {
      return;
    }
    let l10n = new Localization(
      ["branding/brand.ftl", "browser/cryfox.ftl"],
      true
    );
    let [title, message, updateButton, laterButton] = l10n.formatValuesSync([
      { id: "cryfox-update-title" },
      { id: "cryfox-update-message", args: { version } },
      { id: "cryfox-update-button" },
      { id: "cryfox-update-later" },
    ]);
    let flags =
      Services.prompt.BUTTON_POS_0 * Services.prompt.BUTTON_TITLE_IS_STRING +
      Services.prompt.BUTTON_POS_1 * Services.prompt.BUTTON_TITLE_IS_STRING +
      Services.prompt.BUTTON_POS_0_DEFAULT;
    let result = await Services.prompt.asyncConfirmEx(
      win.browsingContext,
      Ci.nsIPrompt.MODAL_TYPE_WINDOW,
      title,
      message,
      flags,
      updateButton,
      laterButton,
      null,
      null,
      {}
    );
    if (result.get("buttonNumClicked") == 0) {
      win.openTrustedLinkIn(url, "tab");
    }
  },
};

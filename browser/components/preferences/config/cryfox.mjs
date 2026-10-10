/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Preferences } from "chrome://global/content/preferences/Preferences.mjs";
import { SettingGroupManager } from "chrome://browser/content/preferences/config/SettingGroupManager.mjs";

Preferences.addAll([
  { id: "browser.nova.enabled", type: "bool" },
  { id: "cryfox.update.check", type: "bool" },
  { id: "extensions.update.enabled", type: "bool" },
  { id: "identity.fxaccounts.enabled", type: "bool" },
  { id: "middlemouse.paste", type: "bool" },
  { id: "toolkit.legacyUserProfileCustomizations.stylesheets", type: "bool" },
  { id: "network.dns.disableIPv6", type: "bool" },
  { id: "network.http.referer.XOriginPolicy", type: "int" },
  { id: "privacy.resistFingerprinting.letterboxing", type: "bool" },
  { id: "webgl.disabled", type: "bool" },
]);

Preferences.addSetting({
  id: "cryfoxUpdateCheck",
  pref: "cryfox.update.check",
});
Preferences.addSetting({
  id: "cryfoxAddonUpdates",
  pref: "extensions.update.enabled",
});
// Button indexes returned by confirmRestartPrompt in preferences.js.
const RESTART_NOW = 0;
const REVERT = 1;

function restartBrowser() {
  let cancelQuit = Cc["@mozilla.org/supports-PRBool;1"].createInstance(
    Ci.nsISupportsPRBool
  );
  Services.obs.notifyObservers(
    cancelQuit,
    "quit-application-requested",
    "restart"
  );
  if (!cancelQuit.data) {
    Services.startup.quit(
      Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart
    );
  }
}

async function promptRestart(enabled, deps, setting) {
  let buttonIndex = await window.confirmRestartPrompt(enabled, 0, true, true);
  if (buttonIndex == RESTART_NOW) {
    Services.startup.quit(
      Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart
    );
  } else if (buttonIndex == REVERT) {
    setting.value = !enabled;
  }
}

Preferences.addSetting({
  id: "cryfoxSync",
  pref: "identity.fxaccounts.enabled",
  onUserChange: promptRestart,
});
// Redesigns that browser.nova.enabled does not cover, turned off together
// with it for the classic interface.
const CLASSIC_UI_PREFS = [
  "browser.newtabpage.activity-stream.nova.enabled",
  "browser.settings-redesign.enabled",
  "browser.urlbar.scotchBonnet.enableOverride",
  "sidebar.revamp",
];

Preferences.addSetting({
  id: "cryfoxClassicUI",
  pref: "browser.nova.enabled",
  get: nova => !nova,
  set: classic => {
    for (let pref of CLASSIC_UI_PREFS) {
      if (classic) {
        Services.prefs.setBoolPref(pref, false);
      } else {
        Services.prefs.clearUserPref(pref);
      }
    }
    return !classic;
  },
  onUserChange: promptRestart,
});
Preferences.addSetting({
  id: "cryfoxMiddleClickPaste",
  pref: "middlemouse.paste",
});
Preferences.addSetting({
  id: "cryfoxUserChrome",
  pref: "toolkit.legacyUserProfileCustomizations.stylesheets",
});
Preferences.addSetting({
  id: "cryfoxIPv6",
  pref: "network.dns.disableIPv6",
  get: disabled => !disabled,
  set: enabled => !enabled,
});
Preferences.addSetting({
  id: "cryfoxLimitReferrers",
  pref: "network.http.referer.XOriginPolicy",
  get: policy => policy == 2,
  set: limit => (limit ? 2 : 0),
});
Preferences.addSetting({
  id: "cryfoxResistFingerprinting",
  pref: "privacy.resistFingerprinting",
});
Preferences.addSetting({
  id: "cryfoxLetterboxing",
  pref: "privacy.resistFingerprinting.letterboxing",
  get: enabled => !!enabled,
});
Preferences.addSetting({
  id: "cryfoxDisableWebGL",
  pref: "webgl.disabled",
});
Preferences.addSetting({
  id: "cryfoxLinksGroup",
});
Preferences.addSetting({
  id: "cryfoxAboutConfig",
  onUserClick: () => window.openTrustedLinkIn("about:config", "tab"),
});
Preferences.addSetting({
  id: "cryfoxProfileFolder",
  onUserClick: () => Services.dirsvc.get("ProfD", Ci.nsIFile).reveal(),
});
Preferences.addSetting({
  id: "cryfoxRestart",
  onUserClick: restartBrowser,
});

SettingGroupManager.registerGroups({
  cryfoxBehavior: {
    l10nId: "cryfox-behavior-group",
    headingLevel: 2,
    items: [
      { id: "cryfoxUpdateCheck", l10nId: "cryfox-update-check" },
      { id: "cryfoxAddonUpdates", l10nId: "cryfox-addon-updates" },
      { id: "cryfoxSync", l10nId: "cryfox-sync" },
      { id: "cryfoxClassicUI", l10nId: "cryfox-classic-ui" },
      { id: "cryfoxMiddleClickPaste", l10nId: "cryfox-middle-click-paste" },
      { id: "cryfoxUserChrome", l10nId: "cryfox-userchrome" },
    ],
  },
  cryfoxNetworking: {
    l10nId: "cryfox-networking-group",
    headingLevel: 2,
    items: [{ id: "cryfoxIPv6", l10nId: "cryfox-ipv6" }],
  },
  cryfoxPrivacy: {
    l10nId: "cryfox-privacy-group",
    headingLevel: 2,
    items: [{ id: "cryfoxLimitReferrers", l10nId: "cryfox-limit-referrers" }],
  },
  cryfoxFingerprinting: {
    l10nId: "cryfox-fingerprinting-group",
    headingLevel: 2,
    items: [
      {
        id: "cryfoxResistFingerprinting",
        l10nId: "cryfox-resist-fingerprinting",
      },
      { id: "cryfoxLetterboxing", l10nId: "cryfox-letterboxing" },
      { id: "cryfoxDisableWebGL", l10nId: "cryfox-disable-webgl" },
    ],
  },
  cryfoxLinks: {
    l10nId: "cryfox-links-group",
    headingLevel: 2,
    items: [
      {
        id: "cryfoxLinksGroup",
        control: "moz-box-group",
        items: [
          {
            id: "cryfoxAboutConfig",
            l10nId: "cryfox-about-config",
            control: "moz-box-button",
            iconSrc: "chrome://global/skin/icons/settings.svg",
          },
          {
            id: "cryfoxProfileFolder",
            l10nId: "cryfox-profile-folder",
            control: "moz-box-button",
            iconSrc: "chrome://global/skin/icons/folder.svg",
          },
          {
            id: "cryfoxRestart",
            l10nId: "cryfox-restart",
            control: "moz-box-button",
            iconSrc: "chrome://global/skin/icons/reload.svg",
          },
        ],
      },
    ],
  },
});

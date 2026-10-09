/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// First-run onboarding drawn over the whole browser window. Adapted from Zen
// Browser's ZenWelcome.mjs (MPL 2.0).
// shortcut: strings are raw English, move them to Fluent if CryFox gets
// localized.

{
  const lazy = {};
  ChromeUtils.defineESModuleGetters(lazy, {
    AddonManager: "resource://gre/modules/AddonManager.sys.mjs",
    SearchService: "moz-src:///toolkit/components/search/SearchService.sys.mjs",
  });

  const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

  const THEMES = [
    {
      id: "default-theme@mozilla.org",
      label: "Match my system",
      swatch: "linear-gradient(135deg, #f9f9fb 50%, #1c1b22 50%)",
    },
    {
      id: "firefox-compact-light@mozilla.org",
      label: "Light",
      swatch: "#f9f9fb",
    },
    {
      id: "firefox-compact-dark@mozilla.org",
      label: "Dark",
      swatch: "#1c1b22",
    },
    {
      id: "firefox-alpenglow@mozilla.org",
      label: "Alpenglow",
      swatch: "linear-gradient(135deg, #592acb, #ff4aa2, #ffbd4f)",
    },
  ];

  const choices = { importData: false, setDefault: false };

  function el(tag, props = {}, ...children) {
    const node = document.createElementNS("http://www.w3.org/1999/xhtml", tag);
    Object.assign(node, props);
    node.append(...children);
    return node;
  }

  function option({ group, label, checked, extra, onchange }) {
    const input = el("input", {
      type: "radio",
      name: group,
      checked: !!checked,
    });
    if (onchange) {
      input.addEventListener("change", onchange);
    }
    return el(
      "label",
      { className: "cryfox-welcome-option" },
      input,
      el("span", { className: "cryfox-welcome-option-radio" }),
      ...(extra ? [extra] : []),
      el("span", {
        className: "cryfox-welcome-option-label",
        textContent: label,
      })
    );
  }

  function yesNo(group, yesLabel, noLabel, key) {
    return content => {
      content.append(
        option({
          group,
          label: yesLabel,
          checked: choices[key],
          onchange: () => (choices[key] = true),
        }),
        option({
          group,
          label: noLabel,
          checked: !choices[key],
          onchange: () => (choices[key] = false),
        })
      );
    };
  }

  const PAGES = [
    {
      title: "Bring your stuff",
      descriptions: [
        "Move bookmarks, passwords and history over from your old browser.",
        "It won't be offended. Probably.",
      ],
      render: yesNo(
        "import",
        "Import from another browser",
        "Start fresh",
        "importData"
      ),
    },
    {
      title: "Pick a look",
      descriptions: [
        "Light, dark, or something with more sunset in it. You can change it later.",
      ],
      async render(content) {
        const active = (
          await lazy.AddonManager.getAddonsByTypes(["theme"])
        ).find(t => t.isActive);
        for (const theme of THEMES) {
          content.append(
            option({
              group: "theme",
              label: theme.label,
              checked: active?.id === theme.id,
              extra: el("span", {
                className: "cryfox-welcome-swatch",
                style: `background: ${theme.swatch}`,
              }),
              async onchange() {
                (await lazy.AddonManager.getAddonByID(theme.id))?.enable();
              },
            })
          );
        }
      },
    },
    {
      title: "Choose your search engine",
      descriptions: [
        "Pick who answers your questions. Some of them remember the questions too.",
      ],
      async render(content) {
        content.setAttribute("page", "search");
        const defaultEngine = await lazy.SearchService.getDefault();
        for (const engine of await lazy.SearchService.getVisibleEngines()) {
          const icon = el("img", {
            className: "cryfox-welcome-engine-icon",
            src: "chrome://browser/skin/search-engine-placeholder.png",
          });
          engine.getIconURL(32).then(url => url && (icon.src = url));
          content.append(
            option({
              group: "search",
              label: engine.name,
              checked: engine.name === defaultEngine.name,
              extra: icon,
              onchange: () =>
                lazy.SearchService.setDefault(
                  engine,
                  lazy.SearchService.CHANGE_REASON.USER
                ),
            })
          );
        }
      },
    },
    {
      title: "Make CryFox your default",
      descriptions: [
        "Links from other apps will open here, safely away from the trackers.",
      ],
      render: yesNo(
        "default",
        "Set CryFox as default",
        "Not now",
        "setDefault"
      ),
    },
    {
      title: "You're all set",
      descriptions: [
        "No telemetry, no studies, no sponsored anything.",
        "We don't know you're here, and we like it that way.",
      ],
      next: "Start browsing",
      render() {},
    },
  ];

  class CryFoxWelcome {
    index = -1;

    constructor() {
      document.documentElement.setAttribute("cryfox-welcome", "true");
      document.head.append(
        (this.style = el("link", {
          rel: "stylesheet",
          href: "chrome://browser/content/cryfox-welcome.css",
        }))
      );
      this.backButton = el("button", {
        id: "cryfox-welcome-back",
        textContent: "Back",
      });
      this.text = el("div", { id: "cryfox-welcome-sidebar-content" });
      this.buttons = el("div", { id: "cryfox-welcome-sidebar-buttons" });
      this.content = el("div", { id: "cryfox-welcome-page-content" });
      this.pages = el(
        "div",
        { id: "cryfox-welcome-pages" },
        el(
          "div",
          { id: "cryfox-welcome-sidebar" },
          this.backButton,
          this.text,
          this.buttons
        ),
        this.content
      );
      this.title = el("h1", { id: "cryfox-welcome-title" });
      this.startButton = el("button", {
        id: "cryfox-welcome-start-button",
        className: "cryfox-welcome-button primary",
        textContent: "Get started",
      });
      this.skipButton = el("button", {
        id: "cryfox-welcome-skip",
        textContent: "Skip setup",
      });
      this.start = el(
        "div",
        { id: "cryfox-welcome-start" },
        this.title,
        this.startButton,
        this.skipButton
      );
      this.root = el("div", { id: "cryfox-welcome" }, this.start, this.pages);
      document.body.append(this.root);

      this.backButton.addEventListener("click", () =>
        this.show(this.index - 1, -1)
      );
      this.startButton.addEventListener("click", () => this.begin(), {
        once: true,
      });
      this.skipButton.addEventListener("click", () => this.finish(), {
        once: true,
      });
      this.animateTitle();
    }

    animateTitle() {
      ["Welcome to", "CryFox"].forEach((line, lineIndex) => {
        const lineElement = el("span");
        [...line].forEach((char, i) => {
          if (char === " ") {
            lineElement.append(" ");
            return;
          }
          const charElement = el("span", {
            className: "cryfox-welcome-char",
            textContent: char,
          });
          lineElement.append(charElement);
          charElement.animate(
            { opacity: [0, 1], transform: ["translateY(50px)", "none"] },
            {
              duration: 600,
              delay: 600 + (lineIndex * 10 + i) * 35,
              easing: SPRING,
              fill: "both",
            }
          );
        });
        this.title.append(lineElement);
      });
      for (const button of [this.startButton, this.skipButton]) {
        button.animate(
          {
            opacity: [0, 1],
            transform: ["translateY(20px)", "none"],
            filter: ["blur(2px)", "none"],
          },
          { duration: 700, delay: 1500, easing: SPRING, fill: "both" }
        );
      }
    }

    async begin() {
      await this.start.animate(
        { opacity: [1, 0], transform: ["none", "translateY(-14px)"] },
        { duration: 300, easing: "ease-in", fill: "forwards" }
      ).finished;
      this.start.remove();
      this.pages.style.display = "flex";
      this.pages.animate(
        { opacity: [0, 1] },
        { duration: 450, easing: "ease-out", fill: "forwards" }
      );
      this.show(0, 1);
    }

    exit(container, transform) {
      for (const child of container.children) {
        child
          .animate(
            { opacity: [1, 0], transform: ["none", transform] },
            { duration: 120, easing: "ease-in", fill: "forwards" }
          )
          .finished.then(() => child.remove());
      }
    }

    show(index, direction) {
      if (index < 0) {
        return;
      }
      const page = PAGES[index];
      if (!page) {
        this.finish();
        return;
      }
      this.index = index;
      this.backButton.toggleAttribute("disabled", index === 0);
      this.exit(this.text, `translateX(${-80 * direction}px)`);
      this.exit(this.content, "none");

      const text = el(
        "div",
        { className: "cryfox-welcome-text" },
        el("h1", { textContent: page.title }),
        ...page.descriptions.map(d => el("p", { textContent: d }))
      );
      this.text.append(text);
      [...text.children].forEach((child, i) =>
        child.animate(
          {
            opacity: [0, 1],
            transform: [`translateX(${120 * direction}px)`, "none"],
          },
          { duration: 450, delay: i * 30, easing: SPRING, fill: "both" }
        )
      );

      const content = el("div", { className: "cryfox-welcome-page" });
      page.render(content);
      this.content.append(content);
      content.animate(
        { opacity: [0, 1] },
        { duration: 250, easing: "ease-out", fill: "both" }
      );

      const next = el("button", {
        className: "cryfox-welcome-button primary",
        textContent: page.next ?? "Next",
      });
      next.addEventListener("click", () => this.show(this.index + 1, 1), {
        once: true,
      });
      this.buttons.replaceChildren(next);
    }

    async finish() {
      await this.root.animate(
        { opacity: [1, 0] },
        { duration: 400, easing: "ease-out", fill: "forwards" }
      ).finished;
      this.root.remove();
      this.style.remove();
      document.documentElement.removeAttribute("cryfox-welcome");
      // Run after the overlay is gone so their dialogs aren't hidden behind it.
      if (choices.setDefault) {
        try {
          window.getShellService()?.setDefaultBrowser(false);
        } catch (ex) {
          console.error(ex);
        }
      }
      if (choices.importData) {
        window.MigrationUtils.showMigrationWizard(window, {
          isStartupMigration: true,
        });
      }
    }
  }

  new CryFoxWelcome();
}

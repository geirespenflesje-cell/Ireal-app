/**
 * Settings / Accessibility port — injectable Academy preferences later;
 * standalone defaults today. No Academy internals.
 */
(function (global) {
  "use strict";

  var STANDALONE_DEFAULTS = Object.freeze({
    locale: "en",
    theme: "system",
    contrast: "normal",
    reducedMotion: false,
    textScale: 1,
    uiScale: 1,
    audioMuted: false,
    masterVolume: null,
    focusVisible: true,
    largeTouchTargets: false
  });

  var hostOverrides = {};
  var listeners = [];

  function mergeSettings() {
    var out = {};
    var key;
    for (key in STANDALONE_DEFAULTS) {
      if (Object.prototype.hasOwnProperty.call(STANDALONE_DEFAULTS, key)) {
        out[key] = STANDALONE_DEFAULTS[key];
      }
    }
    for (key in hostOverrides) {
      if (Object.prototype.hasOwnProperty.call(hostOverrides, key) && hostOverrides[key] !== undefined) {
        out[key] = hostOverrides[key];
      }
    }
    return out;
  }

  function notify() {
    var snap = mergeSettings();
    listeners.slice().forEach(function (fn) {
      try { fn(snap); } catch (e) { /* ignore subscriber errors */ }
    });
    return snap;
  }

  function detectStandaloneHints() {
    try {
      if (global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        hostOverrides.reducedMotion = true;
      }
    } catch (e) { /* ignore */ }
  }

  detectStandaloneHints();

  var SettingsPort = {
    /** Immutable baseline when no host injects values. */
    defaults: STANDALONE_DEFAULTS,

    /** Current effective settings (defaults + host overrides). */
    get: function () {
      return mergeSettings();
    },

    /**
     * Host (mock Academy or future Academy adapter) injects preferences.
     * Partial object; null/undefined keys are ignored. Pass {} to clear overrides.
     */
    inject: function (partial) {
      if (partial == null || typeof partial !== "object") {
        hostOverrides = {};
      } else {
        hostOverrides = {};
        Object.keys(partial).forEach(function (key) {
          if (partial[key] !== undefined) hostOverrides[key] = partial[key];
        });
      }
      return notify();
    },

    /** Clear host overrides; keep detected standalone hints if re-detect=true. */
    reset: function (redetect) {
      hostOverrides = {};
      if (redetect) detectStandaloneHints();
      return notify();
    },

    subscribe: function (fn) {
      if (typeof fn !== "function") return function () {};
      listeners.push(fn);
      return function unsubscribe() {
        listeners = listeners.filter(function (x) { return x !== fn; });
      };
    },

    /** Apply safe CSS hooks for reduced motion / contrast without owning a parallel a11y system. */
    applyDocumentHints: function (root) {
      var doc = root || global.document;
      if (!doc || !doc.documentElement) return;
      var s = mergeSettings();
      doc.documentElement.dataset.academyReducedMotion = s.reducedMotion ? "1" : "0";
      doc.documentElement.dataset.academyContrast = s.contrast || "normal";
      doc.documentElement.dataset.academyLocale = s.locale || "en";
      if (s.textScale && s.textScale !== 1) {
        doc.documentElement.style.setProperty("--academy-text-scale", String(s.textScale));
      } else {
        doc.documentElement.style.removeProperty("--academy-text-scale");
      }
    }
  };

  global.AcademySettingsPort = SettingsPort;
})(typeof window !== "undefined" ? window : globalThis);

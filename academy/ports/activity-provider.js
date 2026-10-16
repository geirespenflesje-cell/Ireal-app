/**
 * Activity Provider port — catalog + capabilities (product-side contract).
 * Not a remote Academy API schema; a stable local boundary.
 */
(function (global) {
  "use strict";

  var PROVIDER_ID = "jazz-chart-reader";

  /** @type {Object.<string, object>} */
  var registry = Object.create(null);

  function freezeActivity(def) {
    if (!def || !def.id) throw new Error("Activity requires stable id");
    return Object.freeze({
      id: String(def.id),
      providerId: String(def.providerId || PROVIDER_ID),
      title: String(def.title || def.id),
      competencies: Array.isArray(def.competencies) ? def.competencies.slice() : [],
      tags: Array.isArray(def.tags) ? def.tags.slice() : [],
      difficulty: def.difficulty != null ? def.difficulty : null,
      estimatedDurationMin: def.estimatedDurationMin != null ? Number(def.estimatedDurationMin) : null,
      capabilities: Object.freeze(Object.assign({
        free: true,
        assigned: true,
        workout: true,
        playback: false,
        notation: false,
        import: false
      }, def.capabilities || {})),
      evidenceTypes: Array.isArray(def.evidenceTypes)
        ? def.evidenceTypes.slice()
        : ["started", "progress", "completed", "interrupted", "error"]
    });
  }

  var ActivityProviderPort = {
    providerId: PROVIDER_ID,

    register: function (def) {
      var activity = freezeActivity(def);
      registry[activity.id] = activity;
      return activity;
    },

    unregister: function (activityId) {
      delete registry[activityId];
    },

    get: function (activityId) {
      return registry[activityId] || null;
    },

    list: function () {
      return Object.keys(registry).map(function (id) {
        return registry[id];
      });
    },

    /** Catalog snapshot for a host. */
    catalog: function () {
      return {
        providerId: PROVIDER_ID,
        activities: ActivityProviderPort.list()
      };
    },

    clearRegistry: function () {
      registry = Object.create(null);
    }
  };

  global.AcademyActivityProviderPort = ActivityProviderPort;
})(typeof window !== "undefined" ? window : globalThis);

/**
 * Launch context port — free | assigned | workout over the same activity engine.
 */
(function (global) {
  "use strict";

  var MODES = Object.freeze(["free", "assigned", "workout"]);

  var current = null;

  function normalize(raw) {
    var ctx = raw && typeof raw === "object" ? raw : {};
    var mode = MODES.indexOf(ctx.mode) >= 0 ? ctx.mode : "free";
    return {
      mode: mode,
      activityId: ctx.activityId || null,
      learner: ctx.learner && typeof ctx.learner === "object" ? ctx.learner : null,
      parameters: ctx.parameters && typeof ctx.parameters === "object" ? ctx.parameters : {},
      settings: ctx.settings && typeof ctx.settings === "object" ? ctx.settings : null,
      assignmentId: ctx.assignmentId || null,
      workoutItemId: ctx.workoutItemId || null,
      correlationId: ctx.correlationId || null
    };
  }

  var LaunchContextPort = {
    modes: MODES,

    /** Active launch context, or null when running pure standalone. */
    get: function () {
      return current ? JSON.parse(JSON.stringify(current)) : null;
    },

    /** Set launch context. Pass null to clear (standalone). */
    set: function (raw) {
      if (raw == null) {
        current = null;
        return null;
      }
      current = normalize(raw);
      return LaunchContextPort.get();
    },

    clear: function () {
      current = null;
    },

    isValidMode: function (mode) {
      return MODES.indexOf(mode) >= 0;
    },

    /**
     * Effective mode for UI/logic — defaults to free when no host launch.
     */
    effectiveMode: function () {
      return current && current.mode ? current.mode : "free";
    }
  };

  global.AcademyLaunchContextPort = LaunchContextPort;
})(typeof window !== "undefined" ? window : globalThis);

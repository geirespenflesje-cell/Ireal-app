/**
 * Thin activity definition for the existing Jazz Chart Reader engine.
 * One activity → free | assigned | workout via launch context only.
 */
(function (global) {
  "use strict";

  var ACTIVITY_ID = "jazz-chart.practice";

  var JazzChartProvider = {
    ACTIVITY_ID: ACTIVITY_ID,

    /** Register catalog entry once ports are loaded. */
    register: function () {
      var port = global.AcademyActivityProviderPort;
      if (!port) throw new Error("AcademyActivityProviderPort missing");
      return port.register({
        id: ACTIVITY_ID,
        providerId: port.providerId,
        title: "Jazz Chart Practice",
        competencies: [
          "harmony.chord-recognition",
          "rhythm.feel-styles",
          "notation.melody-editing",
          "ensemble.comping-listening"
        ],
        tags: ["jazz", "charts", "ireal", "playback", "notation"],
        difficulty: "intermediate",
        estimatedDurationMin: 15,
        capabilities: {
          free: true,
          assigned: true,
          workout: true,
          playback: true,
          notation: true,
          import: true
        },
        evidenceTypes: ["started", "progress", "completed", "interrupted", "error"]
      });
    }
  };

  global.JazzChartAcademyProvider = JazzChartProvider;
})(typeof window !== "undefined" ? window : globalThis);

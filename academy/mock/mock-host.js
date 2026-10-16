/**
 * Minimal mock Academy host for local development.
 * Does NOT recreate Academy — only injects launch/settings and receives evidence.
 */
(function (global) {
  "use strict";

  var received = [];

  function ensureBridge() {
    if (!global.AcademyIntegration) {
      throw new Error("Load product + academy bridge before mock host");
    }
  }

  var MockAcademyHost = {
    demoLearner: Object.freeze({
      id: "learner-demo-1",
      displayName: "Demo Learner"
    }),

    receivedEvidence: function () {
      return received.slice();
    },

    clearEvidence: function () {
      received = [];
    },

    listen: function () {
      ensureBridge();
      return global.AcademyIntegration.evidence.subscribe(function (event) {
        received.push(event);
      });
    },

    injectSettings: function (partial) {
      ensureBridge();
      return global.AcademyIntegration.injectSettings(partial || {
        locale: "sv",
        reducedMotion: true,
        contrast: "high",
        textScale: 1.1
      });
    },

    launchFree: function (extra) {
      ensureBridge();
      return global.AcademyIntegration.launch(Object.assign({
        mode: "free",
        activityId: global.JazzChartAcademyProvider.ACTIVITY_ID,
        learner: MockAcademyHost.demoLearner,
        correlationId: "mock-free-" + Date.now()
      }, extra || {}));
    },

    launchAssigned: function (extra) {
      ensureBridge();
      return global.AcademyIntegration.launch(Object.assign({
        mode: "assigned",
        activityId: global.JazzChartAcademyProvider.ACTIVITY_ID,
        learner: MockAcademyHost.demoLearner,
        assignmentId: "assign-demo-42",
        parameters: { focus: "comping", bars: 16 },
        correlationId: "mock-assigned-" + Date.now()
      }, extra || {}));
    },

    launchWorkout: function (extra) {
      ensureBridge();
      return global.AcademyIntegration.launch(Object.assign({
        mode: "workout",
        activityId: global.JazzChartAcademyProvider.ACTIVITY_ID,
        learner: MockAcademyHost.demoLearner,
        workoutItemId: "workout-item-7",
        parameters: { todaySlot: "warmup" },
        correlationId: "mock-workout-" + Date.now()
      }, extra || {}));
    }
  };

  global.MockAcademyHost = MockAcademyHost;
})(typeof window !== "undefined" ? window : globalThis);

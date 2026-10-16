/**
 * Academy integration bridge — wires ports without importing Academy.
 * Product remains runnable with no host; mock/Academy inject later.
 */
(function (global) {
  "use strict";

  var activeSession = null;

  function requirePorts() {
    if (!global.AcademySettingsPort) throw new Error("AcademySettingsPort missing");
    if (!global.AcademyEvidencePort) throw new Error("AcademyEvidencePort missing");
    if (!global.AcademyLaunchContextPort) throw new Error("AcademyLaunchContextPort missing");
    if (!global.AcademyActivityProviderPort) throw new Error("AcademyActivityProviderPort missing");
    if (!global.JazzChartAcademyProvider) throw new Error("JazzChartAcademyProvider missing");
  }

  function announceSafe(msg) {
    try {
      if (typeof global.announce === "function") global.announce(msg);
    } catch (e) { /* ignore */ }
  }

  function applySettingsToDocument() {
    global.AcademySettingsPort.applyDocumentHints(global.document);
  }

  /**
   * Launch the same engine under free | assigned | workout.
   * Does not create parallel engines.
   */
  function launch(rawContext) {
    requirePorts();
    var Launch = global.AcademyLaunchContextPort;
    var Evidence = global.AcademyEvidencePort;
    var Settings = global.AcademySettingsPort;
    var activityId = (rawContext && rawContext.activityId) || global.JazzChartAcademyProvider.ACTIVITY_ID;
    var activity = global.AcademyActivityProviderPort.get(activityId);
    if (!activity) throw new Error("Unknown activity: " + activityId);

    var mode = rawContext && rawContext.mode ? rawContext.mode : "free";
    if (!Launch.isValidMode(mode)) throw new Error("Invalid launch mode: " + mode);

    if (activeSession && activeSession.sessionId) {
      Evidence.emit({
        type: "interrupted",
        activityId: activeSession.activityId,
        sessionId: activeSession.sessionId,
        mode: activeSession.mode,
        correlationId: activeSession.correlationId,
        detail: { reason: "relaunch" }
      });
      activeSession = null;
    }

    if (rawContext && rawContext.settings) {
      Settings.inject(rawContext.settings);
    }
    applySettingsToDocument();

    var ctx = Launch.set({
      mode: mode,
      activityId: activityId,
      learner: rawContext && rawContext.learner,
      parameters: rawContext && rawContext.parameters,
      settings: rawContext && rawContext.settings,
      assignmentId: rawContext && rawContext.assignmentId,
      workoutItemId: rawContext && rawContext.workoutItemId,
      correlationId: rawContext && rawContext.correlationId
    });

    var sessionId = Evidence.newSessionId(activityId);
    activeSession = {
      sessionId: sessionId,
      activityId: activityId,
      mode: ctx.mode,
      correlationId: ctx.correlationId,
      startedAt: Date.now()
    };

    Evidence.emit({
      type: "started",
      activityId: activityId,
      sessionId: sessionId,
      mode: ctx.mode,
      correlationId: ctx.correlationId,
      detail: {
        learnerId: ctx.learner && ctx.learner.id ? ctx.learner.id : null,
        assignmentId: ctx.assignmentId,
        workoutItemId: ctx.workoutItemId,
        parameters: ctx.parameters
      },
      competencies: activity.competencies
    });

    announceSafe(
      ctx.mode === "free"
        ? "Practice (free)"
        : ctx.mode === "assigned"
          ? "Practice (assignment)"
          : "Practice (workout)"
    );

    return {
      ok: true,
      activityId: activityId,
      mode: ctx.mode,
      sessionId: sessionId,
      engine: "jazz-chart-reader-core"
    };
  }

  function emitProgress(detail) {
    if (!activeSession) return null;
    return global.AcademyEvidencePort.emit({
      type: "progress",
      activityId: activeSession.activityId,
      sessionId: activeSession.sessionId,
      mode: activeSession.mode,
      correlationId: activeSession.correlationId,
      durationMs: Date.now() - activeSession.startedAt,
      detail: detail || {}
    });
  }

  function complete(detail) {
    if (!activeSession) return null;
    var event = global.AcademyEvidencePort.emit({
      type: "completed",
      activityId: activeSession.activityId,
      sessionId: activeSession.sessionId,
      mode: activeSession.mode,
      correlationId: activeSession.correlationId,
      durationMs: Date.now() - activeSession.startedAt,
      detail: detail || {}
    });
    activeSession = null;
    return event;
  }

  function interrupt(reason) {
    if (!activeSession) return null;
    var event = global.AcademyEvidencePort.emit({
      type: "interrupted",
      activityId: activeSession.activityId,
      sessionId: activeSession.sessionId,
      mode: activeSession.mode,
      correlationId: activeSession.correlationId,
      durationMs: Date.now() - activeSession.startedAt,
      detail: { reason: reason || "interrupted" }
    });
    activeSession = null;
    return event;
  }

  function fail(error, detail) {
    if (!activeSession) {
      return global.AcademyEvidencePort.emit({
        type: "error",
        activityId: global.JazzChartAcademyProvider.ACTIVITY_ID,
        error: String(error || "error"),
        detail: detail || {}
      });
    }
    var event = global.AcademyEvidencePort.emit({
      type: "error",
      activityId: activeSession.activityId,
      sessionId: activeSession.sessionId,
      mode: activeSession.mode,
      correlationId: activeSession.correlationId,
      error: String(error || "error"),
      detail: detail || {}
    });
    return event;
  }

  function readQueryLaunch() {
    try {
      var params = new URLSearchParams(global.location.search);
      var mode = params.get("academyMode");
      if (!mode) return null;
      return {
        mode: mode,
        activityId: params.get("academyActivity") || undefined,
        assignmentId: params.get("academyAssignment") || undefined,
        workoutItemId: params.get("academyWorkoutItem") || undefined,
        correlationId: params.get("academyCorrelation") || undefined,
        learner: params.get("academyLearner")
          ? { id: params.get("academyLearner"), displayName: params.get("academyLearnerName") || "Learner" }
          : undefined
      };
    } catch (e) {
      return null;
    }
  }

  function init() {
    requirePorts();
    global.JazzChartAcademyProvider.register();
    applySettingsToDocument();
    global.AcademySettingsPort.subscribe(function () {
      applySettingsToDocument();
    });

    var fromQuery = readQueryLaunch();
    if (fromQuery && global.AcademyLaunchContextPort.isValidMode(fromQuery.mode)) {
      launch(fromQuery);
    }
  }

  var AcademyIntegration = {
    providerId: function () {
      return global.AcademyActivityProviderPort.providerId;
    },
    getCatalog: function () {
      return global.AcademyActivityProviderPort.catalog();
    },
    launch: launch,
    getLaunchContext: function () {
      return global.AcademyLaunchContextPort.get();
    },
    effectiveMode: function () {
      return global.AcademyLaunchContextPort.effectiveMode();
    },
    getSettings: function () {
      return global.AcademySettingsPort.get();
    },
    injectSettings: function (partial) {
      return global.AcademySettingsPort.inject(partial);
    },
    evidence: {
      emit: function (partial) { return global.AcademyEvidencePort.emit(partial); },
      subscribe: function (fn) { return global.AcademyEvidencePort.subscribe(fn); },
      history: function () { return global.AcademyEvidencePort.getHistory(); }
    },
    emitProgress: emitProgress,
    complete: complete,
    interrupt: interrupt,
    fail: fail,
    getActiveSession: function () {
      return activeSession ? Object.assign({}, activeSession) : null;
    },
    /** Confirms product engine identity — same for all modes. */
    engineId: "jazz-chart-reader-core",
    init: init
  };

  global.AcademyIntegration = AcademyIntegration;

  if (global.document && global.document.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", init);
  } else if (global.document) {
    init();
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);

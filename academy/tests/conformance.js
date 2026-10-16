/**
 * Lightweight conformance checks for Academy ports (no Academy repo, no Node required).
 * Run via academy/tests/conformance.html
 */
(function (global) {
  "use strict";

  var results = [];

  function assert(name, cond, detail) {
    results.push({ name: name, ok: !!cond, detail: detail || "" });
  }

  function run() {
    results = [];
    var Integration = global.AcademyIntegration;
    var Settings = global.AcademySettingsPort;
    var Evidence = global.AcademyEvidencePort;
    var Launch = global.AcademyLaunchContextPort;
    var Provider = global.AcademyActivityProviderPort;
    var Jazz = global.JazzChartAcademyProvider;
    var Mock = global.MockAcademyHost;

    assert("ports present", !!(Integration && Settings && Evidence && Launch && Provider && Jazz));
    assert("provider registers stable activity id", !!Provider.get(Jazz.ACTIVITY_ID));
    assert("catalog exposes stable ids", Provider.list().every(function (a) { return !!a.id; }));

    Evidence.clearHistory();
    Launch.clear();

    var free = Integration.launch({ mode: "free", activityId: Jazz.ACTIVITY_ID, correlationId: "t-free" });
    assert("free mode launches", free && free.ok && free.mode === "free");
    assert("free uses core engine", free.engine === Integration.engineId);

    var assigned = Integration.launch({
      mode: "assigned",
      activityId: Jazz.ACTIVITY_ID,
      assignmentId: "a1",
      correlationId: "t-assigned"
    });
    assert("assigned mode launches", assigned && assigned.ok && assigned.mode === "assigned");
    assert("assigned uses same engine", assigned.engine === Integration.engineId);

    var workout = Integration.launch({
      mode: "workout",
      activityId: Jazz.ACTIVITY_ID,
      workoutItemId: "w1",
      correlationId: "t-workout"
    });
    assert("workout mode launches", workout && workout.ok && workout.mode === "workout");
    assert("workout uses same engine", workout.engine === Integration.engineId);

    var hist = Evidence.getHistory();
    assert("evidence emitted and correlated", hist.some(function (e) {
      return e.type === "started" && e.correlationId === "t-workout";
    }));
    assert("relaunch interrupts prior session", hist.some(function (e) { return e.type === "interrupted"; }));

    Settings.reset(false);
    var before = Settings.get();
    Settings.inject({ locale: "sv", reducedMotion: true });
    var after = Settings.get();
    assert("settings context can be supplied", after.locale === "sv" && after.reducedMotion === true);
    Settings.reset(true);
    assert("missing Academy context falls back safely", Settings.get().locale === before.locale || Settings.get().locale === "en");

    Launch.clear();
    assert("standalone effective mode is free", Integration.effectiveMode() === "free");
    assert("core engine id does not depend on Academy", Integration.engineId === "jazz-chart-reader-core");
    assert("integration does not require Academy repo", typeof Integration.launch === "function" && !global.CreativeAcademy);

    Integration.launch({ mode: "free", activityId: Jazz.ACTIVITY_ID });
    Integration.interrupt("test-interrupt");
    assert("interruption does not throw / clears session", Integration.getActiveSession() == null);

    if (Mock) {
      Mock.clearEvidence();
      Mock.listen();
      Mock.launchAssigned();
      assert("mock host can launch assigned", Mock.receivedEvidence().some(function (e) {
        return e.type === "started" && e.mode === "assigned";
      }));
    }

    return {
      passed: results.filter(function (r) { return r.ok; }).length,
      failed: results.filter(function (r) { return !r.ok; }).length,
      results: results
    };
  }

  global.AcademyConformance = { run: run };
})(typeof window !== "undefined" ? window : globalThis);

/**
 * Evidence port — product emits practice events; Academy may subscribe later.
 * No Academy database or mastery engine here.
 */
(function (global) {
  "use strict";

  var EVENT_TYPES = Object.freeze([
    "started",
    "progress",
    "completed",
    "interrupted",
    "error"
  ]);

  var subscribers = [];
  var history = [];
  var HISTORY_MAX = 200;
  var sessionSeq = 0;

  function nowIso() {
    return new Date().toISOString();
  }

  function normalizeEvent(partial) {
    var type = partial && partial.type;
    if (EVENT_TYPES.indexOf(type) < 0) {
      throw new Error("Unknown evidence type: " + type);
    }
    return {
      type: type,
      activityId: partial.activityId || null,
      sessionId: partial.sessionId || null,
      mode: partial.mode || null,
      correlationId: partial.correlationId || null,
      at: partial.at || nowIso(),
      durationMs: partial.durationMs != null ? Number(partial.durationMs) : null,
      attempts: partial.attempts != null ? Number(partial.attempts) : null,
      score: partial.score != null ? partial.score : null,
      competencies: Array.isArray(partial.competencies) ? partial.competencies.slice() : [],
      detail: partial.detail && typeof partial.detail === "object" ? partial.detail : {},
      error: partial.error || null
    };
  }

  var EvidencePort = {
    types: EVENT_TYPES,

    /** Create a session id for correlating started → completed / interrupted. */
    newSessionId: function (activityId) {
      sessionSeq += 1;
      return String(activityId || "activity") + ":s" + sessionSeq + ":" + Date.now();
    },

    emit: function (partial) {
      var event = normalizeEvent(partial);
      history.push(event);
      if (history.length > HISTORY_MAX) history.shift();
      subscribers.slice().forEach(function (fn) {
        try { fn(event); } catch (e) { /* ignore */ }
      });
      return event;
    },

    subscribe: function (fn) {
      if (typeof fn !== "function") return function () {};
      subscribers.push(fn);
      return function unsubscribe() {
        subscribers = subscribers.filter(function (x) { return x !== fn; });
      };
    },

    /** Test / mock helper — does not persist. */
    getHistory: function () {
      return history.slice();
    },

    clearHistory: function () {
      history = [];
    }
  };

  global.AcademyEvidencePort = EvidencePort;
})(typeof window !== "undefined" ? window : globalThis);

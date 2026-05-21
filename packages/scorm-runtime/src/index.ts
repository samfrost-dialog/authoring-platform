/**
 * SCORM 1.2 API Shim
 * Injected verbatim into every exported course package as scorm_api.js.
 *
 * Behaviour:
 *  - In LMS context: proxies all calls to window.parent.API (standard SCORM 1.2 frame API)
 *  - In standalone/preview context: falls back to a localStorage mock so authors
 *    can test courses outside an LMS without errors
 *
 * Compliant with: SCORM 1.2 RTE specification
 * Vendor extensions: NONE — works with any SCORM 1.2-compliant LMS
 */

// This string is the exact JS that gets written into scorm_api.js in the ZIP
export const SCORM_API_SHIM = `
(function () {
  'use strict';

  // ── Find LMS API object ──────────────────────────────────────────────────────
  function findAPI(win) {
    var attempts = 0;
    while (win.API == null && win.parent != null && win.parent !== win) {
      attempts++;
      if (attempts > 7) return null;
      win = win.parent;
    }
    return win.API || null;
  }

  function findAPIThorough(win) {
    var api = findAPI(win);
    if (!api && win.opener) {
      api = findAPI(win.opener);
    }
    return api;
  }

  // ── localStorage mock for standalone / preview use ───────────────────────────
  var MOCK_KEY = 'scorm_1_2_data';
  function getMockData() {
    try {
      return JSON.parse(localStorage.getItem(MOCK_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }
  function setMockData(data) {
    try {
      localStorage.setItem(MOCK_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  var MockAPI = {
    _data: {},
    _initialized: false,
    _lastError: '0',
    LMSInitialize: function () {
      this._data = getMockData();
      this._initialized = true;
      return 'true';
    },
    LMSFinish: function () {
      setMockData(this._data);
      this._initialized = false;
      return 'true';
    },
    LMSGetValue: function (element) {
      return this._data[element] !== undefined ? String(this._data[element]) : '';
    },
    LMSSetValue: function (element, value) {
      this._data[element] = value;
      return 'true';
    },
    LMSCommit: function () {
      setMockData(this._data);
      return 'true';
    },
    LMSGetLastError: function () { return this._lastError; },
    LMSGetErrorString: function (code) {
      var errors = {
        '0': 'No error',
        '101': 'General exception',
        '201': 'Invalid argument error',
        '202': 'Element cannot have children',
        '203': 'Element not an array — cannot have count',
        '301': 'Not initialized',
        '401': 'Not implemented error',
        '402': 'Invalid set value, element is a keyword',
        '403': 'Element is read only',
        '404': 'Element is write only',
        '405': 'Incorrect data type',
      };
      return errors[code] || 'Unknown error';
    },
    LMSGetDiagnostic: function (code) { return 'Diagnostic: ' + code; },
  };

  // ── Session state ────────────────────────────────────────────────────────────
  var api = null;
  var sessionStartTime = null;
  var initialized = false;

  function getAPI() {
    if (!api) {
      api = findAPIThorough(window);
      if (!api) {
        console.warn('[SCORM] No LMS API found — using localStorage mock');
        api = MockAPI;
      }
    }
    return api;
  }

  // ── Format session time as HHHH:MM:SS.SS ────────────────────────────────────
  function formatTime(seconds) {
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = (seconds % 60).toFixed(2);
    return (
      String(h).padStart(4, '0') + ':' +
      String(m).padStart(2, '0') + ':' +
      (s < 10 ? '0' : '') + s
    );
  }

  // ── Public SCORM 1.2 API ─────────────────────────────────────────────────────
  window.ScormAPI = {
    initialize: function () {
      var result = getAPI().LMSInitialize('');
      if (result === 'true') {
        initialized = true;
        sessionStartTime = Date.now();
        // Set initial lesson_status if not already set
        var status = getAPI().LMSGetValue('cmi.core.lesson_status');
        if (!status || status === '') {
          getAPI().LMSSetValue('cmi.core.lesson_status', 'incomplete');
        }
      }
      return result === 'true';
    },

    finish: function () {
      if (!initialized) return false;
      // Commit final session time
      var elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
      getAPI().LMSSetValue('cmi.core.session_time', formatTime(elapsed));
      getAPI().LMSCommit('');
      var result = getAPI().LMSFinish('');
      initialized = false;
      return result === 'true';
    },

    getValue: function (element) {
      return getAPI().LMSGetValue(element);
    },

    setValue: function (element, value) {
      return getAPI().LMSSetValue(element, String(value)) === 'true';
    },

    commit: function () {
      return getAPI().LMSCommit('') === 'true';
    },

    setScore: function (raw, min, max) {
      min = min !== undefined ? min : 0;
      max = max !== undefined ? max : 100;
      getAPI().LMSSetValue('cmi.core.score.raw', String(raw));
      getAPI().LMSSetValue('cmi.core.score.min', String(min));
      getAPI().LMSSetValue('cmi.core.score.max', String(max));
    },

    setLessonStatus: function (status) {
      // Valid statuses: passed, failed, completed, incomplete, not attempted, browsed
      var valid = ['passed','failed','completed','incomplete','not attempted','browsed'];
      if (valid.indexOf(status) === -1) {
        console.warn('[SCORM] Invalid lesson_status: ' + status);
        return;
      }
      getAPI().LMSSetValue('cmi.core.lesson_status', status);
    },

    setLocation: function (location) {
      getAPI().LMSSetValue('cmi.core.lesson_location', String(location));
    },

    setSuspendData: function (data) {
      var str = typeof data === 'string' ? data : JSON.stringify(data);
      if (str.length > 4096) {
        console.warn('[SCORM] suspend_data exceeds 4096 char limit — truncating');
        str = str.substring(0, 4096);
      }
      getAPI().LMSSetValue('cmi.suspend_data', str);
    },

    getSuspendData: function () {
      var raw = getAPI().LMSGetValue('cmi.suspend_data');
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (e) { return raw; }
    },

    recordInteraction: function (index, id, type, response, result, latency) {
      var prefix = 'cmi.interactions.' + index + '.';
      getAPI().LMSSetValue(prefix + 'id', id);
      getAPI().LMSSetValue(prefix + 'type', type);
      getAPI().LMSSetValue(prefix + 'student_response', String(response));
      getAPI().LMSSetValue(prefix + 'result', result);
      if (latency !== undefined) {
        getAPI().LMSSetValue(prefix + 'latency', formatTime(latency));
      }
    },

    getLearnerName: function () {
      return getAPI().LMSGetValue('cmi.core.student_name') || '';
    },

    getLearnerId: function () {
      return getAPI().LMSGetValue('cmi.core.student_id') || '';
    },
  };

  // ── Auto-finish on page unload ────────────────────────────────────────────────
  window.addEventListener('beforeunload', function () {
    if (initialized) {
      window.ScormAPI.finish();
    }
  });

  // ── Auto-initialize on load ───────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    window.ScormAPI.initialize();
  });

})();
`.trim()

// Type for the public ScormAPI surface exposed in exported courses
export interface ScormAPIInterface {
  initialize(): boolean
  finish(): boolean
  getValue(element: string): string
  setValue(element: string, value: string | number): boolean
  commit(): boolean
  setScore(raw: number, min?: number, max?: number): void
  setLessonStatus(status: 'passed' | 'failed' | 'completed' | 'incomplete' | 'not attempted' | 'browsed'): void
  setLocation(location: string): void
  setSuspendData(data: unknown): void
  getSuspendData(): unknown
  recordInteraction(index: number, id: string, type: string, response: string, result: string, latency?: number): void
  getLearnerName(): string
  getLearnerId(): string
}

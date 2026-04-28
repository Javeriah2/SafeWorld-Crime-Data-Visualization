// js/state.js

// The police API publishes data ~2 months behind the current date.
// Defaulting to 2 months ago ensures we always open on a month with data.
function currentMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 2);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const _state = {
  category: 'all-crime',
  month: currentMonth(),
  selectedBorough: null,
  boroughData: [],
  loading: false,
  partialError: false,
};

const _listeners = {};

export function getState() {
  return { ..._state };
}

export function setState(updates) {
  Object.assign(_state, updates);
  Object.keys(updates).forEach(key => {
    (_listeners[key] ?? []).forEach(fn => fn(_state[key], _state));
  });
}

export function subscribe(key, fn) {
  if (!_listeners[key]) _listeners[key] = [];
  _listeners[key].push(fn);
}

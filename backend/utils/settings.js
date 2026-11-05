const Settings = require('../models/Settings');
const defaults = require('../config/defaultSettings');

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

function deepMerge(base, patch) {
  const out = { ...base };
  for (const k of Object.keys(patch || {})) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    out[k] = isObj(patch[k]) && isObj(base?.[k]) ? deepMerge(base[k], patch[k]) : patch[k];
  }
  return out;
}

async function getSettings() {
  const doc = await Settings.findOne({ key: 'main' }).lean();
  return deepMerge(JSON.parse(JSON.stringify(defaults)), doc?.data || {});
}

async function saveSettings(patch) {
  const current = await getSettings();
  const merged = deepMerge(current, patch);
  await Settings.findOneAndUpdate({ key: 'main' }, { data: merged }, { upsert: true, new: true });
  return merged;
}

module.exports = { getSettings, saveSettings, deepMerge };

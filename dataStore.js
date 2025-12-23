/**
 * Tiny JSON persistence helper (sync for simplicity).
 * Data files live in ./data/*.json
 */
const fs = require("fs");
const path = require("path");

function ensureJsonFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
  }
}

function readJson(filePath, defaultValue) {
  ensureJsonFile(filePath, defaultValue);
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw || "null");
    return parsed ?? defaultValue;
  } catch (e) {
    // If file is corrupted, reset to default to keep the app running.
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
    return defaultValue;
  }
}

function writeJson(filePath, value) {
  ensureJsonFile(filePath, []);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

/** Get next integer id from a list of objects that have numeric `id` */
function nextId(list) {
  let max = 0;
  for (const x of list) {
    const idNum = Number(x?.id);
    if (Number.isFinite(idNum)) max = Math.max(max, idNum);
  }
  return max + 1;
}

module.exports = { readJson, writeJson, nextId };

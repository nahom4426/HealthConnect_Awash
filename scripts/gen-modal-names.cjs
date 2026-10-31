#!/usr/bin/env node
// Writes the list of modal names for @customizer/modal-x's types, so openModal('Name')
// is type-checked against the *.mdl.vue / *.amdl.vue files that actually exist.
// The package's own generateFileNames.cjs keeps a file watcher running forever, so it
// can't be used from npm scripts; this is the one-shot equivalent. Runs on postinstall
// and before type-check (the output lives in node_modules, so it is never committed).
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const target = path.join(root, "node_modules", "@customizer", "modal-x", "FileNameEnums.ts");
if (!fs.existsSync(path.dirname(target))) process.exit(0); // package not installed yet

const names = new Set();
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else {
      const m = e.name.match(/^([^.]+)\.(mdl|amdl)\.vue$/);
      if (m) names.add(m[1]);
    }
  }
})(path.join(root, "src"));

const list = [...names].sort().map((n) => `'${n}'`).join(" | ") || "never";
fs.writeFileSync(target, `export type FileNames = ${list}\n`);
console.log(`modal-x: ${names.size} modal names written`);

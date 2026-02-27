#!/usr/bin/env node
// init-baseline.js — Sets the baseline transcript size at session start.
// This ensures the very first PostToolUse can already detect growth.

const fs = require("fs");
const path = require("path");
const os = require("os");

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const stateDir = path.join(os.tmpdir(), `faaaahhh-${data.session_id}`);
    fs.mkdirSync(stateDir, { recursive: true });

    let size = 0;
    try {
      size = fs.statSync(data.transcript_path).size;
    } catch {}

    fs.writeFileSync(path.join(stateDir, "baseline"), String(size));
  } catch {}
  process.exit(0);
});

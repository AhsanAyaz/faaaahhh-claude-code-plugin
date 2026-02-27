#!/usr/bin/env node
// check-context.js — The panic detector
// Monitors transcript file growth to estimate context window usage.
// When estimated usage exceeds ~90% (less than ~10% remaining), plays FAAAAHHH.
//
// This runs as an async PostToolUse hook, so it won't block Claude's responses.
// Think of it as Claude's subconscious anxiety building up in the background.

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile, exec } = require("child_process");

// Read JSON input from stdin
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    run(data);
  } catch {
    process.exit(0);
  }
});

function run(data) {
  const transcriptPath = data.transcript_path;
  const sessionId = data.session_id;
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.dirname(__dirname);

  // State directory — use os.tmpdir() for cross-platform temp
  const stateDir = path.join(os.tmpdir(), `faaaahhh-${sessionId}`);
  fs.mkdirSync(stateDir, { recursive: true });

  const playedFile = path.join(stateDir, "played");
  const baselineFile = path.join(stateDir, "baseline");

  // If we already screamed this cycle, stay quiet (even panic gets exhausting)
  if (fs.existsSync(playedFile)) {
    process.exit(0);
  }

  // Get current transcript file size
  let currentSize;
  try {
    currentSize = fs.statSync(transcriptPath).size;
  } catch {
    process.exit(0);
  }

  // Set baseline on first run (or after a compact reset)
  if (!fs.existsSync(baselineFile)) {
    fs.writeFileSync(baselineFile, String(currentSize));
    process.exit(0);
  }

  const baseline = parseInt(fs.readFileSync(baselineFile, "utf8").trim(), 10) || 0;

  // Calculate growth since baseline (session start or last compaction)
  const growth = currentSize - baseline;

  // Context window estimation:
  // - Claude's context is ~200K tokens
  // - ~4 bytes per token in English text
  // - JSONL transcript has JSON overhead (~1.5x-2x)
  // - So ~200K tokens ≈ 800KB of text ≈ ~1.2-1.6MB of JSONL
  // - 90% of ~1.2MB ≈ ~1MB of transcript growth
  //
  // We use 500KB as a conservative threshold to catch the ~90% usage point.
  // It's not exact science — it's panic science.
  const threshold = parseInt(process.env.FAAAAHHH_THRESHOLD, 10) || 500000;

  if (growth > threshold) {
    // IT'S HAPPENING. CONTEXT IS RUNNING OUT.
    fs.writeFileSync(playedFile, String(Date.now()));
    playSound(pluginRoot);
  }

  process.exit(0);
}

function playSound(pluginRoot) {
  const soundFile = path.join(pluginRoot, "faaaahhhhhhh.mp3");

  if (!fs.existsSync(soundFile)) {
    return;
  }

  const platform = os.platform();

  if (platform === "darwin") {
    // macOS — afplay is built-in, no dependencies needed
    execFile("afplay", [soundFile], { stdio: "ignore" }).unref();
  } else if (platform === "win32") {
    // Windows — use PowerShell with MediaPlayer (supports mp3 natively)
    const psScript = `
      Add-Type -AssemblyName presentationCore
      $player = New-Object System.Windows.Media.MediaPlayer
      $player.Open([Uri]"${soundFile.replace(/\\/g, "\\\\")}")
      $player.Play()
      Start-Sleep -Seconds 10
    `.trim();
    exec(`powershell -NoProfile -Command "${psScript}"`, {
      stdio: "ignore",
      windowsHide: true,
    }).unref();
  } else {
    // Linux/BSD — try players in order of preference
    const players = [
      ["mpv", ["--no-video", "--really-quiet", soundFile]],
      ["ffplay", ["-nodisp", "-autoexit", "-loglevel", "quiet", soundFile]],
      ["cvlc", ["--play-and-exit", "--quiet", soundFile]],
      ["paplay", [soundFile]],
    ];

    for (const [cmd, args] of players) {
      try {
        const child = execFile(cmd, args, { stdio: "ignore" });
        child.unref();
        child.on("error", () => {}); // suppress if binary not found
        break;
      } catch {
        continue;
      }
    }
  }
}

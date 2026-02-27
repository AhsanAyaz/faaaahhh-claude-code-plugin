#!/usr/bin/env node
// on-compact.js — The point of no return
// Fires when auto-compaction triggers (context window is FULL).
// Resets the panic state for the next cycle and plays one final FAAAAHHH.
//
// This is the moment Claude's memories get compressed.
// Pour one out for the lost context.

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

  const stateDir = path.join(os.tmpdir(), `faaaahhh-${sessionId}`);
  fs.mkdirSync(stateDir, { recursive: true });

  // Reset state for the next context window cycle
  let currentSize = 0;
  try {
    currentSize = fs.statSync(transcriptPath).size;
  } catch {
    // transcript gone? that's peak FAAAAHHH
  }

  fs.writeFileSync(path.join(stateDir, "baseline"), String(currentSize));

  // Remove the played flag so the next cycle can scream again
  try {
    fs.unlinkSync(path.join(stateDir, "played"));
  } catch {
    // wasn't there, no worries
  }

  // Play the sound — this is the BIG one
  playSound(pluginRoot);
  process.exit(0);
}

function playSound(pluginRoot) {
  const soundFile = path.join(pluginRoot, "faaaahhhhhhh.mp3");

  if (!fs.existsSync(soundFile)) {
    return;
  }

  const platform = os.platform();

  if (platform === "darwin") {
    execFile("afplay", [soundFile], { stdio: "ignore" }).unref();
  } else if (platform === "win32") {
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
        child.on("error", () => {});
        break;
      } catch {
        continue;
      }
    }
  }
}

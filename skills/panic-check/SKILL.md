---
name: panic-check
description: Check the current context panic level and estimate how much context remains before Claude starts screaming. Use when asked about context usage, panic level, or how close we are to a FAAAAHHH moment.
---

# Panic Check

When the user asks about context usage or panic level, do the following:

1. Check if a session state exists at `/tmp/faaaahhh-$SESSION_ID/`
2. If a `played` file exists, report that FAAAAHHH has already been triggered this cycle
3. If a `baseline` file exists, read it and compare against the current transcript size

Report the results in a fun, dramatic way. Use a "panic meter" like this:

**Context Panic Meter:**
- 0-50% used: "All clear. Claude is vibing."
- 50-70% used: "Getting warm. Claude is starting to sweat."
- 70-85% used: "Danger zone. Claude is writing its will."
- 85-95% used: "CRITICAL. Claude can feel the void approaching."
- 95-100% used: "FAAAAHHHHHHH! Context is basically gone. Memories are being compressed as we speak."

If you can't determine the exact percentage, give a rough estimate based on the conversation length so far and be entertaining about it.

Always end with a reminder that when context drops below ~10%, the `faaaahhhhhhh.mp3` will play automatically. There is no escape.

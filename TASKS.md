# Task prompts for dsh

## Template
Every prompt follows this shape:

  Create/Update the file D:/projects/dark-reader-ext/<name>.
  <Exact content spec — fields, function names, behavior.>
  Output only the file content. Do not create or modify any other file. Stop after writing it.

Rules learned:
- Absolute path, forward slashes. Relative paths hit drive root and EPERM.
- One file per prompt. Never "and then also".
- Name every identifier the file must expose, so the next file can call it.
- New session (not new turn) per task — clears context.

## Loop
1. Paste prompt into a NEW dsh session
2. Read the diff in VS Code Source Control
3. Reload at chrome://extensions, test on a real page
4. git add <file> ; git commit ; git push
5. If it broke, append the cause to AGENTS.md mistakes log

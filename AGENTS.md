# Project: Nocturne — Chrome dark mode extension

## Stack
- Chrome Manifest V3. No build step, no bundler, no framework.
- Vanilla JS, ES modules. No TypeScript. No npm dependencies.

## Hard rules
- Never edit files outside D:\projects\dark-reader-ext.
- Never run git commands. The human handles all commits and pushes.
- Never install npm packages without asking first.
- One file per task. Do not refactor files you were not asked to touch.
- After writing a file, stop and report. Do not chain into the next task.

## Conventions
- 2-space indent, double quotes, semicolons.
- No comments unless the logic is non-obvious.
- manifest_version is always 3.

## Mistakes log
(append corrections here after each session)

- Tools require absolute paths with forward slashes: D:/projects/dark-reader-ext/file.js
- Relative paths resolve to drive root D:\ and fail with EPERM.

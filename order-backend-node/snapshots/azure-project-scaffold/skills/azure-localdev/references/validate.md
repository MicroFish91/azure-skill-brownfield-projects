# Validate

Run these checks after all artifacts generated, before marking plan `Ready` or telling user to press F5.

> **⛔ Every step is mandatory. Partial validation is failure.**
> Do NOT mark plan `Ready` until all steps pass.
> If any step fails, diagnose and fix, then re-run that step to confirm before moving on.

---

## Step 1 — Lint `tasks.json`

For every task in `tasks.json`:

| Check | Rule | Why |
|-------|------|-----|
| **Background matcher** | If `"isBackground": true`, `"problemMatcher"` MUST NOT be `[]`. Must be named matcher (e.g. `$tsc-watch`) or inline object with `background.beginsPattern`/`endsPattern`. | Empty matcher on background task triggers blocking VS Code dialog. |
| **Non-background matcher** | If `"isBackground"` absent or `false`, `"problemMatcher": []` is acceptable. | Only background tasks need real matchers. |
| **`dependsOn` targets exist** | Every label in `dependsOn` must exactly match another task's `"label"`. | Broken chains cause silent launch failures. |
| **`cwd` paths exist** | Every `options.cwd` path must exist in workspace. | Typos cause "directory not found" errors at runtime. |

---

## Step 2 — Lint `launch.json`

For every configuration in `launch.json`:

| Check | Rule |
|-------|------|
| **`preLaunchTask` exists** | Label must exactly match task in `tasks.json`. |
| **Debug port matches** | `"port"` must match port host process actually listens on. |
| **`webRoot` exists** | For `"type": "chrome"` configs, `webRoot` dir must exist in workspace. |
| **Compound configurations exist** | Every name in compound's `"configurations"` array must match config by `"name"`. |

---

## Step 3 — Run Every Configuration (MANDATORY)

> **⛔ YOU MUST ACTUALLY RUN EACH CONFIGURATION IN THE TERMINAL.**
>
> This is not static analysis. You MUST **execute real commands** that
> each launch config triggers, observe output, and confirm they
> reach healthy/ready state. Checking files exist or JSON references
> resolve is **not sufficient** — already done in Steps 1–2.
>
> **If you skip this step or fake it, user will discover broken configs on
> first F5 press. That is validation failure.**

For **every** configuration in `launch.json` (including each entry in compound):

1. **Read the configuration** — look at `preLaunchTask`, follow task chain in `tasks.json` to determine actual command(s) and `cwd`.
2. **Run it** — execute resolved command in terminal. Wait for process to reach ready/listening state or exit.
3. **Verify it started** — if process exits with non-zero code or prints error, it has **failed**. Stop and diagnose immediately.
4. **Stop it** — kill process before moving to next configuration.

> If configuration fails, fix root cause and **re-run it** to confirm before proceeding.

### Output the checklist

After all configurations individually started, verified, and stopped:

```
Launch Configuration Checklist:
✅ {config-name} — {ready signal observed}
❌ {config-name} — {error message or failure reason}
```

> **If any configuration fails:** diagnose and fix root cause (missing
> dependencies, native binding issues, port conflicts, bad paths, etc.), then
> **re-run that configuration from 3a** to confirm fix before proceeding.
> Do NOT mark plan `Ready` with any ❌ entries.
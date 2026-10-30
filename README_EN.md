**中文** · [README.md](./README.md)

<p align="center">
  <img src="assets/banner.svg" alt="MaxLoop · AI self-iteration engine with brakes" width="1280">
</p>

# MaxLoop · AI self-iteration engine with brakes

![Version](https://img.shields.io/badge/version-4.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Stars](https://img.shields.io/github/stars/huanweide/maxloop-overlord?style=social)
![Last Commit](https://img.shields.io/github/last-commit/huanweide/maxloop-overlord)
![CI](https://github.com/huanweide/maxloop-overlord/actions/workflows/ci.yml/badge.svg)

> **TL;DR** — MaxLoop is a drop-in skill that makes *any* AI agent's self-iteration actually converge, using **external-verification brakes** (Oracle Gate + discriminating tests + evidence anchors) instead of "the model says it's done". Two modes: **product deep-iteration** and **plan-upgrade**. Works with WorkBuddy / Claude Code / Cursor / Codex / OpenCode. MIT.

Natural-language / AI iteration → automatically completes "find the real problem → fix per round → re-check against external criteria → deliver only when truly met".

[Overview](#overview) · [What it does](#what-it-does) · [Features](#features) · [Quick start](#quick-start) · [Trigger reference](#trigger-reference) · [Architecture](#architecture) · [Roadmap](#roadmap) · [Contributing](#contributing)

---

## Overview

A normal iteration loop ends when the model *says* it's done. MaxLoop ends only when **external criteria** say it's done. The difference is one sentence: **the gate that decides "done" comes from outside the model, not from the model itself.**

Since v4.0, the former `maxloop-overlord` and `maxloop-upgrade` (plan-upgrade loop) have **merged into one mindset with two modes** — this repo ships both at the same version.

---

## Who should use it

- You run an AI coding agent (WorkBuddy / Claude Code / Cursor / Codex / OpenCode) and are tired of loops that report "fixed" while the bug is still there.
- You want iteration that **converges within a bounded number of rounds** instead of spinning with fake-green status.
- You want every "done" claim backed by **real, char-by-char evidence** you can diff and reproduce.

## Who should NOT use it

- You expect a tool that **auto-edits your code**. MaxLoop is a methodology skill; landing changes is done by you or your agent.
- Your task is a one-shot trivial fix or a pure Q&A — MaxLoop is overhead you don't need.
- You want a hosted service — this is a local Markdown skill plus two visualization HTML files.

---

## What it does

Two triggers, one engine:

**Mode A · Product deep-iteration**

```
User: Deep-review and iterate this dashboard HTML until it passes acceptance-test.js

Round 1: Deep experience   → finds #max-val hardcoded to 120, true dataset max is 150
Round 1: Root cause R/C/N  → R (must change): value is hardcoded, not computed from data
Round 2: Code execution    → compute max from dataset; also fix aria-label
Round 2: Oracle Gate       → run node acceptance-test.js dashboard-maxloop.html
         → baseline(seed) must RED / candidate must GREEN → discriminating test passes → release
Round 2: Deliver           → dual docs + ledger + evidence anchors
```

**Mode B · Plan-upgrade loop (formerly the upgrade loop)**

```
User: maxloop, upgrade this mid-term report PPT

Round 1: Supervised challenge → simulate a user nitpicking page by page, form candidate upgrades
Round 2: R/C/N ledger         → judge each as "must upgrade / optional / shouldn't add", suppress feature creep
Round 3: Three-round check    → every upgrade conclusion must have a real source anchor, no subjective self-defense
Round 3: Deliver              → upgrade proposal doc + check ledger + abandonment report
```

---

## Features

- **Oracle Gate external-judgment gate (the highest rule)** — before claiming "fixed", you must supply five kinds of real evidence: actual run output / lint / entry reachable / pre-fix failure proof / char-by-char evidence anchor; missing any one is rejected outright. See `references/oracle-gate.md`.
- **Discriminating Test (old RED, new GREEN)** — the same problem must have both a "must-fail-before" and a "must-pass-after" output; green without red proves nothing. See `references/discriminating-test.md`.
- **R/C/N + 5 Whys root-cause gate** — every change first passes a necessity gate: R must-change / C optional / N shouldn't-add; root cause must land on `file:line`, with placeholder-substitution tests to falsify "did we fix it". See `references/root-cause-protocol.md`.
- **Escape ladder + stall guard (anti-spin)** — when stuck on one item: R2 swap the reviewer, R3 swap the question, R4 concede and emit a structured abandonment report; two consecutive all-red rounds → stop immediately, no empty spinning. See `references/repeat-failure-breaker.md`.
- **Evidence-based review + symbolic write-off** — any review/upgrade conclusion must carry a real source anchor; no evidence, not accepted; conclusion drift is intercepted by the symbolic write-off defense. See `references/review-protocol.md`.
- **Efficiency index (quantified, not by feel)** — output level ÷ rounds. First controlled study (2026-10-25, same prompt / same model / same defect seed): **efficiency index ×2.0, fake-green rate 100%→0%**. Data and reproduction in `experiments/controlled-study-2026-10-25.md`.
- **Zero dependencies, pure methodology** — the entire skill is Markdown + two visualization HTML files; no package install, no network, no model lock-in. Any agent that can read a skill can use it.

---

## Quick start

### Install (drop the skill into your agent's skills directory)

```bash
# WorkBuddy
git clone https://github.com/huanweide/maxloop-overlord.git ~/.workbuddy/skills/maxloop-overlord

# Claude Code
git clone https://github.com/huanweide/maxloop-overlord.git ~/.claude/skills/maxloop-overlord

# Cursor
git clone https://github.com/huanweide/maxloop-overlord.git ~/.cursor/skills/maxloop-overlord

# Codex / OpenCode
git clone https://github.com/huanweide/maxloop-overlord.git ~/.codex/skills/maxloop-overlord
```

Drop it into the matching `skills` path and it works — no extra config.

### One trigger sentence

```text
Mode A: "Do a deep review and iterative fix on XX" / "Use MaxLoop to converge this problem"
Mode B: "maxloop upgrade the proposal" / "Optimize on top of the PPT" / "three-round check"
```

### Self-check (proof this methodology actually runs)

```bash
cd experiments
node acceptance-test.js seed-dashboard.html      # baseline: must RED (3/5)
node acceptance-test.js dashboard-maxloop.html   # output: must GREEN (5/5)
```

Real output:

```
=========================================
Target: dashboard-maxloop.html
True max of dataset (trueMax) = 150
-----------------------------------------
  [PASS] C1  bars=4, unique labels=4, labels=[North, South, East, West]
  [PASS] C2  #max-val="150" expected="150"
  [PASS] C3  all bar aria-labels numerically correct
  [PASS] C4  ratios=[1.500, 1.500, 1.500, 1.500] max deviation=0.00%
  [PASS] C5  no ERROR
-----------------------------------------
Summary: 5/5 passed -> PASS
=========================================
```

> `seed-dashboard.html` deliberately keeps the defect — it is the discriminating test's **baseline (must RED)**.
> CI also asserts "seed must RED + four outputs must GREEN" — green without red proves nothing.

---

## Trigger reference

| What you say | Mode | Engine does |
|---|---|---|
| "Do a deep review and iterative fix on XX" | A | Seven-stage loop: experience → review → root cause → execute → Oracle re-check → record |
| "Use MaxLoop to converge this" | A | Same, explicitly invoking MaxLoop's convergence discipline |
| "Make this module solid within a bounded number of rounds" | A | Round budget + efficiency-index report |
| "maxloop upgrade the proposal" | B | template baseline → supervised challenge → R/C/N ledger → three-round check |
| "Optimize on top of the PPT" | B | Only rationalize upgrades, don't force content in |
| "Have a supervisor agent challenge me repeatedly" | B | Enable supervisor agent adversarial challenge |

---

## Architecture

The seven-stage main loop is strung together by **four brakes** into an iron chain; the criterion always comes from outside the model, and the convergence standard is "all external criteria green", not "the model says good".

| Primitive | Meaning |
|---|---|
| **Red finding** | A concrete problem with `file:line` evidence, not "feels off" |
| **R/C/N judgment** | R must-change / C optional / N shouldn't-add — necessity and root-cause gate |
| **Discriminating test** | baseline must-RED + candidate must-GREEN, proving "this change is what worked" |
| **Oracle Gate** | All five external criteria present before claiming pass |
| **Evidence anchor** | A conclusion must char-by-char match a real output |
| **Escape ladder** | R2 swap reviewer / R3 swap question / R4 concede — force a new tactic when stuck |
| **Stall guard** | N consecutive rounds with zero improvement → brake and hand off to a human |

```
        ┌──────────── Stage 0 · External learning (load template / search) ────────────┐
        ↓
  ① Find real problem ──→ ② Fix per round ──→ ③ Re-check external criteria ──→ ④ Deliver real result
        ↑                                                  │
        │         failed Oracle Gate                      │
        └──────────────────────────────────────────────────┘
                     ↓ stuck on same item
            Escape ladder R2 swap / R3 swap / R4 concede
                     ↓ N consecutive rounds zero improvement
                stall guard brake → hand to human
```

| Module | File | Description |
|---|---|---|
| Main-loop state machine | `SKILL.md` | Seven stages + spine labels ①②③④, English in `SKILL.en.md` |
| Oracle Gate | `references/oracle-gate.md` | External-criteria prerequisite (highest rule) |
| Discriminating test | `references/discriminating-test.md` | baseline-fails / candidate-passes |
| Root-cause protocol | `references/root-cause-protocol.md` | 5 Whys + placeholder-substitution test |
| Escape ladder | `references/repeat-failure-breaker.md` | 2-3-4 tactic swap, anti-disguised rework |
| Plan-upgrade details | `references/upgrade-mode.md` | Mode B template baseline / R/C/N ledger / wording discipline |
| Execution & degradation | `references/code-exec-protocol.md` · `degrade-protocol.md` | disk-discipline / channel-failure fallback to Chair verification |
| Recording & metrics | `references/record-keeping.md` · `effectiveness-metrics.md` | dual docs + ledger + efficiency index |
| Scenario adapter | `references/novel-forge-adapter.md` | example of wiring the engine to a specific business |
| Acceptance script | `experiments/acceptance-test.js` | browser-free, pure-node objective acceptor |

---

## Add your own adapter

MaxLoop is not tied to a task type. Swap the "external criteria" for your domain's objective acceptance script and the whole brake set is reusable:

```js
// my-acceptance.js —— your Oracle (exit code 0 = PASS, 1 = FAIL)
const out = runMyThing('build/out.bin');
if (out.latencyMs > 200) { console.error('FAIL: latency'); process.exit(1); }
if (!out.hasChecksum)    { console.error('FAIL: checksum'); process.exit(1); }
console.log('PASS');
```

Then treat it as criterion (a) of the Oracle Gate (actual run):

| Oracle Gate five criteria | How your scenario fills it |
|---|---|
| a actual run | `node my-acceptance.js` outputs PASS |
| b lint | your linter / type-check command |
| c entry reachable | the artifact can be loaded by the real entry |
| d pre-fix failure | old baseline output (must FAIL) |
| e evidence anchor | failure line / metric value, char-by-char matchable |

After editing, copy the structure of `references/novel-forge-adapter.md` to land an adapter doc.

---

## Roadmap

- [x] Four brakes (Oracle Gate / discriminating test / root-cause gate / escape ladder)
- [x] Efficiency index + controlled-variable study in `experiments/`
- [x] Full English methodology `SKILL.en.md`
- [ ] More agent adaptation records (Claude Code / Cursor)
- [ ] `experiments/` keeps accumulating cross-task, cross-model controlled data
- [ ] Contribution guide (welcome your empirical results)

Welcome to submit your controlled experiment under `experiments/` — **any "improved by X times" claim must have a matching discriminating-test output and char-by-char evidence anchor in `experiments/`**.

---

## Related projects

The same paradigm (**external-criteria brakes · no fake-green spinning · four brakes**) landed on different carriers, cross-linking:

| Project | Carrier | One line |
|---|---|---|
| [`maxloop-overlord`](https://github.com/huanweide/maxloop-overlord) | Agent Skill (this repo) | The paradigm itself: braked product-iteration / plan-upgrade dual mode |
| [`codehealth-loop`](https://github.com/huanweide/codehealth-loop) | Python engine | Paradigm made concrete for engineering health: 12-axis checkup + four brakes + sandbox-verified fixes |
| [`veriloop`](https://github.com/huanweide/veriloop) | Python CLI | Paradigm made concrete for code audit: 12 pluggable analysis axes + 4 verification brakes |
| [`overlord-loop`](https://github.com/huanweide/overlord-loop) | Engine implementation | Braked AI code-evolution loop engine |
| [`doctors`](https://github.com/huanweide/doctors) | Node CLI bundle | Provides 8 zero-dep health axes, ported by `codehealth-loop`'s perception layer |
| [`family-showcase`](https://github.com/huanweide/family-showcase) | Single-page HTML | 18-axis panoramic dashboard of the engineering-health family |

---

## Contributing

- File an issue describing the **fake-green scenario** you hit, with model / prompt / round count — far more useful than abstract advice.
- PRs must attach a discriminating test: your change needs both a "must-RED-before" and a "must-GREEN-after" real output.
- Append your own controlled experiment directory under `experiments/`, noting the model and prompt verbatim.

## Safety boundary

> ⚠️ MaxLoop is a **methodology skill**, not an executor:
> - It does not auto-edit your code, auto-send network requests, or read any secrets.
> - It requires "landing by a human / upper-level agent"; judgment and execution are decoupled.
> - It governs "does the iteration truly converge", not your business requirements; a single small fix or pure Q&A does not need MaxLoop.

## License

[MIT](LICENSE) © 2026 huanweide

---

<div align="center">
  <b>If MaxLoop saved you a few rounds of useless iteration, drop a ⭐ Star so more people see it.</b><br/>
  <a href="https://github.com/huanweide/maxloop-overlord">huanweide/maxloop-overlord</a>
</div>

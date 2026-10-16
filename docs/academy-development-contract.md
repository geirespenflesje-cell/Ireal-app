# Creative Academy — Development Contract

**Product:** Jazz Chart Reader (this repository)
**Status:** Permanent integration rules for independent development

## Creative Academy principle

> **“Enkel träning för eleven. Full kontroll för läraren.”**
> Simple practice for the student. Full control for the teacher.

## Boundary model

All connected tools integrate through a stable **Academy Activity Provider** boundary.

A provider exposes:

1. **Catalog / Capabilities** — what activities exist and what they can do
2. **Launch** — how an activity is started with a given context
3. **Evidence** — structured practice outcomes the host may collect

Academy owns:

- Catalog → Entitlements → Assignments → Evidence/Mastery → Workout Engine → Today’s Practice

The tool owns:

- Its own engine, activities, playback, notation, import, exercise logic, and evidence **production**

The tool **must not** import Academy internal stores or components.

## One activity, three launch modes

The **same** underlying activity must support:

| Mode | Use |
|------|-----|
| `free` | Free practice |
| `assigned` | Teacher Assignment |
| `workout` | Workout Engine / Today’s Practice |

**Do not** create separate exercise engines for each mode.
Only the **launch context** changes.

## Launch context (conceptual)

A launch may include:

- `mode`: `free` | `assigned` | `workout`
- `activityId`
- learner context
- parameters
- settings / accessibility context

Standalone use must work when no Academy context is provided.

## Settings / preferences / accessibility

All connected modules must be able to consume Academy Settings / Preferences / Accessibility context through a **shared settings boundary**.

- Module-specific settings are allowed.
- Academy-wide settings must be **injectable** (not hard-wired into the tool).
- Prefer: `standalone defaults → settings port ← Academy later`.
- Do **not** spread Academy-specific settings code through the app.

### Accessibility baseline

- **WCAG 2.2 AA**, with selected AAA criteria where useful for music learning.
- Protect: keyboard, visible focus, contrast, semantic controls, screen-reader structure, touch, ~44px targets where appropriate, 320px reflow, 200% zoom, reduced motion where relevant.

## Architecture preference

Prefer:

> **existing engine + thin adapter**

over:

> rewriting proven functionality inside Academy.

Do **not** create parallel systems for:

- settings
- progress
- evidence
- entitlement
- assignment
- workout
- accessibility

New features must remain **independently runnable** outside Academy.

## Evidence (product-side)

The tool emits events/results such as:

- `started` · `progress` · `completed` · `interrupted` · `error`

with relevant fields (duration, attempts, score if applicable, competency evidence).

This repository does **not** host an Academy database, mastery engine, or workout scheduler.

## Independence

Developers work in **this** repo without the Creative Academy repository.

Future Academy integration should mainly mean:

> **CONNECT THE ADAPTER**

not:

> **REBUILD THE PRODUCT**

## Target shape

```
Creative Academy later
        ↓
Academy adapter (external / later)
        ↓
------------------------------
Activity Provider Port
Settings / Accessibility Port
Evidence Port
------------------------------
        ↓
Tool Application
        ↓
Existing Core Engine
```

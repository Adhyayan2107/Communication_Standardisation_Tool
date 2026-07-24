---
name: Consuma Communication Standardisation Tool
description: A content-governance workbench styled as a modern standards office — precision is the brand.
colors:
  paper: "#F1F3F0"
  panel: "#FFFFFF"
  ink: "#16211C"
  muted: "#5C6660"
  viridian: "#0D5C48"
  viridian-deep: "#073B2E"
  violation: "#B3261E"
  violation-tint: "#FBE4E2"
  violation-deep: "#8F1D16"
  violation-pulse: "#F3B7B1"
  warn: "#8A6A00"
  mint: "#DFF0E9"
  line: "#DDE2DC"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontWeight: 700
  title:
    fontFamily: "Space Grotesk, sans-serif"
    fontWeight: 700
    fontSize: "0.9375rem"
  stat:
    fontFamily: "Space Grotesk, sans-serif"
    fontWeight: 700
    fontSize: "1.75rem"
    lineHeight: 1
  headline:
    fontFamily: "Space Grotesk, sans-serif"
    fontWeight: 500
  body:
    fontFamily: "Inter, sans-serif"
    fontWeight: 400
    fontSize: "0.875rem"
    lineHeight: 1.6
  label:
    fontFamily: "Inter, sans-serif"
    fontWeight: 600
    fontSize: "0.6875rem"
    letterSpacing: "0.14em"
  mono:
    fontFamily: "IBM Plex Mono, monospace"
    fontWeight: 400
  data:
    fontFamily: "Inter, sans-serif"
    fontWeight: 400
    fontSize: "0.8125rem"
    lineHeight: 1.5
  chip:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "9.5px"
  specimen:
    fontFamily: "IBM Plex Mono, monospace"
    fontWeight: 600
    fontSize: "1.125rem"
    lineHeight: 1.4
rounded:
  chip: "6px"
  panel: "10px"
  mark: "2px"
  chip-mini: "3px"
components:
  button-primary:
    backgroundColor: "{colors.viridian}"
    textColor: "#FFFFFF"
    rounded: "8px"
  chip-rule:
    textColor: "{colors.viridian}"
    rounded: "{rounded.chip}"
    typography: "{typography.mono}"
---

<!-- SEED: pinned by CLAUDE.md's Design spec (the binding brief); re-run /impeccable document after the pages are built to carbonize component tokens. -->

# Design System: Consuma Communication Standardisation Tool

## Overview

**Creative North Star: "The Standards Office"**

The visual language of a regulator crossed with a modern B2B product site: locked registry cards, rule-ID chips, a compliance stamp. Precision is the brand; the UI itself must look governed. Light, papery surfaces carry dense, exact information; the deep-viridian hero and footer bookend the light pages like the covers of a standards document. Dark is NOT a theme toggle.

**Key Characteristics:**
- Governed values always render in mono — rule IDs, claim values, ledger verdicts, diff spans. The mono face is the personality of the app.
- Flat, bordered panels over shadows; one soft elevation reserved for sticky elements.
- PASS is viridian, violations are a serious red, warnings a dark ochre — verdict colors are semantic only, never decoration.

## Colors

A papery neutral field with one governing green and two semantic verdict colors.

### Primary
- **Viridian** (#0D5C48): primary actions, PASS verdicts, links, active states, focus rings.
- **Deep Viridian** (#073B2E): landing hero and footer backgrounds — the dark bookends.

### Neutral
- **Paper** (#F1F3F0): app background.
- **Panel** (#FFFFFF): cards and panels.
- **Ink** (#16211C): primary text.
- **Muted** (#5C6660): secondary text, section labels.
- **Line** (#DDE2DC): 1px borders everywhere.
- **Mint** (#DFF0E9): chip fills, subtle highlights.

### Tertiary (verdict colors)
- **Violation** (#B3261E): FAIL verdicts, inline violation marks, rule-ID chips on marks.
- **Violation Tint** (#FBE4E2): the fill behind inline violation marks; **Violation Deep** (#8F1D16) is the text on that tint; **Violation Pulse** (#F3B7B1) is the one-time pulse start frame.
- **Warn** (#8A6A00): WARN verdicts only.

**The Semantic Verdict Rule.** Violation red and warn ochre appear only on actual verdicts and marks — never as decoration or emphasis.

## Typography

**Display Font:** Space Grotesk (500/700)
**Body Font:** Inter (400/600)
**Label/Mono Font:** IBM Plex Mono

**Character:** An engineered pairing — geometric display for headlines and the stamp, a quiet workhorse for UI, and a bureaucratic mono for every governed value.

### Hierarchy
- **Display** (700, Space Grotesk): page headlines, the ON/OFF STANDARD stamp.
- **Stat** (700, 28px, Space Grotesk): the big registry numbers on stat panels.
- **Label** (600, 11px, 0.14em tracking, uppercase, Inter): panel headers and section labels.
- **Body** (400, 14px, Inter): UI copy and drafts.
- **Data** (400, 13px, Inter): dense tabular data — the ledger, run history rows.
- **Mono** (IBM Plex Mono): rule IDs, claim values, ledger verdicts, compiled prompt, diff spans.
- **Specimen** (600, 18px, IBM Plex Mono): canonical claim values on the constitution's locked specimen cards.

**The Governed Value Rule.** If a value comes from the constitution (a rule ID, a canonical claim, a verdict), it renders in IBM Plex Mono. Everywhere. No exceptions.

## Layout

Max content width ~1240px. `/tool` is a two-column grid (330px constitution rail + fluid workbench) collapsing to a single column with the rail as a top drawer below 900px. Responsive floor is 360px. Spacing rhythm on a 4px base; panels padded 16px; generous separation between panels, tight grouping inside them.

## Elevation & Depth

Flat by default: 1px `#DDE2DC` borders define every surface on paper. Shadows minimal — one soft elevation (offset + soft blur) reserved for sticky elements only.

## Shapes

Panels 10px radius; chips and stamps 6px; buttons 8px; channel tabs are pills. Borders 1px solid, never colored thick accents.

## Components

- **RuleChip:** mono rule ID in a 6px-radius outline chip — viridian outline/text on panels, red fill on violation marks.
- **StampBadge:** 2px-bordered 6px-radius stamp, Space Grotesk, rotated −2°, viridian "ON STANDARD" / red "OFF STANDARD".
- **Ledger:** a real `<table>`; mono verdict column (PASS/FAIL/WARN in semantic colors), offending spans quoted in mono red.
- **Violation mark:** violation-tint fill (2px radius), 2px violation underline, superscript rule-ID chip (9.5px mono on violation, 3px radius) rendered as ::after content so contentEditable text stays clean; pulses once from violation-pulse, disabled under prefers-reduced-motion.

## Do's and Don'ts

### Do:
- **Do** render every governed value in IBM Plex Mono.
- **Do** use the deep-viridian dark surfaces only as hero/footer bookends.
- **Do** keep visible viridian focus rings on all interactive elements.

### Don't:
- **Don't** add a dark theme toggle.
- **Don't** use shadows for panel definition — borders define surfaces.
- **Don't** animate anything beyond the three specified motions (ledger stagger, stamp settle, one-time mark pulse), and respect `prefers-reduced-motion`.

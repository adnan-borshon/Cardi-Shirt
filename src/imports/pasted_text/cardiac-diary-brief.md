Looking at the two briefs Claude gave you, the structure follows a clear pattern:

- Numbered sections with bold headers
- Philosophy/intent paragraph first
- Then layout specs broken into named sub-sections with `###` headers
- Specific px values, color tokens, component states
- Integration notes at the end tying back to other screens

Let me rewrite the Cardiac Diary section properly in that same voice and structure.

---

# CardiShirt — Cardiac Diary Redesign Brief

## What Changed & Why

The original Cardiac Diary brief was over-specified in ways that created complexity without adding clarity. The tile state logic was too granular for patients to read at a glance, the right panel tried to do too much at once, and the wearing history language leaned toward clinical rather than personal. The revised brief simplifies the visual grammar of the calendar, reduces the right panel to a clear hierarchy of three things — narrative, chart, events — and rewrites the wearing feedback to feel like a companion speaking, not a system reporting. Everything else about the screen's purpose and light-theme treatment remains unchanged.

---

## 1. Cardiac Diary Visual Philosophy — Revised

The Cardiac Diary is a light-theme screen. White base (#FFFFFF), off-white card surfaces (#F7F8FC), 1px card borders at rgba(0, 0, 0, 0.08). This is deliberate — patients spend time here reading and reflecting, and the dark dashboard aesthetic would be wrong for that mode. The diary should feel like a well-designed health journal, calm and organized, with color used sparingly to carry meaning rather than create atmosphere.

Typography follows the full CardiShirt system. Syne for labels, dates, and UI elements. DM Serif for the AI narrative — this is the most human piece of writing in the product and deserves a warm, editorial typeface. DM Mono for all numeric values: BPM, RMSSD, timestamps, streak counts. The combination of DM Serif narrative and DM Mono data within the same panel creates a clear visual distinction between the AI's voice and the raw numbers — patients read the narrative first, then look at the numbers for confirmation.

Color tokens on this screen: cardiac red #E8304A for alert states, wearing streaks, and today's ring. Healthy green #27C28A for good health score days and positive indicators. Caution amber #F5A623 for anomaly days and partial wearing. Gray #C2C8D6 for not-worn days. These four colors carry all the semantic meaning on the calendar — nothing else needs color. Secondary text throughout the screen uses #6B7499. Primary text uses #0D0F1A.

The guiding principle for simplicity: every element on this screen must earn its place by answering a question the patient actually has. "How was my heart this month?" — answered by the calendar. "What happened today?" — answered by the narrative. "What did my heart rate do?" — answered by the chart. "What specific events happened?" — answered by the timeline. Anything that does not answer one of these four questions does not belong on the primary view.

---

## 2. Cardiac Diary Layout

### Desktop — Two Panel Structure

At desktop (1280px and above), the Cardiac Diary is two panels side by side. The left panel is 360px fixed and contains the calendar, streak tracker, and month summary. The right panel is flexible and contains the selected day's full detail. The two panels have a 1px vertical divider between them in the card border color.

At tablet (768–1279px), the panels stack vertically — calendar panel on top, day detail below. The calendar collapses to a more compact form at this breakpoint, described below. At mobile web, the calendar becomes a horizontal date strip at the top of the screen, scrollable left and right, and the day detail occupies the full screen below it. The bottom tab bar handles navigation at mobile web, consistent with the rest of the product.

---

## 3. Left Panel — Calendar and Wearing History

### Calendar Grid

The calendar is the emotional core of this screen. Its job is to let a patient or family member look at a month and understand — in under three seconds — how the patient's heart and wearing habits have been. The tile design must support this three-second scan.

Each day tile is a 40px square with 6px border radius. Four tile states only — reduced from the original brief's five to eliminate the ambiguity between "minimal wear" and "partial wear." A patient does not think in those terms; they think in wore it, mostly wore it, barely wore it, or did not wear it. Four states map directly to that mental model.

**Worn — full day:** solid color fill based on the AI health score for that day. Green (#27C28A) for a score above 75. Amber (#F5A623) for a score between 40 and 74. Red (#E8304A) for a score below 40. The date number is white inside the filled tile. This is the clearest possible encoding: a green square means a good day, a red square means a concerning day.

**Worn — partial day:** the same color fill but at 45% opacity, with the date number in the full-opacity version of that color rather than white. The reduced opacity immediately signals "incomplete data" without requiring the patient to read a legend. The color still communicates the health trend for the hours that were monitored.

**Not worn:** a flat gray fill (#EEF0F5) with the date number in #9AA0B8. No pattern, no hatching — a clean empty tile. Simple and honest.

**Future days:** no fill, no border. Just the date number in #C2C8D6. The tile has no background at all — it is simply a number in the grid.

Today's tile — regardless of wearing status — has a 2px cardiac red ring as its border. The ring sits outside the tile's fill so it does not interfere with the color coding.

Alert days have a single small red dot (6px circle) in the top-right corner of the tile, overlaid on whatever fill the day has. Days with patient-logged symptoms have a small orange dot in the top-left corner. These dots are the only additional encoding on the tile — no more than two dots on any tile at any time.

Days are arranged in a standard 7-column Monday-to-Sunday grid with short day-of-week headers (M T W T F S S) in Syne 11px, color #9AA0B8. Month and year appear above the grid in Syne 16px medium, #0D0F1A, with left and right chevrons for month navigation and a "Today" link on the far right that returns to the current month and selects today.

### Wearing Legend

Immediately below the calendar grid, a single horizontal legend row showing all four tile state treatments with one-word labels: Full, Partial, Not worn, Future. Each legend item is a 16px sample tile followed by its label in Syne 12px, color #6B7499. The legend sits on the same white surface as the calendar, separated by 16px of vertical space. It is always visible when the calendar is visible — a patient should never have to wonder what a tile color means.

### Streak Tracker

Below the legend, the wearing streak. "Current streak" as a label in Syne 12px #6B7499, and the streak count as a larger number in DM Mono 28px #0D0F1A followed by "days" in Syne 14px. A small flame-shaped icon in cardiac red #E8304A sits to the left of the count. Below the current streak: "Personal best — 23 days" in Syne 13px #6B7499 with a small trophy icon.

The streak resets on any day where the shirt is not worn at all. Partial wearing days count toward maintaining the streak but are represented on the calendar at reduced opacity — the patient can see at a glance that they kept their streak but had an incomplete day.

This gamification element is medically meaningful, not decorative. Consistent wearing produces better personalized baselines and catches more events. The streak is the simplest possible behavioral nudge toward that consistency.

### Month Summary Strip

At the bottom of the left panel, a row of four compact metric tiles showing the month's aggregate data: days worn (with a sub-label showing the count out of total days in the month), total alert events, average health score for worn days, and HRV trend for the month as a directional arrow with a label (Improving, Stable, Declining). Each tile is a small card with a metric label in Syne 11px #6B7499 and the value in DM Mono 20px #0D0F1A. The tiles sit on the card surface color (#F7F8FC) with the standard 1px border and 8px border radius.

---

## 4. Right Panel — Day Detail View

Selecting any day with wearing data opens the day detail in the right panel. The panel has 32px of horizontal padding and 28px of top padding. Sections are separated by 24px of vertical space — generous spacing that gives the content room to breathe and lets the patient scan sections without the screen feeling crowded.

### Day Header

The selected date in DM Serif 28px #0D0F1A. Day of week in Syne 14px #6B7499 immediately below. On the same header line as the date, right-aligned: a wearing status badge in pill form. "Worn 9h 20m" with a green background at 15% opacity and green text. "Partial — 4h 12m" with an amber background at 15% opacity and amber text. "Not worn" with a gray background at 15% opacity and gray text. If the day has an alert, an additional red pill badge "1 alert" appears beside the wearing badge.

### AI Narrative

Immediately below the header, the AI-generated day narrative in DM Serif 16px #0D0F1A, line-height 1.7. Three to five sentences depending on how eventful the day was. Warm, direct, second-person. No clinical terminology. This paragraph is the first thing the patient reads and it should answer the most important question — "was my heart okay today?" — before they look at a single number.

The narrative loads with a brief typewriter animation to signal that it is AI-generated and current. A small "CardiShirt AI" badge in Syne 11px #6B7499 sits below the paragraph with the model confidence as a subtle dot scale. A "Read in Bengali" link appears if the language setting is English, and vice versa — both versions are generated simultaneously.

### 24-Hour Heart Rate Chart

Below the narrative, a full-width area chart showing heart rate over the full 24 hours of the selected day. Chart height is 160px at desktop. The x-axis runs midnight to midnight with time labels at 6AM, 12PM, 6PM. The y-axis shows BPM with three reference lines: the patient's resting range floor, the resting range ceiling, and the elevated threshold. These reference lines are 0.5px dashed lines in #C2C8D6 — present but unobtrusive.

The heart rate line is 1.5px, smooth. Color: charcoal (#0D0F1A) when within the patient's established normal range, amber (#F5A623) when above, and soft blue (#5B8AF0) when below the resting floor (indicating deep sleep or rest). The area fill beneath the line matches the line color at 8% opacity.

Periods when the shirt was not worn render as a gray hatched zone rather than a gap or a flat line. The hatching communicates "no data here" clearly without implying the heart rate was zero. The boundary between wearing and non-wearing periods is marked by a thin vertical line in #C2C8D6.

Patient-logged events appear as small icons along the bottom of the chart at the appropriate timestamp — a pill icon for medication, a warning icon for symptoms, a checkmark for check-in completion. Hovering or tapping shows a tooltip with the event detail.

### HRV Summary Row

Below the heart rate chart, a two-column row. Left column: the RMSSD value for the day in DM Mono 32px #0D0F1A with a comparison line below it — "6ms above your 30-day average" in Syne 12px in healthy green or caution amber depending on direction. A plain-language label below the comparison: "Good variability" or "Low variability — consider resting." Right column: a small Poincaré scatter plot, 120×80px, rendered in charcoal dots on a white surface with a light gray axis. A "What does this mean?" text link in Syne 12px cardiac red expands a plain-language explanation inline below the row.

### Events Timeline

Below the HRV row, a chronological timeline of notable events from the day. The timeline is a clean vertical list — no connecting line, no decorative vertical bar. Each event is a row with four elements: a small colored icon on the left (16px), the timestamp in DM Mono 12px #6B7499, a one-line description in Syne 14px #0D0F1A, and a right-aligned action link in Syne 13px cardiac red ("View ECG clip", "Edit note", "View details").

Cardiac events detected by AI: a heart icon in the appropriate status color. Patient-logged events (symptoms, medication, check-in): a person icon in #5B8AF0. Device events (shirt connected, disconnected, signal quality): a shirt icon in #9AA0B8.

The timeline is sorted chronologically. If the day has no events beyond routine device connect and disconnect, the device events are collapsed behind a "Show device events" toggle and the timeline shows only a single line: "No cardiac events detected today" in Syne 14px #6B7499, centered, with a small healthy green checkmark icon. This prevents the timeline from being cluttered by routine connect/disconnect entries on uneventful days.

### Not-Worn Day State

When the patient selects a day with no wearing data, the right panel shows a distinct and simplified state. The header displays the date with a gray "Not worn" badge as above. Where the narrative and chart would be, a single AI-generated note in DM Serif 16px explains the gap in context — if the previous days were also not worn, the tone is gently more concerned; if this is an isolated gap in an otherwise consistent record, the tone is light. Below the note, a single paragraph of encouragement about consistent wearing in the same DM Serif voice, followed by a "Log a note for this day" text link in cardiac red for adding retroactive context. Nothing else — no empty chart frame, no placeholder HRV row.

### Doctor Notes

At the very bottom of the detail view for any day, a collapsible section labeled "Notes" in Syne 14px #6B7499 with a chevron toggle. Collapsed by default unless a note already exists for the day. Expanded: a text input with placeholder "Add a note for this day..." and a save button. Existing notes show as attributed rows: "Patient note — 2 Apr, 11:30 AM" in Syne 12px #6B7499 above the note text in Syne 14px #0D0F1A. Doctor notes show with a blue left border and "Doctor note" attribution. These notes are distinct from notes attached to specific ECG sessions — they capture day-level context.

---

## 5. Component States to Design

Every component on the revised Cardiac Diary has multiple states that must be designed explicitly.

**Calendar tile states:** Full-day green, full-day amber, full-day red, partial-day at reduced opacity in all three health colors, not-worn gray, future day, today ring, alert dot overlay, symptom dot overlay, selected state (tile gains a 2px #0D0F1A border and a subtle shadow-free white inner ring).

**Right panel states:** Normal day (narrative + chart + HRV + events), alert day (narrative references the alert, chart shows the moment in red, events timeline leads with the alert entry), partial-wearing day (chart shows hatched zones, narrative acknowledges the gap, HRV labeled as partial-day estimate), not-worn day (simplified state as described above), first load (skeleton state — gray placeholder blocks for the narrative, a flat gray chart area, empty timeline).

**Streak tracker states:** Active streak (current count with flame icon), streak broken (count resets to 0 with a neutral gray treatment — no red, no alarming language), personal best achieved (brief highlight animation on the best count, then returns to normal display), first day (count is 1, encouraging sub-label: "Day one — keep it going").

**Month summary tiles:** All positive (green directional indicators), mixed (standard neutral display), concerning month (amber or red on the alert count tile and HRV trend tile, no change to the tile structure itself).

**Events timeline states:** Events present (full list), no cardiac events (collapsed with "No cardiac events today" message), empty day (not-worn state), offline (cached events shown with a small "Cached" badge — new analysis unavailable until reconnected).

---

## 6. Cardiac Diary — Hamburger Menu Integration

When Cardiac Diary is the active screen, the wearing streak count updates live in the hamburger menu's navigation badge — "Day 14" shown beside the Cardiac Diary navigation row as a teal pill. The recent activity feed in the hamburger menu prioritizes diary-relevant events: streak milestones, alert days in the calendar, days flagged by the AI for follow-up. The Log a symptom quick action in the hamburger is highlighted on this screen — it is the most contextually relevant quick action when the patient is reviewing their diary. The ECG Records badge shows its standard new-recording count rather than a diary-specific value.

---

## 7. Figma File Additions for Cardiac Diary

Add all Cardiac Diary components to the existing component library. Required component variants: all five calendar tile states (full wear in three health colors, partial, not-worn, future, today, selected), the wearing legend strip, the streak tracker in all four states, the month summary strip, the day detail panel in all five right panel states, the 24-hour heart rate chart with all line color variants and the hatched non-wear zone treatment, the HRV summary row with the Poincaré plot, the events timeline in all states, and the not-worn day simplified panel.

The day detail panel requires Bengali-language variants for the AI narrative section — the DM Serif narrative text reflows in Bengali and the font stack must fall back correctly to a Bengali-compatible serif when the language setting is active. All other UI text uses Syne which handles Bengali adequately for labels and interface copy.

The Cardiac Diary page in the Figma file should show: desktop layout with a calendar month displayed showing a mix of all tile states, right panel showing a normal day in detail, right panel showing a not-worn day, right panel showing an alert day, and the tablet stacked layout as a fourth artboard. Mobile web is a fifth artboard showing the horizontal date strip and the full-screen day detail.

---

*This revised brief supersedes the Cardiac Diary section of the ECG Records and Cardiac Diary follow-up brief in full. The ECG Records screen, hamburger menu specification, and all shared design considerations from that brief remain as specified. Priority order for the design sprint: calendar component with all tile states, day detail panel in all states, 24-hour chart with hatched zones, and then responsive variants at tablet and mobile web.*
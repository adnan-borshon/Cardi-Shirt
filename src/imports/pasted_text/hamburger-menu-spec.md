# CardiShirt — ECG Records & Cardiac Diary Follow-Up Design Brief

---

## Prefatory Note on the Hamburger Menu

Before diving into the two screens, the hamburger menu gets its own full specification here because it appears on both screens and must be designed once, designed well, and used consistently. On the dark dashboard it lives in the sidebar header. On lighter screens it collapses the sidebar at tablet and becomes the sole navigation entry point at mobile web. The instruction is to make it as useful as possible — so the hamburger is not just a navigation drawer. It is a command center.

---

## The Hamburger Menu — Full Specification

### Philosophy

Most hamburger menus are navigation lists wearing a coat. CardiShirt's hamburger menu should be a genuine utility panel — something a patient or family member reaches for because it gives them something useful, not just because they need to go somewhere. It combines navigation, live status, quick actions, recent activity, and contextual shortcuts into one coherent panel. Opening it should feel like glancing at a well-organized control room, not leafing through a directory.

### Trigger and Behavior

At desktop the hamburger icon appears in the sidebar header beside the CardiShirt wordmark. Clicking it collapses the sidebar from 260px to 64px — the icon rail mode. Clicking again expands it. The hamburger is therefore a sidebar toggle, not a separate drawer, at desktop.

At tablet and mobile web the hamburger sits in the top-left of the top navigation bar. Tapping it opens a full-height drawer that slides in from the left, overlaying the content with a semi-transparent backdrop. The drawer is 320px wide at tablet and full-width minus 56px at mobile web (leaving a visible strip of content behind, reinforcing that the drawer is a layer above the page). Tapping the backdrop or swiping left dismisses it.

### Drawer Structure — Five Zones

**Zone 1 — Patient Status Strip (top, always visible)**

The very top of the drawer is a patient status strip that never scrolls away. It contains the patient's name, their current heart status as a colored pill badge (Stable / Watch / Alert), the current heart rate in DM Mono, and the shirt connection indicator. For a family member logged in under their own account, this strip shows the patient they are monitoring by name with the same data. This strip is the most important element in the drawer — a family member who opens the hamburger menu at 11pm to check on their parent sees the answer immediately, before doing anything else.

**Zone 2 — Primary Navigation**

The six primary destinations listed as full-width tappable rows. Each row: icon on the left (24px, filled style when active, outline when inactive), destination name in Syne 15px medium, and a contextual badge on the right when relevant. The contextual badges are what make this navigation panel more useful than a standard list.

Dashboard shows a green dot badge if everything is normal, amber if something is worth watching, red if an alert is active.

ECG Records shows the count of new recordings since the patient last visited: "3 new" in a small pill. Disappears when the count is zero.

Cardiac Diary shows the streak counter — how many consecutive days the shirt has been worn: "Day 14" in a small teal pill. This is a motivational element — patients are encouraged to maintain their streak, which means wearing the shirt consistently.

Risk and Trends shows the direction of the 7-day risk score as a small arrow — up, down, or flat — with a color coding. A family member glancing at the navigation knows immediately if the trend is improving or worsening.

Family and Emergency shows the count of family members currently active (app open): "2 active" when family members are monitoring simultaneously.

Settings and Device shows a red dot if any device issue needs attention — poor sensor connection, low battery, firmware update available.

**Zone 3 — Quick Actions**

Below the navigation, separated by a 0.5px divider, a grid of quick action buttons — two columns, three rows, six total actions. These are the actions patients reach for most often without necessarily navigating to a full screen.

Record ECG now: initiates a new 30-second ECG capture session from wherever the patient is in the app. Opens a recording overlay rather than navigating away.

Log a symptom: opens a quick bottom sheet where the patient can tag the current moment with a symptom — chest tightness, shortness of breath, dizziness, fatigue, or a custom text note. This tagged moment appears in the cardiac diary timeline as a patient-reported event, correlating with the ECG data from the same time.

Share with doctor: generates the shareable report link for the last 7 days immediately, without navigating to the report screen. The link copies to clipboard and a success toast appears. Designed for moments when a patient is at a doctor's appointment and needs to share data quickly.

Call nearest ambulance: a high-visibility red button. One tap initiates the emergency call flow — not the automatic dispatch countdown, but a direct manual call to the nearest registered ambulance service. Designed for emergencies where the patient or family member wants to act immediately without waiting for AI detection. Tapping it opens a confirmation screen, not an immediate call, to prevent accidental activation.

Check family status: navigates directly to the family circle view within the Family and Emergency screen, bypassing the emergency configuration section.

Test shirt connection: triggers an immediate connection quality check, showing signal strength per lead in a micro-panel within the drawer. Useful when the patient just put the shirt on and wants to confirm it is reading correctly before going about their day.

**Zone 4 — Recent Activity Feed**

Below the quick actions, a compact feed of the last five notable events across the patient's history. Each event is a single line — timestamp on the left, event description on the right, with a color-coded left border (red for alerts, amber for anomalies, green for healthy milestones, blue for device events). Tapping any event navigates directly to the relevant record in the appropriate screen — an alert event opens the alert detail in ECG Records, a diary milestone opens that day in Cardiac Diary.

Examples of events that appear here: "Today 3:42 PM — Irregular rhythm detected", "Yesterday — 7-day streak achieved", "Mon 9:15 AM — New 12-lead recording", "Sun — Weekly report generated", "Fri 11pm — Shirt disconnected during sleep."

This feed is not a full notification history — it is a curated digest of the most contextually relevant recent events. The logic for what surfaces here should prioritize medical events first, streak and milestone events second, and device events third.

**Zone 5 — Footer Strip**

At the very bottom of the drawer, a slim footer strip with three elements. The currently logged-in account name and role (Patient or Family: [name]). A language toggle — Bengali and English as two side-by-side text options, the active one underlined. A settings shortcut icon that navigates directly to the account settings page. This footer is always visible, even on short screen heights, because it anchors the drawer and provides the language toggle which is critical for Bengali-speaking patients.

### Hamburger Menu States

Design all of the following states explicitly: default (normal cardiac status), alert active (the patient status strip at the top becomes red, a flashing border appears on the drawer, the Call nearest ambulance quick action button is emphasized), shirt disconnected (the status strip shows disconnected state, the Test shirt connection quick action is highlighted in amber), family member view (the patient status strip shows the patient being monitored, not the logged-in user's data), and first use (recent activity feed is empty — shows three placeholder cards with instructions: "Your recent cardiac events will appear here").

---

## ECG Records Screen

### Purpose and Design Intent

The ECG Records screen is where the data lives in its most complete form. Its primary users are patients reviewing their history, family members trying to understand a past event, and patients preparing to share records with a doctor. The design must serve all three without sacrificing the depth of data that makes the screen medically useful or the clarity that makes it accessible to a non-clinical patient.

The screen uses the light theme — white and off-white surfaces — because this is a reading and analysis context. Patients and family members spend longer periods of time here than on the dashboard, and the dark dashboard theme would cause eye strain in this context.

### Layout at Desktop

Three panels side by side. The left panel (280px fixed) is the session list. The center panel (flexible) is the ECG viewer. The right panel (300px fixed) is the AI analysis panel for the selected session. At tablet, the right panel collapses behind a tab — a toggle between "ECG" and "AI Analysis" switches the center panel content. At mobile web, the panels stack vertically: session list (collapsed to a horizontal scroll strip at the top), full-width ECG viewer, AI analysis below.

### Left Panel — Session List

**Search and filter bar at the top.** A search input (filter by date, by AI tag, by lead). Below it, a filter chip row: All, Flagged, Normal, Doctor Shared, Manual Recordings. These chips are horizontally scrollable at mobile web.

**Session list items.** Each session is a card in the list. The card contains:

The date and time of the recording in DM Mono. The duration of the session (e.g. "Continuous — 8h 42m" for overnight monitoring, "Manual — 32s" for an on-demand recording). The heart rate range during the session (e.g. "58–94 BPM"). An AI status badge — green "Normal" or amber "1 anomaly detected" or red "Alert — irregular rhythm." A small waveform thumbnail: a miniaturized ECG trace for the session, approximately 60px wide and 24px tall, which gives an immediate visual sense of the session's character without opening it. A shared indicator icon if this session was ever shared with a doctor.

Sessions are grouped by date. Each date group has a divider with the date in Syne 13px medium — "Today", "Yesterday", "Monday 31 March", and so on. Within each group, sessions are listed in reverse chronological order.

Long-pressing a session (or right-clicking at desktop) opens a context menu: View, Share with doctor, Export as PDF, Export as CSV, Add note, Delete.

**Session types are visually distinct.** Continuous monitoring sessions (passively recorded throughout the day) have a gradient left border in teal. Manual 12-lead recording sessions have a left border in cardiac red. Alert-triggered recordings (automatically captured when an anomaly is detected) have a left border in amber. Doctor-requested recordings have a left border in deep blue. This color coding lets patients and family members scan the list and instantly identify what type each session is.

### Center Panel — ECG Viewer

**Session header.** At the top of the viewer, a header bar showing the selected session's date, time, duration, and type. To the right: three action buttons — Export, Share, Add note. These are the same three most important actions, always within reach without scrolling.

**The waveform viewer.** The core of the screen. At desktop, the 12-lead grid renders at full width. The grid is organized as four rows of three leads: row 1 shows Leads I, II, III; row 2 shows aVR, aVL, aVF; rows 3 and 4 show V1 through V6. Each lead strip is labeled on the left. The ECG trace is charcoal at 1px on a white background with 0.5px light gray grid lines at standard clinical intervals (1mm small squares, 5mm large squares at 25mm/s standard).

The grid lines are precisely calibrated: horizontal lines represent voltage (0.1mV per small square), vertical lines represent time (0.04s per small square at 25mm/s). These measurements must be accurate and consistent — this viewer may be used by doctors reviewing the data, not just patients.

**Viewer controls.** A toolbar above the waveform contains: a time scrubber (for sessions longer than 30 seconds, allowing navigation through the full recording), a speed toggle (25mm/s and 50mm/s), a gain control (0.5x, 1x, 2x — adjusts vertical amplitude), a filter toggle (raw signal or with baseline wander correction and high-frequency noise filtering), and an AI annotation toggle.

**AI annotation overlay.** When enabled, semi-transparent colored regions appear on the waveform. P waves are highlighted in a soft blue. QRS complexes in a muted green. T waves in a soft amber. Detected anomalies in a more opaque red region with a small AI icon above it. Hovering or tapping any annotated region opens a tooltip with a plain-language explanation: "QRS complex — this represents your heart's main pumping action. This one is within your normal range."

**For continuous monitoring sessions,** the viewer adds a timeline bar at the bottom of the viewport. The full session duration is represented as a horizontal bar. Events are marked on this timeline as small colored dots: red for alert moments, amber for anomaly moments, green for flagged-as-healthy moments, gray dots for user-logged events (medication, symptom reports). Clicking anywhere on the timeline scrubs the waveform to that moment in the session. This makes navigating an 8-hour overnight recording intuitive — the patient or family member can go directly to the 3am moment when an anomaly was flagged without scrolling through hours of ECG data.

**For manual 12-lead sessions** (30-second recordings), the full session fits in the viewer without scrubbing. The viewer shows all 12 leads simultaneously. A rhythm strip — Lead II at full width — appears below the 12-lead grid as a reference. This layout mirrors the standard clinical 12-lead ECG paper format, making the output immediately familiar to any cardiologist reviewing it.

**Playback mode.** A play button in the toolbar initiates playback — the waveform scrolls in real time from start to finish at the selected speed, as if watching it being recorded live. This is particularly useful for understanding the rhythm and its changes over time. During playback, the AI annotation overlay updates in real time, highlighting each wave as it scrolls past. Playback can be paused, scrubbed, and restarted.

**Zoom.** Horizontal pinch-to-zoom at mobile web, scroll-wheel zoom at desktop. Zooming in stretches the time axis, revealing more detail per beat. At maximum zoom, individual samples are visible. At minimum zoom, a 30-second window compresses to show the full rhythm character at a glance.

### Right Panel — AI Analysis

**Session summary.** At the top: the AI's overall assessment of the session in two to three sentences of DM Serif text. Plain language, patient-directed. "This recording was made on Monday afternoon. Your heart showed a normal sinus rhythm for most of the session, with one brief irregular period at the 12-minute mark that resolved on its own."

**Key metrics for the session.** A small grid of four metric tiles: average heart rate, heart rate range, HRV for the session, and rhythm classification. Each tile has its metric name, value in DM Mono, and a comparison to the patient's personal baseline: "+4 BPM above your afternoon average."

**Detected events list.** Every anomaly, irregular moment, or notable rhythm change detected by the AI during the session is listed here chronologically. Each event entry shows: the timestamp within the session (clicking navigates the waveform to that moment), the event type in plain language, the duration, the AI confidence level as a dot scale, and a brief explanation. For alert-triggering events, a red badge appears beside the entry. This list is the bridge between the AI analysis panel and the waveform viewer — it is the index to the session's notable moments.

**Comparison to baseline.** A small section showing how this session compares to the patient's established baseline for the same time of day and day of week. A simple two-bar comparison for heart rate and HRV, with a plain-language summary: "Your heart rate during this session was slightly higher than your usual Monday morning readings. This is within acceptable variation."

**Doctor notes field.** An input at the bottom of the AI panel where the patient or an authorized doctor can add a note to the session. Notes are timestamped and attributed by role (Patient note / Doctor note). They appear in the session's history permanently and are included in exported reports. Patients use this to add context: "I had just walked up two flights of stairs before this recording." Doctors use it to add clinical interpretation: "QRS morphology normal, no interventional concern at this time."

**Export options.** Three export buttons at the bottom of the right panel: Export as PDF (formatted clinical report including AI summary, all 12 leads, detected events, and notes), Export as CSV (raw RR interval data for clinical software), and Copy share link (7-day secure link for doctor access).

### ECG Records — Hamburger Menu Integration

When ECG Records is the active screen, the hamburger menu's recent activity feed prioritizes ECG session events. The Record ECG Now quick action is highlighted (slightly brighter than the other quick actions) because it is the most contextually relevant action on this screen. The session list filter state is remembered — if the patient had "Flagged" sessions filtered when they closed the menu, that filter is still active when the menu closes.

---

## Cardiac Diary Screen

### Purpose and Design Intent

The Cardiac Diary is the most human screen in CardiShirt. While ECG Records shows data with clinical precision, the Cardiac Diary tells the story of the patient's cardiac health over time — including the gaps. The key addition in this brief is that the diary must visually represent device wearing history, not just cardiac events. Days when the shirt was not worn are as meaningful as days when it was — they represent gaps in monitoring that could hide events, and the design must communicate this honestly without shaming the patient.

The diary is used daily by engaged patients and weekly by family members doing a general review. It must serve both use rhythms — quick morning check-ins and deeper weekly analysis sessions.

### Layout at Desktop

Two panels. The left panel (380px fixed) contains the calendar heat map and the day selector. The right panel (flexible) contains the detail view for the selected day. At tablet, the two panels stack vertically — calendar on top, detail below. At mobile web, the calendar is a compressed horizontal strip with a scroll mechanism, and the detail view takes the full screen below it.

### Left Panel — Calendar and Wearing History

**The calendar is the emotional core of this screen.** It must communicate three things simultaneously for each day: the patient's cardiac health status on that day (if the shirt was worn), whether the shirt was worn at all, and any notable events.

Each day tile is a 40px square with a 6px border radius. The tile's visual treatment depends on its wearing status:

Worn — full day (shirt connected for more than 80% of waking hours): the tile shows a solid color fill based on the AI health score. Green fill (score above 75), amber fill (score 40–74), red fill (score below 40). The tile is fully saturated and visible.

Worn — partial day (shirt connected for 40–80% of waking hours): the tile shows a diagonal split fill. The bottom-left triangle is the health score color. The top-right triangle is a medium gray. This split communicates both "some data exists" and "monitoring was incomplete."

Worn — minimal (shirt connected for less than 40% of waking hours): the tile shows a thin colored left border with a gray fill. The colored border represents the brief window of data. The gray fill represents the majority of the day without monitoring.

Not worn — shirt not connected at all: the tile is a medium gray fill with a very subtle diagonal hatching pattern in slightly darker gray. This treatment is visually distinct from healthy days without being harsh or punishing. It reads as "no data" rather than "bad."

Future days: very light gray, no fill, no border. Just the date number in muted text.

Today: a thin cardiac red ring around the tile, regardless of wearing status.

Days with alerts: a small red dot in the top-right corner of the tile, overlaid on whatever fill the day has.

Days with doctor-shared records: a small blue dot in the bottom-right corner.

Days where the patient logged a symptom: a small orange dot in the top-left corner.

**The wearing history legend.** Below the calendar, a horizontal legend explaining the five wearing status tile treatments: Full day, Partial, Minimal, Not worn, Future. This legend is compact — one line of small tiles with labels. It must always be visible when the calendar is visible.

**The wearing streak tracker.** Below the legend, the current wearing streak is displayed: "Current streak — 11 days" with a small flame-like icon in cardiac red. Below it: the personal best streak: "Best — 23 days." This gamification element is deliberate and meaningful — consistent shirt wearing is clinically important, and positive reinforcement encourages it. The streak resets if the shirt is not worn for a full calendar day. Partial wearing days count toward the streak at half value — a patient who wore the shirt for six hours of the day maintains their streak but sees a visual indicator that today was a partial day.

**Monthly navigation.** Above the calendar, a month header with left and right chevrons to navigate months. A "Today" button snaps back to the current month and selects today. A "Jump to date" link opens a date picker for navigating to specific historical dates. Patients with a long history should be able to access records from 12 or more months ago.

**Month summary strip.** Below the streak tracker, a compact summary of the displayed month: total days worn (full or partial), total alert events, average health score for worn days, and HRV trend (up, down, flat) for the month. Four metric tiles in a horizontal row. This gives immediate context for the month as a whole before the patient drills into a specific day.

**Wearing pattern insight.** A small AI insight card below the month summary that appears when the AI detects a meaningful wearing pattern. Examples: "You tend not to wear CardiShirt on Sundays. Mondays show more anomalies than other days — this correlation may be worth discussing with your doctor." Or: "You've worn CardiShirt every day this week. Your data consistency is helping us build a more accurate personal baseline." This card is generated weekly and updates on Mondays.

### Right Panel — Day Detail View

Selecting any day with data (fully or partially worn) loads the day detail view in the right panel. Selecting a not-worn day loads a special state described below.

**Day detail header.** The selected date in large DM Serif. The day of week. A wearing status badge — "Worn 9h 20m" or "Partial — 4h 12m" or "Not worn." If the day has alerts, an alert count badge in red. If the day has doctor-shared records, a blue badge.

**The AI narrative.** Immediately below the header, the AI-generated daily narrative in DM Serif. This is the most prominent element in the detail view — a paragraph of warm, personal, plain-language description of the patient's cardiac day. It reads like a journal entry written by a knowledgeable companion, not a medical report. Length: three to five sentences depending on how eventful the day was.

For a normal day: "Tuesday was a quiet day for your heart. Your rhythm stayed steady through your morning routine, and your resting rate settled into your usual range by mid-afternoon. Your HRV reading this evening was one of your better ones this month — a good sign."

For a day with anomalies: "Thursday had one moment worth noting. At around 2:15 in the afternoon your heart showed an irregular pattern for about 40 seconds before returning to normal. The rest of the day was calm, and our AI model considers the event mild given your overall pattern. We've logged it for your doctor's review."

For a partial wearing day: "We have about four hours of data from this Wednesday morning, from when you woke up until mid-morning. Your heart showed a normal rhythm throughout this window. We don't have data for the rest of the day, so our assessment covers only this period."

The narrative has a "Read in Bengali" / "Read in English" toggle if the patient's language preference differs from the narrative language. Both versions are generated simultaneously.

**The 24-hour heart rate chart.** Below the narrative, a full-width area chart showing the patient's heart rate over the full 24 hours of the selected day. The x-axis is time (midnight to midnight). The y-axis is heart rate in BPM. The patient's baseline range for this time of day appears as a faint shaded band across the chart. The actual heart rate line is charcoal where it is within the baseline range, amber where it is above, and blue where it is below the resting range (indicating deep rest or sleep).

Where the shirt was not worn, the chart shows a gray hatched zone rather than a flat line — communicating "no data here" rather than "heart rate was zero." This is the critical difference from many health apps that simply omit non-wearing periods. The hatched zone is honest and visually distinct.

Where the shirt was partially worn, the chart shows the data for the wearing period in full color and the non-wearing periods in the hatched gray. The boundary between wearing and not-wearing is marked with a small vertical line.

User-logged events from the check-in and symptom log appear as vertical markers on the chart: a small icon at the appropriate time with a tooltip on hover — "Medication logged", "Symptom: chest tightness", "Check-in: feeling tired."

Tapping any point on the chart (at mobile web) or hovering (at desktop) shows a tooltip with the exact time, exact heart rate, and whether the AI classified that moment as normal, watch, or alert.

**HRV summary for the day.** Below the heart rate chart, a compact two-panel row. Left: the RMSSD value for the day in DM Mono large, with a comparison to the patient's 30-day average: "+6ms above average — good variability." Right: a small Poincaré scatter plot for the day's data — distinctive and medically meaningful, small enough to fit in the panel without overwhelming it. A "what does this mean?" link expands a plain-language explanation of HRV and what the day's values suggest.

**Events timeline.** Below the HRV row, a chronological list of notable events for the day. This combines AI-detected cardiac events, patient-logged events, and device events into a single unified timeline. Each event is a row with a timestamp, a color-coded category icon, a brief description, and an action — "View ECG clip" for cardiac events, "Edit note" for patient-logged events, "View details" for device events.

Cardiac events (AI detected): a heart icon in the appropriate status color. Clicking "View ECG clip" opens the relevant session at that timestamp in the ECG Records viewer, with the waveform pre-scrolled to the moment.

Patient-logged events (symptoms, medications, check-in responses): a person icon in teal. Clicking "Edit note" opens the quick note editor.

Device events (shirt connected, disconnected, low battery, lead quality changes): a shirt icon in gray. These events are important context for understanding why data gaps exist in the heart rate chart.

**AI wearing suggestion.** If the selected day shows a not-worn or partial-wearing status, the events timeline is replaced by a gentle AI suggestion section. For a not-worn day: the section shows what data CardiShirt would have captured — drawing from patterns on similar days — and gently communicates what might have been missed: "On most Saturdays like this one, we capture around 7 hours of resting data and 2 hours of active data. Without the shirt on this day, we have no record of your heart's activity. If you had any symptoms on this day, consider mentioning them to your doctor." This is informative, not scolding.

For a partial-wearing day: the suggestion shows the gap in the chart and notes the wearing window: "CardiShirt was connected from 7:14 AM to 11:38 AM. We captured your morning routine and the start of your day. The afternoon and evening have no monitoring data." Below this, a short note on the importance of continuous monitoring, phrased as encouragement: "The more consistently CardiShirt is worn, the better our AI can learn your patterns and catch early warning signs."

**Doctor notes for the day.** At the bottom of the detail view, the same doctor notes field from the ECG Records screen — any note the patient or doctor has attached to this calendar day. These are distinct from notes attached to specific ECG sessions; day-level notes capture observations that apply to the full day rather than a specific recording.

**Not-worn day state.** When the patient selects a day with no wearing data at all, the right panel shows a distinct state. The header displays the date with a "Not worn" badge in gray. Where the narrative would be: a short AI-generated note about what this gap means in context — for example, if the previous five days were also not worn, the note is more concerned in tone; if the patient has a strong streak and this is an isolated gap, the note is lighter. Below it: the patient's schedule from the check-in data if they completed a check-in on this day (possible to complete a check-in without wearing the shirt). Then the AI wearing suggestion described above. Then a "Log a note for this day" option, allowing the patient to add context retroactively — "Was traveling, forgot the shirt" — which the AI will reference in future pattern analysis.

**Navigation between days.** At the very bottom of the detail view, left and right chevron buttons navigate to the previous and next day with data, skipping over not-worn days by default. A toggle switches between "skip non-wearing days" and "show all days including gaps." This toggle defaults to "skip non-wearing days" for patients who want to review their data efficiently, and "show all days" for patients who are doing a full wearing consistency review.

### Cardiac Diary — Hamburger Menu Integration

When the Cardiac Diary is the active screen, the hamburger menu's navigation badge for Cardiac Diary shows the wearing streak: "Day 14" updates in real time. The recent activity feed in the hamburger prioritizes diary-relevant events — streak milestones, notable diary days, days where the AI added a wearing suggestion. The Log a symptom quick action is highlighted on this screen because symptom logging is a core diary feature. The session filter in the ECG Records navigation badge is irrelevant in this context, so it shows the default "ECG Records" label without a count badge when the diary is active.

---

## Shared Design Considerations Across Both Screens

**Empty states.** Both screens need carefully designed empty states for new patients. ECG Records with no recordings yet shows a centered illustration (the CardiShirt ECG motif drawing itself in a loop animation) with text: "Your ECG recordings will appear here. Wear CardiShirt through the day and recordings will be captured automatically." The Cardiac Diary with no history shows the calendar with all future-day tile styling and a gentle prompt: "Your cardiac diary begins when you first wear CardiShirt. Connect the shirt to start your story."

**Loading states.** Both screens load data progressively. The session list and calendar heat map load first (skeleton tiles for the calendar, skeleton list items for the session list). The detail views load second. The AI-generated narrative and analysis load last, with a typewriter animation indicating generation in progress. This progressive loading keeps the screen feeling responsive even on slow connections.

**Offline behavior.** Both screens must function with previously loaded data when the patient is offline. Cached session data and diary data should be available for browsing without an internet connection. Actions that require connectivity — generating new AI analysis, sharing with doctor, syncing new ECG data — are gracefully disabled with a small offline badge rather than producing errors.

**Bengali language.** All AI-generated narrative text must be available in Bengali. Date formats must respect the Bengali calendar conventions when displaying in Bengali mode. DM Mono is used for all numeric values regardless of language setting — numerals are universal and switching to Bengali numeral forms would reduce legibility for medical data.

**Printing and export.** Both screens offer a print-optimized view — a clean white layout with all relevant data for the selected session (ECG Records) or selected month (Cardiac Diary) formatted for A4 paper. The print layout omits navigation, interactive controls, and dark surfaces. It uses a clean typographic layout designed to be handed to a doctor. The print command is accessible through a printer icon in the top-right of each screen, as well as through the right-click context menu on desktop.

---

This brief covers ECG Records and Cardiac Diary in full and supersedes any placeholder specifications from the original brief for these two screens. Priority order for the design sprint: Cardiac Diary calendar component with all tile states, the day detail view with the wearing history chart, ECG Records 12-lead viewer, and then the hamburger menu panel in full.
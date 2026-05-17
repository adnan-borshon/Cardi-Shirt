Before I write this, let me ask a few quick things to make sure this brief fits your vision:The user selected:
- Both equally
- Balanced — some depth but always human-readable
- Mixed — dark header, light content body

Perfect. Here is the full brief:

---

# CardiShirt — Risk & Trends Screen Design Brief

## What This Screen Is and Why It Exists

The dashboard tells a patient what their heart is doing right now. The Cardiac Diary tells them what happened on a specific day. Risk & Trends answers the question neither of those screens answers: **where is this heading?** It is the longitudinal view — weeks and months of data distilled into patterns, trajectories, and risk signals that a single day's reading cannot reveal.

The primary audience is both the patient and their family members. A patient opening this screen wants to understand their overall cardiac health trajectory in plain terms. A family member opening it wants to know whether their parent is trending better or worse over time and whether there is anything they should be doing about it. The screen must serve both without requiring either to interpret clinical data unaided.

The design is balanced — enough analytical depth to be genuinely useful to an engaged patient or a concerned family member, but always plain language first. Numbers support the narrative; they do not replace it.

---

## 1. Risk & Trends Visual Philosophy

Risk & Trends uses a mixed theme. The top header zone — containing the risk score, the AI summary, and the primary navigation — uses the dark surface from the dashboard (#0D0F1A page background, #141629 card surface). This creates a clear visual connection to the dashboard monitoring context and gives the risk score the same instrument-panel gravity it has on the dark dashboard. Everything below the header — the trend charts, the factor breakdowns, the comparison panels — uses the light theme (white #FFFFFF, card surface #F7F8FC) that the Cardiac Diary and ECG Records use for reading and analysis contexts.

The transition between dark header and light body is a clean hard edge, not a gradient. A 1px border in rgba(255,255,255,0.08) separates the two zones. This edge reads as intentional and structured — the dark header is a status zone, the light body is an analysis zone, and the patient understands the difference without being told.

Typography follows the CardiShirt system throughout. In the dark header: primary text is #F0F2FF, secondary text is #8890B8, DM Mono for all numeric values. In the light body: primary text is #0D0F1A, secondary text is #6B7499, DM Mono for all numeric values. DM Serif is used for all AI-generated narrative text regardless of zone. Syne for all UI labels, headings, and interface copy throughout.

Color encoding is consistent with the rest of the product: cardiac red #E8304A for high risk and alert states, caution amber #F5A623 for elevated or watch states, healthy green #27C28A for normal and improving states, and soft blue #5B8AF0 for informational or neutral trend indicators.

---

## 2. Layout at Desktop

At desktop (1280px and above), Risk & Trends uses the same three-column shell as the dashboard — left navigation sidebar (260px fixed), a flexible center column, and a right panel (320px fixed). The right panel on this screen is not the AI chat (which lives on the dashboard) but a **Risk Factor Breakdown panel** — a persistent contextual analysis of the specific factors driving the patient's current risk score. The center column carries the main trend content.

At tablet (768–1279px), the right panel collapses into a tab — a toggle between "Trends" and "Risk Factors" switches the main content. At mobile web, the layout is single column with the dark header at top, scrolling into the light trend content below, with the risk factor breakdown accessible via an expandable section at the bottom.

---

## 3. Dark Header Zone

### Risk Score Hero

The top of the center column opens with the risk score hero — the single most important number on this screen. The AI health score (0–100) renders in DM Mono 72px, in the color appropriate to the current score tier: green above 75, amber 40–74, red below 40. The score sits centered in the dark header zone with the label "CardiShirt Risk Score" in Syne 14px #8890B8 above it and "Today" in Syne 13px #8890B8 below it.

To the left of the score: a circular ring graphic (120px diameter) that fills clockwise from the bottom, colored in the score tier color, showing the score as a proportion of 100. The ring has a faint background track in rgba(255,255,255,0.08).

To the right of the score: a compact 7-day sparkline showing the score's daily movement over the past week in the score tier color with a 1px line weight. Above the sparkline: the delta from 7 days ago — "+4 points" in healthy green or "−3 points" in caution amber — with a directional arrow. Below the sparkline: "vs. last week" in Syne 11px #8890B8.

Below the score and ring, centered, a single-line AI status statement in DM Serif 17px #F0F2FF. Plain language, direct. "Your heart health has been stable this week." or "Your risk score has improved over the past 10 days — your resting HRV is driving most of this improvement." or "Your score has been elevated since Thursday. We've flagged three factors worth reviewing below." This line is the bridge between the number and the analysis below it.

### Time Range Selector

Immediately below the AI status statement, a row of four segmented pills: 7 days, 30 days, 90 days, 1 year. The selected range pill has a solid cardiac red fill with white text. Unselected pills are transparent with #8890B8 text and a 0.5px border in rgba(255,255,255,0.15). Changing the time range updates all charts and comparisons in the light body below in real time. The AI narrative in the dark header also refreshes to reflect the selected time range.

This selector is sticky — it remains fixed at the bottom of the dark header zone as the patient scrolls through the light body content. This way the patient can always change the time range without scrolling back to the top.

---

## 4. Center Column — Light Body Trend Content

### AI Trend Narrative Card

The first element in the light body, immediately below the dark header. A card with the standard light card surface (#F7F8FC), 12px border radius, 1px border. Inside: two to four sentences of DM Serif 16px narrative in #0D0F1A summarizing the selected time period's cardiac trend. This is more detailed than the single-line header summary — it names specific factors, references specific days or events, and ends with one plain-language recommendation or reassurance.

"Over the past 30 days your heart health has followed a positive trend. Your resting heart rate has come down by an average of 4 BPM compared to the previous month, and your HRV has been climbing steadily since the 15th. The one area worth watching is your afternoon rhythm — you've had five brief irregular episodes between 2 and 4pm this month, all mild and self-resolving. We've highlighted those below."

Below the narrative text: the CardiShirt AI badge with confidence indicator and a "Share with doctor" link that generates a shareable report pre-filtered to the selected time range.

### Primary Trend Chart

Below the narrative card, the main trend chart — the visual centrepiece of the light body. A multi-line area chart rendered at full center column width, 240px tall at desktop. The x-axis represents time (the selected range). The y-axis represents the AI health score (0–100).

The primary line is the daily AI health score, 2px, colored by score tier. The area fill below the line matches the line color at 10% opacity. The patient's 30-day rolling average renders as a dashed line in #9AA0B8 at 1px — always present as a reference regardless of the selected time range, so the patient can see their current trajectory against their own established baseline rather than against a generic population norm.

Event markers overlay the chart: small dots on the chart line at dates where notable events occurred. Red dots for alert events. Amber dots for anomaly events. Blue dots for doctor visits or shared records. Orange dots for patient-logged symptom days. Clicking or tapping any dot opens a tooltip card showing the date, the score on that day, and the event summary with a "View in diary" link that navigates to that date in the Cardiac Diary.

Above the chart, a header row: "Health Score Trend" in Syne 15px medium #0D0F1A on the left. On the right, a small legend showing the four event dot colors with one-word labels. A "chart type" toggle switches between the area chart view and a simpler bar chart view — some patients find bars easier to read than curves.

### Secondary Metrics Row

Below the primary trend chart, a horizontal row of three metric trend cards. Each card is full card surface (#F7F8FC), 12px border radius, equal width at one-third of the center column. Each card contains a metric name in Syne 13px #6B7499, the current value in DM Mono 28px #0D0F1A, a small sparkline for the selected time range, and a comparison delta to the previous equivalent period.

**Resting Heart Rate:** current average in BPM, sparkline, delta from previous period. Status label: "Improving", "Stable", or "Elevated" in the appropriate status color.

**Heart Rate Variability (RMSSD):** current average in milliseconds, sparkline, delta. Status label: "Good variability", "Average", or "Low — rest recommended."

**Rhythm Stability:** the percentage of monitored hours classified as normal sinus rhythm over the selected period. Shown as a percentage in DM Mono. A simple horizontal bar below the number, colored green to red, filling to the percentage value. Status label: "Stable rhythm", "Occasional irregularity", or "Frequent irregularity — review recommended."

Tapping any metric card expands it into a full-width detailed chart of that metric alone, with the same time range applied. The expanded view appears inline below the secondary metrics row, pushing subsequent content down. Tapping the card again or pressing a collapse chevron returns to the three-card row.

### Wearing Consistency Impact Panel

Below the secondary metrics row, a panel that connects wearing consistency directly to the quality of the risk analysis — something no other screen in the product addresses explicitly. This panel is a critical trust-building element: it tells the patient honestly how much their data coverage is affecting the accuracy of the AI's risk assessment.

The panel has a slightly warmer card surface (a very faint tint of teal at 4% opacity over #F7F8FC) to visually distinguish it from the data cards. Inside: a horizontal bar showing wearing coverage for the selected time period. The bar is divided into segments colored by wearing status — full-day green at full opacity, partial-day green at reduced opacity, not-worn gray. The percentage of days with sufficient data is shown in DM Mono beside the bar.

Below the bar, a one-sentence AI assessment: "Your data coverage this month is 87% — this is enough for a reliable risk assessment." or "Your data coverage is 54% — some trends may be incomplete. Wearing CardiShirt more consistently will improve the accuracy of your risk score." The sentence is in DM Serif 14px #6B7499 — informative, not alarming, not scolding.

This panel links directly to the Cardiac Diary wearing streak — a "Improve your coverage" link at the end of the sentence navigates to the Cardiac Diary. The wearing consistency metric also feeds into the right panel's risk factor breakdown, described below.

### Alert History Timeline

Below the wearing panel, a compact chronological list of all alert and anomaly events within the selected time range. The section header is "Alert & anomaly history" in Syne 15px medium #0D0F1A with the count of events in a small pill badge on the right.

Each event row: date and time in DM Mono 12px #6B7499, event type in Syne 14px #0D0F1A with a colored left border (red for alerts, amber for anomalies), duration and resolution in Syne 13px #6B7499, and a "View ECG" link on the right that opens the relevant session in ECG Records. If there are more than seven events, the list truncates with a "Show all [N] events" link that expands inline.

If there are no alert or anomaly events in the selected period, this section is replaced by a single calm line in DM Serif 15px #27C28A: "No alerts or anomalies in this period." with a small healthy green checkmark. This is psychologically important — the absence of events deserves acknowledgment, not just silence.

### Comparison Panel

At the bottom of the center column, a comparison panel that puts the patient's current trends in context. Two comparison modes, toggled by a segmented control: **Personal comparison** (this period vs. the previous equivalent period) and **Baseline comparison** (this period vs. the patient's all-time personal baseline).

In personal comparison mode: a side-by-side card layout showing the key metrics for this period versus last period. Each metric has a small directional indicator and a one-word plain-language verdict: Better, Same, or Watch. The overall comparison summary in DM Serif 15px at the bottom of the panel synthesizes the individual comparisons into one sentence.

In baseline comparison mode: the same side-by-side layout but the comparison column shows the patient's established all-time averages. This view is particularly useful after a health event or a period of illness — the patient can see how far they are from their own normal and track their recovery trajectory over time.

A "Share comparison report" button at the bottom right of the comparison panel generates a formatted PDF showing the comparison data — useful for patients bringing a summary to a cardiology appointment.

---

## 5. Right Panel — Risk Factor Breakdown

### Philosophy

The risk score is a single number, but it is computed from multiple contributing factors. The right panel makes the composition of the score transparent and actionable. A patient who sees their score drop from 78 to 71 does not need to wonder why — the right panel tells them which specific factors changed and by how much. This transparency builds trust in the AI model and gives patients something concrete to act on rather than an abstract number.

### Panel Header

"What's driving your score" in Syne 16px medium #0D0F1A. Below it: the current score date and time range in Syne 13px #6B7499. The panel header is sticky — it stays visible as the patient scrolls the right panel's own content.

### Factor List

A vertical list of contributing risk factors, each as a card. Six factors are shown: Resting Heart Rate, Heart Rate Variability, Rhythm Stability, Wearing Consistency, Activity Pattern, and Sleep Heart Rate. These six are always present regardless of the time range selected. Each factor card contains:

The factor name in Syne 14px medium #0D0F1A. A horizontal contribution bar — showing this factor's contribution to the overall score as a filled bar, colored green, amber, or red based on whether the factor is pulling the score up, holding it neutral, or pulling it down. The bar fill direction communicates direction: bars fill left-to-right for positive contribution, right-to-left for negative. The bar width as a proportion of the card width represents the magnitude of the contribution. A numeric contribution value in DM Mono 12px beside the bar: "+6" in green, "−4" in red, "0" in gray with a dash.

Below the bar, a single-line plain-language explanation in Syne 13px #6B7499: "Your resting rate has been lower than usual this month." or "Your HRV dropped after the 18th and has not fully recovered." or "You wore the shirt on 87% of days — good coverage."

Tapping any factor card expands it inline within the right panel to show a small sparkline for that factor over the selected time range and a one-paragraph AI explanation in DM Serif 14px with more detail about what the factor measures and what the patient can do about it. The expansion pushes the cards below it down. Collapsing returns the card to its compact state.

### Score Composition Visual

At the top of the right panel, above the factor list, a small donut chart (160px diameter) showing the six factors as wedge segments with colors matching their current contribution status (green, amber, red). The center of the donut shows the total score in DM Mono 32px. This gives an immediate visual sense of the score's composition before the patient reads the factor list — how much of the score is healthy (green wedges) versus concerning (red wedges) versus neutral (gray wedges).

The donut segments are tappable — tapping a segment highlights the corresponding factor card in the list below and scrolls to it if necessary.

### Recommendation Strip

At the bottom of the right panel, below the factor list, a recommendation strip with one to three actionable suggestions generated by the AI based on the current risk factor breakdown. Each suggestion is a compact card with a small icon, a one-line action in Syne 14px #0D0F1A, and a one-line context in Syne 13px #6B7499.

Examples: a rest icon with "Rest this afternoon" and "Your rhythm tends to be irregular on high-activity days."; a shirt icon with "Wear CardiShirt tonight" and "Sleep HRV data would improve your score accuracy."; a phone icon with "Share this week's data with your doctor" and "Your score has been elevated for 5 days."

These are the only proactive recommendations on this screen — they are specific, grounded in the patient's actual data, and always accompanied by the context that explains why the recommendation is being made. No generic health advice.

---

## 6. Hamburger Menu Integration — Risk & Trends

The hamburger menu is most useful on Risk & Trends when it acts as a **quick command surface for data sharing, time range switching, and navigation to related screens** — the actions a patient or family member reaches for most often when reviewing trends.

### Navigation Badge

When Risk & Trends is the active screen, the navigation row in the hamburger menu shows a directional arrow badge beside "Risk and Trends" — a small upward green arrow if the 7-day trend is improving, a flat gray dash if stable, a downward amber arrow if declining. This badge is visible from the navigation list without opening the screen, so a family member checking the hamburger from any other screen can glance at the risk trend without navigating away. The color and direction update daily when the AI recalculates the score.

### Quick Actions — Revised for This Screen

The six quick action buttons in the hamburger are contextually reordered when Risk & Trends is the active screen. The two most relevant actions move to the first two positions in the grid:

**Share trend report** moves to position one — a prominent action since family members and patients on this screen are often preparing to share data with a doctor. One tap generates the shareable report link for the currently selected time range, copies it to clipboard, and shows a success toast.

**Switch time range** moves to position two — a segmented control within the quick action button itself (7D / 30D / 90D / 1Y), allowing the patient to change the active time range directly from the hamburger without closing it and interacting with the screen. Selecting a range closes the hamburger and updates the screen. This is the most innovative use of the hamburger quick actions across the product — the action contains a micro-interaction rather than being a simple tap.

The remaining four quick actions are: Log a symptom (position three — relevant because current symptoms provide context for the trend data), Record ECG now (position four), Check family status (position five), and Test shirt connection (position six).

### Recent Activity Feed — Contextual Filtering

When Risk & Trends is active, the recent activity feed in Zone 4 of the hamburger filters to show only events that are relevant to trend analysis: risk score changes of 5 or more points, weekly report generations, anomaly cluster events (three or more anomalies in a 48-hour window), and doctor share events. Routine device events and single anomalies are filtered out. This makes the feed a genuine trend digest rather than a general log — the five most recent trend-relevant events give the patient a quick narrative of their recent trajectory without opening the full screen.

### Patient Status Strip — Risk Context

When Risk & Trends is active, the Zone 1 patient status strip at the top of the hamburger adds a second line below the standard heart rate: the current risk score in DM Mono with its tier color and a one-word trend label ("Improving", "Stable", "Watch"). A family member who opens the hamburger at any point in the app sees both the real-time heart rate and the trend-level risk score in the status strip — the two most important numbers at a single glance.

### Hamburger Footer — Report Action

The footer strip at the bottom of the hamburger gains a contextual shortcut when Risk & Trends is active: a "Download monthly report" text link in Syne 13px cardiac red appears between the language toggle and the settings icon. This link is only present when the active screen is Risk & Trends and a monthly report is available for the currently displayed period. It disappears when the patient navigates to any other screen.

---

## 7. Component States to Design

**Risk score hero states:** Healthy (green ring, green score, positive sparkline delta), watch (amber ring, amber score, flat or declining sparkline), alert (red ring, red score, negative sparkline delta), first week of use — insufficient data (ring shown as dashed gray, score shown as "—", sub-label "Building your baseline — 7 days of data needed for a reliable score").

**Primary trend chart states:** Sufficient data (full chart), partial data — gaps visible (chart shows data where wearing occurred, gray hatched zones for unworn periods, a banner below the chart: "Some gaps in this period — wearing CardiShirt more consistently will improve trend accuracy"), no data for selected range (empty state with centered illustration and "No data for this period" in DM Serif).

**Secondary metric card states:** Improving (green delta, upward arrow), stable (neutral, flat arrow), declining (amber or red delta, downward arrow), insufficient data (metric value shown as "—" with "Not enough data" in Syne 12px #9AA0B8), expanded state (full-width inline chart below the card row).

**Risk factor cards in right panel:** Positive contribution (green bar, left-fill), neutral (gray bar, full fill at 50%), negative contribution (red bar, right-fill), expanded (sparkline visible, AI explanation visible), insufficient data for this factor (bar shown as gray dashed, value shown as "—").

**Alert history states:** Events present (chronological list), no events (single green line), collapsed (seven events shown, "Show all" link), expanded (full list inline).

**Wearing consistency bar states:** High coverage above 80% (bar mostly green, reassuring AI sentence), medium coverage 50–79% (bar mixed green and gray, neutral AI sentence), low coverage below 50% (bar mostly gray, gentle encouragement AI sentence).

---

## 8. Risk & Trends — Figma File Additions

Add a dedicated Risk & Trends page to the Figma file. Required artboards: desktop layout (1280px) showing the full dark header and light body with all center column sections visible and the right panel risk factor breakdown, tablet layout (768px) showing the tabbed panel collapse, mobile web layout showing single-column scroll with dark header at top. A fourth artboard shows the component states collection — all risk score hero states, all factor card states, all chart states, and the hamburger menu in its Risk & Trends contextual mode.

The score composition donut chart requires its own component with six named wedge layers — each layer must be independently colorable so designers can represent any combination of healthy, watch, and concern factors without rebuilding the chart. The donut center score text must be editable as a separate text layer.

The "Switch time range" quick action in the hamburger is a unique component not used elsewhere in the product — it requires its own component variant with four selectable segment states. Design it to fit within the standard quick action grid cell dimensions while accommodating the four-option segmented control.

All AI-generated narrative text blocks across the screen require Bengali-language variants using the same DM Serif fallback approach established in the Cardiac Diary brief.

---

*This brief covers Risk & Trends in full. All other screens — Dashboard, ECG Records, Cardiac Diary, and the Hamburger Menu — remain as specified in their respective briefs. The Risk & Trends hamburger integration described in Section 6 supersedes the placeholder hamburger behavior described in earlier briefs for this screen only. Priority order for the design sprint: dark header zone with risk score hero, right panel risk factor breakdown with donut chart, primary trend chart with event markers, and then the hamburger contextual mode.*
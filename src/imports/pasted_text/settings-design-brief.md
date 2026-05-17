Before I write this, a few quick questions:The user selected:
- Both equally
- Light theme like Cardiac Diary
- Left sidebar nav — click a category, content loads on the right

Perfect. Here is the full brief:

---

# CardiShirt — Settings Screen Design Brief

## What This Screen Is and Why It Exists

Settings is the least glamorous screen in CardiShirt and the most consequential. A misconfigured alert threshold could mean a critical event goes unnoticed. A wrong language setting means a patient cannot read their own data. An untested shirt connection means hours of monitoring data that never existed. The Settings screen must be designed with the same care as the dashboard — not as an afterthought, but as a screen that directly affects patient safety.

The screen serves both the patient and a caregiver or family member who may be helping configure the device on behalf of an elderly or less technically confident patient. Every section must be readable by a non-technical user. Every action must have enough context that the patient understands what they are changing and why it matters. And the shirt testing feature — the most tactile, most immediately reassuring thing CardiShirt can offer a new or uncertain patient — must be designed as a first-class experience, not a buried diagnostic menu.

---

## 1. Settings Visual Philosophy

Settings uses the light theme throughout — white base (#FFFFFF), off-white card surfaces (#F7F8FC), 1px card borders at rgba(0,0,0,0.08), 12px border radius on all cards. This is a reading and configuration context. Patients spend deliberate, unhurried time here. The light theme is correct.

Within the light theme, the shirt testing section breaks this rule intentionally. When the test is active — when the patient is wearing the shirt and watching it come alive — the test panel enters a focused dark mode consistent with the ECG live canvas on the dashboard (#0D0F1A background, luminous lead indicators). This momentary dark-mode island within the light settings screen signals that this is not a form field — it is a live instrument reading. The transition in and out of the test panel's dark mode is a 200ms crossfade, consistent with the page transition behavior established in the dashboard brief.

Typography follows the full CardiShirt system throughout. Section headers in Syne 16px medium. Setting labels in Syne 14px medium. Setting descriptions in Syne 13px #6B7499. Values and inputs use the standard form treatment. DM Mono for all numeric inputs — thresholds, timer values, PIN entries. DM Serif is used sparingly — only for the shirt test narrative and any AI-generated profile summaries.

---

## 2. Layout at Desktop

At desktop (1280px and above), Settings uses a two-panel layout within the standard three-column shell. The left navigation sidebar (260px fixed) carries the standard product navigation. Inside the main content area, a secondary left settings category nav (220px fixed) lists all settings categories as a vertical menu. The right content area (flexible) loads the selected category's settings. This creates a clear two-level navigation — primary product nav on the far left, settings category nav in the center-left, settings content on the right.

At tablet (768–1279px), the settings category nav collapses into a horizontal tab strip at the top of the content area. At mobile web, the category nav becomes a full-screen list — tapping a category navigates to its settings as a full-screen view with a back button returning to the category list.

---

## 3. Settings Category Navigation

The settings category nav lists eight categories as tappable rows. Each row: a 20px icon on the left in the category's accent color, the category name in Syne 14px medium #0D0F1A, and a contextual badge on the right when relevant. The active category row has a cardiac red left border (3px) and a very subtle cardiac red tint on its background at 5% opacity.

The eight categories in order:

**Profile & Account** — person icon in #5B8AF0. Badge: a red dot if the profile is incomplete.

**CardiShirt Device** — shirt icon in cardiac red #E8304A. Badge: a green dot if connected, a red dot if disconnected or needs attention. This category contains the shirt test feature.

**Alerts & Notifications** — bell icon in caution amber #F5A623. Badge: "!" if any alert threshold is at a non-default value that may need review.

**AI & Analysis** — a small neural node icon in healthy green #27C28A. No badge in standard state.

**Display & Language** — a globe icon in #5B8AF0. Badge: shows the current language as a two-letter code ("EN" or "BN") as a small gray pill — always visible so the patient can find the language setting without opening the category.

**Privacy & Data** — a lock icon in #6B7499. Badge: a blue dot if any data sharing permission was recently changed.

**Emergency Configuration** — a shield icon in cardiac red. Badge: a green checkmark if fully configured, a red warning if critical fields are missing. This category links to the same emergency configuration content as the Family Circle screen but in a settings-appropriate layout — the patient can reach it from either place.

**About & Support** — an information icon in #9AA0B8. No badge.

A thin horizontal divider separates the first seven categories from About & Support, which is a utility category rather than a configuration category.

---

## 4. Profile & Account

The profile category contains four sections stacked vertically in the content area.

### Patient Profile

A card with the patient's avatar (80px circle, photo or initial), name in Syne 20px medium, age, and their CardiShirt risk tier badge. An "Edit profile" button opens an inline edit form below the profile card — name fields, date of birth, blood type, known conditions (checkboxes: hypertension, diabetes, previous cardiac event, pacemaker, other). These fields feed directly into the AI model as static context — a patient with a previous cardiac event has a different baseline than one without. A note below the known conditions field in DM Serif 13px #6B7499: "This information helps CardiShirt AI personalize your risk analysis. It is never shared without your permission."

### Account Details

Phone number (primary identifier), email address, and account creation date. Edit buttons beside phone and email open inline verification flows — changing either requires a one-time code confirmation.

### Caregiver Access

A toggle labeled "Allow caregiver configuration" — when on, a designated family member with caregiver role can edit settings on behalf of the patient. The designated caregiver's name and avatar appear below the toggle when active. A "Change caregiver" link opens the family member selector. This toggle is what makes the dual patient/caregiver use case work — the patient consciously delegates configuration access rather than every family member having it by default.

### Danger Zone

At the bottom of the profile category, separated by a full-width divider, a minimal danger zone. "Delete account" and "Export all my data" as text links in #E8304A and #5B8AF0 respectively. No buttons — text links only, requiring deliberate intent. Tapping either opens a confirmation overlay with a plain-language explanation of what the action does and a required typed confirmation ("DELETE" or "EXPORT") before proceeding.

---

## 5. CardiShirt Device — Including Full Shirt Test Specification

This is the most important category in Settings and the one that requires the most careful design. It has four sections: Device Status, Shirt Test, Lead Configuration, and Firmware & Maintenance.

### Device Status

A card at the top showing the currently paired shirt. Shirt model name in Syne 15px medium. Serial number in DM Mono 13px #6B7499. Pairing status — "Paired and connected" in healthy green or "Paired — not connected" in gray. Battery level as a visual battery icon with percentage in DM Mono. Last successful sync timestamp in DM Mono 12px. Signal strength per lead as a compact mini-grid described below in the shirt test section.

A "Pair a new shirt" button at the bottom of this card opens the pairing flow — a step-by-step guided overlay for connecting a new device.

### Shirt Test — Full Specification

The shirt test is the centrepiece of the Device category and one of the most important features in the entire product. A patient who has just received their CardiShirt, or a caregiver helping set it up, needs to know with absolute confidence that the shirt is working correctly before trusting it with someone's cardiac monitoring. The test must be thorough, visual, reassuring, and designed for a non-technical user.

**Test entry card.** In its resting state before a test is initiated, the shirt test section is a card with the header "Test your CardiShirt" in Syne 16px medium #0D0F1A. Below the header: a one-paragraph description in Syne 14px #6B7499 — "Run a quick test to confirm your shirt is reading correctly. Put the shirt on, sit still for 30 seconds, and CardiShirt will check all leads and confirm your heart signal is coming through clearly. This takes about 2 minutes." A single "Start shirt test" button in cardiac red, full width of the card. No other controls.

**Test active state — dark mode panel.** When the patient taps "Start shirt test," the card transitions into the dark mode test panel with the 200ms crossfade. The panel background becomes #0D0F1A. The card expands to full content width and increases in height to accommodate the test UI. Everything outside this card dims slightly — a subtle 30% opacity overlay on the rest of the settings content — drawing the patient's full attention to the test.

The dark test panel contains:

**Instruction strip at the top.** A step indicator showing three steps: "Put on the shirt", "Sit still", "Review results." The current step is highlighted in cardiac red. The step label in Syne 15px #F0F2FF. A brief instruction below the current step in DM Serif 14px #8890B8 — warm, direct, like a person talking them through it. Step one: "Make sure all the electrode patches are flat against your skin and the shirt is snug but comfortable." Step two: "Stay seated and breathe normally. We're reading all 12 leads now." Step three: "Here's what we found."

**12-Lead Grid.** The visual heart of the test. A 4×3 grid of lead indicators, each representing one of the 12 ECG leads. Each lead indicator is a rounded rectangle (approximately 80×56px at desktop) containing the lead name in Syne 11px #8890B8 at the top-left, a live mini ECG waveform in the center (40px wide, 24px tall, 1px line), and a status indicator at the bottom-right.

Lead status states during the test: **Checking** — a small spinner animation, lead label in #8890B8, waveform flat with a scanning animation. **Good signal** — the mini waveform becomes luminous cardiac red with the characteristic ECG shape visible, the status dot becomes green (#27C28A), the lead rectangle gains a very subtle green border at 0.5px. **Weak signal** — waveform visible but noisy, status dot amber, amber border. **No signal** — flat gray dashed line, status dot red, red border. **Not applicable** — gray fill, lead name grayed out, used for leads that are not active on the current shirt configuration.

The leads populate one by one as the system reads them — not all at once. They complete in a natural sequence over approximately 20 seconds, giving the patient a sense of progress and the satisfying experience of watching their shirt come alive lead by lead.

**Live ECG strip.** Below the lead grid, a full-width live ECG waveform strip — identical in visual treatment to the dashboard ECG canvas but smaller (120px tall). Lead II by default. The waveform scrolls left in real time during the test. Its color responds to AI classification: cardiac red for normal sinus rhythm, amber for irregular. A label above the strip: "Live signal — Lead II" in Syne 12px #8890B8. This is the patient's first time seeing their own heartbeat in the CardiShirt interface — the design must treat this moment with appropriate weight.

**Overall test progress.** A thin progress bar below the ECG strip, cardiac red fill on dark background, filling from left to right over the 30-second capture window. Percentage complete in DM Mono 12px #8890B8 at the right end of the bar.

**Cancel test button.** A small "Cancel test" text link in #8890B8 at the bottom of the dark panel. Tapping it returns the panel to its resting light-mode card with the "Start shirt test" button.

**Test results state.** When the 30-second capture completes, the test panel transitions to the results state. The step indicator advances to step three. The lead grid shows all final statuses — all green for a perfect test, a mix for a partial result. The live ECG strip pauses on the final second of capture.

Below the lead grid in the results state: a results summary card in a slightly elevated dark surface (#1A1D35). The overall result as a large status statement in DM Serif 18px: "Your CardiShirt is reading well — 12 of 12 leads have a good signal." in healthy green, or "10 of 12 leads have a good signal — 2 leads need attention." in caution amber, or "CardiShirt could not get a reliable reading. Let's try again." in cardiac red.

Below the summary statement: a plain-language explanation of what to do next. For a full pass: "Everything looks good. You're ready to wear CardiShirt for monitoring." For a partial result: the specific leads with weak signal are named — "Lead V3 and V4 have weak signals. Make sure the electrode patches on your left side are flat against your skin, then run the test again." For a fail: "Try repositioning the shirt and running the test again. If the problem continues, contact CardiShirt support." Each scenario ends with an appropriate action button — "Start monitoring" (green), "Test again" (amber), or "Contact support" (cardiac red outlined).

**Test history.** A "View previous test results" link below the results card — collapsed by default — expands a compact chronological list of the last five test runs with date, overall result, and lead count. This gives the patient and caregiver a history of shirt performance over time — useful for identifying a shirt that is degrading.

### Lead Configuration

Below the shirt test section, a lead configuration card. A toggle for each available lead — enabling or disabling individual leads from monitoring. Most patients should leave all leads enabled. The card header includes a warning in DM Serif 13px amber: "Disabling leads reduces monitoring coverage. Only change these settings if advised by your doctor." Each lead toggle has the lead name, a brief description of what that lead monitors, and the toggle. Disabled leads show in the lead grid on the dashboard and in the shirt test as "not applicable" (gray state).

### Firmware & Maintenance

A compact card showing the current firmware version in DM Mono, the last update date, and an "Check for updates" button. Below it: a "Reset shirt connection" link for troubleshooting connectivity issues — tapping initiates a re-pairing flow. A "Clear cached sensor data" link for clearing locally stored calibration data when the patient switches to a new shirt.

---

## 6. Alerts & Notifications

Three sections: Alert Thresholds, Notification Delivery, and Alert History.

### Alert Thresholds

The patient's personalized thresholds for what triggers an alert. Each threshold is a labeled slider or numeric input with a plain-language description of what it controls.

**High heart rate alert:** a numeric input in DM Mono with up/down controls. Default 120 BPM. Description: "Alert me when my heart rate stays above this for more than 30 seconds." A secondary input for duration — "30 seconds" as a default with a dropdown for 15s, 30s, 1 min, 2 min.

**Low heart rate alert:** same format. Default 45 BPM. Description: "Alert me when my heart rate drops below this."

**Irregular rhythm sensitivity:** a three-option segmented control — Low, Standard, High. Standard is default. Description: "How sensitive should CardiShirt be to rhythm irregularities? Higher sensitivity catches more events but may produce more false alerts."

**HRV drop alert:** a toggle (off by default) with a numeric input for percentage drop threshold. Description: "Alert me if my HRV drops more than [25%] below my personal baseline in a single day."

Each threshold card has a "Reset to default" text link in Syne 12px #5B8AF0 that restores that specific threshold to its default value without affecting others.

A note at the bottom of the thresholds section in DM Serif 13px #6B7499: "These thresholds are personalized for you. Changing them affects when CardiShirt alerts you and your family. If unsure, leave them at the recommended defaults or ask your doctor."

### Notification Delivery

Controls how and where notifications are delivered. A toggle for push notifications to the mobile app. A toggle for SMS alerts (to the patient's registered phone number). A toggle for family circle alerts — master on/off for all family member notifications, with a link to the per-member settings in the Family Circle screen. A "Quiet hours" section with a time range picker (start time, end time in DM Mono) — during quiet hours, non-critical notifications are suppressed but critical alerts still fire. A toggle for "Emergency override" — when on, critical alerts bypass quiet hours completely. This toggle is on by default and should not be turned off without a strong warning.

### Alert History

A compact chronological list of the last 20 alerts and anomalies. Same visual treatment as the alert history in Risk & Trends — each entry shows the date, time, event type, and a "View ECG" link. A "Clear alert history" link at the bottom in Syne 12px #6B7499 — opens a confirmation before clearing.

---

## 7. AI & Analysis

Three sections: Analysis Preferences, Baseline Management, and Model Information.

### Analysis Preferences

**Analysis frequency:** a segmented control — Continuous (default), Every 5 minutes, Every 15 minutes. Most patients should stay on continuous. The description explains: "Continuous analysis gives you the most accurate real-time risk assessment. Reducing frequency saves battery on the connected device."

**Daily AI summary time:** a time picker for when the AI generates the daily narrative that appears in the Cardiac Diary and on the dashboard. Default is 8:00 PM.

**Weekly report day:** a day-of-week selector for when the weekly progress card generates. Default is Sunday.

**Check-in reminder:** a toggle and time picker for the daily check-in prompt. Default on, default time 8:00 AM.

### Baseline Management

The patient's personalized baseline is the foundation of CardiShirt's entire value proposition. This section makes the baseline visible and manageable.

A card showing the baseline establishment date ("Baseline established on 12 February 2026"), the number of days of data used to build it (minimum 14 days required), and the current baseline values for resting heart rate range and HRV range in DM Mono.

A "Recalibrate baseline" button — opens a confirmation overlay explaining that recalibration will use the most recent 30 days of data to build a new baseline. Used when the patient's health status has significantly changed (after surgery, after a period of illness, after starting new medication). The overlay includes a warning: "Recalibrating will reset your personal normal. Previous trend comparisons will reference the old baseline for historical accuracy."

A "Reset to factory baseline" link in Syne 12px #6B7499 — more drastic, clears all personalization and starts fresh. Requires typed confirmation.

### Model Information

A card showing the AI model version currently running the patient's analysis, the last model update date, and a brief plain-language description of what the model does. A "How does CardiShirt AI work?" expandable section in DM Serif 14px — a short, honest explanation of what the AI analyzes, what it cannot do, and how to interpret its outputs. This section is important for patient trust and informed consent. A "View full AI disclosure" link navigates to a dedicated disclosure page.

---

## 8. Display & Language

Three sections: Language, Appearance, and Dashboard Preferences.

### Language

A large segmented toggle — English and বাংলা (Bengali) as two options. The active language has a cardiac red underline. Changing the language triggers an immediate full-app re-render with a brief transition animation. A note in both languages: "All AI-generated text will update to your selected language within a few minutes."

Date and time format preferences — a toggle between 12-hour and 24-hour time, and a date format selector (DD/MM/YYYY default for Bangladesh).

Bengali numeral toggle — a toggle to display numerals in Bengali script (০১২৩) rather than Western Arabic (0123) for all non-medical values. Medical data (BPM, RMSSD, risk score) always displays in Western numerals for clinical legibility regardless of this setting. A note explains the exception in plain language.

### Appearance

A theme selector — System default, Light, Dark. System default follows the device's OS theme for the non-dashboard screens (the dashboard is always dark regardless). Selecting Dark applies the dark dashboard aesthetic to all screens, not just the dashboard — an option for patients who strongly prefer the dark environment.

Text size — three options: Standard, Large, Extra Large. Selecting Large or Extra Large increases all Syne body text and DM Mono values proportionally while keeping heading hierarchy intact. Designed for elderly patients with visual impairment.

### Dashboard Preferences

Toggles for optional dashboard elements: show/hide the family circle widget, show/hide the medication log widget, show/hide the daily check-in card (disabling it removes the morning check-in ritual entirely). A toggle for the personalized baseline band on the ECG canvas — on by default. A toggle for the AI proactive messages in the chat — patients who find them intrusive can reduce them to once per day or disable entirely.

---

## 9. Privacy & Data

Three sections: Data Sharing, Storage & Export, and Security.

### Data Sharing

A clear list of what data CardiShirt collects and who it shares it with. Each item is a row with a label, a brief description, and a toggle. Anonymous analytics to improve the AI model (on by default, toggleable). Data sharing with the patient's registered doctor (on by default, requires doctor to be registered in the system). Data sharing with CardiShirt medical review team for quality assurance (on by default, toggleable). No other data sharing. A "View full privacy policy" link at the bottom.

### Storage & Export

Local storage usage in DM Mono — "2.4 GB of ECG data stored on this device." A "Manage storage" button opens a breakdown by data type with options to clear old data beyond a selected retention period. An "Export all data" button — same as the one in the danger zone — generates a full data export in standard formats (PDF report and CSV raw data).

### Security

App lock toggle — requires biometric or PIN to open the app. PIN change flow if PIN is set. Active sessions list showing devices currently logged into the account — each session shows device name, last active timestamp, and a "Log out this device" button. A "Log out all devices" button at the bottom in cardiac red text.

---

## 10. Emergency Configuration

This category in Settings mirrors the emergency configuration section in the Family Circle screen. The layout is identical in function but adapted to the settings two-panel context. The left settings category nav item shows its readiness badge. The content area shows the preferred hospital, emergency contacts priority list, and registered services with dispatch toggles — all described in the Family Circle brief. Changes made here sync immediately to the Family Circle screen and vice versa.

One addition specific to the Settings context: a "Dispatch test" — a clearly labeled test mode that simulates the automatic dispatch countdown without sending any real notifications or calls. This is the test dispatch feature referenced in the dashboard brief as being available only in settings, never on the dashboard. The test plays through the full countdown UI and shows which contacts and services would be notified, then concludes with a summary: "In a real emergency, CardiShirt would have called [Service name] and notified [3 family members] within [45 seconds]." This gives the patient and caregiver confidence in the emergency chain without risking false alarms.

---

## 11. About & Support

A simple utility category. CardiShirt app version in DM Mono. A "Check for app updates" button. Links to: Help center, Contact support (opens a support chat), Report a problem (structured bug report form), Regulatory information (medical device compliance disclosures), Terms of service, Privacy policy. A "Send diagnostic report" button — compiles a technical log of the app's recent behavior and device status and sends it to the CardiShirt support team. Used when troubleshooting issues with support staff. The patient does not need to understand what is in the report — a plain-language description is shown before sending: "This sends a technical summary of your app and device to the CardiShirt team to help diagnose the problem. It does not include your ECG data."

---

## 12. Hamburger Menu Integration — Settings

The hamburger menu is most useful on Settings when it acts as a **quick configuration shortcut and device status surface** — the things a patient or caregiver reaches for most often while configuring the app.

### Navigation Badge

When Settings is the active screen, the hamburger navigation badge beside "Settings and Device" shows the current shirt connection status as a colored dot — green if connected, red if not. A caregiver helping configure the app for a patient can glance at the hamburger from any sub-category of settings and confirm the shirt is still connected without navigating away.

### Patient Status Strip — Configuration Context

When Settings is active, the Zone 1 patient status strip adds a second line showing the active settings category — "Configuring: CardiShirt Device" or "Configuring: Alerts" — in Syne 12px #8890B8. This helps caregivers who may open the hamburger mid-configuration to confirm which section they are in, especially when the settings content is not visible behind the hamburger drawer.

### Quick Actions — Revised for This Screen

When Settings is active, the six quick action grid is reordered with the most contextually relevant configuration and diagnostic actions promoted:

**Test shirt connection** moves to position one — on the device settings screen, this is the single most useful action a patient or caregiver can take. One tap initiates the shirt test flow within the CardiShirt Device category, scrolling and expanding the test panel automatically. If Settings is not currently on the CardiShirt Device category, tapping this action navigates to that category and starts the test.

**Switch language** moves to position two — a language toggle directly in the quick action grid. Tapping it toggles between English and Bengali immediately, without navigating to Display & Language. The action label updates to reflect the language it will switch to: "Switch to বাংলা" or "Switch to English." This is the second micro-interaction quick action in the product after the time range switcher in Risk & Trends.

**Share settings summary with doctor** moves to position three — generates a plain-language summary of the patient's current alert thresholds and AI configuration, formatted as a shareable text message. Useful when a doctor wants to know how the patient's monitoring is configured.

**Log a symptom** stays at position four — always relevant regardless of active screen.

**Call nearest ambulance** stays at position five in its red treatment — emergency access is always available.

**View alert history** at position six — navigates directly to the alert history within Alerts & Notifications settings, bypassing the category nav. Useful when the patient is reviewing settings after a recent alert event.

### Recent Activity Feed — Contextual Filtering

When Settings is active, the Zone 4 recent activity feed filters to configuration-relevant events: settings changes with timestamps ("Alert threshold changed — 3 days ago"), shirt test results ("Shirt test passed — 12/12 leads — yesterday"), firmware updates ("Firmware updated to v2.4.1 — last week"), and baseline recalibration events. This makes the feed a configuration audit log — the patient or caregiver can see at a glance what has changed recently and when, which is reassuring when troubleshooting or reviewing the device after a concerning event.

### Hamburger Footer — Support Shortcut

When Settings is active, a "Contact support" text link in Syne 13px #5B8AF0 appears in the footer strip. This mirrors the support link in About & Support, making help accessible from anywhere within the settings screen without navigating to the utility category. Present only when Settings is the active screen.

---

## 13. Component States to Design

**Settings category nav states:** Default (inactive, icon and label), active (cardiac red left border, tinted background), badge variants (red dot, green checkmark, warning triangle, language pill, count pill), hover state at desktop.

**Shirt test panel states:** Resting (light mode card with start button), test initiating (transition animation frame), test active step one (instruction visible, lead grid all in checking state), test active step two (leads populating one by one, ECG strip live, progress bar filling), results — full pass (all green leads, positive summary), results — partial (mixed leads, specific remediation instructions), results — fail (red leads, retry prompt), test cancelled (return to resting state).

**12-lead grid individual lead states:** Checking (spinner), good signal (green border, luminous waveform), weak signal (amber border, noisy waveform), no signal (red border, flat dashed line), not applicable (gray fill).

**Alert threshold card states:** Default value (no indicator), modified from default (a small "Modified" pill badge in amber beside the setting label), reset to default (brief green confirmation animation).

**Language toggle states:** English active, Bengali active, switching in progress (brief fade transition).

**Baseline card states:** Established (showing date and values), insufficient data — less than 14 days (showing progress toward baseline with a day count: "7 of 14 days collected"), recalibration in progress (spinner with estimated completion time).

**Emergency dispatch test states:** Pre-test (start button), test running (countdown animation, simulated contact list illuminating in sequence), test complete (summary of what would have happened), test cancelled.

---

## 14. Settings Screen — Figma File Additions

Add a dedicated Settings page to the Figma file. Required artboards: desktop layout (1280px) showing the two-panel structure with the category nav on the left and the CardiShirt Device category active on the right — specifically showing the shirt test panel in its active dark mode state as the hero artboard. A second desktop artboard shows the Alerts & Notifications category with all threshold cards. A third shows Profile & Account with the permission editor.

Tablet layout (768px) showing the horizontal tab strip and the device category active. Mobile web layout showing the category list and then the device category as a full-screen view.

A dedicated component states artboard showing every shirt test panel state in sequence — resting, step one, step two with partial lead population, step two with full lead population, results pass, results partial, results fail. This sequence is the most complex UI in the Settings screen and requires explicit design for every frame.

A second component states artboard shows all eight category nav badge variants and all threshold card states.

All AI-generated text blocks — the baseline description, the model information card content, and the dispatch test summary — require Bengali-language variants.

---

*This brief covers Settings in full including the shirt test feature as a first-class design element. All other screens remain as specified in their respective briefs. The hamburger contextual mode described in Section 12 supersedes any placeholder behavior from earlier briefs for this screen only. Priority order for the design sprint: shirt test panel in all states, the 12-lead grid component, the settings category navigation with all badge variants, and then the alerts threshold cards.*
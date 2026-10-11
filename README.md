
# NIGHT SHIFT: TIRE INSPECTION

**A psychological horror game about tires, production records, and things that should not exist.**

You are the night-shift inspector at Blackridge Tire Works, a fictional industrial facility operating long after everyone else has gone home.

Your job seems simple: inspect the product, verify the production records, review the paperwork, and decide whether to approve or reject each case.

But somewhere between the production floor and the inspection room, the records begin to disagree.

A report has already been stamped before an inspection begins.

An operator appears in two places at the same time.

A serial number changes when you look at it again.

And at 03:17, the printer produces a document you do not remember creating.

**Your shift ends at 06:00. Your decisions will determine what remains in the final record.**

---

## About the Game

**NIGHT SHIFT: TIRE INSPECTION** is a browser-based industrial psychological horror game built with HTML, CSS, and vanilla JavaScript.

Instead of fighting enemies or solving conventional puzzles, the player works at a fictional tire inspection workstation. Every case presents a product illustration, a production record, an operator profile, and an inspection report.

The player must compare these sources and decide:

- **OK** — Approve the product when the available evidence supports acceptance.
- **NG** — Reject the product when the case contains a relevant defect or documented inconsistency.

The central challenge is distinguishing a genuine discrepancy from an ordinary record. A suspicious atmosphere is not, by itself, evidence that a product should be rejected.

As the shift progresses, routine paperwork gives way to contradictions, unexplained visual changes, and unsettling records that appear to exist outside the normal timeline.

## Features

- **20 initial inspection cases** organized into a three-part night-shift narrative.
- **Eight fictional production process categories**, each with its own anomaly references.
- **Interactive 2D tire illustration** with selectable tread, sidewall, and bead inspection areas.
- **Production records** containing fictional batches, timestamps, process references, and operator identities.
- **Inspection paperwork** with report numbers, signatures, approval stamps, and recorded observations.
- **Operator and document anomalies**, including mismatched identities, conflicting timestamps, duplicated reports, and inconsistent records.
- **Visual horror events**, such as changing tread patterns, mismatched serial numbers, and unexplained shadows.
- **Anomaly Index** with searchable reference entries and category filters.
- **OK / NG decision system** with scores, error tracking, and decision feedback.
- **Three story acts** that build tension over the course of the shift.
- **Multiple endings** based on the player's recorded decisions.
- **Atmospheric audio** with looping background ambience and decision sound effects.
- **Responsive interface** designed for desktop and smaller screens.

## The Night Shift

The campaign is divided into three narrative acts.

### ACT I — ROUTINE

**22:00 · Cases 01–07**

The shift begins normally. Production records arrive, the workstation is ready, and the inspection process seems familiar.

Learn to compare product information with its supporting records. Not every case contains an anomaly, and not every strange-looking detail is a reason to reject a product.

### ACT II — DISCREPANCY

**00:43 · Cases 08–13**

Records begin to contradict one another.

Timestamps become difficult to reconcile, operator assignments no longer make sense, and seemingly ordinary paperwork develops inconsistencies.

Examine each source carefully. Find the actual contradiction instead of guessing.

### ACT III — FINAL RECORD

**03:17 · Cases 14–20**

The inspection room no longer feels entirely trustworthy.

A printer produces a report that should not exist. Product identities become harder to reconcile, and the final records raise questions about who—or what—has been documenting the shift.

Continue inspecting until the workstation reaches 06:00.

---

## The Eight Process Categories

The Anomaly Index includes eight fictional process categories.

| Reference | Process | Example anomaly |
|---|---|---|
| AI-01 | Banbury | A cycle finishes before its recorded start time. |
| AI-02 | Extruding | The recorded profile differs from the production reference. |
| AI-03 | Bead | The component count does not match the material record. |
| AI-04 | Cutting | Recorded dimensions fall outside the fictional case specification. |
| AI-05 | Building | A component is used before its recorded availability time. |
| AI-06 | Curing | A cycle has contradictory timestamps or press references. |
| AI-07 | Final Inspection | An approval stamp appears before the inspection begins. |
| AI-08 | Tube | The material batch or serial number conflicts with its record. |

The game also includes supporting anomalies involving personnel, documents, and visual evidence.

**Tube is represented as a separate product path in the fictional game rather than a mandatory stage after Final Inspection.**

## Evidence and Anomalies

The game uses several sources of evidence.

### Product evidence

Inspect the illustrated tire's tread, sidewall, and bead areas. Look for visual inconsistencies and compare the displayed serial with the paperwork.

### Production evidence

Review the process name, batch reference, operator identity, shift assignment, and timestamps. A discrepancy should be supported by a comparison with the relevant record.

### Document evidence

Check report numbers, signatures, observations, timestamps, and approval stamps. A document can be inconsistent even when the product illustration appears normal.

### Personnel evidence

Verify an operator through the fictional roster, employee ID, schedule, attendance, or location history.

The game does not treat a person's appearance, an unfamiliar name, or an unsettling event as sufficient proof of a production anomaly.

---

## Controls

| Action | Control |
|---|---|
| Start the shift | Click **BEGIN NIGHT SHIFT** |
| Inspect an area | Click its button or the corresponding tire hotspot |
| Review production records | Click **VERIFY PRODUCTION / OPERATOR RECORD** |
| Review the inspection report | Click **VERIFY INSPECTION REPORT** |
| Approve a case | Click **OK** or press `O` |
| Reject a case | Click **NG** or press `N` |
| Continue to the next case | Click **CONTINUE** |
| Open or close the Anomaly Index | Click **ANOMALY INDEX** |
| Acknowledge a story event | Click **ACKNOWLEDGE** or press `Escape` |
| Toggle audio | Click **SOUND ON / SOUND OFF** |
| Start another shift | Click **START ANOTHER SHIFT** |

Keyboard shortcuts for decisions are ignored while typing in an input field or while a story dialog is open.

## Project Structure

```text
NIGHT-SHIFT-TIRE-INSPECTION/
│
├── index.html
├── README.md
│
├── css/
│   └── style.css
│
├── js/
│   ├── main.js
│   ├── game.js
│   ├── tires.js
│   ├── production.js
│   ├── anomalies.js
│   ├── inspection.js
│   ├── anomaly-index.js
│   ├── audio.js
│   └── story.js
│
└── audio/
    ├── darkne-horror-atmosphere-615391.mp3
    ├── floraphonic-buzzer-18-203421.mp3
    └── koiroylers-correct-356013.mp3
```

### JavaScript Modules

| File | Responsibility |
|---|---|
| `main.js` | Connects interface buttons and user actions. |
| `game.js` | Controls rounds, shift time, score, errors, and endings. |
| `tires.js` | Generates the tire illustration and interactive inspection areas. |
| `production.js` | Supplies fictional process, operator, batch, timestamp, and report data. |
| `anomalies.js` | Stores the anomaly definitions and initial case scenarios. |
| `inspection.js` | Handles visual inspection, document review, clues, and OK/NG evaluation. |
| `anomaly-index.js` | Renders the searchable anomaly reference archive. |
| `audio.js` | Controls background music, sound effects, and the sound toggle. |
| `story.js` | Manages narrative events, chapter transitions, and ending dialogs. |

## Getting Started

### Requirements

- A desktop or mobile browser with JavaScript enabled.
- [Visual Studio Code](https://code.visualstudio.com/) or another text editor.
- A local web server, such as the **Live Server** extension for VS Code.
- The three audio files placed in the `audio/` directory.

No database server, build system, JavaScript framework, or package installation is required.

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/NIGHT-SHIFT-TIRE-INSPECTION.git

cd NIGHT-SHIFT-TIRE-INSPECTION
```

Replace `YOUR-USERNAME` with your GitHub username and use the repository's actual URL.

### 2. Check the audio assets

Make sure the audio directory contains these exact filenames:

```text
audio/
├── darkne-horror-atmosphere-615391.mp3
├── floraphonic-buzzer-18-203421.mp3
└── koiroylers-correct-356013.mp3
```

The filenames in `audio.js` must match the actual files.

### 3. Open the project

Open the project folder in VS Code.

If you have Live Server installed, right-click `index.html` and select **Open with Live Server**.

Alternatively, use another local web server that serves the project files.

Opening the HTML file directly with `file://` may work for basic markup, but a local server is recommended for consistent browser behavior.

### 4. Start playing

When the game opens, click **BEGIN NIGHT SHIFT**. Inspect the tire, review the documents, and submit an OK or NG decision.

Background audio may require a user interaction because browsers can restrict automatic playback.

---

## Technology Stack

- **HTML5** — Game structure and interface.
- **CSS3** — Industrial horror styling, responsive layout, animations, and document presentation.
- **Vanilla JavaScript** — Game state, case data, inspections, story events, and audio controls.
- **SVG** — Procedurally drawn tire illustration and interactive visual hotspots.
- **HTML Audio API** — Background ambience and sound effects.

The game does not require a third-party JavaScript framework.

## Design Philosophy

The horror comes from the gradual loss of certainty.

The workstation initially feels dependable. Every record has a place, every timestamp should make sense, and each decision appears straightforward.

Then the records disagree.

The intention is to make the player slow down, compare evidence, and question the information presented by the interface. The game favors psychological tension, document-based investigation, and unexplained details over combat or conventional jump scares.

The inspection interface is designed to remain readable even as the atmosphere becomes more unsettling.

## Fictional Content Disclaimer

**NIGHT SHIFT: TIRE INSPECTION is an independent fictional horror project.**

Blackridge Tire Works, its personnel, processes, report templates, production records, specifications, batch numbers, and events are invented for entertainment.

The fictional process descriptions and anomaly examples are not real industrial quality-control standards, tire engineering specifications, or workplace procedures.

The project is not an inspection tool and must not be used to evaluate real tires or make real production decisions.

No internal corporate records or proprietary company assets are intended to be included in this project.

## Audio Credits

The game uses locally stored MP3 assets for atmospheric music and decision effects.

- `darkne-horror-atmosphere-615391.mp3` — Background atmosphere.
- `floraphonic-buzzer-18-203421.mp3` — Incorrect-decision or warning effect.
- `koiroylers-correct-356013.mp3` — Correct-decision effect.

The asset filenames are retained as provided. Before publishing the repository, verify each asset's original source, license, and attribution requirements, and include the appropriate credits if required.

## Development Status

The project is being built as a modular browser game. Its HTML interface and JavaScript modules are developed separately so the visual presentation, case database, evaluation logic, audio, and story can be tested and improved independently.

Features may be refined as the modules are integrated and tested together. The 20 initial scenarios represent the starting campaign; additional cases, anomalies, visual events, and endings can be added to expand the experience.

## License

No license has been specified for this repository.

If you plan to release the project for public reuse, add a `LICENSE` file that reflects your intended distribution terms. Third-party audio assets may have separate license conditions regardless of the code license.


/* =========================================================
   NIGHT SHIFT: TIRE INSPECTION
   INSPECTION CONTROLLER

   File: js/inspection.js

   FUNCTIONS:
   1. Load current inspection case.
   2. Inspect tire tread, sidewall, and bead areas.
   3. Review production records and operator information.
   4. Review inspection reports and paper anomalies.
   5. Display clues progressively.
   6. Support repeat inspection.
   7. Evaluate OK / NG decisions.
   8. Explain the result after submission.
   9. Connect with game.js and anomalies.js.

   DEPENDENCIES:
   - anomalies.js
   - game.js

   All cases, records, characters, and technical rules
   are fictional and exist only for this game.
   ========================================================= */

(function () {
    "use strict";


    /* =====================================================
       01. MODULE STATE
       ===================================================== */

    var currentCase = null;
    var currentProductionRecord = null;

    var currentCaseAnomalies = [];

    var areaScanCounts = {};
    var reviewedDocuments = {};

    var initialized = false;


    /* =====================================================
       02. INSPECTION AREA CONFIGURATION
       ===================================================== */

    var INSPECTION_AREAS = {
        tread: {
            id: "tread",
            label: "Tread",
            description: "Surface and tread pattern",

            normalObservation:
                "The visible tread has been recorded. Compare its pattern and visible condition with the available product reference.",

            repeatObservation:
                "The second scan has been recorded. Compare the current view with the observation from the first scan."
        },

        sidewall: {
            id: "sidewall",
            label: "Sidewall",
            description: "Serial and visible markings",

            normalObservation:
                "The sidewall markings have been recorded. Compare the visible serial with the tire serial shown in the records.",

            repeatObservation:
                "The sidewall has been scanned again. Check whether its markings remain consistent with the first observation."
        },

        bead: {
            id: "bead",
            label: "Bead Area",
            description: "Visible edge condition",

            normalObservation:
                "The visible bead area has been recorded. Compare its condition with the reference illustration for this case.",

            repeatObservation:
                "The bead area has been scanned again. Compare the current observation with the first scan."
        }
    };


    /* =====================================================
       03. GENERAL HELPERS
       ===================================================== */

    function getElement(id) {
        return document.getElementById(id);
    }


    function setText(id, value) {
        var element = getElement(id);

        if (!element) {
            return;
        }

        element.textContent =
            value === undefined || value === null
                ? ""
                : String(value);
    }


    function formatNumber(value, digits) {
        return String(value).padStart(digits || 2, "0");
    }


    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }


    function getCaseId() {
        return currentCase && currentCase.id
            ? currentCase.id
            : "UNKNOWN-CASE";
    }


    function getAreaConfig(area) {
        if (!area) {
            return null;
        }

        return INSPECTION_AREAS[
            String(area).toLowerCase()
        ] || null;
    }


    function safeCall(callback, fallbackValue) {
        try {
            return callback();
        } catch (error) {
            console.error(
                "[NIGHT SHIFT INSPECTION] Module call failed:",
                error
            );

            return fallbackValue;
        }
    }


    /* =====================================================
       04. GET ANOMALIES FOR CURRENT CASE

       Data source: anomalies.js

       The player is not shown the expected decision here.
       ===================================================== */

    function getCurrentCaseAnomalies() {
        if (!currentCase) {
            return [];
        }

        if (typeof getAnomaliesForCase === "function") {
            return safeArray(
                getAnomaliesForCase(currentCase)
            );
        }

        return [];
    }


    function getAnomaliesForArea(area) {
        return getCurrentCaseAnomalies().filter(function (anomaly) {
            return anomaly.area === area;
        });
    }


    function getAnomaliesForDocument(documentType) {
        var allowedAreas;

        if (documentType === "production") {
            /*
             * Production documentation also contains
             * operator IDs, shift details, and work records.
             */
            allowedAreas = ["production", "person"];
        } else if (documentType === "report") {
            allowedAreas = ["report"];
        } else {
            return [];
        }

        return getCurrentCaseAnomalies().filter(function (anomaly) {
            return allowedAreas.indexOf(anomaly.area) !== -1;
        });
    }


    /* =====================================================
       05. FINDINGS UI
       ===================================================== */

    function clearFindings() {
        var clueList = getElement("clueList");

        if (clueList) {
            clueList.replaceChildren();
        }
    }


    function setInspectionHint(message) {
        setText("inspectionHint", message);
    }


    function setScanStatus(message) {
        setText("scanStatus", message);
    }


    function appendLocalClue(clue) {
        /*
         * Fallback for inspection outside the game controller.
         * During normal play, NightShiftGame.addDiscoveredClue()
         * owns the discovered clue list.
         */

        var clueList = getElement("clueList");

        if (!clueList || !clue) {
            return;
        }

        var item = document.createElement("li");

        item.textContent = clue.text || clue.clue || String(clue);

        var severity = clue.severity || "normal";

        if (severity === "high") {
            item.classList.add("clue-danger");
        } else if (severity === "medium") {
            item.classList.add("clue-warning");
        } else {
            item.classList.add("clue-normal");
        }

        clueList.appendChild(item);
    }


    /* =====================================================
       06. PUBLISH DISCOVERED CLUES

       Keep inspection state synchronized with game.js.
       ===================================================== */

    function publishClues(area, clues) {
        var normalizedClues = safeArray(clues);

        if (
            window.NightShiftGame &&
            typeof window.NightShiftGame.markAreaInspected === "function"
        ) {
            window.NightShiftGame.markAreaInspected(
                area,
                normalizedClues
            );
        } else {
            normalizedClues.forEach(function (clue) {
                appendLocalClue(clue);
            });
        }
    }


    function publishDocumentClues(clues) {
        var normalizedClues = safeArray(clues);

        if (
            window.NightShiftGame &&
            typeof window.NightShiftGame.addDiscoveredClue === "function"
        ) {
            normalizedClues.forEach(function (clue) {
                window.NightShiftGame.addDiscoveredClue(clue);
            });
        } else {
            normalizedClues.forEach(function (clue) {
                appendLocalClue(clue);
            });
        }
    }


    /* =====================================================
       07. MARK AREA BUTTON STATE
       ===================================================== */

    function updateAreaButton(area, scanCount) {
        var button = document.querySelector(
            '.area-button[data-area="' + area + '"]'
        );

        if (!button) {
            return;
        }

        button.classList.add("inspected");
        button.setAttribute("aria-pressed", "true");

        /*
         * A second scan remains possible. It can reveal
         * a changed visual clue in selected horror cases.
         */
        button.title =
            scanCount > 1
                ? "Inspect again — scan " + scanCount
                : "Inspected — select again to compare";
    }


    function updateOverallScanStatus() {
        var scannedCount = Object.keys(areaScanCounts).filter(
            function (area) {
                return areaScanCounts[area] > 0;
            }
        ).length;

        setScanStatus(
            scannedCount === 0
                ? "NOT STARTED"
                : formatNumber(scannedCount) + " AREA(S) CHECKED"
        );
    }


    /* =====================================================
       08. BUILD VISUAL CLUES

       Only clues registered to the current case are revealed.
       ===================================================== */

    function createVisualAnomalyClue(anomaly, area, scanCount) {
        var anomalyId = anomaly.id || "VISUAL-UNKNOWN";

        /*
         * VIS-01 is the changing-tread scenario.
         * The first scan records a baseline. The actual
         * inconsistency is revealed when the player scans
         * the same area again.
         */
        if (
            anomalyId === "VIS-01" &&
            area === "tread" &&
            scanCount < 2
        ) {
            return null;
        }

        var title = anomaly.title || "Visual Discrepancy";

        var clueText =
            title +
            ": " +
            (anomaly.clue || "Compare the visual evidence with the case reference.");

        if (
            anomalyId === "VIS-01" &&
            scanCount >= 2
        ) {
            clueText =
                "Repeat scan — " +
                (anomaly.clue ||
                    "The current tread pattern differs from the first scan.");
        }

        /*
         * Use a distinct ID for the repeat clue so it can
         * appear separately from the initial baseline.
         */
        var clueId = anomalyId;

        if (scanCount > 1) {
            clueId = anomalyId + "-REPEAT-" + scanCount;
        }

        return {
            id: clueId,
            text: clueText,
            area: area,
            source: "visual",
            severity: anomaly.severity || "medium"
        };
    }


    function createNormalVisualClue(area, scanCount) {
        var config = getAreaConfig(area);

        if (!config) {
            return {
                id: getCaseId() + "-" + area + "-UNKNOWN",
                text: "The observation has been recorded.",
                area: area,
                source: "visual",
                severity: "normal"
            };
        }

        var text = scanCount > 1
            ? config.repeatObservation
            : config.normalObservation;

        return {
            id:
                getCaseId() +
                "-" +
                area +
                "-SCAN-" +
                scanCount,

            text: text,

            area: area,

            source: "visual",

            severity: "normal"
        };
    }


    /* =====================================================
       09. INSPECT TIRE AREA

       Public method:
       NightShiftInspection.inspectArea("tread")
       ===================================================== */

    function inspectArea(area) {
        if (!currentCase) {
            setInspectionHint(
                "Start the shift and load an inspection case first."
            );

            return {
                success: false,
                reason: "no-current-case"
            };
        }

        var areaId = String(area || "").toLowerCase();

        var config = getAreaConfig(areaId);

        if (!config) {
            return {
                success: false,
                reason: "invalid-area"
            };
        }

        var scanCount = (areaScanCounts[areaId] || 0) + 1;

        areaScanCounts[areaId] = scanCount;

        var areaAnomalies = getAnomaliesForArea(areaId);

        var clues = [];


        /* Optional integration with tires.js. */

        if (
            window.NightShiftTires &&
            typeof window.NightShiftTires.inspectArea === "function"
        ) {
            safeCall(function () {
                window.NightShiftTires.inspectArea(
                    areaId,
                    currentCase,
                    currentProductionRecord,
                    scanCount
                );
            }, null);
        }


        /* Create clues for anomalous visual areas. */

        areaAnomalies.forEach(function (anomaly) {
            var clue = createVisualAnomalyClue(
                anomaly,
                areaId,
                scanCount
            );

            if (clue) {
                clues.push(clue);
            }
        });


        /*
         * If this area has no registered visual anomaly,
         * record a neutral observation.
         *
         * A normal visual result does not mean the entire
         * case is normal. Its documents may still conflict.
         */
        if (clues.length === 0) {
            clues.push(
                createNormalVisualClue(areaId, scanCount)
            );
        }


        /* Apply UI and game-state updates. */

        updateAreaButton(areaId, scanCount);

        publishClues(areaId, clues);

        updateOverallScanStatus();

        setInspectionHint(
            config.label +
            " scan recorded. Compare this observation with the " +
            "production record and inspection report."
        );


        /*
         * Visual horror effect for a changing-tread case.
         * This is decorative. The decision still depends on
         * the case evidence and is not decided by the effect.
         */
        var changingTreadDetected = areaAnomalies.some(
            function (anomaly) {
                return (
                    anomaly.id === "VIS-01" &&
                    areaId === "tread" &&
                    scanCount >= 2
                );
            }
        );

        if (changingTreadDetected) {
            triggerVisualDistortion();
        }


        return {
            success: true,
            area: areaId,
            scanCount: scanCount,
            anomaliesFound: areaAnomalies.length,
            clues: clues
        };
    }


    /* =====================================================
       10. VISUAL HORROR EFFECT
       ===================================================== */

    function triggerVisualDistortion() {
        var body = document.body;

        if (!body) {
            return;
        }

        body.classList.remove("screen-distortion");

        /*
         * Force a reflow so the class can animate again
         * after it was removed.
         */
        void body.offsetWidth;

        body.classList.add("screen-distortion");

        window.setTimeout(function () {
            body.classList.remove("screen-distortion");
        }, 350);
    }


    /* =====================================================
       11. DOCUMENT REVIEW BUTTONS

       The production record contains:
       - Operator name and ID
       - Shift and process information
       - Batch and timing information

       The report contains:
       - Report number
       - Tire serial
       - Inspector and inspection time
       - Observations and signature

       These buttons are inserted into existing cards.
       No index.html changes are required.
       ===================================================== */

    function injectDocumentReviewStyles() {
        if (getElement("nightShiftInspectionStyles")) {
            return;
        }

        var style = document.createElement("style");

        style.id = "nightShiftInspectionStyles";

        style.textContent = `
            .inspection-document-review {
                width: 100%;
                min-height: 34px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin-top: 13px;
                padding: 8px 10px;
                color: #4a473c;
                background: rgba(80, 75, 60, 0.08);
                border: 1px solid rgba(47, 46, 38, 0.28);
                border-radius: 2px;
                cursor: pointer;
                font-family: var(--font-mono, monospace);
                font-size: 8px;
                font-weight: 800;
                letter-spacing: 0.06em;
                text-align: left;
                transition:
                    color 160ms ease,
                    background 160ms ease,
                    border-color 160ms ease;
            }

            .inspection-document-review:hover {
                color: #292823;
                background: rgba(80, 75, 60, 0.14);
                border-color: rgba(47, 46, 38, 0.48);
            }

            .inspection-document-review:focus-visible {
                outline: 2px solid #8e3434;
                outline-offset: 3px;
            }

            .inspection-document-review.is-reviewed {
                color: #315c3c;
                background: rgba(49, 92, 60, 0.07);
                border-color: rgba(49, 92, 60, 0.35);
            }

            .inspection-document-review .review-icon {
                font-size: 13px;
            }

            .inspection-document-review .review-label {
                flex: 1;
                line-height: 1.6;
            }
        `;

        document.head.appendChild(style);
    }


    function createDocumentReviewButton(card, documentType, label) {
        if (!card) {
            return;
        }

        var existing = card.querySelector(
            '[data-inspection-review="' + documentType + '"]'
        );

        if (existing) {
            return;
        }

        var button = document.createElement("button");

        button.type = "button";

        button.className = "inspection-document-review";

        button.dataset.inspectionReview = documentType;

        button.setAttribute(
            "aria-label",
            "Review " + label.toLowerCase()
        );

        var labelElement = document.createElement("span");

        labelElement.className = "review-label";
        labelElement.textContent = label;

        var iconElement = document.createElement("span");

        iconElement.className = "review-icon";
        iconElement.textContent = "↗";
        iconElement.setAttribute("aria-hidden", "true");

        button.appendChild(labelElement);
        button.appendChild(iconElement);

        button.addEventListener("click", function () {
            reviewDocument(documentType);
        });


        /*
         * Insert before the document footer to preserve the
         * existing paper-style layout.
         */
        var footer = card.querySelector(".document-footer");

        if (footer) {
            card.insertBefore(button, footer);
        } else {
            card.appendChild(button);
        }
    }


    function initializeDocumentReviewButtons() {
        injectDocumentReviewStyles();

        createDocumentReviewButton(
            document.querySelector(".production-document"),
            "production",
            "VERIFY PRODUCTION / OPERATOR RECORD"
        );

        createDocumentReviewButton(
            document.querySelector(".report-document"),
            "report",
            "VERIFY INSPECTION REPORT"
        );
    }


    /* =====================================================
       12. REVIEW PRODUCTION OR REPORT DOCUMENT

       Public method:
       NightShiftInspection.reviewDocument("production")
       NightShiftInspection.reviewDocument("report")
       ===================================================== */

    function reviewDocument(documentType) {
        if (!currentCase) {
            setInspectionHint(
                "Start the shift before reviewing case documents."
            );

            return {
                success: false,
                reason: "no-current-case"
            };
        }

        var type = String(documentType || "").toLowerCase();

        if (
            type !== "production" &&
            type !== "report"
        ) {
            return {
                success: false,
                reason: "invalid-document-type"
            };
        }

        var recordAnomalies = getAnomaliesForDocument(type);

        var reviewCount = (reviewedDocuments[type] || 0) + 1;

        reviewedDocuments[type] = reviewCount;

        var documentName = type === "production"
            ? "Production / Operator Record"
            : "Inspection Report";

        var clues = [];


        if (recordAnomalies.length > 0) {
            recordAnomalies.forEach(function (anomaly) {
                var repeatPrefix = reviewCount > 1
                    ? "REVIEW " + reviewCount + " — "
                    : "";

                clues.push({
                    id:
                        anomaly.id +
                        "-DOC-REVIEW-" +
                        reviewCount,

                    text:
                        repeatPrefix +
                        anomaly.title +
                        ": " +
                        (
                            anomaly.clue ||
                            "Compare this entry with the other available records."
                        ),

                    area: anomaly.area,

                    source: "document",

                    severity: anomaly.severity || "medium"
                });
            });
        } else {
            clues.push({
                id:
                    getCaseId() +
                    "-" +
                    type.toUpperCase() +
                    "-REVIEW-" +
                    reviewCount,

                text:
                    documentName +
                    " reviewed. No registered discrepancy is assigned " +
                    "to this document category for the current case. " +
                    "Continue checking the other evidence.",

                area: type === "production"
                    ? "production"
                    : "report",

                source: "document",

                severity: "normal"
            });
        }


        publishDocumentClues(clues);


        /* Mark the document review button. */

        var button = document.querySelector(
            '[data-inspection-review="' + type + '"]'
        );

        if (button) {
            button.classList.add("is-reviewed");

            button.setAttribute(
                "aria-label",
                documentName + " reviewed"
            );
        }


        setInspectionHint(
            documentName +
            " reviewed. Compare operator details, time, batch, serial, " +
            "and report observations before deciding."
        );


        /* Add a log entry if the game module is available. */

        if (
            window.NightShiftGame &&
            typeof window.NightShiftGame.addLogEntry === "function"
        ) {
            window.NightShiftGame.addLogEntry(
                typeof window.NightShiftGame.getCurrentClock === "function"
                    ? window.NightShiftGame.getCurrentClock()
                    : "--:--",

                documentName + " reviewed.",

                recordAnomalies.length > 0
                    ? "log-warning"
                    : "log-system"
            );
        }


        return {
            success: true,
            documentType: type,
            reviewCount: reviewCount,
            anomaliesFound: recordAnomalies.length,
            clues: clues
        };
    }


    /* =====================================================
       13. INITIALIZE A CASE

       Called by game.js:
       NightShiftInspection.loadCase(caseData, record, state)
       ===================================================== */

    function loadCase(caseData, productionRecord, gameState) {
        currentCase = caseData || null;

        currentProductionRecord = productionRecord || null;

        areaScanCounts = {};
        reviewedDocuments = {};

        currentCaseAnomalies = currentCase
            ? getCurrentCaseAnomalies()
            : [];


        /*
         * Reset review-button visual state whenever a new case
         * appears. The button click handlers remain attached.
         */
        document.querySelectorAll(
            "[data-inspection-review]"
        ).forEach(function (button) {
            button.classList.remove("is-reviewed");
        });


        Object.keys(INSPECTION_AREAS).forEach(function (area) {
            var button = document.querySelector(
                '.area-button[data-area="' + area + '"]'
            );

            if (button) {
                button.classList.remove("inspected");
                button.disabled = false;

                button.setAttribute("aria-pressed", "false");

                button.title =
                    "Inspect " + INSPECTION_AREAS[area].label;
            }
        });


        updateOverallScanStatus();

        setInspectionHint(
            "Inspect the tire areas, then review the production / operator " +
            "record and inspection report. Compare the available evidence " +
            "before selecting OK or NG."
        );


        if (!currentCase) {
            setInspectionHint(
                "No inspection case is currently loaded."
            );
        }


        return {
            success: Boolean(currentCase),

            caseId: currentCase
                ? currentCase.id
                : null,

            anomalyDefinitionsLoaded:
                currentCaseAnomalies.length
        };
    }


    /* =====================================================
       14. EVALUATE THE PLAYER'S DECISION

       Input:
       {
           caseData,
           decision,
           productionRecord,
           inspectedAreas,
           discoveredClues,
           gameState
       }

       Returns:
       {
           correct,
           expectedDecision,
           feedbackTitle,
           feedbackMessage,
           reasons
       }

       The scenario's expectedDecision in anomalies.js is
       the authoritative answer key. This keeps the outcome
       consistent with the authored 20-case campaign.
       ===================================================== */

    function evaluateDecision(payload) {
        payload = payload || {};

        var caseData = payload.caseData || currentCase;

        var decision = String(payload.decision || "")
            .trim()
            .toUpperCase();

        if (!caseData) {
            return {
                correct: false,

                expectedDecision: null,

                feedbackTitle: "CASE NOT AVAILABLE",

                feedbackMessage:
                    "The current case is unavailable. No evaluation could be completed.",

                reasons: []
            };
        }

        if (
            decision !== "OK" &&
            decision !== "NG"
        ) {
            return {
                correct: false,

                expectedDecision: caseData.expectedDecision || null,

                feedbackTitle: "INVALID DECISION",

                feedbackMessage:
                    "Select OK or NG before submitting the inspection.",

                reasons: []
            };
        }


        var expectedDecision = String(
            caseData.expectedDecision ||
            (
                safeArray(caseData.anomalyIds).length > 0
                    ? "NG"
                    : "OK"
            )
        ).toUpperCase();


        if (
            expectedDecision !== "OK" &&
            expectedDecision !== "NG"
        ) {
            expectedDecision =
                safeArray(caseData.anomalyIds).length > 0
                    ? "NG"
                    : "OK";
        }


        var correct = decision === expectedDecision;

        var anomalies = [];

        if (typeof getAnomaliesForCase === "function") {
            anomalies = safeArray(
                getAnomaliesForCase(caseData)
            );
        }


        var inspectedAreas = safeArray(payload.inspectedAreas);

        var inspectedSet = {};

        inspectedAreas.forEach(function (area) {
            inspectedSet[area] = true;
        });


        var documentCount =
            Object.keys(reviewedDocuments).filter(function (type) {
                return reviewedDocuments[type] > 0;
            }).length;


        var reasons = anomalies.map(function (anomaly) {
            return {
                id: anomaly.id,

                title: anomaly.title,

                clue: anomaly.clue,

                expected: anomaly.expected,

                observed: anomaly.observed,

                area: anomaly.area,

                severity: anomaly.severity
            };
        });


        var feedbackTitle;
        var feedbackMessage;


        if (expectedDecision === "OK") {
            if (correct) {
                feedbackTitle = "DECISION CORRECT";

                feedbackMessage =
                    "The case reference classifies this product as OK. " +
                    "No registered anomaly is assigned to this case. " +
                    "The unusual atmosphere alone is not evidence of a defect.";
            } else {
                feedbackTitle = "FALSE REJECTION";

                feedbackMessage =
                    "The case reference classifies this product as OK. " +
                    "No registered anomaly is assigned to this case. " +
                    "Rejecting a product requires contradictory evidence, " +
                    "not suspicion alone.";
            }
        } else {
            var anomalyDescriptions = anomalies.map(function (anomaly) {
                return (
                    anomaly.title +
                    " — " +
                    (
                        anomaly.clue ||
                        "A discrepancy is recorded for this case."
                    )
                );
            });

            if (correct) {
                feedbackTitle = "DECISION CORRECT";

                feedbackMessage =
                    "The case contains one or more registered discrepancies. " +
                    "The NG decision matches the case reference.";
            } else {
                feedbackTitle = "MISSED DISCREPANCY";

                feedbackMessage =
                    "The case reference requires NG because one or more " +
                    "discrepancies are registered. The submitted OK decision " +
                    "does not match the evidence classification.";
            }

            if (anomalyDescriptions.length > 0) {
                feedbackMessage +=
                    "\n\nREFERENCE FINDINGS:\n- " +
                    anomalyDescriptions.join("\n- ");
            } else {
                feedbackMessage +=
                    "\n\nThe case is marked NG in the scenario reference, " +
                    "but no anomaly details could be loaded.";
            }
        }


        /*
         * Do not make document-review completeness or the
         * number of inspected areas change the answer key.
         * Inspection completeness can contribute to the bonus
         * managed by game.js, but not to the case truth.
         */
        if (correct && inspectedAreas.length === 0) {
            feedbackMessage +=
                "\n\nNote: no physical tire area was recorded as inspected.";
        } else if (correct && inspectedAreas.length < 3) {
            feedbackMessage +=
                "\n\nInspection record: " +
                inspectedAreas.length +
                " of 3 physical areas checked.";
        }

        if (documentCount < 2) {
            feedbackMessage +=
                "\n\nRecord review: " +
                documentCount +
                " of 2 document sections reviewed.";
        }


        return {
            correct: correct,

            isCorrect: correct,

            expectedDecision: expectedDecision,

            submittedDecision: decision,

            feedbackTitle: feedbackTitle,

            feedbackMessage: feedbackMessage,

            reasons: reasons,

            inspectedAreas: inspectedAreas.slice(),

            documentReviews: Object.assign({}, reviewedDocuments),

            evidenceSummary: {
                anomalyCount: anomalies.length,

                registeredAnomalyIds: anomalies.map(function (anomaly) {
                    return anomaly.id;
                }),

                physicalAreasInspected: inspectedAreas.length,

                documentSectionsReviewed: documentCount
            }
        };
    }


    /* =====================================================
       15. RESET INSPECTION MODULE
       ===================================================== */

    function reset() {
        currentCase = null;

        currentProductionRecord = null;

        currentCaseAnomalies = [];

        areaScanCounts = {};
        reviewedDocuments = {};

        clearFindings();

        setScanStatus("NOT STARTED");

        setInspectionHint(
            "No areas inspected yet. Examine the product and " +
            "cross-check the records before deciding."
        );

        document.querySelectorAll(
            ".area-button[data-area]"
        ).forEach(function (button) {
            button.classList.remove("inspected");
            button.disabled = false;

            button.setAttribute("aria-pressed", "false");
        });

        document.querySelectorAll(
            "[data-inspection-review]"
        ).forEach(function (button) {
            button.classList.remove("is-reviewed");
        });

        return true;
    }


    /* =====================================================
       16. PUBLIC API

       Used by game.js and main.js.
       ===================================================== */

    window.NightShiftInspection = {

        /* Load the active case */
        loadCase: loadCase,

        renderCase: loadCase,

        /* Physical inspection */
        inspectArea: inspectArea,

        /* Document review */
        reviewDocument: reviewDocument,

        /* Evaluate final decision */
        evaluateDecision: evaluateDecision,

        /* Read-only access to current inspection context */
        getCurrentCase: function () {
            return currentCase;
        },

        getCurrentProductionRecord: function () {
            return currentProductionRecord;
        },

        getCurrentAnomalies: function () {
            return currentCaseAnomalies.slice();
        },

        getScanCounts: function () {
            return Object.assign({}, areaScanCounts);
        },

        getReviewedDocuments: function () {
            return Object.assign({}, reviewedDocuments);
        },

        getInspectionAreas: function () {
            return Object.keys(INSPECTION_AREAS).map(function (key) {
                return Object.assign({}, INSPECTION_AREAS[key]);
            });
        },

        reset: reset,

        initialize: initialize
    };


    /* =====================================================
       17. LEGACY GLOBAL HELPERS
       ===================================================== */

    window.inspectTireArea = inspectArea;

    window.reviewInspectionDocument = reviewDocument;


    /* =====================================================
       18. BUTTON EVENT BINDING
       ===================================================== */

    function bindInspectionAreaButtons() {
        document.querySelectorAll(
            ".area-button[data-area]"
        ).forEach(function (button) {
            if (button.dataset.inspectionBound === "true") {
                return;
            }

            button.dataset.inspectionBound = "true";

            button.addEventListener("click", function () {
                inspectArea(button.dataset.area);
            });
        });
    }


    /* =====================================================
       19. INITIALIZE
       ===================================================== */

    function initialize() {
        if (initialized) {
            return;
        }

        initialized = true;

        bindInspectionAreaButtons();

        initializeDocumentReviewButtons();

        console.log(
            "[NIGHT SHIFT INSPECTION] Inspection controller initialized."
        );
    }


    /* =====================================================
       20. STARTUP
       ===================================================== */

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }

})();

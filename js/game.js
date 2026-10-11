
/* =========================================================
   NIGHT SHIFT: TIRE INSPECTION
   GAME CONTROLLER

   File: js/game.js

   Tugas:
   1. Mengatur awal dan akhir shift.
   2. Mengatur 20 ronde berdasarkan ANOMALY_CASES.
   3. Mengatur jam permainan dari 22:00 sampai 06:00.
   4. Mengatur skor, kesalahan, dan streak.
   5. Memproses keputusan OK / NG.
   6. Menampilkan hasil keputusan.
   7. Menampilkan catatan aktivitas.
   8. Mengatur transisi antar ronde.
   9. Menentukan ending.
   10. Menghubungkan modul produksi, inspeksi, visual,
       audio, dan cerita.

   DEPENDENCIES:
   - anomalies.js
   - production.js
   - inspection.js
   - tires.js
   - audio.js
   - story.js

   Modul yang belum tersedia akan menggunakan fallback
   sederhana agar pengembangan bisa dilakukan bertahap.

   Semua kasus dan data permainan adalah fiksi.
   ========================================================= */

(function () {
    "use strict";


    /* =====================================================
       01. GAME CONFIGURATION
       ===================================================== */

    var GAME_CONFIG = {
        gameTitle: "NIGHT SHIFT: TIRE INSPECTION",

        shiftStart: 22 * 60,
        shiftEnd: 30 * 60,

        expectedTotalRounds: 20,

        pointsPerCorrectDecision: 100,

        fullInspectionBonus: 10,

        streakBonus: 25,
        streakBonusEvery: 3,

        maximumEventLogEntries: 30
    };


    /*
     * Timeline khusus agar tiga bab cerita memiliki
     * waktu yang sudah direncanakan.
     *
     * 22:00 = awal shift
     * 00:43 = awal Discrepancy
     * 03:17 = awal Final Record
     * 06:00 = akhir shift
     */
    var SHIFT_TIMELINE = [
        "22:00",
        "22:24",
        "22:48",
        "23:12",
        "23:36",
        "00:00",
        "00:24",

        "00:43",
        "01:07",
        "01:31",
        "01:55",
        "02:19",
        "02:43",

        "03:17",
        "03:41",
        "04:05",
        "04:29",
        "04:53",
        "05:17",
        "05:41"
    ];


    var STORY_ACTS = [
        {
            id: "routine",
            title: "ROUTINE",
            firstRound: 1,
            lastRound: 7,
            time: "22:00",

            message:
                "Shift malam dimulai seperti biasa.\n\n" +
                "Periksa ban, cocokkan data, dan catat setiap keputusan. " +
                "Jangan membuat asumsi sebelum menemukan bukti."
        },

        {
            id: "discrepancy",
            title: "DISCREPANCY",
            firstRound: 8,
            lastRound: 13,
            time: "00:43",

            message:
                "Ada catatan yang tidak cocok dengan sumber pembandingnya.\n\n" +
                "Ini bukan alasan untuk langsung menolak setiap produk. " +
                "Temukan bagian mana yang benar-benar bertentangan."
        },

        {
            id: "final-record",
            title: "FINAL RECORD",
            firstRound: 14,
            lastRound: 20,
            time: "03:17",

            message:
                "Printer workstation menghasilkan sebuah catatan yang tidak " +
                "kamu ingat pernah buat.\n\n" +
                "Periksa setiap dokumen. Shift ini belum selesai."
        }
    ];


    /* =====================================================
       02. GAME STATE
       ===================================================== */

    var state = createInitialState();


    function createInitialState() {
        return {
            status: "idle",

            started: false,
            finished: false,
            submitted: false,

            currentIndex: 0,

            cases: [],
            currentCase: null,
            currentProductionRecord: null,

            score: 0,
            errors: 0,

            correctDecisions: 0,
            wrongDecisions: 0,

            acceptedCount: 0,
            rejectedCount: 0,

            currentStreak: 0,
            bestStreak: 0,

            casesReviewed: 0,

            inspectedAreas: [],
            discoveredClues: [],

            caseResults: [],

            startClock: "22:00",
            currentClock: "22:00",

            currentAct: "routine",

            lastDecision: null,
            lastDecisionCorrect: null,

            startedAt: null,
            finishedAt: null
        };
    }


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


    function setHidden(id, hidden) {
        var element = getElement(id);

        if (element) {
            element.hidden = Boolean(hidden);
        }
    }


    function toggleClass(element, className, enabled) {
        if (!element) {
            return;
        }

        element.classList.toggle(className, Boolean(enabled));
    }


    function formatNumber(value, minimumDigits) {
        return String(value).padStart(minimumDigits || 2, "0");
    }


    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }


    function readPath(object, path) {
        if (!object || !path) {
            return undefined;
        }

        var parts = path.split(".");
        var value = object;

        for (var i = 0; i < parts.length; i++) {
            if (
                value === null ||
                value === undefined
            ) {
                return undefined;
            }

            value = value[parts[i]];
        }

        return value;
    }


    function getFirstValue(object, paths, fallback) {
        for (var i = 0; i < paths.length; i++) {
            var value = readPath(object, paths[i]);

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {
                return value;
            }
        }

        return fallback;
    }


    function getDisplayValue(value, fallback) {
        if (
            value !== null &&
            typeof value === "object"
        ) {
            return getFirstValue(
                value,
                ["name", "fullName", "id", "code", "value"],
                fallback || "—"
            );
        }

        if (value === undefined || value === null || value === "") {
            return fallback || "—";
        }

        return value;
    }


    function safeCall(callback, fallbackValue) {
        try {
            return callback();
        } catch (error) {
            console.error(
                "[NIGHT SHIFT GAME] Module call failed:",
                error
            );

            return fallbackValue;
        }
    }


    /* =====================================================
       04. CASE DATABASE
       ===================================================== */

    function getCaseDatabase() {
        if (typeof getAnomalyCasesForShift === "function") {
            var cases = getAnomalyCasesForShift();

            if (Array.isArray(cases) && cases.length > 0) {
                return cases.slice();
            }
        }

        if (
            typeof ANOMALY_CASES !== "undefined" &&
            Array.isArray(ANOMALY_CASES) &&
            ANOMALY_CASES.length > 0
        ) {
            return ANOMALY_CASES.slice();
        }

        console.error(
            "[NIGHT SHIFT GAME] ANOMALY_CASES tidak ditemukan. " +
            "Pastikan anomalies.js dimuat sebelum game.js."
        );

        return [];
    }


    function getProcessName(processId) {
        if (
            typeof ANOMALY_PROCESS_CATALOG !== "undefined" &&
            Array.isArray(ANOMALY_PROCESS_CATALOG)
        ) {
            var process = ANOMALY_PROCESS_CATALOG.find(function (item) {
                return item.id === processId;
            });

            if (process) {
                return process.name;
            }
        }

        return String(processId || "UNKNOWN PROCESS")
            .replace(/-/g, " ")
            .toUpperCase();
    }


    /* =====================================================
       05. SHIFT CLOCK
       ===================================================== */

    function getClockForRound(index) {
        if (index < 0) {
            return "22:00";
        }

        if (index >= SHIFT_TIMELINE.length) {
            return "06:00";
        }

        return SHIFT_TIMELINE[index];
    }


    function getTimelineMinutes(clock) {
        var parts = String(clock).split(":");

        var hours = Number(parts[0]);
        var minutes = Number(parts[1]);

        if (
            !Number.isFinite(hours) ||
            !Number.isFinite(minutes)
        ) {
            return GAME_CONFIG.shiftStart;
        }

        var totalMinutes = (hours * 60) + minutes;

        /*
         * Jam setelah tengah malam berada pada hari berikutnya.
         */
        if (totalMinutes < GAME_CONFIG.shiftStart) {
            totalMinutes += 24 * 60;
        }

        return totalMinutes;
    }


    function getCurrentShiftMinutes() {
        return getTimelineMinutes(state.currentClock);
    }


    function getShiftAct(index) {
        var roundNumber = index + 1;

        for (var i = 0; i < STORY_ACTS.length; i++) {
            var act = STORY_ACTS[i];

            if (
                roundNumber >= act.firstRound &&
                roundNumber <= act.lastRound
            ) {
                return act;
            }
        }

        return STORY_ACTS[0];
    }


    /* =====================================================
       06. FALLBACK PRODUCTION DATA

       Digunakan hanya jika production.js belum menyediakan
       data. Nantinya production.js akan membuat detail yang
       lebih lengkap serta menyelaraskannya dengan anomali.
       ===================================================== */

    function createFallbackProductionRecord(caseData, index) {
        var processName = getProcessName(caseData.processId);

        var startTime = getClockForRound(index);
        var startMinutes = getTimelineMinutes(startTime);

        var finishMinutes = startMinutes + 12;

        var finishHours = Math.floor(
            (finishMinutes % 1440) / 60
        );

        var finishRemainingMinutes = finishMinutes % 60;

        var finishTime =
            formatNumber(finishHours) +
            ":" +
            formatNumber(finishRemainingMinutes);

        var operators = [
            {
                name: "Nara Wijaya",
                id: "EMP-024"
            },
            {
                name: "Dimas Aruna",
                id: "EMP-031"
            },
            {
                name: "Sinta Mahesa",
                id: "EMP-018"
            },
            {
                name: "Arka Pradana",
                id: "EMP-042"
            },
            {
                name: "Mira Adinata",
                id: "EMP-027"
            }
        ];

        var operator = operators[index % operators.length];

        var previousProcesses = {
            banbury: "MATERIAL PREPARATION",
            extruding: "BANBURY",
            bead: "MATERIAL PREPARATION",
            cutting: "EXTRUDING",
            building: "CUTTING",
            curing: "BUILDING",
            "final-inspection": "CURING",
            tube: "SEPARATE PRODUCT LINE"
        };

        var batchNumber =
            "BW-" + formatNumber(2200 + index, 4);

        var serial =
            "BT-" + formatNumber(100 + index, 6);

        var recordId =
            "PR-" + formatNumber(index + 1, 4);

        var anomalyList = [];

        if (typeof getAnomaliesForCase === "function") {
            anomalyList = safeArray(
                getAnomaliesForCase(caseData)
            );
        }

        var productionNotes =
            "Routine production record. " +
            "All displayed values are fictional.";

        if (anomalyList.length > 0) {
            productionNotes =
                "Reference discrepancy recorded: " +
                anomalyList[0].clue;
        }

        var reportObservation =
            "Preliminary observation recorded. " +
            "Verify the product and documents before deciding.";

        var reportAnomalies = anomalyList.filter(function (anomaly) {
            return anomaly.area === "report";
        });

        if (reportAnomalies.length > 0) {
            reportObservation = reportAnomalies[0].clue;
        }

        return {
            recordId: recordId,

            processName: processName,

            batchNumber: batchNumber,
            materialBatch: batchNumber,

            tireSerial: serial,

            operatorName: operator.name,
            operatorId: operator.id,
            operatorShift: "22:00 - 06:00",

            startTime: startTime,
            finishTime: finishTime,

            previousProcess:
                previousProcesses[caseData.processId] ||
                "REFERENCE NOT AVAILABLE",

            productionNotes: productionNotes,

            production: {
                recordId: recordId,
                processName: processName,
                batchNumber: batchNumber,
                materialBatch: batchNumber,
                tireSerial: serial,

                operatorName: operator.name,
                operatorId: operator.id,
                operatorShift: "22:00 - 06:00",

                startTime: startTime,
                finishTime: finishTime,

                previousProcess:
                    previousProcesses[caseData.processId] ||
                    "REFERENCE NOT AVAILABLE",

                notes: productionNotes
            },

            report: {
                reportNumber:
                    "IR-" + formatNumber(index + 1, 4),

                tireSerial: serial,

                inspectorName: "R. HAKIM",
                inspectionTime: finishTime,

                batchNumber: batchNumber,

                status: "PENDING",

                observations: reportObservation,

                signature: "________________"
            },

            tire: {
                serial: serial,
                visualCondition: "PENDING VISUAL SCAN"
            }
        };
    }


    /* =====================================================
       07. PRODUCTION MODULE INTEGRATION
       ===================================================== */

    function createProductionRecord(caseData, index) {
        var context = {
            roundNumber: index + 1,
            roundIndex: index,

            shiftClock: getClockForRound(index),

            shiftMinutes: getTimelineMinutes(
                getClockForRound(index)
            ),

            totalRounds: state.cases.length,

            previousCase:
                index > 0
                    ? state.cases[index - 1]
                    : null
        };

        var productionModule = window.NightShiftProduction;

        if (
            productionModule &&
            typeof productionModule.createRecord === "function"
        ) {
            var result = safeCall(function () {
                return productionModule.createRecord(
                    caseData,
                    context
                );
            }, null);

            if (result && typeof result === "object") {
                return result;
            }
        }

        if (
            productionModule &&
            typeof productionModule.createProductionRecord === "function"
        ) {
            var alternateResult = safeCall(function () {
                return productionModule.createProductionRecord(
                    caseData,
                    context
                );
            }, null);

            if (
                alternateResult &&
                typeof alternateResult === "object"
            ) {
                return alternateResult;
            }
        }

        /*
         * Compatibility fallback for a future production.js
         * that exposes a standalone function instead.
         */
        if (typeof window.generateProductionRecord === "function") {
            var generated = safeCall(function () {
                return window.generateProductionRecord(
                    caseData,
                    context
                );
            }, null);

            if (generated && typeof generated === "object") {
                return generated;
            }
        }

        return createFallbackProductionRecord(caseData, index);
    }


    /* =====================================================
       08. RENDER PRODUCTION RECORD
       ===================================================== */

    function renderProductionRecord(record) {
        var data = record || {};

        var production = data.production || data;

        var report = data.report || {};

        setText(
            "operatorName",
            getDisplayValue(
                getFirstValue(
                    data,
                    ["operatorName", "operator.name", "production.operatorName"],
                    getFirstValue(production, ["operatorName", "operator.name"], "—")
                ),
                "—"
            )
        );

        setText(
            "operatorId",
            getDisplayValue(
                getFirstValue(
                    data,
                    ["operatorId", "operator.id", "production.operatorId"],
                    getFirstValue(production, ["operatorId", "operator.id"], "—")
                ),
                "—"
            )
        );

        setText(
            "operatorShift",
            getDisplayValue(
                getFirstValue(
                    data,
                    ["operatorShift", "shift", "production.operatorShift"],
                    getFirstValue(production, ["operatorShift", "shift"], "—")
                ),
                "—"
            )
        );

        setText(
            "recordProcess",
            getDisplayValue(
                getFirstValue(
                    data,
                    ["processName", "process.name", "production.processName"],
                    getFirstValue(production, ["processName", "process.name"], "—")
                ),
                "—"
            )
        );

        setText(
            "productionStartTime",
            getDisplayValue(
                getFirstValue(
                    data,
                    ["startTime", "productionStartTime", "production.startTime"],
                    getFirstValue(production, ["startTime"], "—")
                ),
                "—"
            )
        );

        setText(
            "productionEndTime",
            getDisplayValue(
                getFirstValue(
                    data,
                    ["finishTime", "endTime", "production.finishTime"],
                    getFirstValue(production, ["finishTime", "endTime"], "—")
                ),
                "—"
            )
        );

        setText(
            "materialBatch",
            getDisplayValue(
                getFirstValue(
                    data,
                    ["materialBatch", "batchNumber", "batch.id"],
                    getFirstValue(production, ["materialBatch", "batchNumber"], "—")
                ),
                "—"
            )
        );

        setText(
            "previousProcess",
            getDisplayValue(
                getFirstValue(
                    data,
                    ["previousProcess", "production.previousProcess"],
                    getFirstValue(production, ["previousProcess"], "—")
                ),
                "—"
            )
        );

        setText(
            "productionNotes",
            getDisplayValue(
                getFirstValue(
                    data,
                    ["productionNotes", "notes", "production.notes"],
                    getFirstValue(production, ["notes"], "No additional notes recorded.")
                ),
                "No additional notes recorded."
            )
        );

        setText(
            "productionRecordId",
            getDisplayValue(
                getFirstValue(
                    data,
                    ["recordId", "productionRecordId", "production.recordId", "id"],
                    getFirstValue(production, ["recordId", "id"], "—")
                ),
                "—"
            )
        );


        /* Report */

        setText(
            "reportNumber",
            getDisplayValue(
                getFirstValue(
                    data,
                    ["reportNumber", "report.reportNumber"],
                    getFirstValue(report, ["reportNumber", "number"], "IR-0001")
                ),
                "IR-0001"
            )
        );

        setText(
            "reportTireSerial",
            getDisplayValue(
                getFirstValue(
                    data,
                    ["reportTireSerial", "report.tireSerial", "tireSerial"],
                    getFirstValue(report, ["tireSerial"], "—")
                ),
                "—"
            )
        );

        setText(
            "reportInspector",
            getDisplayValue(
                getFirstValue(
                    data,
                    ["reportInspector", "report.inspectorName", "inspector.name"],
                    getFirstValue(report, ["inspectorName", "inspector.name"], "—")
                ),
                "—"
            )
        );

        setText(
            "reportTime",
            getDisplayValue(
                getFirstValue(
                    data,
                    ["reportTime", "report.inspectionTime"],
                    getFirstValue(report, ["inspectionTime"], "—")
                ),
                "—"
            )
        );

        setText(
            "reportBatch",
            getDisplayValue(
                getFirstValue(
                    data,
                    ["reportBatch", "report.batchNumber", "batchNumber"],
                    getFirstValue(report, ["batchNumber"], "—")
                ),
                "—"
            )
        );

        setText(
            "reportObservations",
            getDisplayValue(
                getFirstValue(
                    data,
                    ["reportObservations", "report.observations"],
                    getFirstValue(
                        report,
                        ["observations", "notes"],
                        "Awaiting inspector evaluation."
                    )
                ),
                "Awaiting inspector evaluation."
            )
        );

        setText(
            "reportSignature",
            getDisplayValue(
                getFirstValue(
                    data,
                    ["reportSignature", "report.signature"],
                    getFirstValue(report, ["signature"], "________________")
                ),
                "________________"
            )
        );


        /* Keep the visible report pending until a decision. */

        setReportStamp("PENDING");

        setText("reportFooterStatus", "NOT VERIFIED");
    }


    /* =====================================================
       09. REPORT STAMP
       ===================================================== */

    function setReportStamp(decision) {
        var stamp = getElement("reportStamp");

        if (!stamp) {
            setText("reportStatus", decision);
            return;
        }

        stamp.classList.remove(
            "stamp-ok",
            "stamp-ng",
            "stamp-anomaly"
        );

        var normalizedDecision =
            String(decision || "PENDING").toUpperCase();

        var label = normalizedDecision;

        if (normalizedDecision === "OK") {
            stamp.classList.add("stamp-ok");
            stamp.setAttribute(
                "aria-label",
                "Decision recorded: OK"
            );
        } else if (normalizedDecision === "NG") {
            stamp.classList.add("stamp-ng");
            stamp.setAttribute(
                "aria-label",
                "Decision recorded: NG"
            );
        } else {
            label = "PENDING";

            stamp.setAttribute(
                "aria-label",
                "Inspection decision not recorded"
            );
        }

        setText("reportStatus", label);
    }


    /* =====================================================
       10. CLEAR CURRENT INSPECTION
       ===================================================== */

    function resetCurrentInspection() {
        state.submitted = false;

        state.inspectedAreas = [];
        state.discoveredClues = [];

        state.lastDecision = null;
        state.lastDecisionCorrect = null;

        setHidden("decisionFeedback", true);

        setText("feedbackTitle", "DECISION RESULT");
        setText("feedbackMessage", "");

        setText(
            "inspectionHint",
            "No areas inspected yet. Examine the product and " +
            "cross-check the records before deciding."
        );

        setText("scanStatus", "NOT STARTED");

        setText("reportFooterStatus", "NOT VERIFIED");

        var clueList = getElement("clueList");

        if (clueList) {
            clueList.replaceChildren();
        }

        var areaButtons = document.querySelectorAll(
            ".area-button[data-area]"
        );

        areaButtons.forEach(function (button) {
            button.classList.remove("inspected");
            button.disabled = false;
            button.removeAttribute("aria-pressed");
        });

        var decisionButtons = [
            getElement("decisionOK"),
            getElement("decisionNG")
        ];

        decisionButtons.forEach(function (button) {
            if (!button) {
                return;
            }

            button.disabled = false;
            button.classList.remove("decision-locked");
        });

        var stamp = getElement("reportStamp");

        if (stamp) {
            stamp.classList.remove(
                "stamp-ok",
                "stamp-ng",
                "stamp-anomaly"
            );
        }

        var caseStatus = getElement("caseStatus");

        if (caseStatus) {
            caseStatus.classList.remove(
                "status-ok",
                "status-ng"
            );

            caseStatus.textContent = "AWAITING INSPECTION";
        }
    }


    /* =====================================================
       11. RENDER CURRENT CASE
       ===================================================== */

    function renderCurrentCase() {
        var caseData = state.currentCase;

        if (!caseData) {
            return;
        }

        state.currentClock = getClockForRound(
            state.currentIndex
        );

        var processName = getProcessName(caseData.processId);

        var productionRecord = createProductionRecord(
            caseData,
            state.currentIndex
        );

        state.currentProductionRecord = productionRecord;

        resetCurrentInspection();


        /* Case headline */

        setText("caseTitle", caseData.title || "Inspection Record");

        setText(
            "caseNumber",
            "CASE " + formatNumber(state.currentIndex + 1)
        );

        setText("processName", processName);

        setText(
            "batchNumber",
            getDisplayValue(
                getFirstValue(
                    productionRecord,
                    ["batchNumber", "batch.id", "production.batchNumber"],
                    "BW-0001"
                ),
                "BW-0001"
            )
        );

        setText(
            "tireSerial",
            getDisplayValue(
                getFirstValue(
                    productionRecord,
                    ["tireSerial", "tire.serial", "serial", "production.tireSerial"],
                    "BT-000001"
                ),
                "BT-000001"
            )
        );


        renderProductionRecord(productionRecord);

        updateHUD();


        /* Try to render the tire illustration. */

        if (
            window.NightShiftTires &&
            typeof window.NightShiftTires.render === "function"
        ) {
            safeCall(function () {
                window.NightShiftTires.render(
                    caseData,
                    productionRecord
                );
            }, null);
        } else if (
            typeof window.renderTireVisual === "function"
        ) {
            safeCall(function () {
                window.renderTireVisual(
                    caseData,
                    productionRecord
                );
            }, null);
        }


        /* Let inspection.js initialize its clues. */

        if (
            window.NightShiftInspection &&
            typeof window.NightShiftInspection.loadCase === "function"
        ) {
            safeCall(function () {
                window.NightShiftInspection.loadCase(
                    caseData,
                    productionRecord,
                    getState()
                );
            }, null);
        } else if (
            window.NightShiftInspection &&
            typeof window.NightShiftInspection.renderCase === "function"
        ) {
            safeCall(function () {
                window.NightShiftInspection.renderCase(
                    caseData,
                    productionRecord
                );
            }, null);
        }


        var processTitle = processName;

        addLogEntry(
            state.currentClock,
            "Case " +
            formatNumber(state.currentIndex + 1) +
            " loaded: " +
            processTitle +
            ".",
            "log-system"
        );

        if (caseData.caseNote) {
            addLogEntry(
                state.currentClock,
                caseData.caseNote,
                ""
            );
        }

        state.status = "inspecting";

        updateSystemStatus();

        triggerActMilestone();

        if (caseData.storyEvent) {
            showStoryEvent(
                caseData.storyEvent,
                "case"
            );
        }
    }


    /* =====================================================
       12. PROGRESS / HUD
       ===================================================== */

    function updateHUD() {
        var total = state.cases.length || GAME_CONFIG.expectedTotalRounds;

        var currentRound = state.currentIndex + 1;

        if (state.finished) {
            currentRound = total;
        }

        setText(
            "roundCounter",
            formatNumber(currentRound) +
            " / " +
            formatNumber(total)
        );

        setText(
            "scoreCounter",
            formatNumber(state.score, 3)
        );

        setText(
            "errorCounter",
            formatNumber(state.errors, 2)
        );

        setText(
            "shiftClock",
            state.finished
                ? "06:00"
                : state.currentClock
        );

        var progress = getElement("roundProgress");

        var progressFill = getElement("roundProgressFill");

        var completed = state.casesReviewed;

        if (state.finished) {
            completed = total;
        }

        var percentage = total > 0
            ? Math.min(100, (completed / total) * 100)
            : 0;

        if (progress) {
            progress.setAttribute("aria-valuenow", String(completed));
            progress.setAttribute("aria-valuemax", String(total));
        }

        if (progressFill) {
            progressFill.style.width = percentage + "%";
        }
    }


    function updateSystemStatus() {
        var status = getElement("systemStatus");

        if (!status) {
            return;
        }

        if (state.finished) {
            status.textContent = "SHIFT CLOSED";
            return;
        }

        if (!state.started) {
            status.textContent = "SYSTEM STANDBY";
            return;
        }

        var act = getShiftAct(state.currentIndex);

        status.textContent = act.title + " // ACTIVE";
    }


    /* =====================================================
       13. EVENT LOG
       ===================================================== */

    function addLogEntry(time, message, type) {
        var log = getElement("eventLog");

        if (!log) {
            return;
        }

        var entry = document.createElement("p");

        entry.className = "log-entry";

        if (type) {
            entry.classList.add(type);
        }

        var timeElement = document.createElement("span");

        timeElement.className = "log-time";
        timeElement.textContent = time || state.currentClock;

        var messageElement = document.createElement("span");

        messageElement.className = "log-message";
        messageElement.textContent = message || "";

        entry.appendChild(timeElement);
        entry.appendChild(messageElement);

        log.appendChild(entry);

        while (
            log.children.length >
            GAME_CONFIG.maximumEventLogEntries
        ) {
            log.removeChild(log.firstElementChild);
        }

        log.scrollTop = log.scrollHeight;
    }


    function clearEventLog() {
        var log = getElement("eventLog");

        if (!log) {
            return;
        }

        log.replaceChildren();

        addLogEntry(
            "22:00",
            "Inspection workstation initialized.",
            "log-system"
        );
    }


    /* =====================================================
       14. STORY EVENTS
       ===================================================== */

    function triggerActMilestone() {
        var roundNumber = state.currentIndex + 1;

        /*
         * The introduction for Routine is handled by the
         * start screen. Only show popups at the act changes.
         */
        var milestone = null;

        if (roundNumber === 8) {
            milestone = STORY_ACTS[1];
        } else if (roundNumber === 14) {
            milestone = STORY_ACTS[2];
        }

        if (!milestone) {
            return;
        }

        var event = {
            title: milestone.title,
            category: "SHIFT REPORT // " + milestone.time,
            message: milestone.message,
            timestamp: milestone.time,
            act: milestone.id
        };

        showStoryEvent(event, "act");

        addLogEntry(
            milestone.time,
            "Story phase changed: " + milestone.title + ".",
            "log-warning"
        );
    }


    function showStoryEvent(event, source) {
        if (!event || typeof event !== "object") {
            return;
        }

        var context = {
            source: source || "game",

            timestamp:
                event.timestamp ||
                state.currentClock,

            roundNumber: state.currentIndex + 1,

            caseId:
                state.currentCase
                    ? state.currentCase.id
                    : null,

            act: state.currentAct
        };

        if (
            window.NightShiftStory &&
            typeof window.NightShiftStory.showEvent === "function"
        ) {
            safeCall(function () {
                window.NightShiftStory.showEvent(
                    event,
                    context
                );
            }, null);

            return;
        }


        /*
         * Fallback overlay in case story.js has not been
         * created yet.
         */
        var overlay = getElement("storyOverlay");

        if (!overlay) {
            addLogEntry(
                context.timestamp,
                event.title || "Unexpected event",
                "log-warning"
            );

            return;
        }

        setText(
            "storyTitle",
            event.title || "SYSTEM MESSAGE"
        );

        setText(
            "storyCategory",
            event.category || "UNEXPECTED EVENT"
        );

        setText(
            "storyMessage",
            event.message || "An unexpected event has occurred."
        );

        setText(
            "storyTimestamp",
            "TIME: " + context.timestamp
        );

        overlay.hidden = false;

        var continueButton = getElement("storyContinueButton");

        if (
            continueButton &&
            continueButton.dataset.gameBound !== "true"
        ) {
            continueButton.dataset.gameBound = "true";

            continueButton.addEventListener("click", function () {
                var activeOverlay = getElement("storyOverlay");

                if (activeOverlay) {
                    activeOverlay.hidden = true;
                }
            });
        }
    }


    /* =====================================================
       15. START GAME
       ===================================================== */

    function start() {
        var cases = getCaseDatabase();

        if (cases.length === 0) {
            addLogEntry(
                "22:00",
                "Cannot start: anomaly database is unavailable.",
                "log-danger"
            );

            return {
                success: false,
                reason: "no-cases"
            };
        }

        state = createInitialState();

        state.cases = cases;
        state.started = true;
        state.finished = false;
        state.startedAt = new Date();

        state.currentIndex = 0;
        state.currentAct = "routine";

        state.currentCase = state.cases[0];

        state.startClock = "22:00";
        state.currentClock = "22:00";

        setHidden("startScreen", true);
        setHidden("gameScreen", false);
        setHidden("endingScreen", true);

        setHidden("storyOverlay", true);

        clearEventLog();

        updateSystemStatus();

        /*
         * Start music after the player has clicked BEGIN.
         */
        if (
            window.NightShiftAudio &&
            typeof window.NightShiftAudio.playBackgroundMusic === "function"
        ) {
            window.NightShiftAudio.playBackgroundMusic();
        } else if (typeof window.startBackgroundMusic === "function") {
            window.startBackgroundMusic();
        }

        addLogEntry(
            "22:00",
            "Night shift started. Inspector assigned to workstation.",
            "log-system"
        );

        renderCurrentCase();

        return {
            success: true,
            totalRounds: state.cases.length
        };
    }


    /* =====================================================
       16. MARK AN INSPECTION AREA AS REVIEWED
       ===================================================== */

    function markAreaInspected(area, finding) {
        if (!state.started || state.finished || state.submitted) {
            return false;
        }

        if (!area) {
            return false;
        }

        var areaId = String(area).toLowerCase();

        if (state.inspectedAreas.indexOf(areaId) === -1) {
            state.inspectedAreas.push(areaId);
        }

        var button = document.querySelector(
            '.area-button[data-area="' + areaId + '"]'
        );

        if (button) {
            button.classList.add("inspected");
            button.setAttribute("aria-pressed", "true");
        }

        setText(
            "scanStatus",
            formatNumber(state.inspectedAreas.length) +
            " AREA(S) CHECKED"
        );

        if (finding) {
            if (typeof finding === "string") {
                addDiscoveredClue({
                    text: finding,
                    area: areaId,
                    source: "visual"
                });
            } else if (typeof finding === "object") {
                var findings = Array.isArray(finding)
                    ? finding
                    : [finding];

                findings.forEach(function (item) {
                    addDiscoveredClue(item);
                });
            }
        }

        return true;
    }


    /* =====================================================
       17. DISCOVERED CLUES
       ===================================================== */

    function addDiscoveredClue(clue) {
        if (!clue || state.finished) {
            return false;
        }

        var clueObject;

        if (typeof clue === "string") {
            clueObject = {
                text: clue,
                area: "unknown",
                source: "inspection"
            };
        } else {
            clueObject = {
                id: clue.id || null,

                text:
                    clue.text ||
                    clue.clue ||
                    clue.description ||
                    "Evidence recorded.",

                area: clue.area || "unknown",

                source: clue.source || "inspection",

                severity: clue.severity || "normal"
            };
        }

        var duplicate = state.discoveredClues.some(function (existing) {
            return (
                existing.id &&
                clueObject.id &&
                existing.id === clueObject.id
            ) || (
                existing.text === clueObject.text &&
                existing.area === clueObject.area
            );
        });

        if (duplicate) {
            return false;
        }

        state.discoveredClues.push(clueObject);

        var clueList = getElement("clueList");

        if (clueList) {
            var item = document.createElement("li");

            item.textContent = clueObject.text;

            if (clueObject.severity === "high") {
                item.classList.add("clue-danger");
            } else if (clueObject.severity === "medium") {
                item.classList.add("clue-warning");
            } else {
                item.classList.add("clue-normal");
            }

            clueList.appendChild(item);
        }

        setText(
            "inspectionHint",
            "Evidence recorded. Compare the findings with the production record and inspection report."
        );

        return true;
    }


    /* =====================================================
       18. EVALUATE PLAYER DECISION

       Preferred inspection.js interface:

       NightShiftInspection.evaluateDecision({
           caseData,
           decision,
           productionRecord,
           inspectedAreas,
           discoveredClues,
           gameState
       });

       Expected return:
       {
           correct: true / false,
           expectedDecision: "OK" / "NG",
           feedbackTitle: "...",
           feedbackMessage: "..."
       }
       ===================================================== */

    function evaluateDecision(decision) {
        var caseData = state.currentCase;

        var fallbackCorrect =
            decision === caseData.expectedDecision;

        var fallback = {
            correct: fallbackCorrect,

            expectedDecision: caseData.expectedDecision,

            feedbackTitle: fallbackCorrect
                ? "DECISION CORRECT"
                : "DECISION ERROR",

            feedbackMessage: fallbackCorrect
                ? "Your decision matches the evidence classification for this case."
                : "Your decision conflicts with the case classification. Review the clues and compare the documents carefully.",

            reasons: []
        };

        var inspection = window.NightShiftInspection;

        if (
            !inspection ||
            typeof inspection.evaluateDecision !== "function"
        ) {
            return fallback;
        }

        var payload = {
            caseData: caseData,

            decision: decision,

            productionRecord: state.currentProductionRecord,

            inspectedAreas: state.inspectedAreas.slice(),

            discoveredClues: state.discoveredClues.slice(),

            gameState: getState()
        };

        var result = safeCall(function () {
            return inspection.evaluateDecision(payload);
        }, null);

        if (typeof result === "boolean") {
            return {
                correct: result,

                expectedDecision: caseData.expectedDecision,

                feedbackTitle: result
                    ? "DECISION CORRECT"
                    : "DECISION ERROR",

                feedbackMessage: result
                    ? "The decision matches the evaluation."
                    : "The decision does not match the evaluation.",

                reasons: []
            };
        }

        if (result && typeof result === "object") {
            var correct = result.correct;

            if (typeof correct !== "boolean") {
                correct = result.isCorrect;
            }

            if (typeof correct !== "boolean") {
                correct = fallbackCorrect;
            }

            return {
                correct: correct,

                expectedDecision:
                    result.expectedDecision ||
                    fallback.expectedDecision,

                feedbackTitle:
                    result.feedbackTitle ||
                    (correct ? "DECISION CORRECT" : "DECISION ERROR"),

                feedbackMessage:
                    result.feedbackMessage ||
                    result.message ||
                    fallback.feedbackMessage,

                reasons: safeArray(result.reasons),

                details: result
            };
        }

        return fallback;
    }


    /* =====================================================
       19. SUBMIT OK / NG DECISION
       ===================================================== */

    function submitDecision(decision) {
        if (!state.started || state.finished) {
            return {
                success: false,
                reason: "game-not-active"
            };
        }

        if (!state.currentCase) {
            return {
                success: false,
                reason: "no-current-case"
            };
        }

        if (state.submitted) {
            return {
                success: false,
                reason: "already-submitted"
            };
        }

        var normalizedDecision =
            String(decision || "").trim().toUpperCase();

        if (
            normalizedDecision !== "OK" &&
            normalizedDecision !== "NG"
        ) {
            return {
                success: false,
                reason: "invalid-decision"
            };
        }

        var result = evaluateDecision(normalizedDecision);

        state.submitted = true;

        state.lastDecision = normalizedDecision;
        state.lastDecisionCorrect = result.correct;

        state.casesReviewed++;

        if (normalizedDecision === "OK") {
            state.acceptedCount++;
        } else {
            state.rejectedCount++;
        }


        /* Score */

        var roundPoints = 0;
        var bonusPoints = 0;

        if (result.correct) {
            state.correctDecisions++;

            roundPoints = GAME_CONFIG.pointsPerCorrectDecision;

            state.currentStreak++;

            state.bestStreak = Math.max(
                state.bestStreak,
                state.currentStreak
            );

            /*
             * Small bonus for reviewing all three visible
             * tire inspection areas.
             */
            if (state.inspectedAreas.length >= 3) {
                bonusPoints += GAME_CONFIG.fullInspectionBonus;
            }

            /*
             * Small streak bonus every three correct decisions.
             */
            if (
                state.currentStreak > 0 &&
                state.currentStreak %
                    GAME_CONFIG.streakBonusEvery === 0
            ) {
                bonusPoints += GAME_CONFIG.streakBonus;
            }

            state.score += roundPoints + bonusPoints;
        } else {
            state.errors++;
            state.wrongDecisions++;

            state.currentStreak = 0;
        }


        /* Update report with the player's actual decision. */

        setReportStamp(normalizedDecision);

        setText(
            "reportFooterStatus",
            "DECISION RECORDED"
        );


        /* Set case status. */

        var caseStatus = getElement("caseStatus");

        if (caseStatus) {
            caseStatus.classList.remove(
                "status-ok",
                "status-ng"
            );

            if (normalizedDecision === "OK") {
                caseStatus.textContent = "PRODUCT PASSED";
                caseStatus.classList.add("status-ok");
            } else {
                caseStatus.textContent = "PRODUCT REJECTED";
                caseStatus.classList.add("status-ng");
            }
        }


        /* Disable decision buttons after submission. */

        var decisionButtons = [
            getElement("decisionOK"),
            getElement("decisionNG")
        ];

        decisionButtons.forEach(function (button) {
            if (!button) {
                return;
            }

            button.disabled = true;
            button.classList.add("decision-locked");
        });


        /* Feedback */

        setText(
            "feedbackTitle",
            result.feedbackTitle
        );

        var feedbackMessage = result.feedbackMessage || "";

        if (result.correct) {
            var scoreText = "+" + roundPoints + " POINTS";

            if (bonusPoints > 0) {
                scoreText += "  //  BONUS +" + bonusPoints;
            }

            feedbackMessage =
                feedbackMessage +
                "\n\n" +
                scoreText;
        } else {
            feedbackMessage =
                feedbackMessage +
                "\n\nEXPECTED DECISION: " +
                result.expectedDecision;
        }

        setText("feedbackMessage", feedbackMessage);

        setHidden("decisionFeedback", false);


        /* The next-round button label changes at the end. */

        var nextButton = getElement("nextRoundButton");

        if (nextButton) {
            nextButton.textContent =
                state.currentIndex >= state.cases.length - 1
                    ? "VIEW FINAL REPORT →"
                    : "CONTINUE →";
        }


        /* Audio feedback */

        if (
            window.NightShiftAudio &&
            typeof window.NightShiftAudio.playDecisionResult === "function"
        ) {
            window.NightShiftAudio.playDecisionResult(
                result.correct
            );
        } else if (result.correct) {
            if (typeof window.playCorrectSound === "function") {
                window.playCorrectSound();
            }
        } else if (typeof window.playWrongSound === "function") {
            window.playWrongSound();
        }


        /* Event log */

        var logMessage =
            normalizedDecision +
            " decision recorded. ";

        if (result.correct) {
            logMessage += "Evidence evaluation passed.";
        } else {
            logMessage += "Decision conflicts with the case evidence.";
        }

        addLogEntry(
            state.currentClock,
            logMessage,
            result.correct ? "log-system" : "log-danger"
        );


        /* Save result for the final report. */

        state.caseResults.push({
            caseId: state.currentCase.id,

            roundNumber: state.currentIndex + 1,

            processId: state.currentCase.processId,

            decision: normalizedDecision,

            expectedDecision: result.expectedDecision,

            correct: result.correct,

            scoreAwarded: result.correct
                ? roundPoints + bonusPoints
                : 0,

            inspectedAreas: state.inspectedAreas.slice(),

            discoveredClues: state.discoveredClues.slice(),

            clock: state.currentClock
        });

        state.status = "decision-made";

        updateHUD();

        return {
            success: true,

            correct: result.correct,

            decision: normalizedDecision,

            expectedDecision: result.expectedDecision,

            pointsAwarded: result.correct
                ? roundPoints + bonusPoints
                : 0,

            result: result
        };
    }


    /* =====================================================
       20. NEXT ROUND
       ===================================================== */

    function nextRound() {
        if (!state.started || state.finished) {
            return false;
        }

        if (!state.submitted) {
            return false;
        }

        var nextIndex = state.currentIndex + 1;

        if (nextIndex >= state.cases.length) {
            finishGame();
            return true;
        }

        state.currentIndex = nextIndex;

        state.currentCase = state.cases[nextIndex];

        state.currentProductionRecord = null;

        state.currentClock = getClockForRound(nextIndex);

        state.currentAct = getShiftAct(nextIndex).id;

        renderCurrentCase();

        return true;
    }


    /* =====================================================
       21. ENDING SELECTION
       ===================================================== */

    function calculateAccuracy() {
        if (state.casesReviewed === 0) {
            return 0;
        }

        return Math.round(
            (state.correctDecisions / state.casesReviewed) * 100
        );
    }


    function determineEnding() {
        var accuracy = calculateAccuracy();

        if (
            state.errors === 0 &&
            state.casesReviewed === state.cases.length
        ) {
            return {
                id: "clean-record",

                title: "THE CLEAN RECORD",

                symbol: "✓",

                description:
                    "All twenty decisions were consistent with the available evidence. " +
                    "The shift is complete. Yet one final record remains in the archive.",

                finalRecord:
                    "SHIFT STATUS: COMPLETED\n" +
                    "DECISION ERRORS: 0\n" +
                    "FINAL NOTE: No discrepancies were confirmed by your decisions."
            };
        }

        if (
            accuracy >= 75 &&
            state.errors <= 5
        ) {
            return {
                id: "shift-complete",

                title: "SHIFT COMPLETE",

                symbol: "■",

                description:
                    "You made it to 06:00. Most of your decisions held up under review, " +
                    "but several records will require another investigation.",

                finalRecord:
                    "SHIFT STATUS: COMPLETED WITH DISCREPANCIES\n" +
                    "DECISION ACCURACY: " + accuracy + "%\n" +
                    "FINAL NOTE: Some unresolved records remain."
            };
        }

        return {
            id: "final-record",

            title: "THE FINAL RECORD",

            symbol: "!",

            description:
                "Your inspection record is inconsistent. Before the workstation shuts down, " +
                "a final document appears with your name already written on it.",

            finalRecord:
                "SHIFT STATUS: REVIEW REQUIRED\n" +
                "DECISION ACCURACY: " + accuracy + "%\n" +
                "FINAL NOTE: The last report was filed before the shift ended."
        };
    }


    /* =====================================================
       22. FINISH GAME
       ===================================================== */

    function finishGame() {
        state.finished = true;
        state.submitted = true;
        state.status = "finished";
        state.finishedAt = new Date();

        state.currentClock = "06:00";

        var ending = determineEnding();

        var accuracy = calculateAccuracy();

        setHidden("startScreen", true);
        setHidden("gameScreen", true);
        setHidden("endingScreen", false);

        setHidden("storyOverlay", true);


        /* Ending content */

        setText("endingTitle", ending.title);

        setText(
            "endingSymbol",
            ending.symbol
        );

        setText(
            "endingDescription",
            ending.description
        );

        setText(
            "finalScore",
            formatNumber(state.score, 3)
        );

        setText(
            "finalCases",
            formatNumber(state.casesReviewed)
        );

        setText(
            "finalErrors",
            formatNumber(state.errors)
        );

        setText(
            "finalRecordText",
            ending.finalRecord
        );


        /* System status */

        updateHUD();
        updateSystemStatus();

        addLogEntry(
            "06:00",
            "Shift concluded. Final record generated.",
            "log-warning"
        );


        /* Save ending into state. */

        state.ending = ending;

        state.accuracy = accuracy;


        /* Notify story module if available. */

        if (
            window.NightShiftStory &&
            typeof window.NightShiftStory.showEnding === "function"
        ) {
            safeCall(function () {
                window.NightShiftStory.showEnding(
                    ending,
                    getState()
                );
            }, null);
        }

        return ending;
    }


    /* =====================================================
       23. RESET GAME
       ===================================================== */

    function reset() {
        state = createInitialState();

        if (
            window.NightShiftAudio &&
            typeof window.NightShiftAudio.stopAll === "function"
        ) {
            window.NightShiftAudio.stopAll();
        } else if (
            window.NightShiftAudio &&
            typeof window.NightShiftAudio.stopBackgroundMusic === "function"
        ) {
            window.NightShiftAudio.stopBackgroundMusic(true);
        }

        setHidden("startScreen", false);
        setHidden("gameScreen", true);
        setHidden("endingScreen", true);
        setHidden("storyOverlay", true);

        updateHUD();
        updateSystemStatus();

        return true;
    }


    /* =====================================================
       24. STATE ACCESSORS
       ===================================================== */

    function getCurrentCase() {
        return state.currentCase;
    }


    function getCurrentProductionRecord() {
        return state.currentProductionRecord;
    }


    function getCases() {
        return state.cases.slice();
    }


    function getState() {
        return {
            status: state.status,

            started: state.started,
            finished: state.finished,
            submitted: state.submitted,

            currentIndex: state.currentIndex,
            currentRound: state.currentIndex + 1,

            totalRounds: state.cases.length,

            currentCase: state.currentCase,

            currentProductionRecord:
                state.currentProductionRecord,

            score: state.score,
            errors: state.errors,

            correctDecisions: state.correctDecisions,
            wrongDecisions: state.wrongDecisions,

            acceptedCount: state.acceptedCount,
            rejectedCount: state.rejectedCount,

            currentStreak: state.currentStreak,
            bestStreak: state.bestStreak,

            casesReviewed: state.casesReviewed,

            inspectedAreas: state.inspectedAreas.slice(),

            discoveredClues: state.discoveredClues.slice(),

            currentClock: state.currentClock,
            currentAct: getShiftAct(state.currentIndex).id,

            lastDecision: state.lastDecision,
            lastDecisionCorrect: state.lastDecisionCorrect,

            accuracy: calculateAccuracy()
        };
    }


    /* =====================================================
       25. PUBLIC API
       ===================================================== */

    window.NightShiftGame = {

        /* Session control */
        start: start,
        reset: reset,
        restart: start,

        /* Round control */
        nextRound: nextRound,
        submitDecision: submitDecision,

        /* Current case */
        getCurrentCase: getCurrentCase,
        getCurrentProductionRecord: getCurrentProductionRecord,
        getCases: getCases,

        /* Inspection state */
        markAreaInspected: markAreaInspected,
        addDiscoveredClue: addDiscoveredClue,

        /* Story event */
        showStoryEvent: showStoryEvent,

        /* State and score */
        getState: getState,
        getScore: function () {
            return state.score;
        },
        getErrors: function () {
            return state.errors;
        },
        getAccuracy: calculateAccuracy,

        /* UI refresh */
        renderCurrentCase: renderCurrentCase,
        updateHUD: updateHUD,
        addLogEntry: addLogEntry,

        /* Clock and acts */
        getCurrentClock: function () {
            return state.currentClock;
        },
        getShiftAct: function () {
            return getShiftAct(state.currentIndex);
        },

        /* Endgame */
        finish: finishGame,
        determineEnding: determineEnding
    };


    /* =====================================================
       26. LEGACY GLOBAL ALIASES
       ===================================================== */

    /*
     * Optional aliases for other scripts or manual testing.
     * main.js can use NightShiftGame directly instead.
     */

    window.startNightShift = start;
    window.resetNightShift = reset;

    window.submitInspectionDecision = submitDecision;
    window.goToNextRound = nextRound;


    /* =====================================================
       27. INITIALIZATION
       ===================================================== */

    function initializeGameController() {
        updateSystemStatus();

        console.log(
            "[NIGHT SHIFT GAME] Controller initialized."
        );
    }


    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeGameController,
            { once: true }
        );
    } else {
        initializeGameController();
    }

})();

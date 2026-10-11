
/* =========================================================
   NIGHT SHIFT: TIRE INSPECTION
   FICTIONAL PRODUCTION DATABASE

   File: js/production.js

   FUNGSI:
   1. Data delapan kategori proses.
   2. Data roster operator fiktif.
   3. Data waktu dan jadwal shift.
   4. Data batch dan nomor serial.
   5. Data kartu produksi.
   6. Data laporan inspeksi.
   7. Penerapan anomali spesifik untuk setiap kasus.
   8. Penyedia data pembanding bagi inspection.js.
   9. Integrasi dengan game.js.

   CATATAN:
   Semua perusahaan, identitas, catatan, nilai, dan aturan
   teknis adalah fiksi untuk gameplay.

   Nilai dimensi dan kode dalam file ini bukan spesifikasi
   maupun prosedur inspeksi industri yang sesungguhnya.
   ========================================================= */

(function () {
    "use strict";


    /* =====================================================
       01. KONFIGURASI UMUM
       ===================================================== */

    var CONFIG = {
        plantName: "BLACKRIDGE TIRE WORKS",

        shiftName: "NIGHT SHIFT",

        shiftStart: "22:00",
        shiftEnd: "06:00",

        /*
         * Tanggal cerita fiktif.
         * Shift dimulai pada tanggal ini dan melewati tengah malam.
         */
        shiftStartDate: "2031-10-17",

        /*
         * Seluruh format dan spesifikasi produk di database
         * merupakan aturan cerita, bukan standar nyata.
         */
        nominalCuttingLength: 980,
        cuttingTolerance: 5
    };


    /* =====================================================
       02. REFERENSI DELAPAN PROSES FIKTIF
       ===================================================== */

    var PROCESS_DEFINITIONS = [

        {
            id: "banbury",
            name: "BANBURY",
            reference: "PR-BAN-01",

            description:
                "Fictional material mixing record.",

            previousProcess:
                "MATERIAL PREPARATION",

            defaultFormula:
                "MIX-A17",

            defaultBatchPrefix:
                "CMP",

            referenceRule:
                "Formula, batch, waktu, dan ID siklus harus konsisten."
        },

        {
            id: "extruding",
            name: "EXTRUDING",
            reference: "PR-EXT-02",

            description:
                "Fictional material profile record.",

            previousProcess:
                "BANBURY",

            defaultProfile:
                "P-04",

            defaultBatchPrefix:
                "EXT",

            referenceRule:
                "Kode profil, roll material, dan catatan panjang harus cocok."
        },

        {
            id: "bead",
            name: "BEAD",
            reference: "PR-BEA-03",

            description:
                "Fictional bead component record.",

            previousProcess:
                "MATERIAL PREPARATION",

            defaultSize:
                "B-16",

            defaultBatchPrefix:
                "BEA",

            referenceRule:
                "Jumlah dan label komponen harus sesuai dengan kartu kasus."
        },

        {
            id: "cutting",
            name: "CUTTING",
            reference: "PR-CUT-04",

            description:
                "Fictional material cutting record.",

            previousProcess:
                "EXTRUDING",

            defaultBatchPrefix:
                "CUT",

            defaultLength:
                980,

            defaultBatch:
                "CUT-2501",

            referenceRule:
                "Dimensi fiktif dan identitas potongan harus sesuai dengan order."
        },

        {
            id: "building",
            name: "BUILDING",
            reference: "PR-BLD-05",

            description:
                "Fictional product assembly record.",

            previousProcess:
                "CUTTING",

            defaultBatchPrefix:
                "BLD",

            referenceRule:
                "Ketersediaan komponen dan tujuan serial harus konsisten."
        },

        {
            id: "curing",
            name: "CURING",
            reference: "PR-CUR-06",

            description:
                "Fictional curing cycle record.",

            previousProcess:
                "BUILDING",

            defaultPress:
                "PR-08",

            defaultProfile:
                "CV-12",

            defaultBatchPrefix:
                "CUR",

            referenceRule:
                "Urutan waktu, referensi press, dan profil harus cocok."
        },

        {
            id: "final-inspection",
            name: "FINAL INSPECTION",
            reference: "PR-FIN-07",

            description:
                "Fictional final inspection report.",

            previousProcess:
                "CURING",

            defaultBatchPrefix:
                "FIN",

            referenceRule:
                "Serial, waktu pemeriksaan, observasi, dan keputusan harus konsisten."
        },

        {
            id: "tube",
            name: "TUBE",
            reference: "PR-TUB-08",

            description:
                "Fictional tube product record.",

            previousProcess:
                "SEPARATE PRODUCT LINE",

            defaultSize:
                "T-18",

            defaultBatchPrefix:
                "TB",

            referenceRule:
                "Batch material, ukuran fiktif, dan serial harus konsisten."
        }

    ];


    /* =====================================================
       03. ROSTER OPERATOR FIKTIF

       Identitas pembanding hanya tersedia di game.
       Setiap anomali identitas harus dibuktikan melalui ID,
       jadwal, lokasi, atau sumber data yang bertentangan.

       Nama yang tidak dikenal atau tampak mencurigakan
       tidak otomatis berarti operator tersebut anomali.
       ===================================================== */

    var OPERATOR_ROSTER = [

        {
            employeeId: "EMP-024",
            name: "Nara Wijaya",

            assignedShift: "22:00 - 06:00",
            attendance: "PRESENT",

            homeDepartment: "MATERIAL OPERATIONS",

            signatureReference: "SIG-EMP-024",

            badgeId: "BG-024"
        },

        {
            employeeId: "EMP-031",
            name: "Dimas Aruna",

            assignedShift: "22:00 - 06:00",
            attendance: "PRESENT",

            homeDepartment: "PROFILE OPERATIONS",

            signatureReference: "SIG-EMP-031",

            badgeId: "BG-031"
        },

        {
            employeeId: "EMP-018",
            name: "Sinta Mahesa",

            assignedShift: "22:00 - 06:00",
            attendance: "PRESENT",

            homeDepartment: "COMPONENT OPERATIONS",

            signatureReference: "SIG-EMP-018",

            badgeId: "BG-018"
        },

        {
            employeeId: "EMP-042",
            name: "Arka Pradana",

            assignedShift: "22:00 - 06:00",
            attendance: "PRESENT",

            homeDepartment: "ASSEMBLY OPERATIONS",

            signatureReference: "SIG-EMP-042",

            badgeId: "BG-042"
        },

        {
            employeeId: "EMP-027",
            name: "Mira Adinata",

            assignedShift: "22:00 - 06:00",
            attendance: "PRESENT",

            homeDepartment: "QUALITY OPERATIONS",

            signatureReference: "SIG-EMP-027",

            badgeId: "BG-027"
        }

    ];


    /* =====================================================
       04. REFERENSI INSPEKTOR FIKTIF
       ===================================================== */

    var INSPECTOR_ROSTER = [

        {
            inspectorId: "QC-011",
            name: "R. Hakim",
            signatureReference: "SIG-QC-011"
        },

        {
            inspectorId: "QC-016",
            name: "L. Aruna",
            signatureReference: "SIG-QC-016"
        },

        {
            inspectorId: "QC-021",
            name: "M. Santara",
            signatureReference: "SIG-QC-021"
        }

    ];


    /* =====================================================
       05. HELPER DASAR
       ===================================================== */

    function padNumber(value, digits) {
        return String(value).padStart(digits || 2, "0");
    }


    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }


    function cloneObject(value) {
        if (value === null || value === undefined) {
            return value;
        }

        if (Array.isArray(value)) {
            return value.map(cloneObject);
        }

        if (typeof value !== "object") {
            return value;
        }

        var result = {};

        Object.keys(value).forEach(function (key) {
            result[key] = cloneObject(value[key]);
        });

        return result;
    }


    function getProcessDefinition(processId) {
        for (var i = 0; i < PROCESS_DEFINITIONS.length; i++) {
            if (PROCESS_DEFINITIONS[i].id === processId) {
                return PROCESS_DEFINITIONS[i];
            }
        }

        return null;
    }


    function getOperatorById(employeeId) {
        var operator = OPERATOR_ROSTER.find(function (item) {
            return item.employeeId === employeeId;
        });

        return operator
            ? cloneObject(operator)
            : null;
    }


    function getOperatorByName(name) {
        var operator = OPERATOR_ROSTER.find(function (item) {
            return item.name === name;
        });

        return operator
            ? cloneObject(operator)
            : null;
    }


    function getInspectorByIndex(index) {
        var safeIndex = Math.abs(index || 0) %
            INSPECTOR_ROSTER.length;

        return cloneObject(
            INSPECTOR_ROSTER[safeIndex]
        );
    }


    function getCaseAnomalyIds(caseData) {
        if (!caseData || !Array.isArray(caseData.anomalyIds)) {
            return [];
        }

        return caseData.anomalyIds.slice();
    }


    function caseHasAnomaly(caseData, anomalyId) {
        return getCaseAnomalyIds(caseData).indexOf(anomalyId) !== -1;
    }


    function addUniqueNote(record, note) {
        if (!record || !note) {
            return;
        }

        if (!Array.isArray(record.notes)) {
            record.notes = [];
        }

        if (record.notes.indexOf(note) === -1) {
            record.notes.push(note);
        }
    }


    function getCaseId(caseData) {
        return caseData && caseData.id
            ? caseData.id
            : "CASE-UNKNOWN";
    }


    /* =====================================================
       06. WAKTU SHIFT

       Shift dimulai pada 22:00 dan berlanjut melewati
       tengah malam. Format jam menggunakan HH:MM.

       Fungsi waktu ini hanya untuk simulasi game.
       ===================================================== */

    function clockToMinutes(clock) {
        var parts = String(clock || "22:00").split(":");

        var hours = Number(parts[0]);
        var minutes = Number(parts[1]);

        if (
            !Number.isFinite(hours) ||
            !Number.isFinite(minutes)
        ) {
            return 22 * 60;
        }

        return (hours * 60) + minutes;
    }


    function minutesToClock(totalMinutes) {
        var normalized = (
            totalMinutes % (24 * 60) +
            (24 * 60)
        ) % (24 * 60);

        var hours = Math.floor(normalized / 60);

        var minutes = normalized % 60;

        return padNumber(hours) + ":" + padNumber(minutes);
    }


    function addMinutes(clock, amount) {
        return minutesToClock(
            clockToMinutes(clock) + amount
        );
    }


    function minutesSinceShiftStart(clock) {
        var target = clockToMinutes(clock);

        var shiftStart = clockToMinutes(CONFIG.shiftStart);

        if (target < shiftStart) {
            target += 24 * 60;
        }

        return target - shiftStart;
    }


    function getShiftDate(clock) {
        var elapsedMinutes = minutesSinceShiftStart(clock);

        var startDate = CONFIG.shiftStartDate.split("-").map(Number);

        var date = new Date(Date.UTC(
            startDate[0],
            startDate[1] - 1,
            startDate[2]
        ));

        if (elapsedMinutes >= 24 * 60 - shiftStartMinutes()) {
            date.setUTCDate(date.getUTCDate() + 1);
        }

        return [
            date.getUTCFullYear(),
            padNumber(date.getUTCMonth() + 1),
            padNumber(date.getUTCDate())
        ].join("-");
    }


    function shiftStartMinutes() {
        return clockToMinutes(CONFIG.shiftStart);
    }


    function getShiftTimestamp(clock) {
        return getShiftDate(clock) + " " + clock;
    }


    /* =====================================================
       07. NOMOR DATA PER KASUS
       ===================================================== */

    function makeProcessBatch(processId, index) {
        var number = 2200 + index + 1;

        if (processId === "banbury") {
            return "CMP-" + number;
        }

        if (processId === "extruding") {
            return "EXT-" + (2300 + index + 1);
        }

        if (processId === "bead") {
            return "BEA-" + (2400 + index + 1);
        }

        if (processId === "cutting") {
            return "CUT-" + (2500 + index + 1);
        }

        if (processId === "building") {
            return "BLD-" + (2600 + index + 1);
        }

        if (processId === "curing") {
            return "CUR-" + (2700 + index + 1);
        }

        if (processId === "final-inspection") {
            return "FIN-" + (2800 + index + 1);
        }

        if (processId === "tube") {
            return "TB-" + (440 + index + 1);
        }

        return "BW-" + padNumber(number, 4);
    }


    function makeProductSerial(processId, index) {
        if (processId === "tube") {
            return "TU-" + padNumber(8000 + index + 1, 4);
        }

        return "BT-" + padNumber(100 + index + 1, 6);
    }


    function makeRecordId(index) {
        return "PR-" + padNumber(index + 1, 4);
    }


    function makeReportId(index) {
        return "IR-" + padNumber(400 + index + 1, 4);
    }


    function makeRollId(index) {
        return "RL-" + padNumber(31 + index, 3);
    }


    function makeCycleId(index) {
        return "CY-" + padNumber(100 + index + 1, 3);
    }


    /* =====================================================
       08. DATA CATATAN NORMAL UNTUK DELAPAN PROSES
       ===================================================== */

    function createBaseProcessDetails(
        processId,
        index,
        clock,
        finishTime,
        batchNumber,
        productSerial
    ) {
        var startDateTime = getShiftTimestamp(clock);

        var finishDateTime = getShiftTimestamp(finishTime);

        var details = {
            processId: processId,

            startTime: clock,
            finishTime: finishTime,

            startTimestamp: startDateTime,
            finishTimestamp: finishDateTime,

            previousProcess: "",

            batchNumber: batchNumber,

            productSerial: productSerial
        };


        if (processId === "banbury") {
            details.formulaCode = "MIX-A17";

            details.expectedFormulaCode = "MIX-A17";

            details.cycleId = makeCycleId(index);

            details.systemDurationMinutes = 12;

            details.materialBatch = batchNumber;

            details.materialReleaseTime =
                addMinutes(clock, -10);
        }


        if (processId === "extruding") {
            details.profileCode = "P-04";

            details.expectedProfileCode = "P-04";

            details.profileLength = 980;

            details.expectedProfileLength = 980;

            details.materialRoll = makeRollId(index);

            details.materialBatch = batchNumber;

            details.materialReleaseTime =
                addMinutes(clock, -8);
        }


        if (processId === "bead") {
            details.componentCount = 2;

            details.expectedComponentCount = 2;

            details.componentSizeCode = "B-16";

            details.expectedComponentSizeCode = "B-16";

            details.pairLeft = "L-" + padNumber(31 + index, 3);

            details.pairRight = "R-" + padNumber(31 + index, 3);

            details.materialBatch = batchNumber;

            details.materialReceiptTime =
                addMinutes(clock, -10);
        }


        if (processId === "cutting") {
            details.nominalLength = CONFIG.nominalCuttingLength;

            details.observedLength = CONFIG.nominalCuttingLength;

            details.tolerance = CONFIG.cuttingTolerance;

            details.materialRoll = makeRollId(index);

            details.leftLabel = "L-" + padNumber(204 + index, 3);

            details.rightLabel = "R-" + padNumber(204 + index, 3);

            details.expectedLeftLabel = details.leftLabel;

            details.expectedRightLabel = details.rightLabel;

            details.materialBatch = batchNumber;
        }


        if (processId === "building") {
            details.assemblyTime = clock;

            details.componentAvailableTime =
                addMinutes(clock, -10);

            details.componentDestinationSerial = productSerial;

            details.expectedDestinationSerial = productSerial;

            details.componentHistoryStatus = "AVAILABLE";

            details.assemblyStation = "B-" + padNumber(1 + (index % 4), 2);

            details.materialBatch = batchNumber;
        }


        if (processId === "curing") {
            details.pressId = "PR-08";

            details.expectedPressId = "PR-08";

            details.profileCode = "CV-12";

            details.expectedProfileCode = "CV-12";

            details.cycleId = "CC-" + padNumber(index + 1, 4);

            details.systemDurationMinutes = 12;

            details.materialBatch = batchNumber;
        }


        if (processId === "final-inspection") {
            details.inspectionStartTime = clock;

            details.inspectionFinishTime = finishTime;

            details.inspectionStatus = "PENDING";

            details.visualStatus = "NO REGISTERED DISCREPANCY";

            details.materialBatch = batchNumber;
        }


        if (processId === "tube") {
            details.tubeSizeCode = "T-18";

            details.expectedTubeSizeCode = "T-18";

            details.tubeBatch = batchNumber;

            details.materialReceiptTime =
                addMinutes(clock, -10);

            details.tubeSerial = productSerial;
        }


        return details;
    }


    /* =====================================================
       09. CATATAN DASAR OPERATOR
       ===================================================== */

    function createBaseOperator(index, processName) {
        var operator = cloneObject(
            OPERATOR_ROSTER[index % OPERATOR_ROSTER.length]
        );

        operator.currentLocation = processName;

        operator.recordedShift = CONFIG.shiftStart +
            " - " +
            CONFIG.shiftEnd;

        operator.locationHistory = [
            {
                location: processName,

                startTime: null,

                finishTime: null
            }
        ];

        operator.reassignment = null;

        return operator;
    }


    /* =====================================================
       10. CATATAN DASAR PRODUKSI
       ===================================================== */

    function createBaseProductionNotes(record) {
        var details = record.processDetails;

        var processId = record.processId;

        if (processId === "banbury") {
            return [
                "Formula: " + details.formulaCode,

                "Cycle: " + details.cycleId,

                "Material batch: " + details.materialBatch,

                "Material release: " + details.materialReleaseTime
            ].join(" | ");
        }


        if (processId === "extruding") {
            return [
                "Expected profile: " + details.expectedProfileCode,

                "Recorded profile: " + details.profileCode,

                "Length: " + details.profileLength + " fictional units",

                "Material roll: " + details.materialRoll
            ].join(" | ");
        }


        if (processId === "bead") {
            return [
                "Expected components: " + details.expectedComponentCount,

                "Recorded components: " + details.componentCount,

                "Size code: " + details.componentSizeCode,

                "Left pair: " + details.pairLeft,

                "Right pair: " + details.pairRight
            ].join(" | ");
        }


        if (processId === "cutting") {
            return [
                "Nominal length: " + details.nominalLength,

                "Recorded length: " + details.observedLength,

                "Fictional tolerance: ±" + details.tolerance,

                "Left label: " + details.leftLabel,

                "Right label: " + details.rightLabel,

                "Roll: " + details.materialRoll
            ].join(" | ");
        }


        if (processId === "building") {
            return [
                "Assembly time: " + details.assemblyTime,

                "Component available: " + details.componentAvailableTime,

                "Destination serial: " + details.componentDestinationSerial,

                "Station: " + details.assemblyStation
            ].join(" | ");
        }


        if (processId === "curing") {
            return [
                "Press: " + details.pressId,

                "Profile: " + details.profileCode,

                "Cycle: " + details.cycleId,

                "Start: " + details.startTime,

                "Finish: " + details.finishTime
            ].join(" | ");
        }


        if (processId === "final-inspection") {
            return [
                "Inspection start: " + details.inspectionStartTime,

                "Inspection finish: " + details.inspectionFinishTime,

                "Serial: " + record.tireSerial,

                "Inspection state: " + details.inspectionStatus
            ].join(" | ");
        }


        if (processId === "tube") {
            return [
                "Tube batch: " + details.tubeBatch,

                "Size code: " + details.tubeSizeCode,

                "Serial: " + details.tubeSerial,

                "Material receipt: " + details.materialReceiptTime
            ].join(" | ");
        }


        return "No additional production notes.";
    }


    /* =====================================================
       11. LAPORAN INSPEKSI DASAR
       ===================================================== */

    function createBaseReport(index, record, inspector) {
        return {
            reportNumber: makeReportId(index),

            formReference: "IR-QC-02",

            formRevision: "REV-04",

            productSerial: record.tireSerial,

            tireSerial: record.tireSerial,

            inspectorId: inspector.inspectorId,

            inspectorName: inspector.name,

            inspectorSignatureReference:
                inspector.signatureReference,

            signature: "________________",

            signatureTime: record.finishTime,

            inspectionDate:
                getShiftDate(record.finishTime),

            inspectionStartTime:
                record.startTime,

            inspectionTime:
                record.finishTime,

            paperTime:
                record.finishTime,

            systemTime:
                record.finishTime,

            batchNumber: record.batchNumber,

            observations:
                "No registered report discrepancy is assigned to this case. " +
                "Final decision remains pending.",

            status: "PENDING",

            decisionField: "PENDING",

            stampTime: null,

            stampedBeforeInspection: false,

            reportState: "DRAFT",

            duplicatedWith: null
        };
    }


    /* =====================================================
       12. DATA VISUAL PRODUK
       ===================================================== */

    function createBaseTire(record, processId) {
        var isTube = processId === "tube";

        return {
            productType: isTube
                ? "INNER TUBE"
                : "TIRE",

            serial: record.tireSerial,

            visualCondition: "NORMAL",

            treadPattern: "TP-04",

            sidewallSerial: record.tireSerial,

            beadCondition: "INTACT",

            surfaceCondition: "NORMAL",

            componentCount: 2,

            inspectionAreas: {
                tread: {
                    inspected: false,
                    condition: "NORMAL"
                },

                sidewall: {
                    inspected: false,
                    condition: "NORMAL"
                },

                bead: {
                    inspected: false,
                    condition: "NORMAL"
                }
            },

            visualAnomalyIds: [],

            notes: []
        };
    }


    /* =====================================================
       13. DATA KONTEKS DAN CATATAN DASAR
       ===================================================== */

    function createBaseRecord(caseData, context) {
        context = context || {};

        var index = Number.isInteger(context.roundIndex)
            ? context.roundIndex
            : Math.max(0, (context.roundNumber || 1) - 1);

        var processId = caseData.processId;

        var process = getProcessDefinition(processId);

        if (!process) {
            throw new Error(
                "Unknown process ID: " + processId
            );
        }

        var clock = context.shiftClock || "22:00";

        var finishTime = addMinutes(clock, 12);

        var batchNumber = makeProcessBatch(processId, index);

        var tireSerial = makeProductSerial(processId, index);

        var operator = createBaseOperator(
            index,
            process.name
        );

        var inspector = getInspectorByIndex(index);

        var record = {
            caseId: caseData.id,

            roundNumber: index + 1,

            shiftClock: clock,

            shiftDate: getShiftDate(clock),

            shiftTimestamp: getShiftTimestamp(clock),

            plantName: CONFIG.plantName,

            shiftName: CONFIG.shiftName,

            shiftStart: CONFIG.shiftStart,

            shiftEnd: CONFIG.shiftEnd,

            processId: processId,

            processName: process.name,

            processReference: process.reference,

            previousProcess: process.previousProcess,

            recordId: makeRecordId(index),

            batchNumber: batchNumber,

            materialBatch: batchNumber,

            tireSerial: tireSerial,

            productSerial: tireSerial,

            startTime: clock,

            finishTime: finishTime,

            operatorName: operator.name,

            operatorId: operator.employeeId,

            operatorShift: operator.assignedShift,

            operator: operator,

            inspector: inspector,

            formulaCode: null,

            profileCode: null,

            reportNumber: makeReportId(index),

            reportTime: finishTime,

            reportObservations:
                "No registered report discrepancy is assigned to this case. " +
                "Final decision remains pending.",

            reportSignature: "________________",

            notes: [],

            anomalyIds: getCaseAnomalyIds(caseData),

            processDetails: null,

            report: null,

            tire: null,

            references: {
                processReference: process.reference,

                processRule: process.referenceRule,

                fictional: true
            }
        };


        record.processDetails = createBaseProcessDetails(
            processId,
            index,
            clock,
            finishTime,
            batchNumber,
            tireSerial
        );

        record.processDetails.previousProcess =
            process.previousProcess;


        record.tire = createBaseTire(
            record,
            processId
        );

        record.report = createBaseReport(
            index,
            record,
            inspector
        );


        addUniqueNote(
            record,
            createBaseProductionNotes(record)
        );


        addUniqueNote(
            record,
            "Operator ID: " + operator.employeeId
        );

        addUniqueNote(
            record,
            "Recorded location: " + operator.currentLocation
        );

        addUniqueNote(
            record,
            "Record timestamp: " + record.shiftTimestamp
        );


        return record;
    }


    /* =====================================================
       14. ANOMALY: BANBURY — BAN-01
       WAKTU SELESAI LEBIH AWAL DARI WAKTU MULAI
       ===================================================== */

    function applyBAN01(record) {
        record.startTime = "22:05";
        record.finishTime = "21:57";

        record.processDetails.startTime = "22:05";
        record.processDetails.finishTime = "21:57";

        record.processDetails.startTimestamp =
            getShiftTimestamp("22:05");

        record.processDetails.finishTimestamp =
            getShiftTimestamp("21:57");

        addUniqueNote(
            record,
            "Cycle timing discrepancy: start 22:05, finish 21:57."
        );
    }


    /* =====================================================
       15. ANOMALY: EXTRUDING — EXT-01
       PROFIL YANG DICATAT TIDAK SESUAI
       ===================================================== */

    function applyEXT01(record) {
        record.processDetails.expectedProfileCode = "P-04";
        record.processDetails.profileCode = "P-07";

        record.profileCode = "P-07";

        addUniqueNote(
            record,
            "Expected profile: P-04; recorded profile: P-07."
        );
    }


    /* =====================================================
       16. ANOMALY: DOCUMENT — DOC-03
       WAKTU TULIS TANGAN DAN LOG BERBEDA
       ===================================================== */

    function applyDOC03(record) {
        record.report.paperTime = "23:18";

        record.report.systemTime = "23:48";

        record.report.inspectionTime = "23:48";

        record.reportTime = "23:48";

        record.reportObservations =
            "Handwritten report time: 23:18. " +
            "System log time: 23:48. " +
            "The two recorded times do not match.";

        record.report.observations =
            record.reportObservations;

        addUniqueNote(
            record,
            "Report time mismatch: handwritten 23:18 versus system 23:48."
        );
    }


    /* =====================================================
       17. ANOMALY: BEAD — BEA-01
       JUMLAH KOMPONEN TIDAK COCOK
       ===================================================== */

    function applyBEA01(record) {
        record.processDetails.expectedComponentCount = 2;

        record.processDetails.componentCount = 3;

        record.tire.componentCount = 3;

        addUniqueNote(
            record,
            "Material card: 2 components; receiving record: 3 components."
        );
    }


    /* =====================================================
       18. ANOMALY: CUTTING — CUT-02
       LABEL KIRI DAN KANAN TERTUKAR
       ===================================================== */

    function applyCUT02(record) {
        record.processDetails.expectedLeftLabel = "L-204";

        record.processDetails.expectedRightLabel = "R-204";

        record.processDetails.leftLabel = "R-204";

        record.processDetails.rightLabel = "L-204";

        addUniqueNote(
            record,
            "Expected labels: left L-204, right R-204. " +
            "Recorded labels: left R-204, right L-204."
        );
    }


    /* =====================================================
       19. ANOMALY PERSONNEL — PER-02
       NAMA DAN ID OPERATOR TIDAK COCOK
       ===================================================== */

    function applyPER02(record) {
        record.operatorId = "EMP-024";

        record.operatorName = "Dimas Aruna";

        record.operator.employeeId = "EMP-024";

        record.operator.name = "Dimas Aruna";

        record.operator.badgeId = "BG-024";

        record.operator.signatureReference = "SIG-EMP-031";

        record.operator.rosterReferenceName = "Nara Wijaya";

        record.operator.identityMatch = false;

        addUniqueNote(
            record,
            "Roster reference for EMP-024: Nara Wijaya. " +
            "Recorded operator name: Dimas Aruna."
        );
    }


    /* =====================================================
       20. ANOMALY BUILDING — BLD-01
       MATERIAL BELUM TERSEDIA KETIKA PERAKITAN DIMULAI
       ===================================================== */

    function applyBLD01(record) {
        record.startTime = "00:35";
        record.finishTime = "00:47";

        record.processDetails.startTime = "00:35";
        record.processDetails.finishTime = "00:47";

        record.processDetails.assemblyTime = "00:35";

        record.processDetails.componentAvailableTime = "00:41";

        record.processDetails.startTimestamp =
            getShiftTimestamp("00:35");

        record.processDetails.finishTimestamp =
            getShiftTimestamp("00:47");

        record.processDetails.componentHistoryStatus =
            "RELEASED AFTER ASSEMBLY START";

        addUniqueNote(
            record,
            "Assembly started 00:35; component availability recorded at 00:41."
        );
    }


    /* =====================================================
       21. ANOMALY CURING — CUR-01
       WAKTU SELESAI TERBALIK
       ===================================================== */

    function applyCUR01(record) {
        record.startTime = "01:14";
        record.finishTime = "01:09";

        record.processDetails.startTime = "01:14";
        record.processDetails.finishTime = "01:09";

        record.processDetails.startTimestamp =
            getShiftTimestamp("01:14");

        record.processDetails.finishTimestamp =
            getShiftTimestamp("01:09");

        addUniqueNote(
            record,
            "Curing cycle start: 01:14. Recorded finish: 01:09."
        );
    }


    /* =====================================================
       22. ANOMALY FINAL INSPECTION — FIN-01
       STAMPEL OK LEBIH AWAL DARI WAKTU INSPEKSI
       ===================================================== */

    function applyFIN01(record) {
        record.report.status = "OK";

        record.report.decisionField = "OK";

        record.report.stampTime = "02:14";

        record.report.stampedBeforeInspection = true;

        record.report.inspectionStartTime = "02:21";

        record.report.inspectionTime = "02:21";

        record.reportTime = "02:21";

        record.reportObservations =
            "Existing OK stamp timestamp: 02:14. " +
            "Inspection start recorded as: 02:21. " +
            "The report appears to be approved before inspection.";

        record.report.observations =
            record.reportObservations;

        addUniqueNote(
            record,
            "Report shows OK stamp at 02:14 before inspection start at 02:21."
        );
    }


    /* =====================================================
       23. ANOMALY DOCUMENT — DOC-01
       STAMPEL KEPUTUSAN DIBUAT TERLALU AWAL
       ===================================================== */

    function applyDOC01(record) {
        /*
         * FIN-01 and DOC-01 may refer to the same discrepancy.
         * Retain the existing stamp time if it was already set.
         */
        if (!record.report.stampTime) {
            record.report.stampTime = "02:14";
        }

        record.report.stampedBeforeInspection = true;

        record.report.status = "OK";

        record.report.decisionField = "OK";

        if (
            record.reportObservations.indexOf(
                "Existing OK stamp"
            ) === -1
        ) {
            record.reportObservations =
                "Existing OK stamp timestamp: 02:14. " +
                "Inspection start recorded as: 02:21.";
        }

        record.report.observations =
            record.reportObservations;

        addUniqueNote(
            record,
            "Pre-inspection approval stamp recorded in the document."
        );
    }


    /* =====================================================
       24. ANOMALY BANBURY — BAN-02
       KODE FORMULA BERBEDA DARI REFERENSI
       ===================================================== */

    function applyBAN02(record) {
        record.batchNumber = "CMP-2201";

        record.materialBatch = "CMP-2201";

        record.processDetails.batchNumber = "CMP-2201";

        record.processDetails.materialBatch = "CMP-2201";

        record.processDetails.expectedFormulaCode = "MIX-A17";

        record.processDetails.formulaCode = "MIX-X09";

        record.formulaCode = "MIX-X09";

        addUniqueNote(
            record,
            "Batch CMP-2201 reference formula: MIX-A17. " +
            "Recorded formula: MIX-X09."
        );
    }


    /* =====================================================
       25. ANOMALY PERSONNEL — PER-01
       OPERATOR DICATAT DI DUA LOKASI BERSAMAAN
       ===================================================== */

    function applyPER01(record) {
        record.operatorId = "OP-014";

        record.operatorName = "Nara Wijaya";

        record.operator.employeeId = "OP-014";

        record.operator.name = "Nara Wijaya";

        record.operator.currentLocation = "BANBURY";

        record.operator.locationHistory = [

            {
                location: "BANBURY",
                startTime: "02:43",
                finishTime: "02:55"
            },

            {
                location: "BUILDING",
                startTime: "02:43",
                finishTime: "02:55"
            }

        ];

        record.operator.simultaneousAssignments = true;

        addUniqueNote(
            record,
            "OP-014 is listed at BANBURY and BUILDING simultaneously at 02:43."
        );
    }


    /* =====================================================
       26. ANOMALY CUTTING — CUT-01
       DIMENSI FIKTIF DI LUAR ATURAN GAME
       ===================================================== */

    function applyCUT01(record) {
        record.processDetails.nominalLength = 980;

        record.processDetails.observedLength = 1040;

        record.processDetails.tolerance = 5;

        addUniqueNote(
            record,
            "Fictional specification: 980 ±5. " +
            "Recorded length: 1040."
        );
    }


    /* =====================================================
       27. ANOMALY VISUAL — VIS-03
       KERUSAKAN PERMUKAAN YANG TERLIHAT
       ===================================================== */

    function applyVIS03(record) {
        record.tire.visualCondition = "VISIBLE SURFACE DAMAGE";

        record.tire.surfaceCondition = "TORN TREAD SURFACE";

        record.tire.inspectionAreas.tread.condition =
            "VISIBLE DAMAGE";

        record.tire.notes.push(
            "A visible surface tear is included in the case illustration."
        );

        record.tire.visualAnomalyIds.push("VIS-03");

        addUniqueNote(
            record,
            "Visual reference: visible tread surface damage is present."
        );
    }


    /* =====================================================
       28. ANOMALY BUILDING — BLD-02
       RIWAYAT KOMPONEN MERUJUK SERIAL BERBEDA
       ===================================================== */

    function applyBLD02(record) {
        record.tireSerial = "BT-000117";

        record.productSerial = "BT-000117";

        record.batchNumber = "BLD-2617";

        record.materialBatch = "BLD-2617";

        record.processDetails.productSerial = "BT-000117";

        record.processDetails.componentDestinationSerial =
            "BT-000171";

        record.processDetails.expectedDestinationSerial =
            "BT-000117";

        record.processDetails.componentHistoryStatus =
            "DESTINATION SERIAL MISMATCH";

        record.report.productSerial = "BT-000117";

        record.report.tireSerial = "BT-000117";

        record.report.batchNumber = "BLD-2617";

        record.reportObservations =
            "Current product serial: BT-000117. " +
            "Component history destination: BT-000171. " +
            "The component history refers to a different serial.";

        record.report.observations =
            record.reportObservations;

        record.tire.serial = "BT-000117";

        record.tire.sidewallSerial = "BT-000171";

        record.tire.visualAnomalyIds.push("VIS-02");

        addUniqueNote(
            record,
            "Component history points to BT-000171 instead of BT-000117."
        );
    }


    /* =====================================================
       29. ANOMALY VISUAL — VIS-02
       SERIAL PADA SIDEWALL BERBEDA
       ===================================================== */

    function applyVIS02(record) {
        record.tire.serial = record.tireSerial;

        record.tire.sidewallSerial = "BT-000171";

        if (
            record.tire.visualAnomalyIds.indexOf("VIS-02") === -1
        ) {
            record.tire.visualAnomalyIds.push("VIS-02");
        }

        addUniqueNote(
            record,
            "Sidewall serial: BT-000171. Record serial: BT-000117."
        );
    }


    /* =====================================================
       30. ANOMALY CURING — CUR-04
       SERIAL MUNCUL PADA DUA SIKLUS
       ===================================================== */

    function applyCUR04(record) {
        record.tireSerial = "BT-000245";

        record.productSerial = "BT-000245";

        record.batchNumber = "CUR-2718";

        record.materialBatch = "CUR-2718";

        record.processDetails.productSerial = "BT-000245";

        record.processDetails.pressId = "PR-02";

        record.processDetails.expectedPressId = "PR-02";

        record.processDetails.duplicatePressIds = [
            "PR-02",
            "PR-05"
        ];

        record.processDetails.simultaneousPressCycle = true;

        record.report.productSerial = "BT-000245";

        record.report.tireSerial = "BT-000245";

        record.report.batchNumber = "CUR-2718";

        record.tire.serial = "BT-000245";

        addUniqueNote(
            record,
            "Serial BT-000245 is listed at press PR-02 and PR-05 at the same time."
        );
    }


    /* =====================================================
       31. ANOMALY PERSONNEL — PER-04
       JADWAL OPERATOR TIDAK COCOK
       ===================================================== */

    function applyPER04(record) {
        record.operatorShift = "14:00 - 22:00";

        record.operator.assignedShift = "14:00 - 22:00";

        record.operator.recordedShift = "14:00 - 22:00";

        record.operator.reassignment = null;

        record.operator.attendance = "SHIFT COMPLETED";

        record.operator.shiftMismatch = true;

        addUniqueNote(
            record,
            "Operator is assigned to 14:00-22:00 with no new shift assignment recorded."
        );
    }


    /* =====================================================
       32. ANOMALY TUBE — TUB-04
       NOMOR SERIAL DIGUNAKAN PADA DUA PRODUK
       ===================================================== */

    function applyTUB04(record) {
        record.tireSerial = "TU-0091";

        record.productSerial = "TU-0091";

        record.batchNumber = "TB-441";

        record.materialBatch = "TB-441";

        record.processDetails.productSerial = "TU-0091";

        record.processDetails.tubeSerial = "TU-0091";

        record.processDetails.tubeBatch = "TB-441";

        record.report.productSerial = "TU-0091";

        record.report.tireSerial = "TU-0091";

        record.report.batchNumber = "TB-441";

        record.tire.serial = "TU-0091";

        record.tire.productType = "INNER TUBE";

        record.processDetails.duplicateProductSerials = [
            "TU-0091",
            "TU-0088"
        ];

        addUniqueNote(
            record,
            "Tube serial TU-0091 also appears in the record for product TU-0088."
        );
    }


    /* =====================================================
       33. ANOMALY DOCUMENT — DOC-06
       ISI OBSERVASI BERTENTANGAN DENGAN KEPUTUSAN
       ===================================================== */

    function applyDOC06(record) {
        record.report.status = "OK";

        record.report.decisionField = "OK";

        record.reportObservations =
            "Observation: REJECT RECOMMENDED. " +
            "Decision field on attached copy: OK. " +
            "The recorded observation and disposition conflict.";

        record.report.observations =
            record.reportObservations;

        addUniqueNote(
            record,
            "Report observation says REJECT RECOMMENDED while its decision field says OK."
        );
    }


    /* =====================================================
       34. ANOMALI LAIN: EXPLICIT HANDLERS

       Semua ID anomali yang digunakan oleh dua puluh kasus
       awal harus diterapkan melalui handler yang eksplisit.

       Anomali lain di anomalies.js tetap tersedia untuk
       skenario baru. Jika suatu ID belum mempunyai handler,
       referensi clue masih bisa ditampilkan oleh inspection.js.
       ===================================================== */

    var ANOMALY_HANDLERS = {

        "BAN-01": applyBAN01,

        "EXT-01": applyEXT01,

        "DOC-03": applyDOC03,

        "BEA-01": applyBEA01,

        "CUT-02": applyCUT02,

        "PER-02": applyPER02,

        "BLD-01": applyBLD01,

        "CUR-01": applyCUR01,

        "FIN-01": applyFIN01,

        "DOC-01": applyDOC01,

        "BAN-02": applyBAN02,

        "PER-01": applyPER01,

        "CUT-01": applyCUT01,

        "VIS-03": applyVIS03,

        "BLD-02": applyBLD02,

        "VIS-02": applyVIS02,

        "CUR-04": applyCUR04,

        "PER-04": applyPER04,

        "TUB-04": applyTUB04,

        "DOC-06": applyDOC06

    };


    /* =====================================================
       35. TERAPKAN ANOMALI PADA SATU RECORD

       Urutan handler mengikuti anomalyIds di kasus.
       Setiap handler bekerja pada record yang sama.
       ===================================================== */

    function applyCaseAnomalies(record, caseData) {
        var anomalyIds = getCaseAnomalyIds(caseData);

        anomalyIds.forEach(function (anomalyId) {
            var handler = ANOMALY_HANDLERS[anomalyId];

            if (typeof handler === "function") {
                handler(record);
            }
        });

        return record;
    }


    /* =====================================================
       36. SINKRONKAN DATA PADA OBJEK BERTINGKAT

       Game.js membaca sebagian properti dari tingkat atas,
       sementara modul visual masa depan dapat menggunakan
       productionDetails, operator, report, atau tire.
       ===================================================== */

    function synchronizeRecord(record, caseData) {
        var process = getProcessDefinition(record.processId);

        record.caseId = getCaseId(caseData);

        record.processName = process
            ? process.name
            : record.processName;

        record.processReference = process
            ? process.reference
            : record.processReference;

        record.previousProcess = process
            ? process.previousProcess
            : record.previousProcess;


        /* Production data */

        record.production = {
            recordId: record.recordId,

            processId: record.processId,

            processName: record.processName,

            processReference: record.processReference,

            previousProcess: record.previousProcess,

            batchNumber: record.batchNumber,

            materialBatch: record.materialBatch,

            tireSerial: record.tireSerial,

            startTime: record.startTime,

            finishTime: record.finishTime,

            operatorName: record.operatorName,

            operatorId: record.operatorId,

            operatorShift: record.operatorShift,

            operator: cloneObject(record.operator),

            notes: record.productionNotes,

            processDetails: cloneObject(record.processDetails)
        };


        /* Operator aliases */

        record.operator.name = record.operatorName;

        record.operator.employeeId = record.operatorId;

        record.operator.assignedShift = record.operatorShift;


        /* Report data */

        record.report.reportNumber = record.report.reportNumber ||
            record.reportNumber;

        record.reportNumber = record.report.reportNumber;

        record.reportTime = record.report.inspectionTime ||
            record.reportTime;

        record.reportObservations = record.report.observations ||
            record.reportObservations;

        record.reportSignature = record.report.signature ||
            record.reportSignature;


        record.report.productSerial = record.report.productSerial ||
            record.tireSerial;

        record.report.tireSerial = record.report.tireSerial ||
            record.tireSerial;

        record.report.batchNumber = record.report.batchNumber ||
            record.batchNumber;


        /*
         * Copy key top-level fields to the tire illustration
         * for future use by tires.js.
         */

        record.tire.serial = record.tire.serial ||
            record.tireSerial;

        record.tire.productType = record.tire.productType ||
            (record.processId === "tube" ? "INNER TUBE" : "TIRE");


        /* Convenience aliases for future UI use */

        record.tireData = cloneObject(record.tire);

        record.processData = cloneObject(record.processDetails);

        record.reportData = cloneObject(record.report);

        record.operatorData = cloneObject(record.operator);

        record.anomalyIds = getCaseAnomalyIds(caseData);

        record.fictional = true;

        record.productionNotes = safeArray(record.notes).join(" | ");

        return record;
    }


    /* =====================================================
       37. CREATE ONE PRODUCTION RECORD

       Dipanggil oleh game.js:

       NightShiftProduction.createRecord(caseData, context)

       context:
       - roundNumber
       - roundIndex
       - shiftClock
       - shiftMinutes
       - totalRounds
       ===================================================== */

    function createRecord(caseData, context) {
        if (!caseData || !caseData.processId) {
            throw new Error(
                "createRecord requires a case with processId."
            );
        }

        context = context || {};

        var record = createBaseRecord(
            caseData,
            context
        );

        applyCaseAnomalies(
            record,
            caseData
        );

        synchronizeRecord(
            record,
            caseData
        );

        return record;
    }


    /* =====================================================
       38. CREATE PRODUCTION RECORD ALIAS

       Nama alternatif supaya mudah dipanggil dari modul
       lain dan kompatibel dengan pola penamaan lama.
       ===================================================== */

    function createProductionRecord(caseData, context) {
        return createRecord(caseData, context);
    }


    /* =====================================================
       39. GET OPERATOR ROSTER

       Digunakan sebagai sumber pembanding yang dapat dibaca.
       ===================================================== */

    function getRoster() {
        return cloneObject(OPERATOR_ROSTER);
    }


    function getInspectors() {
        return cloneObject(INSPECTOR_ROSTER);
    }


    function getProcessCatalog() {
        return cloneObject(PROCESS_DEFINITIONS);
    }


    /* =====================================================
       40. VALIDASI DATA OPERATOR

       Return:
       {
           exists,
           nameMatches,
           scheduledShift,
           attendance,
           employee
       }
       ===================================================== */

    function validateOperator(employeeId, operatorName) {
        var employee = getOperatorById(employeeId);

        if (!employee) {
            return {
                exists: false,

                nameMatches: false,

                scheduledShift: null,

                attendance: null,

                employee: null
            };
        }

        return {
            exists: true,

            nameMatches:
                employee.name === operatorName,

            scheduledShift:
                employee.assignedShift,

            attendance:
                employee.attendance,

            badgeId:
                employee.badgeId,

            employee:
                employee
        };
    }


    /* =====================================================
       41. GET DETAIL DARI ID ANOMALI

       Mengambil metadata dari anomalies.js.
       ===================================================== */

    function getAnomalyReference(anomalyId) {
        if (typeof getAnomalyDefinition === "function") {
            return getAnomalyDefinition(anomalyId);
        }

        return null;
    }


    /* =====================================================
       42. DIAGNOSTIK DATABASE

       Memeriksa apakah semua ID anomali pada kasus awal
       mempunyai handler yang sesuai.
       ===================================================== */

    function validateProductionDatabase() {
        var errors = [];

        var cases =
            typeof ANOMALY_CASES !== "undefined" &&
            Array.isArray(ANOMALY_CASES)
                ? ANOMALY_CASES
                : [];

        cases.forEach(function (caseData) {
            getCaseAnomalyIds(caseData).forEach(function (anomalyId) {
                var hasHandler =
                    typeof ANOMALY_HANDLERS[anomalyId] === "function";

                var hasDefinition =
                    typeof getAnomalyDefinition === "function"
                        ? Boolean(getAnomalyDefinition(anomalyId))
                        : false;

                if (!hasHandler) {
                    errors.push(
                        caseData.id +
                        ": no production handler for " +
                        anomalyId
                    );
                }

                if (!hasDefinition) {
                    errors.push(
                        caseData.id +
                        ": anomaly definition not found for " +
                        anomalyId
                    );
                }
            });
        });

        return {
            valid: errors.length === 0,

            processCount: PROCESS_DEFINITIONS.length,

            operatorCount: OPERATOR_ROSTER.length,

            inspectorCount: INSPECTOR_ROSTER.length,

            handlerCount: Object.keys(ANOMALY_HANDLERS).length,

            caseCount: cases.length,

            errors: errors
        };
    }


    /* =====================================================
       43. PUBLIC API

       Modules can use:
       NightShiftProduction.createRecord(...)
       NightShiftProduction.getRoster()
       NightShiftProduction.getProcessCatalog()
       NightShiftProduction.validateOperator(...)
       ===================================================== */

    window.NightShiftProduction = {

        createRecord: createRecord,

        createProductionRecord: createProductionRecord,

        getRoster: getRoster,

        getInspectors: getInspectors,

        getProcessCatalog: getProcessCatalog,

        getOperatorById: getOperatorById,

        getOperatorByName: getOperatorByName,

        validateOperator: validateOperator,

        getAnomalyReference: getAnomalyReference,

        validateDatabase: validateProductionDatabase,

        getConfig: function () {
            return cloneObject(CONFIG);
        }
    };


    /* =====================================================
       44. LEGACY GLOBAL ALIASES
       ===================================================== */

    window.generateProductionRecord = createRecord;


    /* =====================================================
       45. INITIALIZE
       ===================================================== */

    function initialize() {
        console.log(
            "[NIGHT SHIFT PRODUCTION] Database initialized."
        );

        console.log(
            "[NIGHT SHIFT PRODUCTION] Processes:",
            PROCESS_DEFINITIONS.length
        );

        console.log(
            "[NIGHT SHIFT PRODUCTION] Fictional operators:",
            OPERATOR_ROSTER.length
        );

        var validation = validateProductionDatabase();

        if (!validation.valid) {
            console.warn(
                "[NIGHT SHIFT PRODUCTION] Database validation warnings:",
                validation.errors
            );
        }
    }


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

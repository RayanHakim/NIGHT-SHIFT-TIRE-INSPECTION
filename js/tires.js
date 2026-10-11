
/* =========================================================
   NIGHT SHIFT: TIRE INSPECTION
   TIRE VISUALIZATION ENGINE

   File: js/tires.js

   FITUR:
   1. Menggambar ban fiktif dengan SVG.
   2. Area Tread, Sidewall, dan Bead.
   3. Serial produk dari production.js.
   4. Visual kerusakan sesuai ID anomali.
   5. Perubahan pola tread saat pemindaian ulang.
   6. Efek bayangan supernatural.
   7. Hotspot interaktif pada gambar.
   8. Dukungan keyboard untuk hotspot.
   9. Terhubung dengan inspection.js dan game.js.

   ANOMALI VISUAL YANG DIDUKUNG:
   VIS-01 — Changing Tread
   VIS-02 — Unlisted Serial
   VIS-03 — Visible Surface Damage
   VIS-04 — Separated Edge
   VIS-05 — Impossible Pattern
   VIS-06 — Moving Shadow

   Semua visual, produk, nomor serial, dan kejadian
   dalam file ini adalah fiksi untuk kebutuhan gameplay.
   ========================================================= */

(function () {
    "use strict";


    /* =====================================================
       01. CONFIGURATION
       ===================================================== */

    var SVG_NS = "http://www.w3.org/2000/svg";

    var VISUAL_CONFIG = {
        viewBox: "0 0 360 285",

        centerX: 180,
        centerY: 143,

        outerRadius: 84,
        treadInnerRadius: 68,
        sidewallInnerRadius: 46,
        beadInnerRadius: 36,

        background: "#111513",

        rubberDark: "#101312",
        rubberMid: "#252b27",
        rubberLight: "#414841",

        highlight: "#606b60",

        normalAccent: "#9baa9b",
        anomalyAccent: "#c74646"
    };


    /* =====================================================
       02. MODULE STATE
       ===================================================== */

    var currentCase = null;

    var currentRecord = null;

    var currentVisualAnomalyIds = [];

    var scanCounts = {};

    var currentVisualState = {
        changingTread: false,
        movingShadow: false,
        visibleDamage: false,
        separatedBead: false,
        impossiblePattern: false,
        serialMismatch: false
    };

    var initialized = false;


    /* =====================================================
       03. GENERAL HELPERS
       ===================================================== */

    function getElement(id) {
        return document.getElementById(id);
    }


    function safeArray(value) {
        return Array.isArray(value) ? value : [];
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


    function padNumber(value, digits) {
        return String(value).padStart(digits || 2, "0");
    }


    function normalizeText(value, fallback) {
        if (
            value === null ||
            value === undefined ||
            String(value).trim() === ""
        ) {
            return fallback || "";
        }

        return String(value);
    }


    function hasCaseAnomaly(anomalyId) {
        if (!currentCase) {
            return false;
        }

        var ids = safeArray(currentCase.anomalyIds);

        return ids.indexOf(anomalyId) !== -1;
    }


    function getVisualAnomalyIds(caseData, productionRecord) {
        var ids = [];

        if (caseData) {
            safeArray(caseData.anomalyIds).forEach(function (id) {
                if (
                    /^VIS-\d+$/.test(id) &&
                    ids.indexOf(id) === -1
                ) {
                    ids.push(id);
                }
            });
        }

        if (
            productionRecord &&
            productionRecord.tire
        ) {
            safeArray(
                productionRecord.tire.visualAnomalyIds
            ).forEach(function (id) {
                if (ids.indexOf(id) === -1) {
                    ids.push(id);
                }
            });
        }

        return ids;
    }


    /* =====================================================
       04. SVG ELEMENT FACTORY

       SVG dibuat melalui DOM API agar teks serial dan
       data produk tidak diperlakukan sebagai HTML.
       ===================================================== */

    function svgElement(tag, attributes, text) {
        var element = document.createElementNS(
            SVG_NS,
            tag
        );

        if (attributes) {
            Object.keys(attributes).forEach(function (key) {
                if (attributes[key] !== undefined &&
                    attributes[key] !== null) {
                    element.setAttribute(
                        key,
                        String(attributes[key])
                    );
                }
            });
        }

        if (text !== undefined && text !== null) {
            element.textContent = String(text);
        }

        return element;
    }


    function appendSvg(parent, tag, attributes, text) {
        var element = svgElement(
            tag,
            attributes,
            text
        );

        parent.appendChild(element);

        return element;
    }


    function appendLine(parent, x1, y1, x2, y2, color, width, opacity) {
        return appendSvg(
            parent,
            "line",
            {
                x1: x1,
                y1: y1,
                x2: x2,
                y2: y2,

                stroke: color || "#778077",

                "stroke-width": width || 1,

                "stroke-opacity":
                    opacity === undefined
                        ? 1
                        : opacity,

                "stroke-linecap": "round"
            }
        );
    }


    function appendCircle(parent, cx, cy, r, attributes) {
        var values = Object.assign(
            {
                cx: cx,
                cy: cy,
                r: r
            },
            attributes || {}
        );

        return appendSvg(parent, "circle", values);
    }


    function polarPoint(cx, cy, radius, angleDegrees) {
        var angle = angleDegrees * Math.PI / 180;

        return {
            x: cx + Math.cos(angle) * radius,
            y: cy + Math.sin(angle) * radius
        };
    }


    /* =====================================================
       05. SERIAL AND PRODUCT DATA
       ===================================================== */

    function getProductSerial() {
        if (!currentRecord) {
            return "BT-000001";
        }

        return normalizeText(
            currentRecord.tireSerial ||
            currentRecord.productSerial ||
            (
                currentRecord.tire &&
                currentRecord.tire.serial
            ),
            "BT-000001"
        );
    }


    function getSidewallSerial() {
        if (!currentRecord) {
            return getProductSerial();
        }

        var tire = currentRecord.tire || {};

        return normalizeText(
            tire.sidewallSerial,
            getProductSerial()
        );
    }


    function isSerialMismatch() {
        return (
            getProductSerial() !== getSidewallSerial()
        );
    }


    function getProductType() {
        if (!currentRecord || !currentRecord.tire) {
            return "TIRE";
        }

        return normalizeText(
            currentRecord.tire.productType,
            "TIRE"
        ).toUpperCase();
    }


    /* =====================================================
       06. DETECT CURRENT VISUAL CONDITIONS
       ===================================================== */

    function updateVisualState() {
        currentVisualState = {
            changingTread:
                currentVisualAnomalyIds.indexOf("VIS-01") !== -1 &&
                (scanCounts.tread || 0) >= 2,

            movingShadow:
                currentVisualAnomalyIds.indexOf("VIS-06") !== -1,

            visibleDamage:
                currentVisualAnomalyIds.indexOf("VIS-03") !== -1,

            separatedBead:
                currentVisualAnomalyIds.indexOf("VIS-04") !== -1,

            impossiblePattern:
                currentVisualAnomalyIds.indexOf("VIS-05") !== -1,

            serialMismatch:
                currentVisualAnomalyIds.indexOf("VIS-02") !== -1 ||
                isSerialMismatch()
        };
    }


    /* =====================================================
       07. SVG DEFINITIONS

       Gradients and animation definitions.
       ===================================================== */

    function buildSvgDefinitions(svg) {
        var defs = appendSvg(svg, "defs");


        /* Tire rubber radial gradient */

        var outerGradient = appendSvg(
            defs,
            "radialGradient",
            {
                id: "nsTireOuterGradient",

                cx: "38%",
                cy: "27%",
                r: "78%"
            }
        );

        appendSvg(
            outerGradient,
            "stop",
            {
                offset: "0%",
                "stop-color": "#343a35"
            }
        );

        appendSvg(
            outerGradient,
            "stop",
            {
                offset: "46%",
                "stop-color": "#1e2420"
            }
        );

        appendSvg(
            outerGradient,
            "stop",
            {
                offset: "100%",
                "stop-color": "#080a09"
            }
        );


        /* Sidewall gradient */

        var sidewallGradient = appendSvg(
            defs,
            "radialGradient",
            {
                id: "nsTireSidewallGradient",

                cx: "35%",
                cy: "25%",
                r: "85%"
            }
        );

        appendSvg(
            sidewallGradient,
            "stop",
            {
                offset: "0%",
                "stop-color": "#414941"
            }
        );

        appendSvg(
            sidewallGradient,
            "stop",
            {
                offset: "55%",
                "stop-color": "#242a25"
            }
        );

        appendSvg(
            sidewallGradient,
            "stop",
            {
                offset: "100%",
                "stop-color": "#141815"
            }
        );


        /* Bead gradient */

        var beadGradient = appendSvg(
            defs,
            "linearGradient",
            {
                id: "nsTireBeadGradient",

                x1: "0%",
                y1: "0%",
                x2: "100%",
                y2: "100%"
            }
        );

        appendSvg(
            beadGradient,
            "stop",
            {
                offset: "0%",
                "stop-color": "#737c70"
            }
        );

        appendSvg(
            beadGradient,
            "stop",
            {
                offset: "45%",
                "stop-color": "#343b35"
            }
        );

        appendSvg(
            beadGradient,
            "stop",
            {
                offset: "100%",
                "stop-color": "#141815"
            }
        );


        /* Central hub gradient */

        var hubGradient = appendSvg(
            defs,
            "radialGradient",
            {
                id: "nsTireHubGradient",

                cx: "35%",
                cy: "25%",
                r: "80%"
            }
        );

        appendSvg(
            hubGradient,
            "stop",
            {
                offset: "0%",
                "stop-color": "#626b60"
            }
        );

        appendSvg(
            hubGradient,
            "stop",
            {
                offset: "65%",
                "stop-color": "#29302a"
            }
        );

        appendSvg(
            hubGradient,
            "stop",
            {
                offset: "100%",
                "stop-color": "#0c100d"
            }
        );


        /* Tire floor shadow */

        var shadowGradient = appendSvg(
            defs,
            "linearGradient",
            {
                id: "nsTireShadowGradient",

                x1: "0%",
                y1: "0%",
                x2: "100%",
                y2: "0%"
            }
        );

        appendSvg(
            shadowGradient,
            "stop",
            {
                offset: "0%",
                "stop-color": "#000000",
                "stop-opacity": "0"
            }
        );

        appendSvg(
            shadowGradient,
            "stop",
            {
                offset: "50%",
                "stop-color": "#000000",
                "stop-opacity": "0.65"
            }
        );

        appendSvg(
            shadowGradient,
            "stop",
            {
                offset: "100%",
                "stop-color": "#000000",
                "stop-opacity": "0"
            }
        );


        /* Small glow filter */

        var glow = appendSvg(
            defs,
            "filter",
            {
                id: "nsTireRedGlow",
                x: "-80%",
                y: "-80%",
                width: "260%",
                height: "260%"
            }
        );

        appendSvg(
            glow,
            "feGaussianBlur",
            {
                stdDeviation: "2.4",
                result: "blur"
            }
        );

        var merge = appendSvg(
            glow,
            "feMerge"
        );

        appendSvg(merge, "feMergeNode", {
            in: "blur"
        });

        appendSvg(merge, "feMergeNode", {
            in: "SourceGraphic"
        });
    }


    /* =====================================================
       08. BACKGROUND GRID AND FLOOR
       ===================================================== */

    function drawBackground(svg) {
        var group = appendSvg(
            svg,
            "g",
            {
                class: "tire-background"
            }
        );

        appendSvg(
            group,
            "rect",
            {
                x: 0,
                y: 0,
                width: 360,
                height: 285,
                fill: "#111513"
            }
        );


        /* Technical grid */

        for (var x = 0; x <= 360; x += 30) {
            appendLine(
                group,
                x,
                0,
                x,
                285,
                "#8c978d",
                0.5,
                0.075
            );
        }

        for (var y = 0; y <= 285; y += 30) {
            appendLine(
                group,
                0,
                y,
                360,
                y,
                "#8c978d",
                0.5,
                0.075
            );
        }


        /* Floor shadow */

        appendSvg(
            group,
            "ellipse",
            {
                cx: 180,
                cy: 229,
                rx: 111,
                ry: 10,
                fill: "url(#nsTireShadowGradient)"
            }
        );


        /* Floor reference line */

        appendLine(
            group,
            20,
            239,
            340,
            239,
            "#4f594f",
            0.8,
            0.32
        );


        /* Technical crosshair */

        var centerX = VISUAL_CONFIG.centerX;
        var centerY = VISUAL_CONFIG.centerY;

        appendLine(
            group,
            centerX,
            9,
            centerX,
            46,
            "#a3afa1",
            0.7,
            0.28
        );

        appendLine(
            group,
            centerX,
            233,
            centerX,
            267,
            "#a3afa1",
            0.7,
            0.28
        );


        appendSvg(
            group,
            "text",
            {
                x: 180,
                y: 15,
                class: "tire-technical-label",
                "text-anchor": "middle"
            },
            "VISUAL SCAN // 01"
        );
    }


    /* =====================================================
       09. OUTER TIRE BODY
       ===================================================== */

    function drawOuterTire(svg) {
        var cx = VISUAL_CONFIG.centerX;
        var cy = VISUAL_CONFIG.centerY;

        var group = appendSvg(
            svg,
            "g",
            {
                class: "tire-rubber-body"
            }
        );


        /* Main tire mass */

        appendCircle(
            group,
            cx,
            cy,
            86,
            {
                fill: "#080a09",
                stroke: "#596259",
                "stroke-width": 1.3
            }
        );


        appendCircle(
            group,
            cx,
            cy,
            83,
            {
                fill: "url(#nsTireOuterGradient)",
                stroke: "#1f2520",
                "stroke-width": 1
            }
        );


        /* Subtle outer rubber highlights */

        appendCircle(
            group,
            cx,
            cy,
            81,
            {
                fill: "none",
                stroke: "#707a6f",
                "stroke-width": 0.65,
                "stroke-opacity": 0.25
            }
        );


        appendCircle(
            group,
            cx,
            cy,
            69,
            {
                fill: "none",
                stroke: "#080a09",
                "stroke-width": 2.2
            }
        );


        return group;
    }


    /* =====================================================
       10. TREAD PATTERN
       ===================================================== */

    function drawTreadGrooves(svg) {
        var cx = VISUAL_CONFIG.centerX;
        var cy = VISUAL_CONFIG.centerY;

        var treadGroup = appendSvg(
            svg,
            "g",
            {
                class: "tire-tread-pattern"
            }
        );


        /*
         * A second inspection can change the tread layout
         * for the supernatural VIS-01 scenario.
         */

        var changing =
            currentVisualState.changingTread;

        var impossible =
            currentVisualState.impossiblePattern;

        var baseRotation =
            changing ? 13 : 0;


        /* Main circumferential tread divisions */

        for (var i = 0; i < 48; i++) {
            var angle = (i * 360 / 48) + baseRotation;

            var innerPoint = polarPoint(
                cx,
                cy,
                69,
                angle
            );

            var outerPoint = polarPoint(
                cx,
                cy,
                81,
                angle + 2
            );

            var color = "#050706";

            var opacity = 0.92;

            /*
             * VIS-05 introduces an alternate groove layout
             * in a small sector of the tread.
             */

            if (
                impossible &&
                angle > 165 &&
                angle < 230
            ) {
                color = "#647062";
                opacity = 0.72;
            }

            /*
             * VIS-01 changes the groove appearance only
             * after the player scans the tread a second time.
             */

            if (changing && i % 3 === 0) {
                color = "#8e3939";
                opacity = 0.88;
            }

            appendLine(
                treadGroup,
                innerPoint.x,
                innerPoint.y,
                outerPoint.x,
                outerPoint.y,
                color,
                i % 4 === 0 ? 2.0 : 1.2,
                opacity
            );
        }


        /* Inner tread band */

        appendCircle(
            treadGroup,
            cx,
            cy,
            69,
            {
                fill: "none",
                stroke: "#0b0e0c",
                "stroke-width": 2.0
            }
        );


        /* Cross-grooves give the band a recognizable pattern. */

        for (var j = 0; j < 24; j++) {
            var grooveAngle = (
                j * 360 / 24
            ) + (changing ? 19 : 0);

            var p1 = polarPoint(
                cx,
                cy,
                73,
                grooveAngle - 3
            );

            var p2 = polarPoint(
                cx,
                cy,
                79,
                grooveAngle + 3
            );

            appendLine(
                treadGroup,
                p1.x,
                p1.y,
                p2.x,
                p2.y,
                changing ? "#9a3a3a" : "#303730",
                1.2,
                0.88
            );
        }


        /* Changing-tread indicator */

        if (changing) {
            appendCircle(
                treadGroup,
                cx,
                cy,
                85,
                {
                    fill: "none",
                    stroke: "#b94444",
                    "stroke-width": 1.1,
                    "stroke-dasharray": "2 5",
                    class: "tire-changing-ring"
                }
            );
        }


        /* Different pattern indicator */

        if (impossible) {
            appendSvg(
                treadGroup,
                "path",
                {
                    d:
                        "M 126 95 " +
                        "L 132 88 " +
                        "L 138 101 " +
                        "L 144 91 " +
                        "L 150 104 " +
                        "L 156 94 ",

                    fill: "none",
                    stroke: "#a4ad9c",
                    "stroke-width": 1.4,
                    "stroke-linejoin": "round",
                    "stroke-linecap": "round"
                }
            );
        }


        return treadGroup;
    }


    /* =====================================================
       11. SIDEWALL RING
       ===================================================== */

    function drawSidewall(svg) {
        var cx = VISUAL_CONFIG.centerX;
        var cy = VISUAL_CONFIG.centerY;

        var sidewallGroup = appendSvg(
            svg,
            "g",
            {
                class: "tire-sidewall"
            }
        );


        appendCircle(
            sidewallGroup,
            cx,
            cy,
            67,
            {
                fill: "url(#nsTireSidewallGradient)",
                stroke: "#121713",
                "stroke-width": 2
            }
        );


        appendCircle(
            sidewallGroup,
            cx,
            cy,
            63,
            {
                fill: "none",
                stroke: "#707b70",
                "stroke-width": 0.7,
                "stroke-opacity": 0.43
            }
        );


        appendCircle(
            sidewallGroup,
            cx,
            cy,
            59,
            {
                fill: "none",
                stroke: "#111512",
                "stroke-width": 2.1
            }
        );


        appendCircle(
            sidewallGroup,
            cx,
            cy,
            52,
            {
                fill: "none",
                stroke: "#4f594e",
                "stroke-width": 0.8,
                "stroke-dasharray": "1 4",
                "stroke-opacity": 0.68
            }
        );


        /* Tiny embossed markers around the sidewall. */

        for (var i = 0; i < 16; i++) {
            var angle = i * (360 / 16);

            var point = polarPoint(
                cx,
                cy,
                55.5,
                angle
            );

            appendCircle(
                sidewallGroup,
                point.x,
                point.y,
                0.85,
                {
                    fill: "#8b9587",
                    "fill-opacity": 0.36
                }
            );
        }


        return sidewallGroup;
    }


    /* =====================================================
       12. SIDEWALL LETTERING AND SERIAL
       ===================================================== */

    function drawSidewallText(svg) {
        var cx = VISUAL_CONFIG.centerX;
        var cy = VISUAL_CONFIG.centerY;

        var group = appendSvg(
            svg,
            "g",
            {
                class: "tire-sidewall-text"
            }
        );


        appendSvg(
            group,
            "text",
            {
                x: cx,
                y: cy - 20,
                class: "tire-brand-name",
                "text-anchor": "middle"
            },
            "BLACKRIDGE"
        );


        appendSvg(
            group,
            "text",
            {
                x: cx,
                y: cy - 9,
                class: "tire-brand-subtitle",
                "text-anchor": "middle"
            },
            "TIRE WORKS"
        );


        appendSvg(
            group,
            "text",
            {
                x: cx,
                y: cy + 8,
                class: "tire-product-spec",
                "text-anchor": "middle"
            },
            getProductType()
        );


        var displayedSerial = getSidewallSerial();

        var serialMismatch = isSerialMismatch();

        appendSvg(
            group,
            "text",
            {
                x: cx,
                y: cy + 22,
                class: serialMismatch
                    ? "tire-serial tire-serial-anomaly"
                    : "tire-serial",

                "text-anchor": "middle",

                "font-size":
                    displayedSerial.length > 10
                        ? 7.5
                        : 9
            },
            displayedSerial
        );


        if (serialMismatch) {
            appendSvg(
                group,
                "circle",
                {
                    cx: cx + 38,
                    cy: cy + 18,
                    r: 3.3,

                    fill: "#b93636",

                    class: "tire-serial-warning"
                }
            );
        }


        return group;
    }


    /* =====================================================
       13. BEAD AREA
       ===================================================== */

    function drawBead(svg) {
        var cx = VISUAL_CONFIG.centerX;
        var cy = VISUAL_CONFIG.centerY;

        var beadGroup = appendSvg(
            svg,
            "g",
            {
                class: "tire-bead"
            }
        );


        appendCircle(
            beadGroup,
            cx,
            cy,
            46,
            {
                fill: "url(#nsTireBeadGradient)",
                stroke: "#80897d",
                "stroke-width": 0.9
            }
        );


        appendCircle(
            beadGroup,
            cx,
            cy,
            42,
            {
                fill: "none",
                stroke: "#080a09",
                "stroke-width": 2
            }
        );


        appendCircle(
            beadGroup,
            cx,
            cy,
            38,
            {
                fill: "#101411",
                stroke: "#5c665a",
                "stroke-width": 1.1
            }
        );


        /* Separated bead indication */

        if (currentVisualState.separatedBead) {
            appendSvg(
                beadGroup,
                "path",
                {
                    d:
                        "M 208 174 " +
                        "A 46 46 0 0 0 224 145",

                    fill: "none",

                    stroke: "#de4040",

                    "stroke-width": 4,

                    "stroke-linecap": "round",

                    "stroke-dasharray": "10 4",

                    filter: "url(#nsTireRedGlow)"
                }
            );

            appendSvg(
                beadGroup,
                "path",
                {
                    d:
                        "M 205 170 " +
                        "L 211 166 " +
                        "L 208 160 " +
                        "L 216 157 ",

                    fill: "none",

                    stroke: "#f08b76",

                    "stroke-width": 1.2,

                    "stroke-linecap": "round"
                }
            );
        }


        /* Central hub */

        appendCircle(
            beadGroup,
            cx,
            cy,
            33,
            {
                fill: "url(#nsTireHubGradient)",
                stroke: "#101411",
                "stroke-width": 2
            }
        );


        appendCircle(
            beadGroup,
            cx,
            cy,
            27,
            {
                fill: "none",
                stroke: "#7a8577",
                "stroke-width": 0.75,
                "stroke-opacity": 0.5
            }
        );


        /* Six hub bolts */

        for (var i = 0; i < 6; i++) {
            var point = polarPoint(
                cx,
                cy,
                21,
                i * 60 - 90
            );

            appendCircle(
                beadGroup,
                point.x,
                point.y,
                3.0,
                {
                    fill: "#111512",
                    stroke: "#829083",
                    "stroke-width": 0.8
                }
            );

            appendCircle(
                beadGroup,
                point.x,
                point.y,
                0.8,
                {
                    fill: "#9ca79a"
                }
            );
        }


        /* Center label */

        appendSvg(
            beadGroup,
            "text",
            {
                x: cx,
                y: cy + 3,
                class: "tire-center-mark",
                "text-anchor": "middle"
            },
            "BT"
        );


        return beadGroup;
    }


    /* =====================================================
       14. VISIBLE SURFACE DAMAGE
       ===================================================== */

    function drawSurfaceDamage(svg) {
        if (!currentVisualState.visibleDamage) {
            return;
        }

        var group = appendSvg(
            svg,
            "g",
            {
                class: "tire-surface-damage"
            }
        );


        /*
         * The damage is intentionally stylized. It is a
         * visual storytelling clue, not a real-world defect
         * measurement or repair guide.
         */

        appendSvg(
            group,
            "path",
            {
                d:
                    "M 139 79 " +
                    "L 144 88 " +
                    "L 137 93 " +
                    "L 146 101 " +
                    "L 142 107 " +
                    "L 151 112",

                fill: "none",

                stroke: "#080909",

                "stroke-width": 6,

                "stroke-linecap": "round",

                "stroke-linejoin": "round"
            }
        );


        appendSvg(
            group,
            "path",
            {
                d:
                    "M 139 79 " +
                    "L 144 88 " +
                    "L 137 93 " +
                    "L 146 101 " +
                    "L 142 107 " +
                    "L 151 112",

                fill: "none",

                stroke: "#bb3939",

                "stroke-width": 2.4,

                "stroke-linecap": "round",

                "stroke-linejoin": "round"
            }
        );


        appendSvg(
            group,
            "circle",
            {
                cx: 138,
                cy: 94,
                r: 8,
                fill: "#b93838",
                "fill-opacity": 0.1,
                stroke: "#ce4b4b",
                "stroke-width": 0.8,
                "stroke-opacity": 0.8
            }
        );


        appendSvg(
            group,
            "text",
            {
                x: 119,
                y: 75,
                class: "tire-damage-label"
            },
            "!"
        );


        return group;
    }


    /* =====================================================
       15. IMPOSSIBLE TREAD LABEL
       ===================================================== */

    function drawChangingTreadLabel(svg) {
        if (!currentVisualState.changingTread) {
            return;
        }

        appendSvg(
            svg,
            "text",
            {
                x: 180,
                y: 257,
                class: "tire-anomaly-caption",
                "text-anchor": "middle"
            },
            "TREAD PATTERN CHANGED"
        );
    }


    /* =====================================================
       16. SUPERNATURAL SHADOW
       ===================================================== */

    function drawMovingShadow(svg) {
        if (!currentVisualState.movingShadow) {
            return;
        }

        var group = appendSvg(
            svg,
            "g",
            {
                class: "tire-moving-shadow"
            }
        );


        appendSvg(
            group,
            "ellipse",
            {
                cx: 180,
                cy: 143,
                rx: 76,
                ry: 68,
                fill: "#000000",
                "fill-opacity": 0.2,
                class: "tire-shadow-overlay"
            }
        );


        appendSvg(
            group,
            "path",
            {
                d:
                    "M 113 120 " +
                    "Q 147 68 181 91 " +
                    "Q 216 104 238 133",

                fill: "none",

                stroke: "#0a0b0a",

                "stroke-width": 13,

                "stroke-opacity": 0.26,

                "stroke-linecap": "round",

                class: "tire-moving-shadow-path"
            }
        );


        appendSvg(
            group,
            "text",
            {
                x: 180,
                y: 258,
                class: "tire-anomaly-caption",
                "text-anchor": "middle"
            },
            "SHADOW ALIGNMENT UNRESOLVED"
        );
    }


    /* =====================================================
       17. SMALL DATA LABELS
       ===================================================== */

    function drawSerialReference(svg) {
        var recordSerial = getProductSerial();

        var sidewallSerial = getSidewallSerial();

        var mismatch = isSerialMismatch();

        var group = appendSvg(
            svg,
            "g",
            {
                class: "tire-serial-reference"
            }
        );


        appendSvg(
            group,
            "text",
            {
                x: 12,
                y: 270,
                class: "tire-data-caption"
            },
            "RECORD: " + recordSerial
        );


        if (mismatch) {
            appendSvg(
                group,
                "text",
                {
                    x: 348,
                    y: 270,
                    class: "tire-data-caption tire-data-error",
                    "text-anchor": "end"
                },
                "SIDEWALL: " + sidewallSerial
            );
        }


        return group;
    }


    /* =====================================================
       18. SVG HOTSPOT HELPERS
       ===================================================== */

    function bindHotspot(group, area) {
        function activate() {
            if (
                window.NightShiftInspection &&
                typeof window.NightShiftInspection.inspectArea === "function"
            ) {
                window.NightShiftInspection.inspectArea(area);
            } else if (
                window.NightShiftGame &&
                typeof window.NightShiftGame.markAreaInspected === "function"
            ) {
                window.NightShiftGame.markAreaInspected(area);
            }
        }


        group.addEventListener("click", function () {
            activate();
        });


        group.addEventListener("keydown", function (event) {
            if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                event.preventDefault();

                activate();
            }
        });


        group.addEventListener("focus", function () {
            group.classList.add("is-focused");
        });


        group.addEventListener("blur", function () {
            group.classList.remove("is-focused");
        });
    }


    function drawHotspot(
        svg,
        area,
        x,
        y,
        width,
        label,
        code,
        connector
    ) {
        var scanCount = scanCounts[area] || 0;

        var group = appendSvg(
            svg,
            "g",
            {
                class:
                    "tire-hotspot" +
                    (scanCount > 0 ? " is-inspected" : ""),

                role: "button",

                tabindex: "0",

                "aria-label":
                    "Inspect " + label,

                "aria-pressed":
                    scanCount > 0 ? "true" : "false",

                "data-area": area
            }
        );


        /* Connector from label to tire */

        if (connector) {
            appendSvg(
                group,
                "path",
                {
                    d: connector,

                    fill: "none",

                    stroke: scanCount > 0
                        ? "#b84b4b"
                        : "#667166",

                    "stroke-width": 0.8,

                    "stroke-opacity": 0.85
                }
            );
        }


        /* Label background */

        appendSvg(
            group,
            "rect",
            {
                x: x,
                y: y,
                width: width,
                height: 32,

                rx: 2,

                fill: scanCount > 0
                    ? "#29201f"
                    : "#171c18",

                stroke: scanCount > 0
                    ? "#9c4646"
                    : "#414a41",

                "stroke-width": 0.8
            }
        );


        /* Leading status marker */

        appendCircle(
            group,
            x + 8,
            y + 10,
            2,
            {
                fill: scanCount > 0
                    ? "#d55c5c"
                    : "#899488"
            }
        );


        appendSvg(
            group,
            "text",
            {
                x: x + 14,
                y: y + 12,
                class: "tire-hotspot-name"
            },
            label
        );


        appendSvg(
            group,
            "text",
            {
                x: x + 8,
                y: y + 24,
                class: "tire-hotspot-code"
            },
            scanCount > 0
                ? "SCAN " + formatNumber(scanCount)
                : code
        );


        bindHotspot(group, area);

        return group;
    }


    /* =====================================================
       19. DRAW ALL HOTSPOTS
       ===================================================== */

    function drawHotspots(svg) {
        drawHotspot(
            svg,
            "tread",
            8,
            41,
            82,
            "TREAD",
            "AREA 01",
            "M 90 57 L 99 57 L 112 94"
        );


        drawHotspot(
            svg,
            "sidewall",
            270,
            69,
            82,
            "SIDEWALL",
            "AREA 02",
            "M 270 85 L 258 85 L 246 121"
        );


        drawHotspot(
            svg,
            "bead",
            270,
            197,
            82,
            "BEAD",
            "AREA 03",
            "M 270 213 L 257 213 L 220 177"
        );
    }


    /* =====================================================
       20. SVG ACCESSIBILITY / SCAN FOOTER
       ===================================================== */

    function drawScanSummary(svg) {
        var scannedAreas = Object.keys(scanCounts).filter(
            function (area) {
                return scanCounts[area] > 0;
            }
        );

        var label = scannedAreas.length === 0
            ? "SELECT AN INSPECTION AREA"
            : scannedAreas.length + " AREA(S) REVIEWED";

        appendSvg(
            svg,
            "text",
            {
                x: 180,
                y: 279,
                class: "tire-data-caption",
                "text-anchor": "middle"
            },
            label
        );
    }


    /* =====================================================
       21. INJECT CSS FOR THE SVG
       ===================================================== */

    function injectTireStyles() {
        if (getElement("nightShiftTireStyles")) {
            return;
        }

        var style = document.createElement("style");

        style.id = "nightShiftTireStyles";

        style.textContent = `
            /* SVG responsive sizing */

            #tireVisual {
                position: relative;
                width: 100%;
            }

            #tireVisual .night-shift-tire-svg {
                display: block;
                width: 100%;
                max-width: 430px;
                height: auto;
                max-height: 300px;
                margin: 0 auto;
                overflow: visible;
            }


            /* Technical labels */

            #tireVisual .tire-technical-label {
                fill: #657165;
                font-family: var(--font-mono, monospace);
                font-size: 6.5px;
                letter-spacing: 1.4px;
            }

            #tireVisual .tire-data-caption {
                fill: #707b70;
                font-family: var(--font-mono, monospace);
                font-size: 6.4px;
                letter-spacing: 0.3px;
            }

            #tireVisual .tire-data-error {
                fill: #d66d6d;
            }


            /* Sidewall text */

            #tireVisual .tire-brand-name {
                fill: #a2ac9f;
                font-family: Arial, sans-serif;
                font-size: 8px;
                font-weight: 900;
                letter-spacing: 1px;
            }

            #tireVisual .tire-brand-subtitle {
                fill: #798577;
                font-family: var(--font-mono, monospace);
                font-size: 5.2px;
                letter-spacing: 1.4px;
            }

            #tireVisual .tire-product-spec {
                fill: #a1ab9e;
                font-family: var(--font-mono, monospace);
                font-size: 6px;
                letter-spacing: 0.8px;
            }

            #tireVisual .tire-serial {
                fill: #c5cec0;
                font-family: var(--font-mono, monospace);
                font-size: 8px;
                font-weight: 800;
                letter-spacing: 0.25px;
            }

            #tireVisual .tire-serial-anomaly {
                fill: #f06464;
                filter: url(#nsTireRedGlow);
            }

            #tireVisual .tire-center-mark {
                fill: #c1ccbd;
                font-family: Arial, sans-serif;
                font-size: 9px;
                font-weight: 900;
                letter-spacing: 0.5px;
            }


            /* Damage */

            #tireVisual .tire-damage-label {
                fill: #f07373;
                font-family: var(--font-mono, monospace);
                font-size: 10px;
                font-weight: 900;
            }

            #tireVisual .tire-anomaly-caption {
                fill: #d57878;
                font-family: var(--font-mono, monospace);
                font-size: 7px;
                font-weight: 900;
                letter-spacing: 0.8px;
            }


            /* Interactive hotspots */

            #tireVisual .tire-hotspot {
                cursor: pointer;
                outline: none;
            }

            #tireVisual .tire-hotspot-name {
                fill: #d4dcd0;
                font-family: var(--font-mono, monospace);
                font-size: 7.2px;
                font-weight: 900;
                letter-spacing: 0.4px;
            }

            #tireVisual .tire-hotspot-code {
                fill: #879386;
                font-family: var(--font-mono, monospace);
                font-size: 6px;
                letter-spacing: 0.5px;
            }

            #tireVisual .tire-hotspot:hover rect {
                fill: #242d26;
                stroke: #849182;
            }

            #tireVisual .tire-hotspot.is-inspected rect {
                stroke: #a44747;
            }

            #tireVisual .tire-hotspot.is-focused rect {
                stroke: #e6eeee;
                stroke-width: 1.8;
            }

            #tireVisual .tire-hotspot:focus-visible rect {
                stroke: #e6eeee;
                stroke-width: 1.8;
            }


            /* Changing tread */

            #tireVisual .tire-changing-ring {
                animation: night-shift-tread-pulse 2s ease-in-out infinite;
            }

            @keyframes night-shift-tread-pulse {
                0%, 100% {
                    stroke-opacity: 0.4;
                }

                50% {
                    stroke-opacity: 0.95;
                }
            }


            /* Supernatural shadow */

            #tireVisual .tire-shadow-overlay {
                animation: night-shift-shadow-drift 3.8s ease-in-out infinite alternate;
            }

            #tireVisual .tire-moving-shadow-path {
                animation: night-shift-shadow-line 4.2s ease-in-out infinite alternate;
            }

            @keyframes night-shift-shadow-drift {
                0% {
                    transform: translate(-5px, 3px);
                    opacity: 0.12;
                }

                50% {
                    opacity: 0.34;
                }

                100% {
                    transform: translate(7px, -3px);
                    opacity: 0.18;
                }
            }

            @keyframes night-shift-shadow-line {
                0% {
                    opacity: 0.15;
                    transform: translateX(-4px);
                }

                50% {
                    opacity: 0.7;
                }

                100% {
                    opacity: 0.2;
                    transform: translateX(4px);
                }
            }


            @media (max-width: 420px) {
                #tireVisual .night-shift-tire-svg {
                    max-height: 290px;
                }
            }


            @media (prefers-reduced-motion: reduce) {
                #tireVisual .tire-changing-ring,
                #tireVisual .tire-shadow-overlay,
                #tireVisual .tire-moving-shadow-path {
                    animation: none;
                }
            }
        `;

        document.head.appendChild(style);
    }


    /* =====================================================
       22. BUILD SVG
       ===================================================== */

    function buildTireSvg() {
        var svg = svgElement(
            "svg",
            {
                xmlns: SVG_NS,

                viewBox: VISUAL_CONFIG.viewBox,

                class: "night-shift-tire-svg",

                role: "group",

                "aria-label":
                    "Interactive fictional tire diagram with tread, sidewall, and bead inspection areas"
            }
        );


        buildSvgDefinitions(svg);

        drawBackground(svg);

        drawOuterTire(svg);

        drawTreadGrooves(svg);

        drawSidewall(svg);

        drawBead(svg);

        drawSidewallText(svg);

        drawSurfaceDamage(svg);

        drawMovingShadow(svg);

        drawChangingTreadLabel(svg);

        drawSerialReference(svg);

        drawHotspots(svg);

        drawScanSummary(svg);


        return svg;
    }


    /* =====================================================
       23. RENDER CURRENT TIRE

       Public method called by game.js:
       NightShiftTires.render(caseData, productionRecord)
       ===================================================== */

    function render(caseData, productionRecord) {
        var container = getElement("tireVisual");

        if (!container) {
            console.warn(
                "[NIGHT SHIFT TIRES] #tireVisual not found."
            );

            return false;
        }

        injectTireStyles();


        var caseChanged =
            !currentCase ||
            !caseData ||
            currentCase.id !== caseData.id;


        currentCase = caseData || null;

        currentRecord = productionRecord || null;


        if (caseChanged) {
            scanCounts = {};

            currentVisualState = {
                changingTread: false,
                movingShadow: false,
                visibleDamage: false,
                separatedBead: false,
                impossiblePattern: false,
                serialMismatch: false
            };
        }


        currentVisualAnomalyIds = getVisualAnomalyIds(
            currentCase,
            currentRecord
        );


        updateVisualState();


        var svg = buildTireSvg();

        container.replaceChildren(svg);


        /*
         * Hide the old placeholder if it was left in the HTML.
         * replaceChildren() already removes it, so no extra
         * changes to index.html are required.
         */


        updateStatusText();

        return true;
    }


    /* =====================================================
       24. HANDLE INSPECTION OF AN AREA

       Called by inspection.js:

       NightShiftTires.inspectArea(
           area,
           caseData,
           productionRecord,
           scanCount
       )

       It does not call inspection.js again, preventing
       circular function calls.
       ===================================================== */

    function inspectArea(
        area,
        caseData,
        productionRecord,
        scanCount
    ) {
        var areaId = String(area || "").toLowerCase();

        var validAreas = [
            "tread",
            "sidewall",
            "bead"
        ];

        if (validAreas.indexOf(areaId) === -1) {
            return {
                success: false,
                reason: "invalid-area"
            };
        }


        if (caseData && currentCase && caseData.id !== currentCase.id) {
            render(
                caseData,
                productionRecord
            );
        } else {
            if (caseData) {
                currentCase = caseData;
            }

            if (productionRecord) {
                currentRecord = productionRecord;
            }
        }


        if (typeof scanCount === "number" && scanCount > 0) {
            scanCounts[areaId] = scanCount;
        } else {
            scanCounts[areaId] = (
                scanCounts[areaId] || 0
            ) + 1;
        }


        currentVisualAnomalyIds = getVisualAnomalyIds(
            currentCase,
            currentRecord
        );


        /*
         * Re-render so repeat scans and selected states
         * are reflected in the illustration.
         */

        updateVisualState();

        var container = getElement("tireVisual");

        if (container) {
            container.replaceChildren(
                buildTireSvg()
            );
        }


        updateStatusText();


        return {
            success: true,

            area: areaId,

            scanCount: scanCounts[areaId],

            changingTread:
                currentVisualState.changingTread,

            visualAnomalyIds:
                currentVisualAnomalyIds.slice(),

            serialMismatch:
                currentVisualState.serialMismatch
        };
    }


    /* =====================================================
       25. UPDATE STATUS
       ===================================================== */

    function updateStatusText() {
        var serialMismatch = isSerialMismatch();

        var hasVisualAnomalies =
            currentVisualAnomalyIds.length > 0;

        if (serialMismatch) {
            setText(
                "scanStatus",
                "SERIAL MISMATCH"
            );

            return;
        }

        if (currentVisualState.changingTread) {
            setText(
                "scanStatus",
                "PATTERN CHANGED"
            );

            return;
        }

        if (hasVisualAnomalies) {
            setText(
                "scanStatus",
                "VISUAL REVIEW REQUIRED"
            );

            return;
        }

        var scannedCount = Object.keys(scanCounts).filter(
            function (area) {
                return scanCounts[area] > 0;
            }
        ).length;

        setText(
            "scanStatus",
            scannedCount > 0
                ? "SCAN IN PROGRESS"
                : "AWAITING SCAN"
        );
    }


    /* =====================================================
       26. GET CURRENT VISUAL STATE
       ===================================================== */

    function getState() {
        return {
            caseId: currentCase
                ? currentCase.id
                : null,

            productSerial: getProductSerial(),

            sidewallSerial: getSidewallSerial(),

            scanCounts: Object.assign({}, scanCounts),

            visualAnomalyIds:
                currentVisualAnomalyIds.slice(),

            visualState:
                Object.assign({}, currentVisualState),

            productType: getProductType()
        };
    }


    /* =====================================================
       27. RESET VISUAL MODULE
       ===================================================== */

    function reset() {
        currentCase = null;

        currentRecord = null;

        currentVisualAnomalyIds = [];

        scanCounts = {};

        currentVisualState = {
            changingTread: false,
            movingShadow: false,
            visibleDamage: false,
            separatedBead: false,
            impossiblePattern: false,
            serialMismatch: false
        };

        var container = getElement("tireVisual");

        if (container) {
            container.replaceChildren();

            var placeholder = document.createElement("div");

            placeholder.className = "tire-placeholder";

            var wheel = document.createElement("div");

            wheel.className = "placeholder-wheel";

            var innerWheel = document.createElement("div");

            innerWheel.className = "placeholder-inner-wheel";

            innerWheel.textContent = "BT";

            wheel.appendChild(innerWheel);

            var text = document.createElement("p");

            text.textContent = "AWAITING VISUAL SCAN";

            placeholder.appendChild(wheel);

            placeholder.appendChild(text);

            container.appendChild(placeholder);
        }

        setText("scanStatus", "NOT STARTED");

        return true;
    }


    /* =====================================================
       28. INITIALIZATION
       ===================================================== */

    function initialize() {
        if (initialized) {
            return;
        }

        initialized = true;

        injectTireStyles();

        console.log(
            "[NIGHT SHIFT TIRES] Tire visualization initialized."
        );
    }


    /* =====================================================
       29. PUBLIC API
       ===================================================== */

    window.NightShiftTires = {

        render: render,

        inspectArea: inspectArea,

        getState: getState,

        reset: reset,

        getAnomalyIds: function () {
            return currentVisualAnomalyIds.slice();
        },

        getProductSerial: getProductSerial,

        getSidewallSerial: getSidewallSerial,

        isSerialMismatch: isSerialMismatch
    };


    /* =====================================================
       30. LEGACY GLOBAL ALIAS
       ===================================================== */

    window.renderTireVisual = render;


    /* =====================================================
       31. STARTUP
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

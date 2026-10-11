
/* =========================================================
   NIGHT SHIFT: TIRE INSPECTION
   ANOMALY INDEX — INTERACTIVE HORROR ARCHIVE

   File: js/anomaly-index.js

   Fitur:
   1. Arsip interaktif untuk delapan proses.
   2. Referensi anomali operator dan identitas.
   3. Referensi anomali dokumen dan laporan.
   4. Referensi anomali visual dan supernatural.
   5. Pencarian petunjuk secara langsung.
   6. Filter kategori.
   7. Statistik arsip.
   8. Detail anomali yang bisa dibuka dan ditutup.
   9. Tampilan responsif.
   10. Efek horor industrial yang tetap nyaman dibaca.

   Dependency:
   js/anomalies.js harus dimuat sebelumnya.

   Semua nama, arsip, kejadian, dan aturan merupakan fiksi.
   ========================================================= */

(function () {
    "use strict";


    /* =====================================================
       01. KONFIGURASI
       ===================================================== */

    var ROOT_ID = "anomalyIndexPanel";
    var LIST_ID = "anomalyIndexList";

    var FILTERS = [
        {
            id: "all",
            label: "ALL RECORDS"
        },
        {
            id: "process",
            label: "PROCESSES"
        },
        {
            id: "person",
            label: "PERSONNEL"
        },
        {
            id: "paper",
            label: "DOCUMENTS"
        },
        {
            id: "visual",
            label: "VISUAL"
        }
    ];

    var ACTIVE_FILTER = "all";
    var SEARCH_QUERY = "";

    var searchInput = null;
    var filterButtons = [];
    var entryElements = [];
    var resultCounter = null;
    var emptyState = null;


    /* =====================================================
       02. HELPER HTML

       Gunakan textContent untuk tulisan dari database,
       sehingga teks tidak diperlakukan sebagai HTML.
       ===================================================== */

    function createElement(tag, className, text) {
        var element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text !== undefined && text !== null) {
            element.textContent = String(text);
        }

        return element;
    }


    function appendTextElement(parent, tag, className, text) {
        var element = createElement(tag, className, text);
        parent.appendChild(element);
        return element;
    }


    function createButton(className, text, type) {
        var button = createElement("button", className, text);

        button.type = type || "button";

        return button;
    }


    function clearElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }


    function formatNumber(value) {
        return String(value).padStart(2, "0");
    }


    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }


    /* =====================================================
       03. AMBIL DATA DARI anomalies.js
       ===================================================== */

    function getSourceData() {
        if (
            typeof getAnomalyIndexData === "function"
        ) {
            return getAnomalyIndexData();
        }

        return null;
    }


    function getSupportingCatalog(category) {
        var catalogs = {
            person:
                typeof ANOMALY_PEOPLE_CATALOG !== "undefined"
                    ? ANOMALY_PEOPLE_CATALOG
                    : [],

            paper:
                typeof ANOMALY_PAPER_CATALOG !== "undefined"
                    ? ANOMALY_PAPER_CATALOG
                    : [],

            visual:
                typeof ANOMALY_VISUAL_CATALOG !== "undefined"
                    ? ANOMALY_VISUAL_CATALOG
                    : []
        };

        return safeArray(catalogs[category]);
    }


    function getTotalDefinitions() {
        if (
            typeof ANOMALY_DEFINITIONS !== "undefined" &&
            Array.isArray(ANOMALY_DEFINITIONS)
        ) {
            return ANOMALY_DEFINITIONS.length;
        }

        return 0;
    }


    /* =====================================================
       04. TANAMKAN STYLING ARSIP

       Styling ini khusus untuk Anomaly Index.
       Gaya utama game tetap berada di css/style.css.
       ===================================================== */

    function injectArchiveStyles() {
        if (document.getElementById("nightShiftArchiveStyles")) {
            return;
        }

        var style = document.createElement("style");

        style.id = "nightShiftArchiveStyles";

        style.textContent = `
            /* ==========================================
               ARCHIVE WINDOW
               ========================================== */

            #${ROOT_ID} .ns-ai-shell {
                position: relative;
                overflow: hidden;
                color: #dfe4dd;
                background:
                    radial-gradient(
                        ellipse at 100% 0%,
                        rgba(122, 28, 28, 0.12),
                        transparent 48%
                    ),
                    #0b0e0d;
                border: 1px solid #343a35;
            }

            #${ROOT_ID} .ns-ai-shell::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: #a32c2c;
                pointer-events: none;
            }

            #${ROOT_ID} .ns-ai-topbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                flex-wrap: wrap;
                padding: 13px;
                background: #141816;
                border-bottom: 1px solid #303630;
            }

            #${ROOT_ID} .ns-ai-topbar-label {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #c9cec7;
                font-family: var(--font-mono, monospace);
                font-size: 9px;
                font-weight: 800;
                letter-spacing: 0.12em;
            }

            #${ROOT_ID} .ns-ai-led {
                width: 7px;
                height: 7px;
                flex-shrink: 0;
                background: #b72e2e;
                border-radius: 50%;
                box-shadow: 0 0 9px rgba(211, 46, 46, 0.3);
                animation: ns-ai-pulse 2.6s ease-in-out infinite;
            }

            #${ROOT_ID} .ns-ai-classification {
                padding: 5px 7px;
                color: #d27979;
                background: rgba(151, 38, 38, 0.08);
                border: 1px solid rgba(175, 55, 55, 0.32);
                font-family: var(--font-mono, monospace);
                font-size: 8px;
                font-weight: 800;
                letter-spacing: 0.08em;
            }

            @keyframes ns-ai-pulse {
                0%, 100% {
                    opacity: 1;
                }

                50% {
                    opacity: 0.42;
                }
            }


            /* ==========================================
               INTRODUCTION
               ========================================== */

            #${ROOT_ID} .ns-ai-intro {
                position: relative;
                padding: 19px 14px 17px;
                border-bottom: 1px solid #282e2a;
            }

            #${ROOT_ID} .ns-ai-kicker {
                margin-bottom: 8px;
                color: #bf5555;
                font-family: var(--font-mono, monospace);
                font-size: 9px;
                font-weight: 800;
                letter-spacing: 0.16em;
            }

            #${ROOT_ID} .ns-ai-title {
                color: #eceee8;
                font-size: clamp(18px, 3vw, 24px);
                font-weight: 900;
                line-height: 1.3;
                letter-spacing: -0.035em;
            }

            #${ROOT_ID} .ns-ai-description {
                margin-top: 9px;
                color: #a8b0a6;
                font-size: 11px;
                line-height: 1.9;
            }

            #${ROOT_ID} .ns-ai-warning {
                margin-top: 14px;
                padding: 10px 11px;
                color: #c5b39c;
                background: rgba(132, 98, 54, 0.07);
                border-left: 2px solid #795b39;
                font-size: 10px;
                line-height: 1.85;
            }

            #${ROOT_ID} .ns-ai-warning strong {
                display: block;
                margin-bottom: 3px;
                color: #d6b78b;
                font-family: var(--font-mono, monospace);
                font-size: 8px;
                letter-spacing: 0.12em;
            }


            /* ==========================================
               ARCHIVE STATISTICS
               ========================================== */

            #${ROOT_ID} .ns-ai-stat-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 7px;
                padding: 12px;
                border-bottom: 1px solid #282e2a;
            }

            #${ROOT_ID} .ns-ai-stat {
                min-width: 0;
                padding: 11px 10px;
                background: #121614;
                border: 1px solid #2b322d;
            }

            #${ROOT_ID} .ns-ai-stat-label {
                display: block;
                color: #899288;
                font-family: var(--font-mono, monospace);
                font-size: 8px;
                line-height: 1.6;
                letter-spacing: 0.08em;
            }

            #${ROOT_ID} .ns-ai-stat-value {
                display: block;
                margin-top: 4px;
                color: #e8ece4;
                font-family: var(--font-mono, monospace);
                font-size: 23px;
                font-weight: 900;
                line-height: 1.25;
            }

            #${ROOT_ID} .ns-ai-stat-value-red {
                color: #d85a5a;
            }

            #${ROOT_ID} .ns-ai-meter {
                height: 3px;
                margin-top: 8px;
                overflow: hidden;
                background: #282f2a;
            }

            #${ROOT_ID} .ns-ai-meter-fill {
                width: 100%;
                height: 100%;
                background: #943131;
                transform-origin: left center;
            }


            /* ==========================================
               SEARCH & FILTERS
               ========================================== */

            #${ROOT_ID} .ns-ai-tools {
                padding: 12px;
                background: #0e1210;
                border-bottom: 1px solid #303630;
            }

            #${ROOT_ID} .ns-ai-search-label {
                display: block;
                margin-bottom: 7px;
                color: #9da69c;
                font-family: var(--font-mono, monospace);
                font-size: 8px;
                font-weight: 800;
                letter-spacing: 0.1em;
            }

            #${ROOT_ID} .ns-ai-search-wrap {
                position: relative;
            }

            #${ROOT_ID} .ns-ai-search-icon {
                position: absolute;
                top: 50%;
                left: 11px;
                color: #9c5555;
                font-family: var(--font-mono, monospace);
                font-size: 15px;
                transform: translateY(-50%);
                pointer-events: none;
            }

            #${ROOT_ID} .ns-ai-search {
                width: 100%;
                min-height: 40px;
                padding: 10px 11px 10px 33px;
                color: #e2e6df;
                background: #151a17;
                border: 1px solid #3a423b;
                border-radius: 2px;
                outline: none;
                font-family: var(--font-main, Arial, sans-serif);
                font-size: 12px;
                transition:
                    border-color 160ms ease,
                    background 160ms ease;
            }

            #${ROOT_ID} .ns-ai-search::placeholder {
                color: #727c72;
            }

            #${ROOT_ID} .ns-ai-search:focus {
                background: #191f1b;
                border-color: #9d4545;
                box-shadow: 0 0 0 2px rgba(171, 43, 43, 0.09);
            }

            #${ROOT_ID} .ns-ai-filter-label {
                margin-top: 13px;
                margin-bottom: 7px;
                color: #7f897f;
                font-family: var(--font-mono, monospace);
                font-size: 8px;
                letter-spacing: 0.1em;
            }

            #${ROOT_ID} .ns-ai-filter-list {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
            }

            #${ROOT_ID} .ns-ai-filter {
                min-height: 29px;
                padding: 6px 8px;
                color: #a7afa5;
                background: #151a17;
                border: 1px solid #333a34;
                border-radius: 2px;
                cursor: pointer;
                font-family: var(--font-mono, monospace);
                font-size: 8px;
                font-weight: 800;
                letter-spacing: 0.035em;
                transition:
                    color 150ms ease,
                    background 150ms ease,
                    border-color 150ms ease;
            }

            #${ROOT_ID} .ns-ai-filter:hover {
                color: #f1f3ec;
                border-color: #747d73;
            }

            #${ROOT_ID} .ns-ai-filter.is-active {
                color: #fff1f1;
                background: #542222;
                border-color: #943b3b;
            }

            #${ROOT_ID} .ns-ai-result-line {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin-top: 10px;
                color: #7f897f;
                font-family: var(--font-mono, monospace);
                font-size: 8px;
            }

            #${ROOT_ID} .ns-ai-result-number {
                color: #c6cec2;
            }


            /* ==========================================
               INDEX SECTIONS
               ========================================== */

            #${ROOT_ID} .ns-ai-section-heading {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 10px;
                padding: 17px 12px 10px;
            }

            #${ROOT_ID} .ns-ai-section-heading h4 {
                color: #dce1d8;
                font-family: var(--font-mono, monospace);
                font-size: 10px;
                font-weight: 900;
                line-height: 1.6;
                letter-spacing: 0.09em;
            }

            #${ROOT_ID} .ns-ai-section-heading p {
                margin-top: 4px;
                color: #818a80;
                font-size: 10px;
                line-height: 1.7;
            }

            #${ROOT_ID} .ns-ai-section-code {
                flex-shrink: 0;
                color: #a75c5c;
                font-family: var(--font-mono, monospace);
                font-size: 8px;
                letter-spacing: 0.05em;
            }


            /* ==========================================
               PROCESS / SUPPORTING CARDS
               ========================================== */

            #${ROOT_ID} .ns-ai-entries {
                display: flex;
                flex-direction: column;
                gap: 7px;
                padding: 0 10px 12px;
            }

            #${ROOT_ID} .ns-ai-entry {
                min-width: 0;
                background: #121614;
                border: 1px solid #303831;
                transition:
                    border-color 160ms ease,
                    background 160ms ease;
            }

            #${ROOT_ID} .ns-ai-entry:hover {
                background: #151a17;
                border-color: #4a554a;
            }

            #${ROOT_ID} .ns-ai-entry[hidden] {
                display: none !important;
            }

            #${ROOT_ID} .ns-ai-entry[open] {
                border-color: #604040;
                background:
                    linear-gradient(
                        120deg,
                        rgba(105, 32, 32, 0.055),
                        transparent 70%
                    ),
                    #121614;
            }

            #${ROOT_ID} .ns-ai-entry-summary {
                display: flex;
                align-items: center;
                gap: 10px;
                min-height: 62px;
                padding: 10px;
                cursor: pointer;
                list-style: none;
            }

            #${ROOT_ID} .ns-ai-entry-summary::-webkit-details-marker {
                display: none;
            }

            #${ROOT_ID} .ns-ai-entry-summary::marker {
                content: "";
            }

            #${ROOT_ID} .ns-ai-entry-summary:focus-visible {
                outline: 2px solid #bc5757;
                outline-offset: -3px;
            }

            #${ROOT_ID} .ns-ai-entry-number {
                width: 33px;
                height: 37px;
                flex-shrink: 0;
                display: grid;
                place-items: center;
                color: #c56d6d;
                background: #211515;
                border: 1px solid #523030;
                font-family: var(--font-mono, monospace);
                font-size: 10px;
                font-weight: 900;
            }

            #${ROOT_ID} .ns-ai-entry-main {
                flex: 1;
                min-width: 0;
            }

            #${ROOT_ID} .ns-ai-entry-name {
                display: block;
                color: #e0e5dd;
                font-size: 11px;
                font-weight: 800;
                line-height: 1.6;
                overflow-wrap: anywhere;
            }

            #${ROOT_ID} .ns-ai-entry-meta {
                display: block;
                margin-top: 3px;
                color: #828d81;
                font-family: var(--font-mono, monospace);
                font-size: 8px;
                line-height: 1.7;
                overflow-wrap: anywhere;
            }

            #${ROOT_ID} .ns-ai-entry-count {
                flex-shrink: 0;
                min-width: 31px;
                padding: 5px 6px;
                color: #c0c8bd;
                background: #1c221e;
                border: 1px solid #354038;
                font-family: var(--font-mono, monospace);
                font-size: 9px;
                font-weight: 800;
                text-align: center;
            }

            #${ROOT_ID} .ns-ai-entry-arrow {
                flex-shrink: 0;
                color: #a55252;
                font-family: var(--font-mono, monospace);
                font-size: 13px;
                transition: transform 180ms ease;
            }

            #${ROOT_ID} details[open] > summary .ns-ai-entry-arrow {
                transform: rotate(90deg);
            }

            #${ROOT_ID} .ns-ai-entry-body {
                padding: 0 10px 12px;
                border-top: 1px solid #292f2a;
            }

            #${ROOT_ID} .ns-ai-rule {
                margin-top: 11px;
                padding: 10px;
                background: rgba(105, 130, 105, 0.055);
                border-left: 2px solid #596e59;
            }

            #${ROOT_ID} .ns-ai-rule-label,
            #${ROOT_ID} .ns-ai-field-label {
                display: block;
                color: #91a08f;
                font-family: var(--font-mono, monospace);
                font-size: 8px;
                font-weight: 800;
                letter-spacing: 0.1em;
            }

            #${ROOT_ID} .ns-ai-rule-text {
                margin-top: 6px;
                color: #c1c9bf;
                font-size: 10px;
                line-height: 1.85;
                overflow-wrap: anywhere;
            }


            /* ==========================================
               ANOMALY ENTRIES
               ========================================== */

            #${ROOT_ID} .ns-ai-anomaly {
                position: relative;
                margin-top: 9px;
                padding: 11px;
                background: #0f1311;
                border: 1px solid #2b322d;
                border-left: 2px solid #774141;
            }

            #${ROOT_ID} .ns-ai-anomaly-top {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 8px;
            }

            #${ROOT_ID} .ns-ai-anomaly-id {
                display: inline-block;
                color: #cf7777;
                font-family: var(--font-mono, monospace);
                font-size: 8px;
                font-weight: 900;
                letter-spacing: 0.07em;
                overflow-wrap: anywhere;
            }

            #${ROOT_ID} .ns-ai-severity {
                flex-shrink: 0;
                padding: 3px 5px;
                color: #d19a85;
                background: rgba(128, 51, 38, 0.12);
                border: 1px solid rgba(146, 71, 53, 0.4);
                font-family: var(--font-mono, monospace);
                font-size: 7px;
                font-weight: 900;
                letter-spacing: 0.045em;
            }

            #${ROOT_ID} .ns-ai-severity.medium {
                color: #c7b17f;
                background: rgba(129, 101, 43, 0.09);
                border-color: rgba(129, 101, 43, 0.36);
            }

            #${ROOT_ID} .ns-ai-anomaly-title {
                margin-top: 6px;
                color: #e2e5de;
                font-size: 11px;
                font-weight: 800;
                line-height: 1.6;
                overflow-wrap: anywhere;
            }

            #${ROOT_ID} .ns-ai-anomaly-clue {
                margin-top: 7px;
                color: #aab3a7;
                font-size: 10px;
                line-height: 1.9;
                overflow-wrap: anywhere;
            }

            #${ROOT_ID} .ns-ai-anomaly-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 6px;
                margin-top: 9px;
                padding-top: 8px;
                color: #737f73;
                border-top: 1px solid #252c27;
                font-family: var(--font-mono, monospace);
                font-size: 8px;
            }

            #${ROOT_ID} .ns-ai-evidence-tag {
                color: #96a294;
            }

            #${ROOT_ID} .ns-ai-empty-category {
                padding: 13px;
                color: #909a8e;
                font-size: 10px;
                line-height: 1.8;
            }


            /* ==========================================
               SEARCH EMPTY STATE
               ========================================== */

            #${ROOT_ID} .ns-ai-empty-search {
                margin: 0 10px 12px;
                padding: 22px 12px;
                text-align: center;
                background: #111512;
                border: 1px dashed #494139;
            }

            #${ROOT_ID} .ns-ai-empty-symbol {
                color: #aa5555;
                font-family: var(--font-mono, monospace);
                font-size: 23px;
            }

            #${ROOT_ID} .ns-ai-empty-title {
                margin-top: 9px;
                color: #dedfd8;
                font-family: var(--font-mono, monospace);
                font-size: 10px;
                font-weight: 900;
                letter-spacing: 0.06em;
            }

            #${ROOT_ID} .ns-ai-empty-text {
                margin-top: 7px;
                color: #929b91;
                font-size: 10px;
                line-height: 1.8;
            }


            /* ==========================================
               ARCHIVE FOOTER
               ========================================== */

            #${ROOT_ID} .ns-ai-bottom {
                padding: 12px;
                background: #111512;
                border-top: 1px solid #303730;
            }

            #${ROOT_ID} .ns-ai-bottom-line {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 8px;
                color: #7f887e;
                font-family: var(--font-mono, monospace);
                font-size: 8px;
                line-height: 1.8;
            }

            #${ROOT_ID} .ns-ai-bottom-line span:last-child {
                color: #bd6565;
                text-align: right;
            }

            #${ROOT_ID} .ns-ai-disclaimer {
                margin-top: 9px;
                color: #7e877d;
                font-size: 9px;
                line-height: 1.85;
            }


            /* ==========================================
               RESPONSIVE LAYOUT
               ========================================== */

            @media (max-width: 360px) {
                #${ROOT_ID} .ns-ai-stat-grid {
                    gap: 5px;
                    padding: 9px;
                }

                #${ROOT_ID} .ns-ai-stat {
                    padding: 9px 7px;
                }

                #${ROOT_ID} .ns-ai-stat-value {
                    font-size: 19px;
                }

                #${ROOT_ID} .ns-ai-entry-summary {
                    gap: 7px;
                    padding: 8px;
                }

                #${ROOT_ID} .ns-ai-entry-number {
                    width: 29px;
                    height: 33px;
                }

                #${ROOT_ID} .ns-ai-entry-count {
                    min-width: 25px;
                    padding: 4px;
                }
            }


            /* ==========================================
               REDUCED MOTION
               ========================================== */

            @media (prefers-reduced-motion: reduce) {
                #${ROOT_ID} .ns-ai-led {
                    animation: none;
                }

                #${ROOT_ID} .ns-ai-entry-arrow,
                #${ROOT_ID} .ns-ai-filter,
                #${ROOT_ID} .ns-ai-search {
                    transition: none;
                }
            }
        `;

        document.head.appendChild(style);
    }


    /* =====================================================
       05. HEADER ARSIP
       ===================================================== */

    function buildArchiveHeader(container, data) {
        var shell = createElement("div", "ns-ai-shell");

        var topbar = createElement("div", "ns-ai-topbar");

        var statusLabel = createElement("div", "ns-ai-topbar-label");

        appendTextElement(statusLabel, "span", "ns-ai-led", "");

        appendTextElement(
            statusLabel,
            "span",
            "",
            "ARCHIVE SYSTEM // ONLINE"
        );

        topbar.appendChild(statusLabel);

        appendTextElement(
            topbar,
            "span",
            "ns-ai-classification",
            "FICTIONAL ARCHIVE"
        );

        shell.appendChild(topbar);


        /* Introduction */

        var intro = createElement("div", "ns-ai-intro");

        appendTextElement(
            intro,
            "p",
            "ns-ai-kicker",
            "RECORD CLASSIFICATION // AI-00"
        );

        appendTextElement(
            intro,
            "h3",
            "ns-ai-title",
            "Anomaly Index"
        );

        appendTextElement(
            intro,
            "p",
            "ns-ai-description",
            "Delapan jalur proses. Puluhan catatan. " +
            "Sebagian kesalahan bisa dijelaskan. " +
            "Sebagian lainnya tidak seharusnya ada di sini."
        );

        var warning = createElement("div", "ns-ai-warning");

        appendTextElement(
            warning,
            "strong",
            "",
            "INSPECTOR'S NOTE"
        );

        appendTextElement(
            warning,
            "span",
            "",
            "Jangan memutuskan hanya karena seseorang terlihat aneh. " +
            "Cocokkan identitas, waktu, lokasi, produk, dan dokumen. " +
            "Cari bukti yang benar-benar bertentangan."
        );

        intro.appendChild(warning);
        shell.appendChild(intro);


        /* Statistics */

        var statGrid = createElement("div", "ns-ai-stat-grid");

        var processCount = safeArray(data.processes).length;
        var definitionCount = getTotalDefinitions();

        buildStat(
            statGrid,
            "PROCESS GROUPS",
            formatNumber(processCount),
            false
        );

        buildStat(
            statGrid,
            "KNOWN PATTERNS",
            formatNumber(definitionCount),
            true
        );

        shell.appendChild(statGrid);

        container.appendChild(shell);
    }


    function buildStat(parent, label, value, isRed) {
        var stat = createElement("div", "ns-ai-stat");

        appendTextElement(
            stat,
            "span",
            "ns-ai-stat-label",
            label
        );

        appendTextElement(
            stat,
            "strong",
            "ns-ai-stat-value" + (isRed ? " ns-ai-stat-value-red" : ""),
            value
        );

        var meter = createElement("div", "ns-ai-meter");
        var fill = createElement("div", "ns-ai-meter-fill");

        meter.appendChild(fill);
        stat.appendChild(meter);

        parent.appendChild(stat);
    }


    /* =====================================================
       06. SEARCH DAN FILTER TOOLBAR
       ===================================================== */

    function buildToolbar(container) {
        var toolbar = createElement("div", "ns-ai-tools");

        appendTextElement(
            toolbar,
            "label",
            "ns-ai-search-label",
            "SEARCH THE ARCHIVE"
        );

        var searchWrap = createElement("div", "ns-ai-search-wrap");

        appendTextElement(
            searchWrap,
            "span",
            "ns-ai-search-icon",
            "⌕"
        );

        searchInput = createElement("input", "ns-ai-search");

        searchInput.type = "search";
        searchInput.id = "nsAiSearch";
        searchInput.placeholder =
            "Search ID, operator, serial, stamp...";
        searchInput.autocomplete = "off";
        searchInput.spellcheck = false;
        searchInput.setAttribute(
            "aria-label",
            "Search anomaly index"
        );

        searchWrap.appendChild(searchInput);
        toolbar.appendChild(searchWrap);


        appendTextElement(
            toolbar,
            "p",
            "ns-ai-filter-label",
            "FILTER BY RECORD TYPE"
        );

        var filterList = createElement("div", "ns-ai-filter-list");

        filterButtons = [];

        FILTERS.forEach(function (filter) {
            var button = createButton(
                "ns-ai-filter",
                filter.label
            );

            button.dataset.filter = filter.id;
            button.setAttribute(
                "aria-pressed",
                filter.id === ACTIVE_FILTER ? "true" : "false"
            );

            if (filter.id === ACTIVE_FILTER) {
                button.classList.add("is-active");
            }

            button.addEventListener("click", function () {
                ACTIVE_FILTER = filter.id;

                updateFilterButtons();
                applyFilters();
            });

            filterList.appendChild(button);
            filterButtons.push(button);
        });

        toolbar.appendChild(filterList);


        var resultLine = createElement("div", "ns-ai-result-line");

        appendTextElement(
            resultLine,
            "span",
            "",
            "MATCHING RECORDS"
        );

        resultCounter = appendTextElement(
            resultLine,
            "strong",
            "ns-ai-result-number",
            "00 / 00"
        );

        toolbar.appendChild(resultLine);

        searchInput.addEventListener("input", function () {
            SEARCH_QUERY = searchInput.value
                .trim()
                .toLowerCase();

            applyFilters();
        });

        container.appendChild(toolbar);
    }


    function updateFilterButtons() {
        filterButtons.forEach(function (button) {
            var active = button.dataset.filter === ACTIVE_FILTER;

            button.classList.toggle("is-active", active);

            button.setAttribute(
                "aria-pressed",
                active ? "true" : "false"
            );
        });
    }


    /* =====================================================
       07. JUDUL BAGIAN
       ===================================================== */

    function buildSectionHeading(title, description, code) {
        var wrapper = createElement("div", "ns-ai-section-heading");

        var textWrapper = createElement("div", "");

        appendTextElement(
            textWrapper,
            "h4",
            "",
            title
        );

        appendTextElement(
            textWrapper,
            "p",
            "",
            description
        );

        wrapper.appendChild(textWrapper);

        appendTextElement(
            wrapper,
            "span",
            "ns-ai-section-code",
            code
        );

        return wrapper;
    }


    /* =====================================================
       08. DETAIL KARTU YANG BISA DIBUKA
       ===================================================== */

    function buildExpandableEntry(options) {
        var details = createElement("details", "ns-ai-entry");

        details.dataset.group = options.group;
        details.dataset.search = options.searchText.toLowerCase();

        var summary = createElement("summary", "ns-ai-entry-summary");

        appendTextElement(
            summary,
            "span",
            "ns-ai-entry-number",
            options.number
        );

        var entryMain = createElement("span", "ns-ai-entry-main");

        appendTextElement(
            entryMain,
            "span",
            "ns-ai-entry-name",
            options.title
        );

        appendTextElement(
            entryMain,
            "span",
            "ns-ai-entry-meta",
            options.subtitle
        );

        summary.appendChild(entryMain);

        appendTextElement(
            summary,
            "span",
            "ns-ai-entry-count",
            formatNumber(options.count)
        );

        appendTextElement(
            summary,
            "span",
            "ns-ai-entry-arrow",
            "›"
        );

        details.appendChild(summary);

        var body = createElement("div", "ns-ai-entry-body");

        options.buildBody(body);

        details.appendChild(body);

        return details;
    }


    /* =====================================================
       09. ATURAN NORMAL
       ===================================================== */

    function buildNormalRule(parent, text) {
        var rule = createElement("div", "ns-ai-rule");

        appendTextElement(
            rule,
            "span",
            "ns-ai-rule-label",
            "REFERENCE // NORMAL CONDITIONS"
        );

        appendTextElement(
            rule,
            "p",
            "ns-ai-rule-text",
            text || "Tidak ada aturan referensi yang tersedia."
        );

        parent.appendChild(rule);
    }


    /* =====================================================
       10. KARTU ANOMALI INDIVIDUAL
       ===================================================== */

    function buildAnomalyCard(anomaly, group) {
        var card = createElement("article", "ns-ai-anomaly");

        var top = createElement("div", "ns-ai-anomaly-top");

        appendTextElement(
            top,
            "span",
            "ns-ai-anomaly-id",
            anomaly.id || "UNKNOWN-ID"
        );

        var severity = anomaly.severity || "medium";

        appendTextElement(
            top,
            "span",
            "ns-ai-severity " + severity,
            severity === "high" ? "HIGH PRIORITY" : "MEDIUM"
        );

        card.appendChild(top);

        appendTextElement(
            card,
            "h5",
            "ns-ai-anomaly-title",
            anomaly.title || "Unnamed Anomaly"
        );

        appendTextElement(
            card,
            "p",
            "ns-ai-anomaly-clue",
            anomaly.clue || "No reference note available."
        );

        var footer = createElement("div", "ns-ai-anomaly-footer");

        appendTextElement(
            footer,
            "span",
            "ns-ai-evidence-tag",
            "EVIDENCE: " + getAreaLabel(anomaly.area)
        );

        appendTextElement(
            footer,
            "span",
            "",
            "REF // " + (anomaly.id || "UNKNOWN")
        );

        card.appendChild(footer);

        return card;
    }


    function getAreaLabel(area) {
        var labels = {
            production: "PRODUCTION",
            person: "PERSONNEL",
            report: "DOCUMENT",
            tread: "TREAD",
            sidewall: "SIDEWALL",
            bead: "BEAD",
            visual: "VISUAL"
        };

        return labels[area] || "RECORD";
    }


    /* =====================================================
       11. DELAPAN PROSES UTAMA
       ===================================================== */

    function buildProcessEntry(process, index) {
        var anomalies = safeArray(process.anomalies);

        var searchText = [
            process.name,
            process.id,
            process.reference,
            process.description,
            process.normalRule
        ].join(" ");

        anomalies.forEach(function (anomaly) {
            searchText += " " + [
                anomaly.id,
                anomaly.title,
                anomaly.clue,
                anomaly.area,
                anomaly.expected,
                anomaly.observed
            ].join(" ");
        });

        return buildExpandableEntry({

            number: formatNumber(index + 1),

            group: "process",

            title: process.name,

            subtitle:
                process.reference +
                " // " +
                anomalies.length +
                " REFERENCE PATTERNS",

            count: anomalies.length,

            searchText: searchText,

            buildBody: function (body) {

                buildNormalRule(
                    body,
                    process.normalRule || process.description
                );

                anomalies.forEach(function (anomaly) {
                    body.appendChild(
                        buildAnomalyCard(anomaly, "process")
                    );
                });

                if (anomalies.length === 0) {
                    appendTextElement(
                        body,
                        "p",
                        "ns-ai-empty-category",
                        "Belum ada pola yang terdaftar untuk proses ini."
                    );
                }

            }

        });
    }


    /* =====================================================
       12. ANOMALI PENDUKUNG:
           PERSONNEL, DOCUMENTS, VISUAL
       ===================================================== */

    function buildSupportingEntry(options, index) {
        var anomalies = safeArray(options.anomalies);

        var searchText = [
            options.name,
            options.description,
            options.id
        ].join(" ");

        anomalies.forEach(function (anomaly) {
            searchText += " " + [
                anomaly.id,
                anomaly.title,
                anomaly.clue,
                anomaly.area,
                anomaly.expected,
                anomaly.observed
            ].join(" ");
        });

        return buildExpandableEntry({

            number: options.number,

            group: options.group,

            title: options.name,

            subtitle:
                options.reference +
                " // SUPPORTING RECORDS",

            count: anomalies.length,

            searchText: searchText,

            buildBody: function (body) {

                buildNormalRule(
                    body,
                    options.description
                );

                anomalies.forEach(function (anomaly) {
                    body.appendChild(
                        buildAnomalyCard(anomaly, options.group)
                    );
                });

            }

        });
    }


    /* =====================================================
       13. PESAN KETIKA PENCARIAN TIDAK MENEMUKAN HASIL
       ===================================================== */

    function buildEmptyState(container) {
        emptyState = createElement("div", "ns-ai-empty-search");
        emptyState.hidden = true;

        appendTextElement(
            emptyState,
            "div",
            "ns-ai-empty-symbol",
            "?"
        );

        appendTextElement(
            emptyState,
            "h4",
            "ns-ai-empty-title",
            "NO MATCHING RECORD"
        );

        appendTextElement(
            emptyState,
            "p",
            "ns-ai-empty-text",
            "Tidak ada arsip yang cocok dengan pencarian ini. " +
            "Coba gunakan ID, kata yang lebih pendek, atau filter lain."
        );

        container.appendChild(emptyState);
    }


    /* =====================================================
       14. FOOTER ARSIP
       ===================================================== */

    function buildArchiveFooter(container) {
        var footer = createElement("div", "ns-ai-bottom");

        var line = createElement("div", "ns-ai-bottom-line");

        appendTextElement(
            line,
            "span",
            "",
            "ARCHIVE // NIGHT OPERATIONS"
        );

        appendTextElement(
            line,
            "span",
            "",
            "STATUS: UNVERIFIED"
        );

        footer.appendChild(line);

        appendTextElement(
            footer,
            "p",
            "ns-ai-disclaimer",
            "Indeks ini adalah referensi dalam permainan horor fiktif. " +
            "Deskripsi dan batas proses tidak mewakili standar inspeksi " +
            "pabrik atau prosedur perusahaan sungguhan."
        );

        container.appendChild(footer);
    }


    /* =====================================================
       15. FILTER SELURUH ENTRI
       ===================================================== */

    function applyFilters() {
        var visibleCount = 0;

        entryElements.forEach(function (entry) {
            var groupMatches =
                ACTIVE_FILTER === "all" ||
                entry.dataset.group === ACTIVE_FILTER;

            var queryMatches =
                !SEARCH_QUERY ||
                entry.dataset.search.indexOf(SEARCH_QUERY) !== -1;

            var isVisible = groupMatches && queryMatches;

            entry.hidden = !isVisible;

            if (isVisible) {
                visibleCount++;

                /* Buka kartu yang cocok ketika pengguna mencari. */
                if (SEARCH_QUERY) {
                    entry.open = true;
                }
            }
        });

        if (resultCounter) {
            resultCounter.textContent =
                formatNumber(visibleCount) +
                " / " +
                formatNumber(entryElements.length);
        }

        if (emptyState) {
            emptyState.hidden = visibleCount > 0;
        }
    }


    /* =====================================================
       16. RENDER SELURUH KATALOG
       ===================================================== */

    function renderAnomalyIndex() {
        var list = document.getElementById(LIST_ID);

        if (!list) {
            console.warn(
                "[NIGHT SHIFT] Anomaly Index container tidak ditemukan."
            );

            return;
        }

        var data = getSourceData();

        if (!data || !Array.isArray(data.processes)) {
            clearElement(list);

            var errorMessage = createElement(
                "div",
                "ns-ai-empty-search"
            );

            appendTextElement(
                errorMessage,
                "h4",
                "ns-ai-empty-title",
                "ARCHIVE UNAVAILABLE"
            );

            appendTextElement(
                errorMessage,
                "p",
                "ns-ai-empty-text",
                "Database anomali belum tersedia. Pastikan anomalies.js " +
                "dimuat sebelum anomaly-index.js di index.html."
            );

            list.appendChild(errorMessage);

            console.error(
                "[NIGHT SHIFT] Database anomali belum tersedia."
            );

            return;
        }


        clearElement(list);

        entryElements = [];
        filterButtons = [];
        searchInput = null;
        resultCounter = null;
        emptyState = null;

        injectArchiveStyles();


        /* Container arsip */
        var shell = createElement("div", "ns-ai-shell");

        buildArchiveHeader(shell, data);
        buildToolbar(shell);


        /* Delapan proses utama */
        shell.appendChild(
            buildSectionHeading(
                "PRIMARY PROCESS FILES",
                "Delapan kategori utama. Buka tiap file untuk melihat pola.",
                "AI-01 — AI-08"
            )
        );

        var processEntries = createElement("div", "ns-ai-entries");

        safeArray(data.processes).forEach(function (process, index) {
            var entry = buildProcessEntry(process, index);

            processEntries.appendChild(entry);
            entryElements.push(entry);
        });

        shell.appendChild(processEntries);


        /* File referensi pendukung */
        shell.appendChild(
            buildSectionHeading(
                "SUPPORTING RECORDS",
                "Tidak semua anomali berada pada produk. Sebagian ada pada orang, dokumen, atau penglihatan.",
                "REF-X"
            )
        );

        var supportEntries = createElement("div", "ns-ai-entries");


        /* Personnel */
        var personEntry = buildSupportingEntry({
            number: "P1",
            group: "person",
            name: "PERSONNEL / IDENTITIES",
            id: "PERSONNEL",
            reference: "REF-PERSON",
            description:
                "Periksa ID, nama, daftar shift, kehadiran, lokasi, " +
                "dan tanda tangan. Penampilan seseorang bukan bukti anomali.",
            anomalies: getSupportingCatalog("person")
        });

        supportEntries.appendChild(personEntry);
        entryElements.push(personEntry);


        /* Documents */
        var paperEntry = buildSupportingEntry({
            number: "D1",
            group: "paper",
            name: "PAPER / DOCUMENT CONTROL",
            id: "DOCUMENTS",
            reference: "REF-DOC",
            description:
                "Bandingkan nomor laporan, serial, waktu, versi formulir, " +
                "stempel, tanda tangan, dan isi catatan.",
            anomalies: getSupportingCatalog("paper")
        });

        supportEntries.appendChild(paperEntry);
        entryElements.push(paperEntry);


        /* Visual */
        var visualEntry = buildSupportingEntry({
            number: "V1",
            group: "visual",
            name: "VISUAL / UNEXPLAINED",
            id: "VISUAL",
            reference: "REF-VIS",
            description:
                "Petunjuk visual dapat berupa kondisi fisik yang terlihat " +
                "atau perubahan yang tidak dapat dijelaskan di dalam cerita.",
            anomalies: getSupportingCatalog("visual")
        });

        supportEntries.appendChild(visualEntry);
        entryElements.push(visualEntry);


        shell.appendChild(supportEntries);


        /* Search empty state */
        buildEmptyState(shell);


        /* Footer */
        buildArchiveFooter(shell);


        list.appendChild(shell);

        applyFilters();
    }


    /* =====================================================
       17. INISIALISASI
       ===================================================== */

    function initializeAnomalyIndex() {
        var root = document.getElementById(ROOT_ID);

        if (!root) {
            return;
        }

        renderAnomalyIndex();
    }


    /* =====================================================
       18. PUBLIC FUNCTION
       ===================================================== */

    window.renderNightShiftAnomalyIndex = renderAnomalyIndex;


    /* =====================================================
       19. START
       ===================================================== */

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeAnomalyIndex,
            { once: true }
        );
    } else {
        initializeAnomalyIndex();
    }

})();

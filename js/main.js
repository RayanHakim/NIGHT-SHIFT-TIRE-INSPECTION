
/* =========================================================
   NIGHT SHIFT: TIRE INSPECTION
   MAIN INTERFACE CONTROLLER

   File: js/main.js

   TUGAS:
   1. Menghubungkan tombol Start dan Restart.
   2. Menghubungkan keputusan OK / NG.
   3. Menghubungkan tombol Continue / Next Round.
   4. Membuka dan menutup Anomaly Index.
   5. Mengelola tampilan antarmuka.
   6. Menangani status modul yang belum tersedia.
   7. Menyediakan fungsi debug untuk pengembangan.
   8. Memastikan event tidak terpasang dua kali.

   MODULES:
   - game.js
   - inspection.js
   - tires.js
   - production.js
   - anomalies.js
   - anomaly-index.js
   - audio.js
   - story.js

   Semua data dan peristiwa merupakan konten game fiktif.
   ========================================================= */

(function () {
    "use strict";


    /* =====================================================
       01. STATE
       ===================================================== */

    var initialized = false;

    var boundElements = [];

    var lastAction = null;


    /* =====================================================
       02. HELPER DOM
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


    function addClass(id, className) {
        var element = getElement(id);

        if (element) {
            element.classList.add(className);
        }
    }


    function removeClass(id, className) {
        var element = getElement(id);

        if (element) {
            element.classList.remove(className);
        }
    }


    function isVisible(element) {
        if (!element || element.hidden) {
            return false;
        }

        return true;
    }


    /* =====================================================
       03. MODULE LOOKUP
       ===================================================== */

    function getGameModule() {
        return window.NightShiftGame || null;
    }


    function getInspectionModule() {
        return window.NightShiftInspection || null;
    }


    function getTireModule() {
        return window.NightShiftTires || null;
    }


    function getProductionModule() {
        return window.NightShiftProduction || null;
    }


    function getAudioModule() {
        return window.NightShiftAudio || null;
    }


    function getStoryModule() {
        return window.NightShiftStory || null;
    }


    /* =====================================================
       04. SYSTEM STATUS
       ===================================================== */

    function setSystemStatus(message) {
        setText("systemStatus", message);
    }


    function showModuleError(message) {
        console.error(
            "[NIGHT SHIFT MAIN]",
            message
        );

        setSystemStatus("MODULE ERROR");

        var feedback = getElement("decisionFeedback");

        var title = getElement("feedbackTitle");

        var body = getElement("feedbackMessage");

        if (feedback && title && body) {
            title.textContent = "SYSTEM ERROR";

            body.textContent = message;

            feedback.hidden = false;
        }
    }


    function clearModuleError() {
        var feedback = getElement("decisionFeedback");

        if (
            feedback &&
            getElement("feedbackTitle") &&
            getElement("feedbackTitle").textContent === "SYSTEM ERROR"
        ) {
            feedback.hidden = true;

            setText("feedbackTitle", "DECISION RESULT");

            setText("feedbackMessage", "");
        }
    }


    /* =====================================================
       05. BIND EVENT ONCE

       Prevent duplicate listeners when initialization is
       requested more than once.
       ===================================================== */

    function bindClickOnce(elementId, handler, bindingKey) {
        var element = getElement(elementId);

        if (!element) {
            console.warn(
                "[NIGHT SHIFT MAIN] Element not found:",
                elementId
            );

            return false;
        }

        var key = bindingKey || elementId;

        var existing = boundElements.indexOf(key) !== -1;

        if (existing) {
            return true;
        }

        element.addEventListener("click", handler);

        boundElements.push(key);

        return true;
    }


    /* =====================================================
       06. START GAME
       ===================================================== */

    function handleStartGame() {
        clearModuleError();

        var game = getGameModule();

        if (!game || typeof game.start !== "function") {
            showModuleError(
                "Game controller tidak ditemukan. " +
                "Pastikan game.js dimuat sebelum main.js."
            );

            return;
        }


        /*
         * Reset the story queue before starting a new session.
         * This prevents old queued events from appearing in a
         * restarted game.
         */

        var story = getStoryModule();

        if (story && typeof story.reset === "function") {
            story.reset();
        }


        /*
         * game.js handles:
         * - Showing the main game screen
         * - Loading the first case
         * - Initializing score and round state
         * - Starting background music
         */

        var result = game.start();

        if (!result || result.success !== true) {
            showModuleError(
                "Permainan tidak dapat dimulai. " +
                "Periksa apakah ANOMALY_CASES tersedia di anomalies.js."
            );

            return;
        }

        lastAction = {
            type: "start",
            timestamp: Date.now()
        };

        console.log(
            "[NIGHT SHIFT MAIN] Game started. Cases:",
            result.totalRounds
        );
    }


    /* =====================================================
       07. SUBMIT OK / NG
       ===================================================== */

    function handleDecision(decision) {
        clearModuleError();

        var game = getGameModule();

        if (
            !game ||
            typeof game.submitDecision !== "function"
        ) {
            showModuleError(
                "Fungsi evaluasi tidak tersedia. " +
                "Pastikan game.js sudah dimuat."
            );

            return;
        }


        /*
         * Do not accept decisions while a story dialog is
         * visible. The dialog is intended to pause the player
         * until they acknowledge the message.
         */

        var storyOverlay = getElement("storyOverlay");

        if (isVisible(storyOverlay)) {
            return;
        }


        var result = game.submitDecision(decision);

        if (!result || result.success !== true) {
            if (result && result.reason === "already-submitted") {
                return;
            }

            if (
                result &&
                result.reason === "game-not-active"
            ) {
                return;
            }

            if (
                result &&
                result.reason === "invalid-decision"
            ) {
                console.warn(
                    "[NIGHT SHIFT MAIN] Invalid decision:",
                    decision
                );

                return;
            }

            if (
                result &&
                result.reason === "no-current-case"
            ) {
                showModuleError(
                    "Tidak ada kasus aktif untuk dievaluasi."
                );
            }

            return;
        }


        lastAction = {
            type: "decision",
            decision: decision,
            correct: result.correct,
            timestamp: Date.now()
        };


        /*
         * game.js updates the feedback panel, report stamp,
         * score, error counter, and decision buttons.
         *
         * Focus Continue so the player can proceed using
         * the keyboard if desired.
         */

        var continueButton = getElement("nextRoundButton");

        if (continueButton && !continueButton.disabled) {
            try {
                continueButton.focus({
                    preventScroll: true
                });
            } catch (error) {
                continueButton.focus();
            }
        }


        console.log(
            "[NIGHT SHIFT MAIN] Decision submitted:",
            decision,
            "Correct:",
            result.correct
        );
    }


    /* =====================================================
       08. NEXT ROUND / CONTINUE
       ===================================================== */

    function handleNextRound() {
        var storyOverlay = getElement("storyOverlay");

        if (isVisible(storyOverlay)) {
            return;
        }

        var game = getGameModule();

        if (
            !game ||
            typeof game.nextRound !== "function"
        ) {
            showModuleError(
                "Fungsi nextRound tidak ditemukan di game.js."
            );

            return;
        }

        var result = game.nextRound();

        if (result === false) {
            return;
        }

        lastAction = {
            type: "next-round",
            timestamp: Date.now()
        };

        /*
         * nextRound() may load the next case or finish the
         * shift and render the ending screen.
         */

        console.log(
            "[NIGHT SHIFT MAIN] Proceeded to next round."
        );
    }


    /* =====================================================
       09. RESTART GAME
       ===================================================== */

    function handleRestartGame() {
        var game = getGameModule();

        if (!game) {
            showModuleError(
                "Game controller tidak tersedia untuk restart."
            );

            return;
        }


        /*
         * Reset modules that hold their own state.
         */

        var story = getStoryModule();

        if (story && typeof story.reset === "function") {
            story.reset();
        }


        var inspection = getInspectionModule();

        if (inspection && typeof inspection.reset === "function") {
            inspection.reset();
        }


        var tires = getTireModule();

        if (tires && typeof tires.reset === "function") {
            tires.reset();
        }


        /*
         * game.reset() resets the game counters and screens.
         * game.start() then begins a clean new session.
         */

        if (typeof game.reset === "function") {
            game.reset();
        }

        handleStartGame();


        lastAction = {
            type: "restart",
            timestamp: Date.now()
        };
    }


    /* =====================================================
       10. ANOMALY INDEX
       ===================================================== */

    function updateAnomalyIndexToggle(isOpen) {
        var button = getElement("anomalyIndexToggle");

        var panel = getElement("anomalyIndexPanel");

        var icon = getElement("indexToggleIcon");

        if (!button || !panel) {
            return;
        }

        panel.hidden = !isOpen;

        button.setAttribute(
            "aria-expanded",
            isOpen ? "true" : "false"
        );

        if (icon) {
            icon.textContent = isOpen ? "−" : "+";
        }

        if (isOpen) {
            button.setAttribute(
                "aria-label",
                "Close Anomaly Index"
            );
        } else {
            button.setAttribute(
                "aria-label",
                "Open Anomaly Index"
            );
        }
    }


    function handleToggleAnomalyIndex() {
        var button = getElement("anomalyIndexToggle");

        var panel = getElement("anomalyIndexPanel");

        if (!button || !panel) {
            console.warn(
                "[NIGHT SHIFT MAIN] Anomaly Index controls not found."
            );

            return;
        }


        var isOpen = button.getAttribute("aria-expanded") === "true";

        var nextState = !isOpen;


        /*
         * Render the index only if it has not already been
         * generated. This preserves search and filter state
         * when the player closes and reopens the panel.
         */

        var hasRenderedIndex = Boolean(
            panel.querySelector(".ns-ai-shell")
        );

        if (
            nextState &&
            !hasRenderedIndex &&
            typeof window.renderNightShiftAnomalyIndex === "function"
        ) {
            window.renderNightShiftAnomalyIndex();
        }


        updateAnomalyIndexToggle(nextState);


        lastAction = {
            type: "toggle-anomaly-index",
            open: nextState,
            timestamp: Date.now()
        };
    }


    /* =====================================================
       11. INITIALIZE ANOMALY INDEX
       ===================================================== */

    function initializeAnomalyIndex() {
        var button = getElement("anomalyIndexToggle");

        var panel = getElement("anomalyIndexPanel");

        if (!button || !panel) {
            return;
        }

        /*
         * Default state: closed.
         */

        updateAnomalyIndexToggle(false);
    }


    /* =====================================================
       12. INITIALIZE REPORT STAMP AND FEEDBACK
       ===================================================== */

    function initializeFeedback() {
        setHidden("decisionFeedback", true);

        var status = getElement("caseStatus");

        if (status) {
            status.textContent = "AWAITING INSPECTION";

            status.classList.remove(
                "status-ok",
                "status-ng"
            );
        }

        var okButton = getElement("decisionOK");

        var ngButton = getElement("decisionNG");

        if (okButton) {
            okButton.disabled = false;
        }

        if (ngButton) {
            ngButton.disabled = false;
        }
    }


    /* =====================================================
       13. MODULE HEALTH CHECK
       ===================================================== */

    function checkModules() {
        var moduleStatus = {
            anomalies:
                typeof window.getAnomalyCaseById === "function" ||
                typeof window.ANOMALY_CASES !== "undefined",

            production:
                Boolean(getProductionModule()),

            inspection:
                Boolean(getInspectionModule()),

            tires:
                Boolean(getTireModule()),

            audio:
                Boolean(getAudioModule()),

            story:
                Boolean(getStoryModule()),

            game:
                Boolean(getGameModule())
        };


        var missing = Object.keys(moduleStatus).filter(
            function (key) {
                return !moduleStatus[key];
            }
        );


        if (missing.length > 0) {
            console.warn(
                "[NIGHT SHIFT MAIN] Some modules are unavailable:",
                missing
            );
        }

        return {
            ready: missing.length === 0,

            modules: moduleStatus,

            missing: missing
        };
    }


    /* =====================================================
       14. KEYBOARD SHORTCUTS

       Optional shortcuts:
       O = choose OK
       N = choose NG

       Shortcuts are ignored while typing in an input,
       textarea, select, or while the story dialog is open.
       ===================================================== */

    function isTypingTarget(target) {
        if (!target) {
            return false;
        }

        var tagName = String(
            target.tagName || ""
        ).toLowerCase();

        return (
            tagName === "input" ||
            tagName === "textarea" ||
            tagName === "select" ||
            target.isContentEditable === true
        );
    }


    function handleKeyboardShortcuts(event) {
        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        if (isTypingTarget(event.target)) {
            return;
        }

        var storyOverlay = getElement("storyOverlay");

        if (isVisible(storyOverlay)) {
            return;
        }

        var game = getGameModule();

        if (
            !game ||
            typeof game.getState !== "function"
        ) {
            return;
        }

        var state = game.getState();

        if (
            !state ||
            !state.started ||
            state.finished ||
            state.submitted
        ) {
            return;
        }


        var key = String(event.key || "").toLowerCase();

        if (key === "o") {
            event.preventDefault();

            handleDecision("OK");

            return;
        }

        if (key === "n") {
            event.preventDefault();

            handleDecision("NG");
        }
    }


    /* =====================================================
       15. BIND MAIN UI BUTTONS
       ===================================================== */

    function bindMainControls() {
        bindClickOnce(
            "startButton",
            handleStartGame
        );

        bindClickOnce(
            "decisionOK",
            function () {
                handleDecision("OK");
            }
        );

        bindClickOnce(
            "decisionNG",
            function () {
                handleDecision("NG");
            }
        );

        bindClickOnce(
            "nextRoundButton",
            handleNextRound
        );

        bindClickOnce(
            "restartButton",
            handleRestartGame
        );

        bindClickOnce(
            "anomalyIndexToggle",
            handleToggleAnomalyIndex
        );


        /*
         * Do not bind soundToggle here.
         * audio.js already owns that button.
         *
         * Do not bind storyContinueButton here.
         * story.js already owns that button.
         *
         * inspection.js owns:
         * - Tread
         * - Sidewall
         * - Bead
         * - Document review buttons
         */
    }


    /* =====================================================
       16. INITIALIZATION
       ===================================================== */

    function initialize() {
        if (initialized) {
            return;
        }

        initialized = true;

        bindMainControls();

        initializeAnomalyIndex();

        initializeFeedback();


        /*
         * Keyboard shortcuts are registered once.
         */

        document.addEventListener(
            "keydown",
            handleKeyboardShortcuts
        );


        /*
         * Check modules only for diagnostic purposes.
         * Some modules may intentionally be implemented later.
         */

        var health = checkModules();

        console.log(
            "[NIGHT SHIFT MAIN] Interface initialized."
        );

        console.log(
            "[NIGHT SHIFT MAIN] Module status:",
            health.modules
        );
    }


    /* =====================================================
       17. PUBLIC API FOR TESTING
       ===================================================== */

    window.NightShiftMain = {

        initialize: initialize,

        start: handleStartGame,

        decideOK: function () {
            handleDecision("OK");
        },

        decideNG: function () {
            handleDecision("NG");
        },

        next: handleNextRound,

        restart: handleRestartGame,

        toggleAnomalyIndex: handleToggleAnomalyIndex,

        getModuleStatus: checkModules,

        getLastAction: function () {
            return lastAction
                ? Object.assign({}, lastAction)
                : null;
        }
    };


    /* =====================================================
       18. STARTUP
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

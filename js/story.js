
/* =========================================================
   NIGHT SHIFT: TIRE INSPECTION
   STORY & HORROR EVENT CONTROLLER

   File: js/story.js

   FUNGSI:
   1. Mengatur tiga bab cerita.
   2. Menampilkan dialog kejadian horor.
   3. Mengelola antrean peristiwa agar tidak saling menimpa.
   4. Memunculkan cerita berdasarkan kasus dan waktu shift.
   5. Menambahkan efek gangguan layar untuk kejadian tertentu.
   6. Menampilkan adegan ending.
   7. Mendukung keyboard dan aksesibilitas.
   8. Terhubung dengan game.js melalui NightShiftStory.

   HTML YANG DIGUNAKAN:
   #storyOverlay
   #storyCategory
   #storyTitle
   #storyMessage
   #storyTimestamp
   #storyContinueButton

   Semua cerita, karakter, dan peristiwa adalah fiksi.
   ========================================================= */

(function () {
    "use strict";


    /* =====================================================
       01. STORY CONFIGURATION
       ===================================================== */

    var STORY_CONFIG = {
        title: "NIGHT SHIFT: TIRE INSPECTION",

        openingTime: "22:00",

        firstDiscrepancy: "00:43",

        finalRecordTime: "03:17",

        shiftEnd: "06:00",

        maximumQueuedEvents: 12,

        enableScreenDistortion: true,

        enableNarrativeEnrichment: true
    };


    /* =====================================================
       02. STORY STATE
       ===================================================== */

    var storyState = {
        initialized: false,

        active: false,

        activeEvent: null,

        eventQueue: [],

        seenEventKeys: [],

        currentAct: "routine",

        lastRound: 0,

        eventCount: 0,

        endingShown: false,

        previouslyFocusedElement: null
    };


    /* =====================================================
       03. CHAPTER DEFINITIONS
       ===================================================== */

    var STORY_CHAPTERS = [

        {
            id: "routine",

            title: "ROUTINE",

            firstRound: 1,

            lastRound: 7,

            time: "22:00",

            category: "CHAPTER 01 // ROUTINE",

            description:
                "The shift begins.",

            openingMessage:
                "22:00.\n\n" +
                "The inspection room hums under fluorescent lights. " +
                "The air smells faintly of dust and warm rubber.\n\n" +
                "A stack of reports waits on your desk. " +
                "The night should be ordinary.\n\n" +
                "Check every record. Trust what you can verify.",

            transitionMessage:
                "Your first cases have been recorded.\n\n" +
                "The workstation is functioning normally. " +
                "The records appear routine.\n\n" +
                "Continue the inspection."
        },


        {
            id: "discrepancy",

            title: "DISCREPANCY",

            firstRound: 8,

            lastRound: 13,

            time: "00:43",

            category: "CHAPTER 02 // DISCREPANCY",

            description:
                "The records begin to disagree.",

            openingMessage:
                "00:43.\n\n" +
                "A line appears in the activity log that you do not remember reading.\n\n" +
                "The timestamp is correct. The workstation clock is correct. " +
                "The record itself is the problem.\n\n" +
                "Do not reject everything. Find the contradiction."
        },


        {
            id: "final-record",

            title: "FINAL RECORD",

            firstRound: 14,

            lastRound: 20,

            time: "03:17",

            category: "CHAPTER 03 // FINAL RECORD",

            description:
                "The inspection record is no longer behaving normally.",

            openingMessage:
                "03:17.\n\n" +
                "The printer activates beside your desk.\n\n" +
                "A single sheet slides out. It has no header, no batch number, " +
                "and no visible source file.\n\n" +
                "At the bottom is a signature line.\n\n" +
                "Your name is already written there."
        }

    ];


    /* =====================================================
       04. NARRATIVE ENRICHMENT

       Extra atmospheric text is attached to selected events.
       These lines are story details. They do not change the
       answer key in anomalies.js.
       ===================================================== */

    var STORY_ENRICHMENT = {

        "A SECOND TIME": {
            type: "case",
            effect: "mild",

            extra:
                "You compare the paper with the digital record once more.\n\n" +
                "The time on the screen has not changed. " +
                "The handwriting on the report looks slightly darker than before."
        },


        "WHO STAMPED IT?": {
            type: "case",
            effect: "strong",

            extra:
                "The stamp is already dry.\n\n" +
                "The inspection field is still empty, and the signature line has not been completed.\n\n" +
                "Someone prepared the result before the inspection began."
        },


        "THE OPERATOR IS BUSY": {
            type: "case",
            effect: "mild",

            extra:
                "You check the two station entries again.\n\n" +
                "Both have the same employee ID and the same minute. " +
                "A third location briefly appears beneath them: INSPECTION ROOM.\n\n" +
                "It disappears when you move the cursor."
        },


        "IT IS NOT THE SAME TIRE": {
            type: "case",
            effect: "strong",

            extra:
                "You remember reading the serial number during the first scan.\n\n" +
                "The number in the report is different. " +
                "The difference is small enough to overlook if you stop checking."
        },


        "THE SAME NUMBER": {
            type: "case",
            effect: "strong",

            extra:
                "The duplicate serial appears in two separate reports.\n\n" +
                "One report records an inspection you remember completing. " +
                "The other has your signature, but you do not remember seeing that product."
        }

    };


    /* =====================================================
       05. GENERAL HELPERS
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


    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }


    function normalizeString(value, fallback) {
        if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        ) {
            return fallback || "";
        }

        return String(value);
    }


    function getOverlay() {
        return getElement("storyOverlay");
    }


    function getDialog() {
        var overlay = getOverlay();

        return overlay
            ? overlay.querySelector(".story-dialog")
            : null;
    }


    function getContinueButton() {
        return getElement("storyContinueButton");
    }


    function isOverlayVisible() {
        var overlay = getOverlay();

        return Boolean(
            overlay &&
            !overlay.hidden
        );
    }


    function getCurrentClock() {
        if (
            window.NightShiftGame &&
            typeof window.NightShiftGame.getCurrentClock === "function"
        ) {
            return window.NightShiftGame.getCurrentClock();
        }

        return "--:--";
    }


    function getCurrentGameState() {
        if (
            window.NightShiftGame &&
            typeof window.NightShiftGame.getState === "function"
        ) {
            return window.NightShiftGame.getState();
        }

        return null;
    }


    /* =====================================================
       06. DETERMINE STORY CHAPTER
       ===================================================== */

    function getChapterByRound(roundNumber) {
        var round = Number(roundNumber);

        if (!Number.isFinite(round) || round < 1) {
            return STORY_CHAPTERS[0];
        }

        for (var i = 0; i < STORY_CHAPTERS.length; i++) {
            var chapter = STORY_CHAPTERS[i];

            if (
                round >= chapter.firstRound &&
                round <= chapter.lastRound
            ) {
                return chapter;
            }
        }

        return STORY_CHAPTERS[STORY_CHAPTERS.length - 1];
    }


    function getChapterById(chapterId) {
        for (var i = 0; i < STORY_CHAPTERS.length; i++) {
            if (STORY_CHAPTERS[i].id === chapterId) {
                return STORY_CHAPTERS[i];
            }
        }

        return null;
    }


    /* =====================================================
       07. EVENT TYPE
       ===================================================== */

    function determineEventType(event, context) {
        event = event || {};
        context = context || {};

        if (
            context.source === "ending" ||
            event.eventType === "ending"
        ) {
            return "ending";
        }

        if (
            context.source === "act" ||
            event.act
        ) {
            return "act";
        }

        if (
            context.source === "ambient" ||
            event.eventType === "ambient"
        ) {
            return "ambient";
        }

        return "case";
    }


    /* =====================================================
       08. EVENT NORMALIZATION
       ===================================================== */

    function normalizeEvent(event, context) {
        event = event || {};
        context = context || {};

        var title = normalizeString(
            event.title,
            "UNEXPECTED EVENT"
        );

        var eventType = determineEventType(
            event,
            context
        );

        var eventTimestamp = normalizeString(
            event.timestamp ||
            context.timestamp ||
            getCurrentClock(),
            "UNKNOWN"
        );

        var message = normalizeString(
            event.message,
            "An unexpected event has occurred."
        );

        var category = normalizeString(
            event.category,
            "SYSTEM MESSAGE"
        );


        /* Add story-specific details when appropriate. */

        var enrichment = STORY_CONFIG.enableNarrativeEnrichment
            ? STORY_ENRICHMENT[title]
            : null;

        if (
            enrichment &&
            typeof enrichment.extra === "string"
        ) {
            message += "\n\n" + enrichment.extra;
        }


        var roundNumber = Number(
            context.roundNumber ||
            (
                getCurrentGameState() &&
                getCurrentGameState().currentRound
            ) ||
            0
        );


        return {

            id:
                event.id ||
                null,

            key:
                event.key ||
                [
                    eventType,
                    context.caseId || "",
                    title,
                    eventTimestamp
                ].join("|"),

            title: title,

            category: category,

            message: message,

            timestamp: eventTimestamp,

            eventType: eventType,

            source: context.source || "game",

            roundNumber: roundNumber,

            chapterId:
                event.act ||
                context.act ||
                (
                    roundNumber > 0
                        ? getChapterByRound(roundNumber).id
                        : storyState.currentAct
                ),

            effect:
                event.effect ||
                (
                    enrichment
                        ? enrichment.effect
                        : "none"
                ),

            symbol:
                event.symbol ||
                (
                    eventType === "ending"
                        ? "■"
                        : eventType === "act"
                            ? "◆"
                            : "!"
                ),

            endingId:
                event.id ||
                null
        };
    }


    /* =====================================================
       09. INJECT STORY VISUAL STYLING

       Uses the existing story overlay from index.html.
       ===================================================== */

    function injectStoryStyles() {
        if (getElement("nightShiftStoryStyles")) {
            return;
        }

        var style = document.createElement("style");

        style.id = "nightShiftStoryStyles";

        style.textContent = `
            /* Story overlay states */
            #storyOverlay {
                --story-accent: #c34b4b;
            }

            #storyOverlay[data-story-type="act"] {
                --story-accent: #a66d43;
            }

            #storyOverlay[data-story-type="case"] {
                --story-accent: #bd2929;
            }

            #storyOverlay[data-story-type="ambient"] {
                --story-accent: #776b8d;
            }

            #storyOverlay[data-story-type="ending"] {
                --story-accent: #b7a16f;
            }

            #storyOverlay .story-dialog {
                border-color: color-mix(
                    in srgb,
                    var(--story-accent) 45%,
                    #242a26
                );
                box-shadow:
                    0 25px 100px rgba(0, 0, 0, 0.55),
                    0 0 35px color-mix(
                        in srgb,
                        var(--story-accent) 6%,
                        transparent
                    );
            }

            #storyOverlay .story-dialog::before {
                width: 78px;
                background: var(--story-accent);
            }

            #storyOverlay .story-alert-marker {
                border-color: var(--story-accent);
                background: color-mix(
                    in srgb,
                    var(--story-accent) 18%,
                    #111413
                );
            }

            #storyOverlay .story-dialog-header {
                color: color-mix(
                    in srgb,
                    var(--story-accent) 75%,
                    #eadbd2
                );
            }

            #storyOverlay #storyCategory {
                line-height: 1.8;
            }

            #storyOverlay #storyMessage {
                white-space: pre-line;
                overflow-wrap: anywhere;
                line-height: 2;
            }

            #storyOverlay #storyTimestamp {
                line-height: 1.8;
            }

            #storyOverlay .story-dialog.story-entering {
                animation: night-shift-story-enter 240ms ease both;
            }

            #storyOverlay .story-dialog.story-intense {
                border-color: #833333;
            }

            #storyOverlay .story-dialog.story-quiet {
                border-color: #4f4c45;
            }

            @keyframes night-shift-story-enter {
                from {
                    opacity: 0;
                    transform: translateY(8px) scale(0.99);
                }

                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            @media (prefers-reduced-motion: reduce) {
                #storyOverlay .story-dialog.story-entering {
                    animation: none;
                }
            }
        `;

        document.head.appendChild(style);
    }


    /* =====================================================
       10. STORY EVENT DEDUPLICATION
       ===================================================== */

    function hasSeenEvent(eventKey) {
        return storyState.seenEventKeys.indexOf(eventKey) !== -1;
    }


    function markEventSeen(eventKey) {
        if (!hasSeenEvent(eventKey)) {
            storyState.seenEventKeys.push(eventKey);
        }
    }


    /* =====================================================
       11. ADD EVENT TO QUEUE

       A queued event waits until the currently visible event
       has been acknowledged by the player.
       ===================================================== */

    function enqueueEvent(normalizedEvent) {
        if (!normalizedEvent) {
            return false;
        }

        if (hasSeenEvent(normalizedEvent.key)) {
            return false;
        }

        if (
            storyState.eventQueue.length >=
            STORY_CONFIG.maximumQueuedEvents
        ) {
            console.warn(
                "[NIGHT SHIFT STORY] Event queue is full. Event skipped:",
                normalizedEvent.title
            );

            return false;
        }

        markEventSeen(normalizedEvent.key);

        storyState.eventQueue.push(normalizedEvent);

        storyState.eventCount++;

        processQueue();

        return true;
    }


    /* =====================================================
       12. SHOW STORY EVENT

       Compatible with game.js:

       NightShiftStory.showEvent(event, context)
       ===================================================== */

    function showEvent(event, context) {
        var normalizedEvent = normalizeEvent(
            event,
            context
        );

        if (normalizedEvent.chapterId) {
            storyState.currentAct = normalizedEvent.chapterId;
        }

        if (normalizedEvent.roundNumber > 0) {
            storyState.lastRound = normalizedEvent.roundNumber;
        }

        if (
            normalizedEvent.eventType === "ending"
        ) {
            storyState.endingShown = true;
        }


        /*
         * Add a small message to the activity log for case
         * events. Act transitions are already logged by game.js.
         */
        if (
            normalizedEvent.eventType === "case" &&
            window.NightShiftGame &&
            typeof window.NightShiftGame.addLogEntry === "function"
        ) {
            window.NightShiftGame.addLogEntry(
                normalizedEvent.timestamp,
                "Story event: " + normalizedEvent.title,
                "log-warning"
            );
        }


        return enqueueEvent(normalizedEvent);
    }


    /* =====================================================
       13. SHOW CHAPTER OPENING

       Optional API for starting a chapter explicitly.
       Existing game.js sends act events through showEvent().
       ===================================================== */

    function showChapterOpening(chapterId) {
        var chapter = getChapterById(chapterId);

        if (!chapter) {
            return false;
        }

        return showEvent({
            id: "CHAPTER-" + chapter.id.toUpperCase(),

            title: chapter.title,

            category: chapter.category,

            message:
                chapter.openingMessage ||
                chapter.transitionMessage,

            timestamp: chapter.time,

            act: chapter.id,

            eventType: "act",

            symbol: "◆"
        }, {
            source: "act",

            timestamp: chapter.time,

            act: chapter.id
        });
    }


    /* =====================================================
       14. SHOW ENDING EVENT

       Called by game.js once the shift finishes.
       The ending dialog overlays the final screen. When the
       player acknowledges it, the ending report remains visible.
       ===================================================== */

    function showEnding(ending, gameState) {
        ending = ending || {};
        gameState = gameState || {};

        var title = ending.title || "SHIFT COMPLETE";

        var description = ending.description ||
            "The shift has ended.";

        var finalRecord = ending.finalRecord || "";

        var fullMessage = description;

        if (finalRecord) {
            fullMessage += "\n\n" + finalRecord;
        }

        var score = Number(gameState.score || 0);

        var errors = Number(gameState.errors || 0);

        var accuracy = Number(gameState.accuracy || 0);

        if (!accuracy && gameState.casesReviewed > 0) {
            accuracy = Math.round(
                (
                    Number(gameState.correctDecisions || 0) /
                    Number(gameState.casesReviewed)
                ) * 100
            );
        }

        fullMessage +=
            "\n\nFINAL CHECK:\n" +
            "SCORE: " + score + "\n" +
            "DECISION ERRORS: " + errors + "\n" +
            "ACCURACY: " + accuracy + "%";

        return showEvent({
            id: "ENDING-" + (ending.id || title),

            title: title,

            category: "FINAL ENTRY // 06:00",

            message: fullMessage,

            timestamp: "06:00",

            eventType: "ending",

            symbol: ending.symbol || "■"
        }, {
            source: "ending",

            timestamp: "06:00",

            roundNumber: gameState.currentRound ||
                gameState.totalRounds ||
                20
        });
    }


    /* =====================================================
       15. PROCESS EVENT QUEUE
       ===================================================== */

    function processQueue() {
        if (storyState.active) {
            return;
        }

        if (storyState.eventQueue.length === 0) {
            closeOverlay();
            return;
        }

        var nextEvent = storyState.eventQueue.shift();

        storyState.activeEvent = nextEvent;

        storyState.active = true;

        renderEvent(nextEvent);
    }


    /* =====================================================
       16. RENDER EVENT ON SCREEN
       ===================================================== */

    function renderEvent(event) {
        var overlay = getOverlay();

        if (!overlay) {
            console.warn(
                "[NIGHT SHIFT STORY] #storyOverlay not found."
            );

            storyState.active = false;
            storyState.activeEvent = null;

            processQueue();

            return;
        }


        /* Save keyboard focus before opening the modal. */

        if (
            document.activeElement &&
            document.activeElement !== document.body
        ) {
            storyState.previouslyFocusedElement =
                document.activeElement;
        }


        var dialog = getDialog();

        var continueButton = getContinueButton();


        /* Type-specific visual state. */

        overlay.dataset.storyType = event.eventType;

        overlay.hidden = false;

        overlay.setAttribute("aria-hidden", "false");


        if (dialog) {
            dialog.classList.remove(
                "story-entering",
                "story-intense",
                "story-quiet"
            );

            if (event.effect === "strong") {
                dialog.classList.add("story-intense");
            } else if (event.effect === "mild") {
                dialog.classList.add("story-quiet");
            }

            void dialog.offsetWidth;

            dialog.classList.add("story-entering");
        }


        /* Populate the existing HTML elements. */

        setText(
            "storyTitle",
            event.title
        );

        setText(
            "storyCategory",
            event.category
        );

        setText(
            "storyMessage",
            event.message
        );

        setText(
            "storyTimestamp",
            "TIME: " + event.timestamp
        );

        setText(
            "storyAlertMarker",
            event.symbol
        );

        /*
         * The current HTML uses story-alert-marker but does
         * not assign an ID, so also update it by class.
         */

        var marker = overlay.querySelector(".story-alert-marker");

        if (marker) {
            marker.textContent = event.symbol || "!";
        }


        /* Update acknowledgment button text. */

        if (continueButton) {
            if (event.eventType === "ending") {
                continueButton.textContent =
                    "RETURN TO FINAL REPORT →";
            } else if (event.eventType === "act") {
                continueButton.textContent =
                    "CONTINUE SHIFT →";
            } else {
                continueButton.textContent =
                    "ACKNOWLEDGE →";
            }
        }


        /*
         * Trigger the pre-existing brief distortion animation
         * for major anomalies, but never change the answer key.
         */

        if (
            STORY_CONFIG.enableScreenDistortion &&
            (
                event.effect === "strong" ||
                event.eventType === "ending"
            )
        ) {
            triggerDistortion();
        }


        if (continueButton) {
            continueButton.focus();
        }
    }


    /* =====================================================
       17. ACKNOWLEDGE ACTIVE EVENT
       ===================================================== */

    function acknowledgeEvent() {
        if (!storyState.active) {
            return false;
        }

        var completedEvent = storyState.activeEvent;

        storyState.active = false;

        storyState.activeEvent = null;


        /*
         * Remove transient styling before loading the next event.
         */

        var dialog = getDialog();

        if (dialog) {
            dialog.classList.remove(
                "story-entering",
                "story-intense",
                "story-quiet"
            );
        }


        if (completedEvent) {
            /*
             * A small diagnostic entry helps when developing
             * the game. No extra log is added for every message.
             */
            console.log(
                "[NIGHT SHIFT STORY] Acknowledged:",
                completedEvent.title
            );
        }


        if (storyState.eventQueue.length > 0) {
            processQueue();
        } else {
            closeOverlay();
        }

        return true;
    }


    /* =====================================================
       18. CLOSE OVERLAY
       ===================================================== */

    function closeOverlay() {
        var overlay = getOverlay();

        if (overlay) {
            overlay.hidden = true;

            overlay.setAttribute(
                "aria-hidden",
                "true"
            );

            overlay.removeAttribute("data-story-type");
        }

        storyState.active = false;

        storyState.activeEvent = null;


        var oldFocus = storyState.previouslyFocusedElement;

        storyState.previouslyFocusedElement = null;

        if (
            oldFocus &&
            typeof oldFocus.focus === "function" &&
            document.contains(oldFocus)
        ) {
            try {
                oldFocus.focus();
            } catch (error) {
                /* Ignore focus restoration failures. */
            }
        }
    }


    /* =====================================================
       19. SCREEN DISTORTION
       ===================================================== */

    function triggerDistortion() {
        if (
            !STORY_CONFIG.enableScreenDistortion ||
            !document.body
        ) {
            return;
        }

        document.body.classList.remove("screen-distortion");

        /*
         * Force a layout flush so repeated events can
         * retrigger the CSS animation.
         */

        void document.body.offsetWidth;

        document.body.classList.add("screen-distortion");

        window.setTimeout(function () {
            if (document.body) {
                document.body.classList.remove("screen-distortion");
            }
        }, 350);
    }


    /* =====================================================
       20. KEYBOARD SUPPORT
       ===================================================== */

    function handleKeyboard(event) {
        if (!isOverlayVisible()) {
            return;
        }

        /*
         * Escape acknowledges the current event. It does
         * not silently dismiss the entire event queue.
         */

        if (event.key === "Escape") {
            event.preventDefault();

            acknowledgeEvent();

            return;
        }

        /*
         * Enter and Space work naturally on the focused
         * button. No global handler is needed for them.
         */
    }


    /* =====================================================
       21. BUTTON EVENT BINDING
       ===================================================== */

    function bindStoryControls() {
        var button = getContinueButton();

        if (
            button &&
            button.dataset.storyBound !== "true"
        ) {
            button.dataset.storyBound = "true";

            button.addEventListener("click", function () {
                acknowledgeEvent();
            });
        }

        if (!storyState.keyboardBound) {
            document.addEventListener(
                "keydown",
                handleKeyboard
            );

            storyState.keyboardBound = true;
        }
    }


    /* =====================================================
       22. RESET STORY STATE
       ===================================================== */

    function reset() {
        storyState.active = false;

        storyState.activeEvent = null;

        storyState.eventQueue = [];

        storyState.seenEventKeys = [];

        storyState.currentAct = "routine";

        storyState.lastRound = 0;

        storyState.eventCount = 0;

        storyState.endingShown = false;

        storyState.previouslyFocusedElement = null;

        closeOverlay();

        return true;
    }


    /* =====================================================
       23. STORY STATUS
       ===================================================== */

    function getState() {
        return {
            active: storyState.active,

            activeEvent: storyState.activeEvent,

            queueLength: storyState.eventQueue.length,

            currentAct: storyState.currentAct,

            lastRound: storyState.lastRound,

            eventCount: storyState.eventCount,

            endingShown: storyState.endingShown,

            currentClock: getCurrentClock()
        };
    }


    function getChapters() {
        return STORY_CHAPTERS.map(function (chapter) {
            return Object.assign({}, chapter);
        });
    }


    /* =====================================================
       24. OPTIONAL AMBIENT STORY EVENTS

       These can be called by game.js in a future revision.
       For example:
       NightShiftStory.showAmbient("printer")
       ===================================================== */

    var AMBIENT_EVENTS = {

        printer: {
            id: "AMBIENT-PRINTER",

            title: "PRINTER IDLE",

            category: "WORKSTATION EVENT",

            message:
                "The printer begins to warm up.\n\n" +
                "No print job appears in the queue.\n\n" +
                "After a few seconds, the sound stops.",

            effect: "mild",

            symbol: "!"
        },


        intercom: {
            id: "AMBIENT-INTERCOM",

            title: "INTERCOM STATIC",

            category: "UNSCHEDULED TRANSMISSION",

            message:
                "A short burst of static comes through the intercom.\n\n" +
                "There is no voice, only the sound of someone breathing very close to the microphone.",

            effect: "mild",

            symbol: "!"
        },


        emptyStation: {
            id: "AMBIENT-EMPTY-STATION",

            title: "UNASSIGNED STATION",

            category: "LOCATION DISCREPANCY",

            message:
                "A station status changes from OFFLINE to ACTIVE.\n\n" +
                "No operator is assigned to it.\n\n" +
                "The screen returns to OFFLINE before you can open the details.",

            effect: "strong",

            symbol: "!"
        },


        footsteps: {
            id: "AMBIENT-FOOTSTEPS",

            title: "MOVEMENT DETECTED",

            category: "FACILITY STATUS",

            message:
                "You hear footsteps beyond the inspection room door.\n\n" +
                "They stop when you look toward the hallway.\n\n" +
                "The access log does not report anyone entering.",

            effect: "mild",

            symbol: "!"
        }

    };


    function showAmbient(eventName) {
        var event = AMBIENT_EVENTS[eventName];

        if (!event) {
            return false;
        }

        var context = {
            source: "ambient",

            timestamp: getCurrentClock(),

            roundNumber: storyState.lastRound
        };

        return showEvent(
            event,
            context
        );
    }


    /* =====================================================
       25. PUBLIC API
       ===================================================== */

    window.NightShiftStory = {

        /* Existing game.js integration */
        showEvent: showEvent,

        showEnding: showEnding,

        /* Optional chapter controls */
        showChapterOpening: showChapterOpening,

        /* Optional ambient events */
        showAmbient: showAmbient,

        /* Event queue */
        acknowledge: acknowledgeEvent,

        getState: getState,

        getChapters: getChapters,

        reset: reset,

        /* Visual effect */
        triggerDistortion: triggerDistortion,

        /* Configuration */
        getConfig: function () {
            return Object.assign({}, STORY_CONFIG);
        }
    };


    /* =====================================================
       26. INITIALIZATION
       ===================================================== */

    function initialize() {
        if (storyState.initialized) {
            return;
        }

        storyState.initialized = true;

        injectStoryStyles();

        bindStoryControls();

        var overlay = getOverlay();

        if (overlay) {
            overlay.hidden = true;

            overlay.setAttribute(
                "aria-hidden",
                "true"
            );
        }

        console.log(
            "[NIGHT SHIFT STORY] Story controller initialized."
        );
    }


    /* =====================================================
       27. STARTUP
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

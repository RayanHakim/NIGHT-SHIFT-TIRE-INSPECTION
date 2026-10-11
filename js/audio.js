
/* =========================================================
   NIGHT SHIFT: TIRE INSPECTION
   AUDIO CONTROLLER

   File: js/audio.js

   AUDIO ASSETS:
   1. Background atmosphere
      audio/darkne-horror-atmosphere-615391.mp3

   2. Incorrect decision / warning
      audio/floraphonic-buzzer-18-203421.mp3

   3. Correct decision
      audio/koiroylers-correct-356013.mp3

   FEATURES:
   - Background music looping
   - Correct decision sound
   - Wrong decision sound
   - Sound ON / OFF button
   - Volume control
   - Repeated effect playback
   - Browser autoplay protection
   - Audio error handling
   - Public functions for other game modules

   All audio is local to this fictional game.
   ========================================================= */

(function () {
    "use strict";


    /* =====================================================
       01. AUDIO FILE PATHS

       Nama file harus sama persis dengan file di folder
       audio/, termasuk huruf dan tanda hubung.
       ===================================================== */

    var AUDIO_FILES = {
        background:
            "audio/darkne-horror-atmosphere-615391.mp3",

        wrong:
            "audio/floraphonic-buzzer-18-203421.mp3",

        correct:
            "audio/koiroylers-correct-356013.mp3"
    };


    /* =====================================================
       02. AUDIO SETTINGS
       ===================================================== */

    var SETTINGS = {
        backgroundVolume: 0.28,
        effectsVolume: 0.75,

        /* Sound starts enabled, but music waits for
           a user action such as clicking Start. */
        soundEnabled: true
    };


    /* =====================================================
       03. AUDIO STATE
       ===================================================== */

    var soundEnabled = SETTINGS.soundEnabled;

    /*
     * True after the game requests the background music.
     * If the player mutes the game, we remember this state
     * so music can resume when sound is enabled again.
     */
    var backgroundMusicRequested = false;

    var activeEffectInstances = [];

    var backgroundAudio = null;

    var effectAudio = {
        correct: null,
        wrong: null
    };


    /* =====================================================
       04. HELPER — CLAMP VOLUME
       ===================================================== */

    function clampVolume(value) {
        var number = Number(value);

        if (!Number.isFinite(number)) {
            return 0;
        }

        return Math.max(0, Math.min(1, number));
    }


    /* =====================================================
       05. CREATE AUDIO OBJECT
       ===================================================== */

    function createAudio(src, options) {
        options = options || {};

        var audio = new Audio(src);

        audio.preload = options.preload || "auto";
        audio.volume = clampVolume(options.volume);

        if (options.loop) {
            audio.loop = true;
        }

        audio.addEventListener("error", function () {
            console.warn(
                "[NIGHT SHIFT AUDIO] Unable to load audio:",
                src,
                audio.error || ""
            );
        });

        return audio;
    }


    /* =====================================================
       06. INITIALIZE AUDIO ASSETS
       ===================================================== */

    function initializeAudioAssets() {
        if (backgroundAudio) {
            return;
        }

        backgroundAudio = createAudio(
            AUDIO_FILES.background,
            {
                volume: SETTINGS.backgroundVolume,
                loop: true
            }
        );

        effectAudio.correct = createAudio(
            AUDIO_FILES.correct,
            {
                volume: SETTINGS.effectsVolume
            }
        );

        effectAudio.wrong = createAudio(
            AUDIO_FILES.wrong,
            {
                volume: SETTINGS.effectsVolume
            }
        );
    }


    /* =====================================================
       07. UPDATE SOUND BUTTON UI
       ===================================================== */

    function updateSoundButton() {
        var soundToggle = document.getElementById("soundToggle");
        var soundIcon = document.getElementById("soundIcon");
        var soundLabel = document.getElementById("soundLabel");

        if (!soundToggle) {
            return;
        }

        soundToggle.setAttribute(
            "aria-pressed",
            soundEnabled ? "true" : "false"
        );

        soundToggle.setAttribute(
            "aria-label",
            soundEnabled ? "Turn sound off" : "Turn sound on"
        );

        soundToggle.title = soundEnabled
            ? "Turn sound off"
            : "Turn sound on";

        if (soundIcon) {
            soundIcon.textContent = soundEnabled ? "♫" : "×";
        }

        if (soundLabel) {
            soundLabel.textContent = soundEnabled
                ? "SOUND ON"
                : "SOUND OFF";
        }

        soundToggle.classList.toggle(
            "sound-disabled",
            !soundEnabled
        );
    }


    /* =====================================================
       08. STOP ALL SOUND EFFECTS

       Used when the player turns sound off.
       ===================================================== */

    function stopAllEffects() {
        Object.keys(effectAudio).forEach(function (key) {
            var audio = effectAudio[key];

            if (!audio) {
                return;
            }

            audio.pause();

            try {
                audio.currentTime = 0;
            } catch (error) {
                /* Some browsers may not seek before
                   the audio file has loaded. */
            }
        });

        activeEffectInstances.forEach(function (audio) {
            audio.pause();

            try {
                audio.currentTime = 0;
            } catch (error) {
                /* Ignore unsupported seek operations. */
            }
        });

        activeEffectInstances = [];
    }


    /* =====================================================
       09. PLAY BACKGROUND MUSIC

       Called when the player begins a shift.

       Music will loop until stopped or muted.
       ===================================================== */

    function playBackgroundMusic() {
        initializeAudioAssets();

        backgroundMusicRequested = true;

        if (!soundEnabled) {
            return Promise.resolve(false);
        }

        backgroundAudio.loop = true;
        backgroundAudio.volume = clampVolume(
            SETTINGS.backgroundVolume
        );

        var playPromise = backgroundAudio.play();

        if (playPromise && typeof playPromise.then === "function") {
            return playPromise
                .then(function () {
                    return true;
                })
                .catch(function (error) {
                    /*
                     * Browsers may block playback unless
                     * it follows a user interaction.
                     *
                     * The Start button is intended to
                     * provide that interaction.
                     */
                    if (
                        error &&
                        error.name !== "AbortError" &&
                        error.name !== "NotAllowedError"
                    ) {
                        console.warn(
                            "[NIGHT SHIFT AUDIO] Background playback failed:",
                            error
                        );
                    }

                    return false;
                });
        }

        return Promise.resolve(true);
    }


    /* =====================================================
       10. STOP BACKGROUND MUSIC

       resetPosition = true resets the music to the beginning.
       Without it, the next start resumes the previous position.
       ===================================================== */

    function stopBackgroundMusic(resetPosition) {
        initializeAudioAssets();

        backgroundMusicRequested = false;

        backgroundAudio.pause();

        if (resetPosition === true) {
            try {
                backgroundAudio.currentTime = 0;
            } catch (error) {
                /* Ignore seek errors for unloaded audio. */
            }
        }
    }


    /* =====================================================
       11. PLAY SOUND EFFECT

       Uses an additional audio instance if the same effect
       is still playing. This prevents rapid decisions or
       repeated triggers from cutting off an existing sound.
       ===================================================== */

    function playEffect(effectName) {
        initializeAudioAssets();

        if (!soundEnabled) {
            return Promise.resolve(false);
        }

        var sourceAudio = effectAudio[effectName];

        if (!sourceAudio) {
            console.warn(
                "[NIGHT SHIFT AUDIO] Unknown effect:",
                effectName
            );

            return Promise.resolve(false);
        }

        var audio = sourceAudio;

        /*
         * If the base sound is already playing, create a
         * separate instance so the new effect can overlap.
         */
        if (!sourceAudio.paused && !sourceAudio.ended) {
            audio = sourceAudio.cloneNode(true);
            audio.volume = clampVolume(SETTINGS.effectsVolume);
            audio.preload = "auto";

            activeEffectInstances.push(audio);

            audio.addEventListener("ended", function () {
                removeActiveEffect(audio);
            }, { once: true });

            audio.addEventListener("error", function () {
                removeActiveEffect(audio);

                console.warn(
                    "[NIGHT SHIFT AUDIO] Effect playback failed:",
                    effectName
                );
            }, { once: true });
        }

        audio.volume = clampVolume(SETTINGS.effectsVolume);

        try {
            audio.currentTime = 0;
        } catch (error) {
            /* Playback can still proceed if seeking fails. */
        }

        var playPromise = audio.play();

        if (playPromise && typeof playPromise.then === "function") {
            return playPromise
                .then(function () {
                    return true;
                })
                .catch(function (error) {
                    removeActiveEffect(audio);

                    if (
                        error &&
                        error.name !== "AbortError" &&
                        error.name !== "NotAllowedError"
                    ) {
                        console.warn(
                            "[NIGHT SHIFT AUDIO] Cannot play effect:",
                            effectName,
                            error
                        );
                    }

                    return false;
                });
        }

        return Promise.resolve(true);
    }


    /* =====================================================
       12. REMOVE COMPLETED EFFECT INSTANCE
       ===================================================== */

    function removeActiveEffect(audio) {
        var index = activeEffectInstances.indexOf(audio);

        if (index !== -1) {
            activeEffectInstances.splice(index, 1);
        }
    }


    /* =====================================================
       13. CORRECT DECISION SOUND

       Call when the player makes the correct decision:
       - OK for a genuinely normal case
       - NG for a case that should be rejected
       ===================================================== */

    function playCorrectSound() {
        return playEffect("correct");
    }


    /* =====================================================
       14. WRONG DECISION SOUND

       Call when the player's decision conflicts with the
       evidence and expected result of the current case.
       ===================================================== */

    function playWrongSound() {
        return playEffect("wrong");
    }


    /* =====================================================
       15. SOUND ON / OFF
       ===================================================== */

    function setSoundEnabled(enabled) {
        soundEnabled = Boolean(enabled);

        if (!soundEnabled) {
            stopBackgroundMusic(false);
            stopAllEffects();

            /*
             * Keep the request state separate from the
             * playback operation, so music can resume
             * when sound is re-enabled.
             */
            backgroundMusicRequested = true;
        }

        updateSoundButton();

        /*
         * Turning sound back on resumes ambience only
         * if the current game has requested it.
         */
        if (soundEnabled && backgroundMusicRequested) {
            playBackgroundMusic();
        }

        return soundEnabled;
    }


    function toggleSound() {
        return setSoundEnabled(!soundEnabled);
    }


    function isSoundEnabled() {
        return soundEnabled;
    }


    /* =====================================================
       16. VOLUME CONTROL

       Value must be between 0 and 1.

       Example:
       setBackgroundVolume(0.20);
       setEffectsVolume(0.65);
       ===================================================== */

    function setBackgroundVolume(value) {
        SETTINGS.backgroundVolume = clampVolume(value);

        if (backgroundAudio) {
            backgroundAudio.volume =
                SETTINGS.backgroundVolume;
        }

        return SETTINGS.backgroundVolume;
    }


    function setEffectsVolume(value) {
        SETTINGS.effectsVolume = clampVolume(value);

        Object.keys(effectAudio).forEach(function (key) {
            if (effectAudio[key]) {
                effectAudio[key].volume =
                    SETTINGS.effectsVolume;
            }
        });

        activeEffectInstances.forEach(function (audio) {
            audio.volume = SETTINGS.effectsVolume;
        });

        return SETTINGS.effectsVolume;
    }


    /* =====================================================
       17. PLAY DECISION SOUND

       `wasCorrect` must come from inspection.js or game.js.
       Do not decide that a sound is correct just because
       the player pressed OK or NG.
       ===================================================== */

    function playDecisionResult(wasCorrect) {
        if (wasCorrect === true) {
            return playCorrectSound();
        }

        if (wasCorrect === false) {
            return playWrongSound();
        }

        return Promise.resolve(false);
    }


    /* =====================================================
       18. BIND UI EVENTS

       Connects the audio controller to index.html.
       ===================================================== */

    function bindAudioControls() {
        var soundToggle = document.getElementById("soundToggle");
        var startButton = document.getElementById("startButton");

        if (
            soundToggle &&
            soundToggle.dataset.audioBound !== "true"
        ) {
            soundToggle.dataset.audioBound = "true";

            soundToggle.addEventListener("click", function () {
                toggleSound();
            });
        }

        /*
         * Starting music here gives the browser a direct
         * user interaction that can permit audio playback.
         *
         * main.js may also call playBackgroundMusic().
         * Calling it twice is safe because the same audio
         * element is reused.
         */
        if (
            startButton &&
            startButton.dataset.audioBound !== "true"
        ) {
            startButton.dataset.audioBound = "true";

            startButton.addEventListener("click", function () {
                if (soundEnabled) {
                    playBackgroundMusic();
                }
            });
        }

        updateSoundButton();
    }


    /* =====================================================
       19. STOP EVERYTHING

       Useful when restarting the game or leaving a session.
       ===================================================== */

    function stopAllAudio() {
        backgroundMusicRequested = false;

        stopBackgroundMusic(true);
        stopAllEffects();
    }


    /* =====================================================
       20. PUBLIC AUDIO API

       Other modules can use:

       NightShiftAudio.playBackgroundMusic()
       NightShiftAudio.stopBackgroundMusic()
       NightShiftAudio.playCorrect()
       NightShiftAudio.playWrong()
       NightShiftAudio.playDecisionResult(true)
       NightShiftAudio.setSoundEnabled(false)
       NightShiftAudio.toggleSound()
       NightShiftAudio.stopAll()
       ===================================================== */

    window.NightShiftAudio = {

        initialize: initializeAudioAssets,

        playBackgroundMusic: playBackgroundMusic,
        stopBackgroundMusic: stopBackgroundMusic,

        playCorrect: playCorrectSound,
        playWrong: playWrongSound,

        playEffect: playEffect,
        playDecisionResult: playDecisionResult,

        setSoundEnabled: setSoundEnabled,
        toggleSound: toggleSound,
        isSoundEnabled: isSoundEnabled,

        setBackgroundVolume: setBackgroundVolume,
        setEffectsVolume: setEffectsVolume,

        stopAll: stopAllAudio,

        getSettings: function () {
            return {
                soundEnabled: soundEnabled,
                backgroundVolume: SETTINGS.backgroundVolume,
                effectsVolume: SETTINGS.effectsVolume,
                backgroundMusicRequested: backgroundMusicRequested
            };
        }
    };


    /* =====================================================
       21. OPTIONAL GLOBAL HELPERS

       Convenient for the other classic JavaScript files.
       ===================================================== */

    window.playCorrectSound = playCorrectSound;
    window.playWrongSound = playWrongSound;

    window.startBackgroundMusic = playBackgroundMusic;
    window.stopBackgroundMusic = stopBackgroundMusic;


    /* =====================================================
       22. INITIALIZATION
       ===================================================== */

    function initialize() {
        initializeAudioAssets();
        bindAudioControls();

        console.log(
            "[NIGHT SHIFT AUDIO] Audio controller initialized."
        );
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


    /* =====================================================
       23. CLEANUP
       ===================================================== */

    window.addEventListener("pagehide", function () {
        if (backgroundAudio) {
            backgroundAudio.pause();
        }

        stopAllEffects();
    });

})();

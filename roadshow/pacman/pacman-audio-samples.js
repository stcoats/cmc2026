// Sample-based replacement for the Google Doodle's former Flash sound player.
// The MP3 files were extracted losslessly from pacman10-hp-sound.swf, preserving
// the sounds and channel names used by the original 2010 game engine.
var PacManAudioEngine = (function () {
    "use strict";

    var base = "audio/";
    var trackNames = [
        "eating-dot-1", "eating-dot-2", "eating-dot-double",
        "eating-ghost", "fruit", "death", "death-double", "extra-life",
        "start-music", "start-music-double"
    ];
    var ambientNames = [
        "ambient-1", "ambient-2", "ambient-3", "ambient-4",
        "ambient-fright", "ambient-eyes", "cutscene"
    ];
    var known = Object.create(null);
    var templates = Object.create(null);
    var channels = [null, null, null, null, null];
    var ambient = null;
    var ambientName = null;
    var ambientSource = null;
    var ambientGain = null;
    var ambientGeneration = 0;
    var ambientBuffers = Object.create(null);
    var ambientLoads = Object.create(null);
    var AudioContextClass = window.AudioContext || window.webkitAudioContext;
    var audioContext = null;

    trackNames.concat(ambientNames).forEach(function (name) {
        known[name] = true;
        var audio = new Audio(base + name + ".mp3");
        audio.preload = "auto";
        templates[name] = audio;
    });

    function stopAudio(audio) {
        if (!audio) return;
        audio.pause();
        try { audio.currentTime = 0; } catch (error) {}
    }

    function start(name, loop) {
        if (!known[name]) return null;
        var audio = templates[name].cloneNode(true);
        audio.loop = Boolean(loop);
        audio.volume = loop ? 0.72 : 0.88;
        var promise = audio.play();
        if (promise && promise.catch) {
            // Browsers can reject playback until the game has been clicked.
            promise.catch(function () {});
        }
        return audio;
    }

    // HTMLAudioElement inserts a short restart gap when looping MP3 files.
    // The arcade siren, frightened-ghost and returning-eyes tracks are tiny
    // loops, so that gap is audible every few tenths of a second. Decode
    // trimmed PCM versions into Web Audio buffers for sample-continuous loops.
    function getAudioContext() {
        if (!AudioContextClass) return null;
        if (!audioContext) audioContext = new AudioContextClass();
        if (audioContext.state === "suspended") {
            var resumed = audioContext.resume();
            if (resumed && resumed.catch) resumed.catch(function () {});
        }
        return audioContext;
    }

    function loadAmbientBuffer(name) {
        if (ambientBuffers[name]) return Promise.resolve(ambientBuffers[name]);
        if (ambientLoads[name]) return ambientLoads[name];

        var context = getAudioContext();
        if (!context || !window.fetch) return Promise.reject(new Error("Web Audio unavailable"));

        ambientLoads[name] = fetch(base + name + ".wav")
            .then(function (response) {
                if (!response.ok) throw new Error("Unable to load " + name);
                return response.arrayBuffer();
            })
            .then(function (data) {
                return new Promise(function (resolve, reject) {
                    context.decodeAudioData(data, resolve, reject);
                });
            })
            .then(function (buffer) {
                ambientBuffers[name] = buffer;
                return buffer;
            });
        return ambientLoads[name];
    }

    function stopAmbientAudio() {
        ambientGeneration++;
        stopAudio(ambient);
        ambient = null;
        if (ambientSource) {
            try { ambientSource.stop(); } catch (error) {}
            ambientSource.disconnect();
            ambientSource = null;
        }
        if (ambientGain) {
            ambientGain.disconnect();
            ambientGain = null;
        }
    }

    function startGaplessAmbient(name) {
        var context = getAudioContext();
        if (!context) {
            ambient = start(name, true);
            return;
        }

        var generation = ambientGeneration;
        loadAmbientBuffer(name).then(function (buffer) {
            if (generation !== ambientGeneration || ambientName !== name) return;
            ambientSource = context.createBufferSource();
            ambientGain = context.createGain();
            ambientSource.buffer = buffer;
            ambientSource.loop = true;
            ambientGain.gain.value = 0.72;
            ambientSource.connect(ambientGain);
            ambientGain.connect(context.destination);
            ambientSource.start(0);
        }).catch(function () {
            if (generation === ambientGeneration && ambientName === name) {
                ambient = start(name, true);
            }
        });
    }

    return {
        playTrack: function (name, channel) {
            if (channel >= 0 && channel < channels.length) {
                stopAudio(channels[channel]);
                channels[channel] = start(name, false);
            }
        },
        stopChannel: function (channel) {
            if (channel >= 0 && channel < channels.length) {
                stopAudio(channels[channel]);
                channels[channel] = null;
            }
        },
        playAmbientTrack: function (name) {
            if (ambientName === name) return;
            stopAmbientAudio();
            ambientName = name;
            startGaplessAmbient(name);
        },
        stopAmbientTrack: function () {
            stopAmbientAudio();
            ambientName = null;
        },
        close: function () {
            for (var i = 0; i < channels.length; i++) {
                stopAudio(channels[i]);
                channels[i] = null;
            }
            stopAmbientAudio();
            ambientName = null;
        }
    };
})();

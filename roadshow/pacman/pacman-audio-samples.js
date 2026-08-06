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
            if (ambient && ambientName === name && !ambient.paused) return;
            stopAudio(ambient);
            ambientName = name;
            ambient = start(name, true);
        },
        stopAmbientTrack: function () {
            stopAudio(ambient);
            ambient = null;
            ambientName = null;
        },
        close: function () {
            for (var i = 0; i < channels.length; i++) {
                stopAudio(channels[i]);
                channels[i] = null;
            }
            stopAudio(ambient);
            ambient = null;
            ambientName = null;
        }
    };
})();

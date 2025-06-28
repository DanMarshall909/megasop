export class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.soundEnabled = false;
        this.currentSound = null;
        this.soundPriority = 0;
        this.titleMusicPosition = 0;
        this.titleMusicTimer = 0;
        // Authentic PC Speaker priority levels from original Sopwith
        this.SOUND_PRIORITIES = {
            TITLE: 5,
            EXPLOSION: 10,
            BOMB: 20,
            SHOT: 30,
            FALLING: 40,
            HIT: 50,
            PLANE: 60
        };
        // PC Speaker frequency table (authentic frequencies)
        this.frequencies = {
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
            'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
            'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
            'C6': 1046.50
        };
        // Original Sopwith title melody (recreated from analysis)
        this.titleMelody = [
            { note: 'G4', duration: 0.3 },
            { note: 'C5', duration: 0.3 },
            { note: 'E5', duration: 0.3 },
            { note: 'G5', duration: 0.6 },
            { note: 'F5', duration: 0.3 },
            { note: 'E5', duration: 0.3 },
            { note: 'D5', duration: 0.3 },
            { note: 'C5', duration: 0.6 },
            { note: 'G4', duration: 0.3 },
            { note: 'C5', duration: 0.3 },
            { note: 'E5', duration: 0.3 },
            { note: 'C5', duration: 0.6 },
            { note: 'rest', duration: 0.6 }
        ];
        this.initialize();
    }
    initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.soundEnabled = true;
        }
        catch (e) {
            console.log("Web Audio API not supported");
            this.soundEnabled = false;
        }
    }
    playPCSpeakerTone(frequency, duration, priority, volume = 0.15) {
        if (!this.soundEnabled || !this.audioContext)
            return;
        // PC Speaker priority system - higher priority interrupts lower
        if (this.currentSound && priority <= this.soundPriority) {
            return; // Don't interrupt higher priority sound
        }
        // Stop current sound if new one has higher priority
        if (this.currentSound) {
            try {
                this.currentSound.stop();
            }
            catch (e) {
                // Ignore if already stopped
            }
        }
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            // Authentic PC Speaker uses square waves
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            // PC Speaker characteristic envelope (sharp attack, quick decay)
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.001);
            gainNode.gain.exponentialRampToValueAtTime(volume * 0.8, this.audioContext.currentTime + duration * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            this.currentSound = oscillator;
            this.soundPriority = priority;
            // Clear current sound when it ends
            setTimeout(() => {
                if (this.currentSound === oscillator) {
                    this.currentSound = null;
                    this.soundPriority = 0;
                }
            }, duration * 1000);
        }
        catch (e) {
            console.log("Sound playback failed");
        }
    }
    // Authentic PC Speaker engine sound with frequency modulation
    playEngineSound(powerLevel) {
        const baseFreq = 80 + powerLevel * 60; // Lower frequency for engine rumble
        const modulationFreq = baseFreq + Math.sin(Date.now() * 0.01) * 20; // Add vibration
        this.playPCSpeakerTone(modulationFreq, 0.15, this.SOUND_PRIORITIES.PLANE, 0.08);
    }
    // Sharp machine gun burst (authentic rapid-fire PC speaker)
    playShootSound() {
        this.playPCSpeakerTone(1200, 0.06, this.SOUND_PRIORITIES.SHOT, 0.12);
        // Add second burst for authentic machine gun effect
        setTimeout(() => {
            this.playPCSpeakerTone(1000, 0.04, this.SOUND_PRIORITIES.SHOT, 0.10);
        }, 30);
    }
    // Bomb drop with descending frequency sweep
    playBombSound() {
        this.playFrequencySweep(400, 200, 0.25, this.SOUND_PRIORITIES.BOMB, 0.15);
    }
    // Multi-stage explosion with authentic PC speaker noise simulation
    playExplosionSound() {
        // First blast
        this.playPCSpeakerTone(180, 0.15, this.SOUND_PRIORITIES.EXPLOSION, 0.2);
        // Rumble sequence
        setTimeout(() => this.playPCSpeakerTone(120, 0.12, this.SOUND_PRIORITIES.EXPLOSION, 0.15), 80);
        setTimeout(() => this.playPCSpeakerTone(90, 0.10, this.SOUND_PRIORITIES.EXPLOSION, 0.12), 160);
        setTimeout(() => this.playPCSpeakerTone(60, 0.08, this.SOUND_PRIORITIES.EXPLOSION, 0.08), 240);
    }
    // Sharp hit impact
    playHitSound() {
        this.playPCSpeakerTone(1800, 0.08, this.SOUND_PRIORITIES.HIT, 0.18);
    }
    // Frequency sweep for authentic PC speaker effects
    playFrequencySweep(startFreq, endFreq, duration, priority, volume) {
        if (!this.soundEnabled || !this.audioContext)
            return;
        if (this.currentSound && priority <= this.soundPriority)
            return;
        if (this.currentSound) {
            try {
                this.currentSound.stop();
            }
            catch (e) {
                // Ignore if already stopped
            }
        }
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.001);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            this.currentSound = oscillator;
            this.soundPriority = priority;
            setTimeout(() => {
                if (this.currentSound === oscillator) {
                    this.currentSound = null;
                    this.soundPriority = 0;
                }
            }, duration * 1000);
        }
        catch (e) {
            console.log("Frequency sweep failed");
        }
    }
    // Title screen music system
    playTitleMusic() {
        if (this.titleMusicPosition >= this.titleMelody.length) {
            this.titleMusicPosition = 0; // Loop the melody
        }
        const note = this.titleMelody[this.titleMusicPosition];
        if (note.note !== 'rest') {
            const frequency = this.frequencies[note.note];
            this.playPCSpeakerTone(frequency, note.duration, this.SOUND_PRIORITIES.TITLE, 0.1);
        }
        this.titleMusicPosition++;
        this.titleMusicTimer = note.duration;
    }
    updateTitleMusic(deltaTime) {
        if (this.titleMusicTimer > 0) {
            this.titleMusicTimer -= deltaTime;
        }
        else {
            this.playTitleMusic();
        }
    }
    resetTitleMusic() {
        this.titleMusicPosition = 0;
        this.titleMusicTimer = 0;
    }
}
//# sourceMappingURL=AudioSystem.js.map
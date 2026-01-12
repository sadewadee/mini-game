
import * as Tone from 'tone';

let synth: Tone.PolySynth | null = null;
let noiseSynth: Tone.NoiseSynth | null = null;

export const initAudio = async () => {
    if (Tone.context.state !== 'running') {
        await Tone.start();
    }

    if (!synth) {
        synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "square" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 }
        }).toDestination();

        // Lower volume
        synth.volume.value = -10;
    }

    if (!noiseSynth) {
        noiseSynth = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0 }
        }).toDestination();
        noiseSynth.volume.value = -12;
    }
};

const lastPlayed: Record<string, number> = {};

export const playSfx = (type: 'shoot' | 'explode' | 'powerup' | 'jump' | 'score' | 'shield' | 'missile' | 'boss_hit') => {
    if (!synth || !noiseSynth) return;

    // Debounce to prevent "Start time strictly greater" errors
    const now = Date.now();
    const threshold = type === 'shoot' ? 80 : 50;
    if (now - (lastPlayed[type] || 0) < threshold) return;
    lastPlayed[type] = now;

    switch (type) {
        case 'shoot':
            synth.triggerAttackRelease("C5", "32n");
            break;
        case 'explode':
            noiseSynth.triggerAttackRelease("8n");
            break;
        case 'powerup':
            synth.triggerAttackRelease(["E5", "G5", "C6"], "16n");
            break;
        case 'jump':
            synth.triggerAttackRelease("A4", "64n");
            break;
        case 'score':
            synth.triggerAttackRelease(["C6", "E6"], "32n");
            break;
        case 'shield':
            synth.triggerAttackRelease(["C3", "C4"], "16n");
            break;
        case 'missile':
            // Deep explosion sound simulation using low chords
            synth.triggerAttackRelease(["C2", "G2"], "8n");
            break;
        case 'boss_hit':
            synth.triggerAttackRelease("G2", "32n");
            break;
    }
};

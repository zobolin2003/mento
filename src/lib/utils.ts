import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Natural wind blowing sound for checking off tasks
export const playEraseSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const duration = 0.25; // Shortened duration for a quick gust of wind
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise (will be filtered into wind)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Lowpass filter to muffle the noise into a wind-like sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    
    // Sweep the frequency to simulate a quick gust of wind (whoosh effect)
    filter.frequency.setValueAtTime(150, ctx.currentTime); // Start low
    filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05); // Swell up fast (50ms)
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration); // Die down quickly
    filter.Q.value = 0.5; // Low resonance for a smooth, diffuse sound

    // Envelope to make the volume swell and fade naturally
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05); // Quick attack (50ms)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration); // Quick fade out

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

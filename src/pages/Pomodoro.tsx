import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Bell, BellOff, Music, VolumeX, Coffee, Brain, SkipForward } from 'lucide-react';
import { cn } from '../lib/utils';

type Mode = 'focus' | 'break';
type FocusSoundType = 'tick' | 'ambient' | 'forest';
type BreakSoundType = 'cheerful' | 'calm';
type SoundType = FocusSoundType | BreakSoundType;

export default function Pomodoro() {
  const [focusDuration, setFocusDuration] = useState(25 * 60);
  const [breakDuration, setBreakDuration] = useState(5 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<Mode>('focus');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [tickingEnabled, setTickingEnabled] = useState(false);
  const [focusSound, setFocusSound] = useState<FocusSoundType>('ambient');
  const [breakSound, setBreakSound] = useState<BreakSoundType>('cheerful');
  const [cycles, setCycles] = useState(0);
  
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editMinutes, setEditMinutes] = useState('25');
  const [editSeconds, setEditSeconds] = useState('00');
  const [timeError, setTimeError] = useState('');

  const [isAlarmRinging, setIsAlarmRinging] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientNodeRef = useRef<{ stop: () => void } | null>(null);
  const alarmNodeRef = useRef<{ stop: () => void } | null>(null);

  const tickingSoundType = mode === 'focus' ? focusSound : breakSound;

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playTick = () => {
    if (!tickingEnabled || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    // Create a crisp, high-frequency click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    // Highpass filter to remove any low-end "thud" and make it crisp
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    
    // Square wave provides more harmonics for a sharp click
    osc.type = 'square';
    // Start high and drop very quickly (20ms)
    osc.frequency.setValueAtTime(2500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.02);
    
    // Very sharp volume envelope
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.02);
  };

  const playAlarm = () => {
    if (!soundEnabled || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    let isStopped = false;
    let timeoutId: NodeJS.Timeout;

    const playSequence = () => {
      if (isStopped) return;
      
      if (mode === 'break') {
        // Crisp Ding-Dong for break end
        const playNote = (freq: number, startTime: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.6, startTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(startTime);
          osc.stop(startTime + duration);
        };
        
        const now = ctx.currentTime;
        playNote(783.99, now, 0.8); // G5 (Ding)
        playNote(659.25, now + 0.4, 1.2); // E5 (Dong)
        
        timeoutId = setTimeout(playSequence, 3000);
      } else {
        // Sunrise alarm: gentle swelling major 7th arpeggio (Cmaj7: C, E, G, B)
        const frequencies = [261.63, 329.63, 392.00, 493.88, 523.25]; // C4, E4, G4, B4, C5
        
        frequencies.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.value = freq;
          
          // Swelling envelope
          const startTime = ctx.currentTime + i * 0.15;
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.3, startTime + 0.5);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 3.0);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(startTime);
          osc.stop(startTime + 3.0);
        });

        timeoutId = setTimeout(playSequence, 4000);
      }
    };

    playSequence();

    alarmNodeRef.current = {
      stop: () => {
        isStopped = true;
        clearTimeout(timeoutId);
      }
    };
  };

  const stopAlarm = () => {
    if (alarmNodeRef.current) {
      alarmNodeRef.current.stop();
      alarmNodeRef.current = null;
    }
    setIsAlarmRinging(false);
    
    if (mode === 'focus') {
      setMode('break');
      setTimeLeft(breakDuration);
      setCycles(c => c + 1);
    } else {
      setMode('focus');
      setTimeLeft(focusDuration);
    }
  };

  const stopAmbientSound = () => {
    if (ambientNodeRef.current) {
      try { ambientNodeRef.current.stop(); } catch (e) {}
      ambientNodeRef.current = null;
    }
  };

  useEffect(() => {
    if (isActive && tickingEnabled && tickingSoundType !== 'tick') {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      let isStopped = false;

      if (tickingSoundType === 'ambient') {
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.1; // Very soft and gentle
        
        // Lowpass filter for a warm, muffled sound
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        
        masterGain.connect(filter);
        filter.connect(ctx.destination);

        // Relaxing frequencies (A major 9th chord elements)
        const frequencies = [220, 277.18, 329.63, 415.30]; 
        const nodes: any[] = [];

        frequencies.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;

          const gain = ctx.createGain();
          gain.gain.value = 0.5;

          // Slow LFO for volume modulation (breathing effect)
          const lfo = ctx.createOscillator();
          lfo.type = 'sine';
          lfo.frequency.value = 0.03 + (i * 0.01); // Very slow, 0.03Hz = ~33s per cycle

          const lfoGain = ctx.createGain();
          lfoGain.gain.value = 0.5;

          lfo.connect(lfoGain);
          lfoGain.connect(gain.gain);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start();
          lfo.start();

          nodes.push(osc, lfo, gain, lfoGain);
        });

        ambientNodeRef.current = {
          stop: () => {
            if (!isStopped) {
              nodes.forEach(n => {
                try { n.stop?.(); } catch(e) {}
                try { n.disconnect(); } catch(e) {}
              });
              masterGain.disconnect();
              filter.disconnect();
              isStopped = true;
            }
          }
        };
      } else if (tickingSoundType === 'forest') {
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.05; // Softer
        masterGain.connect(ctx.destination);

        const nodes: any[] = [];

        // Wind/Leaves (Filtered noise)
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 400; // Lower frequency for softer sound
        noiseFilter.Q.value = 0.5;

        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.1; // Softer

        // Wind modulation
        const windLfo = ctx.createOscillator();
        windLfo.type = 'sine';
        windLfo.frequency.value = 0.1;
        const windLfoGain = ctx.createGain();
        windLfoGain.gain.value = 0.1;
        windLfo.connect(windLfoGain);
        windLfoGain.connect(noiseGain.gain);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);

        noise.start();
        windLfo.start();
        nodes.push(noise, noiseFilter, noiseGain, windLfo, windLfoGain);

        // Occasional bird chirps
        const chirpInterval = setInterval(() => {
          if (Math.random() > 0.3 && !isStopped) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            const baseFreq = 2000 + Math.random() * 1000;
            osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(baseFreq + 500, ctx.currentTime + 0.1);
            osc.frequency.exponentialRampToValueAtTime(baseFreq - 200, ctx.currentTime + 0.2);

            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.05); // Slightly louder chirp
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(masterGain);

            osc.start();
            osc.stop(ctx.currentTime + 0.2);
          }
        }, 2000);

        ambientNodeRef.current = {
          stop: () => {
            if (!isStopped) {
              clearInterval(chirpInterval);
              nodes.forEach(n => {
                try { n.stop?.(); } catch(e) {}
                try { n.disconnect(); } catch(e) {}
              });
              masterGain.disconnect();
              isStopped = true;
            }
          }
        };
      } else if (tickingSoundType === 'cheerful') {
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.08;
        masterGain.connect(ctx.destination);

        // Light music arpeggio (C major 7)
        const notes = [261.63, 329.63, 392.00, 493.88, 392.00, 329.63]; 
        let noteIdx = 0;
        let intervalId: NodeJS.Timeout;

        const playNextNote = () => {
          if (isStopped) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.value = notes[noteIdx];
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
          
          osc.connect(gain);
          gain.connect(masterGain);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.6);
          
          noteIdx = (noteIdx + 1) % notes.length;
        };

        intervalId = setInterval(playNextNote, 350);

        ambientNodeRef.current = {
          stop: () => {
            isStopped = true;
            clearInterval(intervalId);
            masterGain.disconnect();
          }
        };
      } else if (tickingSoundType === 'calm') {
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.1;
        masterGain.connect(ctx.destination);

        const nodes: any[] = [];
        
        // Two slow sine waves creating a beating effect
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 320; // E4
        
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 322; // Slightly detuned
        
        const gain = ctx.createGain();
        gain.gain.value = 0.1;
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(masterGain);
        
        osc1.start();
        osc2.start();
        nodes.push(osc1, osc2, gain);

        ambientNodeRef.current = {
          stop: () => {
            isStopped = true;
            nodes.forEach(n => {
              try { n.stop?.(); } catch(e) {}
              try { n.disconnect(); } catch(e) {}
            });
            masterGain.disconnect();
          }
        };
      }
    } else {
      stopAmbientSound();
    }

    return () => {
      stopAmbientSound();
    };
  }, [isActive, tickingEnabled, tickingSoundType]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
        if (tickingSoundType === 'tick') {
          playTick();
        }
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      setIsAlarmRinging(true);
      playAlarm();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, focusDuration, breakDuration, soundEnabled, tickingEnabled, tickingSoundType]);

  const toggleTimer = () => {
    initAudio();
    setIsActive(!isActive);
    setIsEditingTime(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsEditingTime(false);
    setTimeLeft(mode === 'focus' ? focusDuration : breakDuration);
  };

  const skipTimer = () => {
    setIsActive(false);
    setIsEditingTime(false);
    if (mode === 'focus') {
      setMode('break');
      setTimeLeft(breakDuration);
      setCycles(c => c + 1);
    } else {
      setMode('focus');
      setTimeLeft(focusDuration);
    }
  };

  const switchMode = (newMode: Mode) => {
    setIsActive(false);
    setIsEditingTime(false);
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? focusDuration : breakDuration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeClick = () => {
    if (!isActive && !isAlarmRinging) {
      setIsEditingTime(true);
      setEditMinutes(Math.floor(timeLeft / 60).toString().padStart(2, '0'));
      setEditSeconds((timeLeft % 60).toString().padStart(2, '0'));
    }
  };

  const handleTimeSubmit = () => {
    setIsEditingTime(false);
    let m = parseInt(editMinutes) || 0;
    let s = parseInt(editSeconds) || 0;
    
    if (m < 0) m = 0;
    if (s < 0) s = 0;
    if (s > 59) {
      m += Math.floor(s / 60);
      s = s % 60;
    }
    
    if (m > 120) {
      m = 120;
      s = 0;
      setTimeError('Maximum focus time is 120 minutes.');
      setTimeout(() => setTimeError(''), 3000);
    }
    
    const totalSeconds = m * 60 + s;
    const finalSeconds = Math.max(0, totalSeconds); 
    
    if (mode === 'focus') {
      setFocusDuration(finalSeconds);
    } else {
      setBreakDuration(finalSeconds);
    }
    setTimeLeft(finalSeconds);
  };

  const handleTimeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTimeSubmit();
    }
  };

  const totalDuration = mode === 'focus' ? focusDuration : breakDuration;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  const availableSounds = mode === 'focus' 
    ? ['tick', 'ambient', 'forest'] as const 
    : ['cheerful', 'calm'] as const;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]"
    >
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-[var(--title)]">Pomodoro</h1>
        <p className="text-[var(--muted)] mt-2">Stay focused, take breaks, and track your cycles.</p>
      </div>

      <div className="card-container p-8 sm:p-12 w-full max-w-md relative overflow-hidden">
        {/* Progress Background */}
        <div 
          className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-linear z-0 flex flex-col justify-end"
          style={{ height: `${progress}%` }}
        >
          <div className="absolute top-0 left-0 right-0 w-[200%] h-12 -mt-11 flex animate-wave text-[var(--color-primary)] opacity-20">
            <svg viewBox="0 0 1440 320" className="w-1/2 h-full fill-current" preserveAspectRatio="none">
              <path d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,122.7C672,96,768,96,864,117.3C960,139,1056,181,1152,186.7C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
            <svg viewBox="0 0 1440 320" className="w-1/2 h-full fill-current" preserveAspectRatio="none">
              <path d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,122.7C672,96,768,96,864,117.3C960,139,1056,181,1152,186.7C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
          <div className="w-full h-full bg-[var(--color-primary)]/20" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {timeError && (
            <div className="absolute -top-4 bg-red-500 text-white text-sm px-4 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2 z-50">
              {timeError}
            </div>
          )}
          {/* Mode Switcher */}
          <div className="flex bg-[var(--background)] p-1 rounded-2xl mb-10 border border-[var(--border)]">
            <button
              onClick={() => switchMode('focus')}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all",
                mode === 'focus' 
                  ? "bg-[var(--card)] text-[var(--color-primary)] shadow-sm" 
                  : "text-[var(--muted)] hover:text-[var(--title)]"
              )}
            >
              <Brain size={18} />
              Focus
            </button>
            <button
              onClick={() => switchMode('break')}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all",
                mode === 'break' 
                  ? "bg-[var(--card)] text-blue-500 shadow-sm" 
                  : "text-[var(--muted)] hover:text-[var(--title)]"
              )}
            >
              <Coffee size={18} />
              Break
            </button>
          </div>

          {/* Timer Display */}
          <div className="mb-6 h-28 flex items-center justify-center">
            {isEditingTime ? (
              <div 
                className="flex items-center text-7xl sm:text-8xl font-bold text-[var(--title)] font-mono tracking-tighter"
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    handleTimeSubmit();
                  }
                }}
              >
                <input
                  type="text"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  onKeyDown={handleTimeKeyDown}
                  className="w-24 sm:w-32 bg-transparent border-b-2 border-[var(--color-primary)] text-center focus:outline-none"
                  autoFocus
                />
                <span className="mx-2 pb-2">:</span>
                <input
                  type="text"
                  value={editSeconds}
                  onChange={(e) => setEditSeconds(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  onKeyDown={handleTimeKeyDown}
                  className="w-24 sm:w-32 bg-transparent border-b-2 border-[var(--color-primary)] text-center focus:outline-none"
                />
              </div>
            ) : (
              <div 
                onClick={handleTimeClick}
                className={cn(
                  "text-7xl sm:text-8xl font-bold text-[var(--title)] font-mono tracking-tighter transition-colors",
                  !isActive && !isAlarmRinging && "cursor-pointer hover:text-[var(--color-primary)]"
                )}
                title={!isActive && !isAlarmRinging ? "Click to edit time" : ""}
              >
                {formatTime(timeLeft)}
              </div>
            )}
          </div>

          {/* Time Slider */}
          <div className={cn(
            "w-full max-w-[240px] mb-10 transition-opacity duration-300",
            isActive || isEditingTime || isAlarmRinging ? "opacity-0 pointer-events-none" : "opacity-100"
          )}>
            <div className="flex justify-between text-xs text-[var(--muted)] mb-2 font-medium">
              <span>15s</span>
              <span className="text-[var(--color-primary)] font-bold">{formatTime(mode === 'focus' ? focusDuration : breakDuration)}</span>
              <span>{mode === 'focus' ? '120m' : '30m'}</span>
            </div>
            <input
              type="range"
              min="15"
              max={mode === 'focus' ? 120 * 60 : 30 * 60}
              step="15"
              value={mode === 'focus' ? focusDuration : breakDuration}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (mode === 'focus') {
                  setFocusDuration(val);
                } else {
                  setBreakDuration(val);
                }
                setTimeLeft(val);
              }}
              className="w-full h-2 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 w-full">
            {isAlarmRinging ? (
              <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-lg font-medium text-[var(--title)] animate-pulse">
                  {mode === 'focus' ? "Time's up! Time to take a break ☕" : "Break is over! Ready to focus? 🚀"}
                </p>
                <button
                  onClick={stopAlarm}
                  className="px-8 py-4 rounded-2xl bg-red-500 text-white font-bold text-lg shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors"
                >
                  Stop Alarm
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    initAudio();
                    setSoundEnabled(!soundEnabled);
                  }}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors border",
                    soundEnabled 
                      ? "text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30" 
                      : "text-[var(--muted)] bg-[var(--background)] border-[var(--border)] hover:bg-[var(--border)]"
                  )}
                  title={soundEnabled ? "Alarm On" : "Alarm Off"}
                >
                  {soundEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                </button>

                <button
                  onClick={resetTimer}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-[var(--muted)] bg-[var(--background)] hover:bg-[var(--border)] transition-colors border border-[var(--border)]"
                  title="Reset Timer"
                >
                  <RotateCcw size={20} />
                </button>
                
                <button
                  onClick={toggleTimer}
                  className={cn(
                    "w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 flex-shrink-0 mx-1",
                    mode === 'focus' ? "bg-[var(--color-primary)] shadow-[var(--color-primary)]/30" : "bg-blue-500 shadow-blue-500/30"
                  )}
                >
                  {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                </button>

                <button
                  onClick={skipTimer}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-[var(--muted)] bg-[var(--background)] hover:bg-[var(--border)] transition-colors border border-[var(--border)]"
                  title="Skip Phase"
                >
                  <SkipForward size={20} />
                </button>

                <button
                  onClick={() => {
                    initAudio();
                    setTickingEnabled(!tickingEnabled);
                  }}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors border",
                    tickingEnabled 
                      ? "text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30" 
                      : "text-[var(--muted)] bg-[var(--background)] border-[var(--border)] hover:bg-[var(--border)]"
                  )}
                  title={tickingEnabled ? "Background Sound On" : "Background Sound Off"}
                >
                  {tickingEnabled ? <Music size={20} /> : <VolumeX size={20} />}
                </button>
              </>
            )}
          </div>

          {/* Sound Type Selector */}
          <AnimatePresence>
            {tickingEnabled && !isAlarmRinging && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="flex gap-2 overflow-hidden"
              >
                {availableSounds.map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      initAudio();
                      if (mode === 'focus') {
                        setFocusSound(type as FocusSoundType);
                      } else {
                        setBreakSound(type as BreakSoundType);
                      }
                    }}
                    className={cn(
                      "px-4 py-2 text-xs font-medium rounded-xl capitalize transition-colors border",
                      tickingSoundType === type
                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                        : "bg-[var(--background)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--color-primary)]/50"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-[var(--muted)] font-medium">
          Completed Cycles Today: <span className="text-[var(--title)] text-xl ml-2">{cycles}</span>
        </p>
      </div>
    </motion.div>
  );
}


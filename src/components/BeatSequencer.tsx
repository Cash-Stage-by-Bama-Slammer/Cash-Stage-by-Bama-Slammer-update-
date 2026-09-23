import { useState, useEffect, useRef } from 'react';
import { Play, Square, Volume2, VolumeX, RotateCcw, Sparkles } from 'lucide-react';
import { audioEngine } from '../lib/audioEngine';

interface BeatSequencerProps {
  onUseBeatInStudio?: (beatName: string) => void;
}

const DRUM_TRACKS = [
  { id: 'kick', name: 'Kick Drum', color: 'bg-lime-500' },
  { id: 'snare', name: 'Snare Snap', color: 'bg-purple-500' },
  { id: 'hihat', name: 'Trap Hi-Hat', color: 'bg-yellow-400' },
  { id: 'clap', name: 'Street Clap', color: 'bg-cyan-400' },
  { id: 'bass808', name: 'Sub 808 Bass', color: 'bg-red-500' },
];

export const BeatSequencer = ({ onUseBeatInStudio }: BeatSequencerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(130);
  const [currentStep, setCurrentStep] = useState(0);
  const [grid, setGrid] = useState<Record<string, boolean[]>>({
    kick: [true, false, false, false, false, false, false, true, false, false, true, false, false, false, false, false],
    snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    bass808: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
  });
  const [mutes, setMutes] = useState<Record<string, boolean>>({});

  const timerRef = useRef<number | null>(null);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = (60 / bpm / 4) * 1000;
    timerRef.current = window.setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = (prev + 1) % 16;
        // Trigger sounds
        if (grid.kick[nextStep] && !mutes.kick) audioEngine.playKick();
        if (grid.snare[nextStep] && !mutes.snare) audioEngine.playSnare();
        if (grid.hihat[nextStep] && !mutes.hihat) audioEngine.playHiHat();
        if (grid.clap[nextStep] && !mutes.clap) audioEngine.playClap();
        if (grid.bass808[nextStep] && !mutes.bass808) audioEngine.play808(undefined, 42);
        return nextStep;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, bpm, grid, mutes]);

  const toggleStep = (trackId: string, index: number) => {
    setGrid((prev) => ({
      ...prev,
      [trackId]: prev[trackId].map((val, idx) => (idx === index ? !val : val)),
    }));
  };

  const toggleMute = (trackId: string) => {
    setMutes((prev) => ({ ...prev, [trackId]: !prev[trackId] }));
  };

  const clearGrid = () => {
    setGrid({
      kick: Array(16).fill(false),
      snare: Array(16).fill(false),
      hihat: Array(16).fill(false),
      clap: Array(16).fill(false),
      bass808: Array(16).fill(false),
    });
  };

  const loadPreset = (type: string) => {
    if (type === 'trap') {
      setBpm(140);
      setGrid({
        kick: [true, false, false, false, false, false, false, true, false, false, true, false, false, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        bass808: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      });
    } else if (type === 'drill') {
      setBpm(142);
      setGrid({
        kick: [true, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false],
        snare: [false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
        hihat: [true, false, false, true, false, true, false, false, true, false, true, false, true, false, false, true],
        clap: [false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
        bass808: [true, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false],
      });
    } else {
      setBpm(90);
      setGrid({
        kick: [true, false, false, false, false, false, true, false, false, true, false, false, false, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
        clap: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        bass808: [true, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false],
      });
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-5">
      {/* Sequencer Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-pulse shadow-[0_0_8px_#39ff14]" />
            <h3 className="text-base font-black italic tracking-tighter uppercase text-white">
              16-Step Beat Studio
            </h3>
          </div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            DSP Drum Synthesizer • 1000+ Unsigned Vets Beats
          </p>
        </div>

        {/* BPM & Presets */}
        <div className="flex items-center gap-3">
          <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-[9px] font-black uppercase text-zinc-400">TEMPO</span>
            <input
              type="range"
              min="80"
              max="165"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-16 h-1 accent-lime-400 cursor-pointer"
            />
            <span className="text-xs font-mono font-black text-lime-400">{bpm}</span>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg ${
              isPlaying
                ? 'bg-red-500 text-white shadow-red-500/20'
                : 'bg-lime-400 text-black shadow-lime-400/20 hover:bg-lime-300'
            }`}
          >
            {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            {isPlaying ? 'STOP' : 'PLAY'}
          </button>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[9px] font-black uppercase text-zinc-500 whitespace-nowrap">Presets:</span>
        <button
          onClick={() => loadPreset('trap')}
          className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-purple-500 transition-colors whitespace-nowrap"
        >
          Trap 140
        </button>
        <button
          onClick={() => loadPreset('drill')}
          className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-lime-400 transition-colors whitespace-nowrap"
        >
          Drill 142
        </button>
        <button
          onClick={() => loadPreset('boombap')}
          className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-yellow-400 transition-colors whitespace-nowrap"
        >
          Boom-Bap 90
        </button>
        <button
          onClick={clearGrid}
          className="px-2 py-1 rounded-lg text-[9px] font-black uppercase text-zinc-500 hover:text-red-400 ml-auto flex items-center gap-1"
        >
          <RotateCcw size={10} /> Clear
        </button>
      </div>

      {/* 16-Step Matrix */}
      <div className="space-y-2.5 overflow-x-auto no-scrollbar pb-1">
        {DRUM_TRACKS.map((track) => (
          <div key={track.id} className="flex items-center gap-2 min-w-[500px]">
            {/* Track Info & Mute */}
            <div className="w-28 flex items-center justify-between bg-zinc-900/80 px-2 py-1.5 rounded-lg border border-zinc-800">
              <span className="text-[9px] font-black uppercase tracking-tight truncate text-zinc-300">
                {track.name}
              </span>
              <button
                onClick={() => toggleMute(track.id)}
                className={`p-1 rounded ${mutes[track.id] ? 'text-red-400' : 'text-zinc-500 hover:text-white'}`}
              >
                {mutes[track.id] ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>
            </div>

            {/* Steps */}
            <div className="flex-1 grid grid-cols-16 gap-1">
              {grid[track.id]?.map((active, stepIdx) => {
                const isCurrent = isPlaying && currentStep === stepIdx;
                const isDownbeat = stepIdx % 4 === 0;

                return (
                  <button
                    key={stepIdx}
                    onClick={() => toggleStep(track.id, stepIdx)}
                    className={`h-8 rounded-md transition-all border ${
                      active
                        ? `${track.color} border-white/40 shadow-sm shadow-${track.color}`
                        : isDownbeat
                        ? 'bg-zinc-900 border-zinc-700/60 hover:bg-zinc-800'
                        : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-900'
                    } ${isCurrent ? 'ring-2 ring-white scale-105 z-10' : ''}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
        <span className="text-[10px] text-zinc-500 font-mono">16 STEPS • 4/4 TIME • REAL SYNTH</span>
        {onUseBeatInStudio && (
          <button
            onClick={() => onUseBeatInStudio(`${bpm} BPM Custom Unsigned Beat`)}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all active:scale-95"
          >
            <Sparkles size={14} /> Send Beat to Studio
          </button>
        )}
      </div>
    </div>
  );
};

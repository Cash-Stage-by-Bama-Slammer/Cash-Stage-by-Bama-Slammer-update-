import { useState, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Sliders,
  Sparkles,
  Layers,
  Volume2,
  VolumeX,
  Upload,
  RotateCcw,
  ShieldCheck,
  Music,
  CheckCircle2,
  Clock,
  Radio,
  Activity,
  Headphones,
  SlidersHorizontal,
  ChevronRight,
  Disc3
} from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { BeatSequencer } from './BeatSequencer';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { banManager } from '../lib/banManager';
import confetti from 'canvas-confetti';

interface StudioDawProps {
  userId?: string;
  username?: string;
  onTrackDropped?: () => void;
}

const GENRES = ['Hip hop', 'Rap', 'Gospel', 'Alternative', 'R&B', 'Blues', 'Country'];
const BARS_TELEPROMPTER = [
  'Microphone check, one two in the southern heat',
  'Cash Stage arena where the real lyricists meet',
  'No synthetic bots, just organic blood and sweat',
  'Heavyweight bars dropping with zero regret',
  'Sealed in the vault till the seven o\'clock toll',
  'Where the words turn straight into bankrolls'
];

type StudioMode = 'live_verse' | 'arrangement' | 'fx_rack' | 'beat_maker';
type RecordingStatus = 'Idle' | 'Armed' | 'Recording' | 'Paused' | 'Finished';

export const StudioDaw = ({ userId, username, onTrackDropped }: StudioDawProps) => {
  const {
    isRecording,
    audioUrl,
    recordingTime,
    formatTime,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();

  const [mode, setMode] = useState<StudioMode>('live_verse');
  const [isPlayingMix, setIsPlayingMix] = useState(false);
  const [selectedBpm, setSelectedBpm] = useState(140);
  const [selectedBeat, setSelectedBeat] = useState('140 BPM Cash Stage Hit');

  // Single source of truth for recording state
  const recordingState: RecordingStatus = isRecording
    ? 'Recording'
    : audioUrl
    ? 'Finished'
    : 'Idle';

  // Teleprompter state (auto-scrolls with recording time)
  const currentLineIndex = Math.min(
    BARS_TELEPROMPTER.length - 1,
    Math.floor((recordingTime / 3) % BARS_TELEPROMPTER.length)
  );

  // Screen 1: Mix Container Sliders (Vocal Gain & Beat Volume)
  const [vocalGain, setVocalGain] = useState(85);
  const [beatVolume, setBeatVolume] = useState(80);

  // Screen 2: 4-Track Stems
  const [stemVolumes, setStemVolumes] = useState({
    lead: 90,
    backing: 75,
    beat: 85,
    fx: 60,
  });
  const [stemMutes, setStemMutes] = useState({
    lead: false,
    backing: false,
    beat: false,
    fx: false,
  });
  const [stemSolos, setStemSolos] = useState({
    lead: false,
    backing: false,
    beat: false,
    fx: false,
  });

  // Vocal Chain Modules (with consistent status indicators)
  const [vocalChain, setVocalChain] = useState({
    autoTune: true,
    hardTune: true,
    tubeWarmth: true,
    dynamicComp: true,
    eqLowCut: true,
    reverb: false,
  });

  // FX values
  const [keyScale, setKeyScale] = useState('C Minor');
  const [retuneSpeed, setRetuneSpeed] = useState(3);
  const [tubeDrive, setTubeDrive] = useState(65);

  // Drop Track Modal
  const [showDropModal, setShowDropModal] = useState(false);
  const [dropTitle, setDropTitle] = useState('');
  const [dropGenre, setDropGenre] = useState(GENRES[0]);
  const [dropType, setDropType] = useState<'solo' | 'collab' | 'battle' | 'cypher'>('solo');
  const [isDropping, setIsDropping] = useState(false);

  // Format battle countdown timer: 1:00 total allocated limit
  const maxBattleSeconds = 60;
  const remainingSeconds = Math.max(0, maxBattleSeconds - recordingTime);
  const countdownMinutes = Math.floor(remainingSeconds / 60);
  const countdownSecs = remainingSeconds % 60;
  const countdownFormatted = `${countdownMinutes}:${countdownSecs < 10 ? '0' : ''}${countdownSecs}`;
  const progressPercent = Math.min(100, (recordingTime / maxBattleSeconds) * 100);

  const handleRecordButton = () => {
    if (userId) {
      const check = banManager.assertCanRecord(userId);
      if (!check.allowed) {
        alert(check.error);
        return;
      }
    }

    if (recordingState === 'Recording') {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleUploadDrop = async () => {
    if (!dropTitle.trim() || !userId) return;

    setIsDropping(true);
    try {
      await addDoc(collection(db, 'tracks'), {
        title: dropTitle.trim(),
        authorId: userId,
        authorName: username || 'Unsigned Artist',
        audioUrl: audioUrl || 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
        genre: dropGenre,
        type: dropType,
        plays: 1,
        views: 1,
        likes: 0,
        promoType: 'none',
        createdAt: serverTimestamp(),
      });

      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#39ff14', '#a855f7', '#ffd700'],
      });

      alert(`Track "${dropTitle.trim()}" successfully published to Cash Stage!`);
      setShowDropModal(false);
      setDropTitle('');
      clearRecording();
      if (onTrackDropped) onTrackDropped();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'tracks');
    } finally {
      setIsDropping(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Studio Header Mode Navigation */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-3 shadow-2xl">
        <div className="grid grid-cols-4 gap-1">
          {[
            { id: 'live_verse' as StudioMode, label: 'Live Verse', color: 'border-lime-400 text-lime-400' },
            { id: 'arrangement' as StudioMode, label: 'Arrangement', color: 'border-purple-400 text-purple-400' },
            { id: 'fx_rack' as StudioMode, label: 'Vocal Chain', color: 'border-yellow-400 text-yellow-400' },
            { id: 'beat_maker' as StudioMode, label: 'Beats', color: 'border-lime-400 text-white' },
          ].map((tab) => {
            const isActive = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id)}
                className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                  isActive
                    ? 'bg-zinc-900 border-lime-400 text-lime-400 shadow-md shadow-lime-400/20'
                    : 'border-transparent text-zinc-500 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SCREEN 1: LIVE VERSE RECORDING */}
      {mode === 'live_verse' && (
        <div className="space-y-4">
          {/* Dedicated Countdown Timer Container (#1: Headline scale, tabular, circular progress ring) */}
          <div className="bg-gradient-to-r from-zinc-950 via-purple-950/40 to-zinc-950 border-2 border-purple-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
            {/* Top Bar with Read-Only Recording State (#2: Read-only live indicator) */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  LIVE BATTLE ARENA
                </span>
                <span className="text-[9px] font-mono text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/30">
                  48-HR ROUND
                </span>
              </div>

              {/* Read-Only Status Indicator */}
              <div className="flex items-center gap-1.5" role="status" aria-label="Recording status">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    recordingState === 'Recording'
                      ? 'bg-red-500 animate-ping'
                      : recordingState === 'Finished'
                      ? 'bg-lime-400'
                      : 'bg-zinc-600'
                  }`}
                />
                <span className="text-[10px] font-mono font-black uppercase text-zinc-300">
                  {recordingState === 'Recording' ? 'LIVE ON AIR' : recordingState}
                </span>
              </div>
            </div>

            {/* Prominent High-Impact Countdown Readout */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-lime-400 block">
                  COUNTDOWN TIME LIMIT
                </span>
                <div className="text-4xl font-black font-mono tracking-tighter text-white font-tabular flex items-baseline gap-2">
                  <span className="text-lime-400 drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">
                    {countdownFormatted}
                  </span>
                  <span className="text-base text-zinc-500 font-normal">/ 1:00</span>
                </div>
                <p className="text-[10px] font-mono text-zinc-400">
                  Tempo: <span className="text-yellow-400 font-bold">{selectedBpm} BPM</span> • Key: {keyScale}
                </p>
              </div>

              {/* Circular Gauge Representation */}
              <div className="relative w-16 h-16 rounded-full border-4 border-zinc-800 flex items-center justify-center shadow-inner">
                <div
                  className="absolute inset-0 rounded-full border-4 border-lime-400 border-t-transparent animate-spin"
                  style={{ animationDuration: '4s', opacity: recordingState === 'Recording' ? 1 : 0.2 }}
                />
                <Clock size={20} className="text-lime-400" />
              </div>
            </div>

            {/* Linear Progress Rail */}
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mt-4 border border-zinc-800">
              <div
                style={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-purple-500 via-yellow-400 to-lime-400 transition-all duration-300"
              />
            </div>
          </div>

          {/* Lyric Teleprompter with Center Highlight & Progress Rail (#4) */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-2 shadow-xl">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2">
              <span className="flex items-center gap-1.5">
                <Activity size={12} className="text-lime-400" /> Teleprompter Sync
              </span>
              <span className="text-yellow-400 font-mono">BAR {currentLineIndex + 1} OF 6</span>
            </div>

            <div className="space-y-1.5 py-1">
              {BARS_TELEPROMPTER.map((line, idx) => {
                const isCurrent = idx === currentLineIndex;
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl text-xs font-mono transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-purple-950/50 border border-yellow-400 text-yellow-300 font-bold shadow-lg shadow-purple-900/30 translate-x-1'
                        : 'text-zinc-500'
                    }`}
                  >
                    <span>{line}</span>
                    {isCurrent && <span className="text-[9px] text-lime-400 font-bold uppercase tracking-widest">LIVE</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grouped "Mix" Container (#5: Vocal Gain & Beat Volume side-by-side) */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                <SlidersHorizontal size={14} className="text-purple-400" /> Mix Console
              </h4>
              <span className="text-[10px] font-mono text-zinc-400">Headphone Monitor Active</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Vocal Gain Slider */}
              <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-zinc-400">Vocal Gain</span>
                  <span className="text-xs font-mono font-bold text-lime-400">{vocalGain}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={vocalGain}
                  onChange={(e) => setVocalGain(Number(e.target.value))}
                  className="w-full h-1.5 accent-lime-400 cursor-pointer"
                />
              </div>

              {/* Beat Volume Slider */}
              <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-zinc-400">Beat Vol</span>
                  <span className="text-xs font-mono font-bold text-yellow-400">{beatVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={beatVolume}
                  onChange={(e) => setBeatVolume(Number(e.target.value))}
                  className="w-full h-1.5 accent-yellow-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Status Pills vs Actionable Effects Button (#6 & #7) */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Status Pill: Mic Check (Non-interactive) */}
              <div
                role="status"
                className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl flex items-center gap-1.5 text-[10px] font-bold uppercase text-zinc-400 cursor-default select-none"
              >
                <CheckCircle2 size={13} className="text-lime-400" /> Mic Check: On
              </div>

              {/* Status Pill: Beat Synced (Non-interactive) */}
              <div
                role="status"
                className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl flex items-center gap-1.5 text-[10px] font-bold uppercase text-zinc-400 cursor-default select-none"
              >
                <CheckCircle2 size={13} className="text-lime-400" /> Beat: Synced
              </div>
            </div>

            {/* Actionable Button: Effects (Prominent Material styling with ripple) */}
            <button
              onClick={() => setMode('fx_rack')}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 border border-purple-400 shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
            >
              <Sliders size={14} /> Effects
            </button>
          </div>

          {/* Unambiguous REC Button (#3: Dedicated source of truth) */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 flex flex-col items-center gap-3 shadow-2xl">
            <button
              onClick={handleRecordButton}
              className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl active:scale-95 ${
                recordingState === 'Recording'
                  ? 'bg-red-500 text-white animate-pulse ring-8 ring-red-500/20 shadow-red-500/40'
                  : 'bg-red-600 hover:bg-red-500 text-white ring-8 ring-red-600/20 shadow-red-600/40'
              }`}
            >
              {recordingState === 'Recording' ? (
                <Square size={26} fill="currentColor" />
              ) : (
                <Mic size={28} />
              )}
            </button>

            <span className="text-xs font-black uppercase tracking-widest text-white">
              {recordingState === 'Recording'
                ? 'STOP RECORDING'
                : audioUrl
                ? 'RECORD NEW TAKE'
                : 'START RECORDING'}
            </span>

            {/* Review Take & Drop Track */}
            {audioUrl && (
              <div className="flex gap-2 w-full pt-2">
                <button
                  onClick={() => setIsPlayingMix(!isPlayingMix)}
                  className="flex-1 py-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-lime-400 text-xs font-black uppercase flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  {isPlayingMix ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                  {isPlayingMix ? 'Pause Take' : 'Play Take'}
                </button>
                <button
                  onClick={() => setShowDropModal(true)}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-lime-400 via-yellow-400 to-lime-500 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-lime-400/20 active:scale-95 transition-all"
                >
                  <Upload size={14} /> Drop To Stage
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SCREEN 2: STUDIO / ARRANGEMENT */}
      {mode === 'arrangement' && (
        <div className="space-y-4">
          {/* Multitrack Stems with 48px Mute & Solo Targets (#1: 44-48dp minimum touch target & spacing) */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-purple-400" />
                <h3 className="text-sm font-black uppercase text-white">
                  Arrangement Stems
                </h3>
              </div>
              <span className="text-[10px] font-mono text-lime-400">4-TRACK CONSOLE</span>
            </div>

            <div className="space-y-3">
              {[
                { id: 'lead', label: 'VOICE 1 (LEAD)', color: 'border-red-500', barColor: 'bg-red-500' },
                { id: 'backing', label: 'VOICE 2 (DOUBLES)', color: 'border-purple-500', barColor: 'bg-purple-500' },
                { id: 'beat', label: 'BEAT (INSTRUMENTAL)', color: 'border-lime-400', barColor: 'bg-lime-400' },
                { id: 'fx', label: 'AD-LIBS & 808 FX', color: 'border-yellow-400', barColor: 'bg-yellow-400' },
              ].map((track) => {
                const key = track.id as keyof typeof stemVolumes;
                const isMuted = stemMutes[key];
                const isSolo = stemSolos[key];

                return (
                  <div
                    key={track.id}
                    className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-tight text-white">
                        {track.label}
                      </span>

                      {/* Enlarged 48px Mute & Solo Targets with clear spacing */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setStemMutes((prev) => ({ ...prev, [key]: !prev[key] }))}
                          aria-label={`Mute ${track.label}`}
                          className={`w-11 h-11 rounded-xl text-xs font-black uppercase flex items-center justify-center transition-all ${
                            isMuted
                              ? 'bg-red-500 text-white shadow-md shadow-red-500/40'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          M
                        </button>
                        <button
                          onClick={() => setStemSolos((prev) => ({ ...prev, [key]: !prev[key] }))}
                          aria-label={`Solo ${track.label}`}
                          className={`w-11 h-11 rounded-xl text-xs font-black uppercase flex items-center justify-center transition-all ${
                            isSolo
                              ? 'bg-yellow-400 text-black shadow-md shadow-yellow-400/40 font-black'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          S
                        </button>
                      </div>
                    </div>

                    {/* Normalized Track Row Density: Fixed-Height Waveform Container (#4) */}
                    <div className="h-10 bg-black/60 rounded-xl p-2 flex items-center gap-1 border border-zinc-800/80">
                      {[30, 65, 45, 90, 80, 50, 75, 40, 85, 60, 95, 70, 45, 80, 55, 65, 35, 90, 60, 40].map(
                        (h, i) => (
                          <div
                            key={i}
                            style={{ height: isMuted ? '15%' : `${h}%` }}
                            className={`flex-1 rounded-full transition-all duration-200 ${
                              isMuted ? 'bg-zinc-700' : track.barColor
                            }`}
                          />
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Elevated Transport Bar (#2: Distinct Surface elevation & #5: Prominent BPM chip) */}
          <div className="bg-zinc-950 border-2 border-yellow-500/40 rounded-3xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              {/* BPM Labeled Chip (#5) */}
              <div className="bg-black border border-yellow-500/50 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-yellow-400">TEMPO</span>
                <span className="text-sm font-mono font-black text-white">{selectedBpm} BPM</span>
              </div>

              {/* Timecode Labeled Chip (#5) */}
              <div className="bg-black border border-lime-400/50 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-lime-400">TIME</span>
                <span className="text-sm font-mono font-black text-white">
                  {formatTime(recordingTime)}
                </span>
              </div>
            </div>

            {/* Transport Controls */}
            <div className="flex items-center justify-center gap-4 pt-1">
              <button
                onClick={() => clearRecording()}
                className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center active:scale-95"
                title="Rewind / Reset"
              >
                <RotateCcw size={18} />
              </button>

              <button
                onClick={() => setIsPlayingMix(!isPlayingMix)}
                className="w-16 h-16 rounded-full bg-lime-400 hover:bg-lime-300 text-black flex items-center justify-center shadow-lg shadow-lime-400/30 active:scale-95 transition-all"
              >
                {isPlayingMix ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>

              <button
                onClick={handleRecordButton}
                className="w-12 h-12 rounded-2xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/30 active:scale-95"
                title="Record Track"
              >
                <Mic size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOCAL CHAIN MODULES (#3: Consistent status convention across all modules) */}
      {mode === 'fx_rack' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders size={18} className="text-lime-400" />
              <h3 className="text-sm font-black uppercase text-white">Vocal Chain Modules</h3>
            </div>
            <span className="text-[10px] font-mono text-yellow-400">STATUS CONVENTION: GREEN = ON</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { id: 'autoTune' as const, name: 'Auto-Tune Pro', desc: 'Hardware pitch tracking & scale correction' },
              { id: 'hardTune' as const, name: 'Hard Tune 808', desc: 'Instantaneous retune snap for punchy trap bars' },
              { id: 'tubeWarmth' as const, name: 'Analog Tube Warmth', desc: 'Adds harmonic saturation & vintage crunch' },
              { id: 'dynamicComp' as const, name: 'Dynamic VCA Compressor', desc: 'Smooths out transient volume spikes' },
              { id: 'eqLowCut' as const, name: '100Hz Low-Cut EQ Filter', desc: 'Eliminates room rumble & mic handling noise' },
              { id: 'reverb' as const, name: 'Stereo Convolution Reverb', desc: 'Adds lush hall depth and vocal presence' },
            ].map((mod) => {
              const active = vocalChain[mod.id];
              return (
                <div
                  key={mod.id}
                  onClick={() =>
                    setVocalChain((prev) => ({ ...prev, [mod.id]: !prev[mod.id] }))
                  }
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between ${
                    active
                      ? 'bg-zinc-900 border-lime-400/80 shadow-md shadow-lime-400/10'
                      : 'bg-zinc-950 border-zinc-800 opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {/* Consistent Status Indicator (#3) */}
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          active ? 'bg-lime-400 shadow-[0_0_8px_#39ff14]' : 'bg-zinc-700'
                        }`}
                      />
                      <h4 className="text-xs font-black uppercase text-white">{mod.name}</h4>
                    </div>
                    <p className="text-[10px] text-zinc-400">{mod.desc}</p>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-zinc-400 mt-0.5 uppercase">
                    {active ? 'ON' : 'OFF'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BEAT SEQUENCER */}
      {mode === 'beat_maker' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl">
          <BeatSequencer />
        </div>
      )}

      {/* DROP TRACK MODAL */}
      {showDropModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-black uppercase text-white">Publish Studio Drop</h3>
              <button onClick={() => setShowDropModal(false)} className="text-xs text-zinc-500 hover:text-white">
                Cancel
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Track Title..."
                value={dropTitle}
                onChange={(e) => setDropTitle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
              />

              <select
                value={dropGenre}
                onChange={(e) => setDropGenre(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                {(['solo', 'collab', 'battle', 'cypher'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setDropType(t)}
                    className={`py-2 rounded-xl text-xs font-black uppercase border transition-all ${
                      dropType === t
                        ? 'bg-lime-400 border-lime-400 text-black'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {t} Drop
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleUploadDrop}
              disabled={isDropping || !dropTitle.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-lime-400 via-yellow-400 to-lime-500 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-lime-400/20 active:scale-95 disabled:opacity-50"
            >
              {isDropping ? 'Dropping to Feed...' : 'Publish Drop'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

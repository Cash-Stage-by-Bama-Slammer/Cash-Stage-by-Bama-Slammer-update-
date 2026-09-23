import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Headphones, Clock, Users, Play, Pause, Flame, ShieldCheck, CheckCircle2, Lock, Sparkles, Send, Music2, Eye, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { audioEngine } from '../lib/audioEngine';
import { banManager } from '../lib/banManager';

export interface L4LSession {
  id: string;
  name: string;
  genre: string;
  capacityLimit: number;
  currentCount: number;
  description: string;
  bannerColor: string;
}

interface L4LTrack {
  id: string;
  title: string;
  artistName: string;
  artistUid: string;
  avatarUrl: string;
  genre: string;
  audioUrl: string;
  votesTallied: number;
  listensReceived: number;
}

const SESSIONS: L4LSession[] = [
  {
    id: 'l4l_trap',
    name: 'Session 1: Trap & Southern 808s',
    genre: 'Rap & Hip Hop',
    capacityLimit: 300,
    currentCount: 218,
    description: 'Hard-hitting sub bass, rapid-fire hi-hat rolls, and street anthems.',
    bannerColor: 'from-purple-900/60 to-zinc-950 border-purple-500/40',
  },
  {
    id: 'l4l_gospel',
    name: 'Session 2: Gospel & Faith Cypher',
    genre: 'Gospel & Christian Hip Hop',
    capacityLimit: 300,
    currentCount: 164,
    description: 'Uplifting message, salvation lyricism, and anointed flow.',
    bannerColor: 'from-yellow-900/50 to-zinc-950 border-yellow-500/40',
  },
  {
    id: 'l4l_boombap',
    name: 'Session 3: Drill & Street Poetry',
    genre: 'Drill & Boom Bap',
    capacityLimit: 300,
    currentCount: 285,
    description: 'Sliding 808s, grime pockets, and authentic storytelling.',
    bannerColor: 'from-lime-950/60 to-zinc-950 border-lime-500/40',
  },
  {
    id: 'l4l_fusion',
    name: 'Session 4: Alternative, R&B & Country',
    genre: 'Alternative & Fusion',
    capacityLimit: 300,
    currentCount: 142,
    description: 'Acoustic guitar riffs, soul melodies, and country rap hybrids.',
    bannerColor: 'from-cyan-950/60 to-zinc-950 border-cyan-500/40',
  },
];

interface Listen4ListenSessionProps {
  userId?: string;
  username?: string;
}

export const Listen4ListenSession = ({ userId, username }: Listen4ListenSessionProps) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>('l4l_trap');
  const [activeTrack, setActiveTrack] = useState<L4LTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [listenSeconds, setListenSeconds] = useState(0);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [evaluatedTracks, setEvaluatedTracks] = useState<Record<string, boolean>>({});
  const [submittedToQueue, setSubmittedToQueue] = useState(false);

  // Voting Questionnaire State
  const [qCount, setQCount] = useState('1 (Solo Artist)');
  const [qFeature, setQFeature] = useState('Yes, Feature Worthy 🔥');
  const [qPocket, setQPocket] = useState('Surgical Pocket / On Beat');
  const [qFavLine, setQFavLine] = useState('');
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  // Sample participants roster (artists can see each other, but votes remain anonymous!)
  const [queueTracks, setQueueTracks] = useState<L4LTrack[]>([
    {
      id: 'l4l_trk_1',
      title: 'Southside Iron Flow',
      artistName: 'Miss Bama Slammer',
      artistUid: 'bama_vet_01',
      avatarUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&auto=format&fit=crop&q=80',
      genre: 'Rap',
      audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
      votesTallied: 34,
      listensReceived: 182,
    },
    {
      id: 'l4l_trk_2',
      title: 'Grace In The Trenches',
      artistName: 'Praise Soldier',
      artistUid: 'gospel_vet_02',
      avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
      genre: 'Gospel',
      audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
      votesTallied: 29,
      listensReceived: 154,
    },
    {
      id: 'l4l_trk_3',
      title: 'Muddy Wheels Freestyle',
      artistName: 'Country Trap Vet',
      artistUid: 'country_vet_03',
      avatarUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=150&auto=format&fit=crop&q=80',
      genre: 'Country',
      audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
      votesTallied: 41,
      listensReceived: 219,
    },
  ]);

  // Compute live countdown to 7:00 PM EST daily reset
  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      // Target 7:00 PM EST (19:00 EST / 23:00 UTC depending on DST or local)
      // We calculate time remaining until the next 19:00 EST today or tomorrow
      const nowUtc = now.getTime() + now.getTimezoneOffset() * 60000;
      // EST is UTC - 4 (EDT) or UTC - 5 (EST)
      const estOffset = -4; // EDT offset in hours
      const estTime = new Date(nowUtc + 3600000 * estOffset);

      const target = new Date(estTime);
      target.setHours(19, 0, 0, 0); // 7:00 PM EST

      if (estTime.getTime() > target.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      const diffMs = target.getTime() - estTime.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen timer
  useEffect(() => {
    let timer: number;
    if (isPlaying) {
      timer = window.setInterval(() => {
        setListenSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const selectedSession = SESSIONS.find((s) => s.id === selectedSessionId) || SESSIONS[0];

  const handleSelectTrackToListen = (track: L4LTrack) => {
    setActiveTrack(track);
    setListenSeconds(0);
    setIsPlaying(true);
    audioEngine.startRadioStream();
  };

  const togglePlayback = () => {
    if (isPlaying) {
      audioEngine.stopRadioStream();
      setIsPlaying(false);
    } else {
      audioEngine.startRadioStream();
      setIsPlaying(true);
    }
  };

  const handleSubmitAnonymousVote = async () => {
    if (!activeTrack) return;
    if (!userId) {
      alert('Sign in to submit your anonymous vote.');
      return;
    }

    const banCheck = banManager.assertCanVote(userId);
    if (!banCheck.allowed) {
      alert(banCheck.error);
      return;
    }

    if (listenSeconds < 10) {
      alert('Please listen for at least 10 seconds before submitting an unbiased rating!');
      return;
    }

    setIsSubmittingVote(true);
    try {
      // 1. Submit Anonymous Vote to Firestore
      await addDoc(collection(db, 'votes'), {
        trackId: activeTrack.id,
        sessionId: selectedSessionId,
        voterId: userId, // internal audit only, never shown to contestants
        anonymous: true,
        peopleCount: qCount,
        featureWorthy: qFeature,
        pocketTiming: qPocket,
        favoriteLine: qFavLine || 'Fire verse',
        talliedAt7pmEst: true,
        createdAt: serverTimestamp(),
      });

      // 2. Confetti & Audio Chime
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#39ff14', '#ffd700', '#bd00ff'],
      });
      audioEngine.playJackpotChime();

      setEvaluatedTracks((prev) => ({ ...prev, [activeTrack.id]: true }));
      setQueueTracks((prev) =>
        prev.map((t) => (t.id === activeTrack.id ? { ...t, votesTallied: t.votesTallied + 1 } : t))
      );

      alert(
        `Anonymous vote registered for "${activeTrack.title}"! All session votes are sealed and will be tallied by 7:00 PM EST.`
      );
      setActiveTrack(null);
      audioEngine.stopRadioStream();
      setIsPlaying(false);
    } catch (e) {
      console.warn('L4L vote note:', e);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleJoinQueue = () => {
    if (selectedSession.currentCount >= selectedSession.capacityLimit) {
      alert('This session has hit its 300 limit! Resets at 7:00 PM EST.');
      return;
    }

    setSubmittedToQueue(true);
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#39ff14', '#ffffff'],
    });
    alert(
      `Your track is entered into ${selectedSession.name}! You are in the 300 queue. Votes tally at 7:00 PM EST.`
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Session Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/70 via-zinc-950 to-lime-950/60 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Headphones className="text-lime-400" size={24} />
              <span className="text-[10px] font-black uppercase tracking-widest text-lime-400 bg-lime-400/10 px-2.5 py-0.5 rounded-full border border-lime-400/30">
                Limit 300 • Reset 7 PM EST
              </span>
            </div>
            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">
              Listen 4 Listen Sessions
            </h2>
            <p className="text-xs text-zinc-400 font-bold max-w-sm mt-0.5">
              Artists can see each other, but all votes are 100% anonymous & tallied at 7:00 PM EST!
            </p>
          </div>

          {/* Reset Countdown Box */}
          <div className="bg-black/80 border border-yellow-500/40 px-4 py-2.5 rounded-2xl text-right shrink-0">
            <span className="text-[9px] font-black uppercase text-yellow-400 flex items-center gap-1 justify-end">
              <Clock size={12} /> Resets at 7:00 PM EST
            </span>
            <span className="text-sm font-mono font-black text-white">{timeUntilReset}</span>
          </div>
        </div>
      </div>

      {/* Multiple Choice Session Selector */}
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block px-1">
          Choose Your Listen 4 Listen Session:
        </span>
        <div className="grid grid-cols-2 gap-2">
          {SESSIONS.map((sess) => {
            const isSelected = sess.id === selectedSessionId;
            const pct = Math.round((sess.currentCount / sess.capacityLimit) * 100);

            return (
              <button
                key={sess.id}
                onClick={() => {
                  setSelectedSessionId(sess.id);
                  setActiveTrack(null);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-zinc-900 border-lime-400 shadow-[0_0_20px_rgba(57,255,20,0.2)]'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <h4
                    className={`text-xs font-black uppercase truncate pr-1 ${
                      isSelected ? 'text-lime-400' : 'text-white'
                    }`}
                  >
                    {sess.name}
                  </h4>
                  <span className="text-[9px] font-mono font-bold text-zinc-400 shrink-0">
                    {sess.currentCount}/300
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 line-clamp-1">{sess.description}</p>

                {/* Capacity Progress Bar */}
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full ${pct > 90 ? 'bg-red-500' : 'bg-lime-400'}`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Session Status Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-purple-400" />
            <h3 className="text-sm font-black uppercase text-white">
              {selectedSession.name} Roster
            </h3>
          </div>
          <span className="text-[10px] font-mono text-lime-400">
            {300 - selectedSession.currentCount} SLOTS OPEN TILL 7 PM EST
          </span>
        </div>

        {/* Join Queue Button */}
        {!submittedToQueue ? (
          <button
            onClick={handleJoinQueue}
            className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
          >
            <Music2 size={16} /> Enter My Track Into 300 Queue
          </button>
        ) : (
          <div className="p-3 bg-lime-950/30 border border-lime-500/40 rounded-2xl text-center text-xs font-black uppercase text-lime-400 flex items-center justify-center gap-2">
            <CheckCircle2 size={16} /> Track Queued! Listen to other vets below to boost rank
          </div>
        )}

        {/* Participant Queue (Can see each other!) */}
        <div className="space-y-3 pt-1">
          {queueTracks.map((track) => {
            const isDone = evaluatedTracks[track.id];
            const isCurrent = activeTrack?.id === track.id;

            return (
              <div
                key={track.id}
                className={`bg-zinc-900/80 border p-3.5 rounded-2xl flex items-center justify-between transition-all ${
                  isCurrent
                    ? 'border-purple-500 shadow-md'
                    : isDone
                    ? 'border-lime-500/30'
                    : 'border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-zinc-700 shrink-0">
                    <img
                      src={track.avatarUrl}
                      alt={track.artistName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white truncate max-w-[150px]">
                      {track.title}
                    </h4>
                    <p className="text-[10px] font-mono text-zinc-400">
                      <span className="text-purple-400">@{track.artistName}</span> •{' '}
                      <span className="text-zinc-500">{track.genre}</span>
                    </p>
                    <span className="text-[9px] font-mono text-yellow-400">
                      {track.votesTallied} votes sealed (revealed at 7 PM EST)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectTrackToListen(track)}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    isDone
                      ? 'bg-zinc-800 text-lime-400 border border-lime-400/30'
                      : isCurrent
                      ? 'bg-lime-400 text-black'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                >
                  {isCurrent && isPlaying ? (
                    <Pause size={12} fill="currentColor" />
                  ) : (
                    <Play size={12} fill="currentColor" />
                  )}
                  {isDone ? 'Voted' : isCurrent ? 'Listening' : 'Listen 4 Listen'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ACTIVE LISTENING & ANONYMOUS VOTING CONSOLE */}
      {activeTrack && (
        <div className="bg-zinc-950 border-2 border-purple-500/60 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider block">
                ANONYMOUS LISTENING SESSION • 100% UNBIASED
              </span>
              <h3 className="text-base font-black italic uppercase text-white">
                "{activeTrack.title}" by @{activeTrack.artistName}
              </h3>
            </div>
            <button
              onClick={() => {
                setActiveTrack(null);
                audioEngine.stopRadioStream();
                setIsPlaying(false);
              }}
              className="text-xs text-zinc-500 hover:text-white"
            >
              Close
            </button>
          </div>

          {/* Listening Progress Bar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4">
            <button
              onClick={togglePlayback}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isPlaying ? 'bg-red-500 text-white' : 'bg-lime-400 text-black'
              }`}
            >
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>Listening Time: {listenSeconds}s</span>
                <span className={listenSeconds >= 10 ? 'text-lime-400 font-bold' : 'text-yellow-400'}>
                  {listenSeconds >= 10 ? 'QUALIFIED TO VOTE' : 'Listen 10s to unlock vote'}
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, (listenSeconds / 15) * 100)}%` }}
                  className="h-full bg-gradient-to-r from-purple-500 to-lime-400"
                />
              </div>
            </div>
          </div>

          {/* Anonymous Multi-Choice Questions */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1.5">
              <Lock size={14} className="text-lime-400" /> Anonymous Feedback (Artist will never see your identity)
            </h4>

            {/* Q1: How many people in the track */}
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                1. How many people are on the track you just heard?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['1 (Solo Artist)', '2 (Collab Duo)', '3+ (Cypher / Crew)'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setQCount(opt)}
                    className={`py-2 px-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${
                      qCount === opt
                        ? 'bg-purple-600 border-purple-400 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q2: Feature Worthy */}
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                2. Feature worthy track?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Yes, Feature Worthy 🔥', 'Needs Polish / Demo'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setQFeature(opt)}
                    className={`py-2 px-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${
                      qFeature === opt
                        ? 'bg-lime-400 border-lime-400 text-black font-black'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q3: Pocket Timing */}
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                3. Flow & Pocket Alignment:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Surgical Pocket / On Beat', 'Slur Trap Pocket', 'Slightly Off Metronome'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setQPocket(opt)}
                    className={`py-2 px-1 rounded-xl text-[9px] font-bold uppercase border transition-all ${
                      qPocket === opt
                        ? 'bg-yellow-400 border-yellow-400 text-black font-black'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q4: Favorite line they said */}
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                4. Favorite line they said:
              </label>
              <input
                type="text"
                placeholder="Quote their hardest bar..."
                value={qFavLine}
                onChange={(e) => setQFavLine(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
              />
            </div>
          </div>

          {/* Submit Anonymous Vote */}
          <button
            onClick={handleSubmitAnonymousVote}
            disabled={listenSeconds < 10 || isSubmittingVote}
            className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl ${
              listenSeconds < 10
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-lime-400 hover:bg-lime-300 text-black shadow-lime-400/30 active:scale-95'
            }`}
          >
            <ShieldCheck size={16} />
            {isSubmittingVote
              ? 'Sealing Anonymous Vote...'
              : 'Submit Anonymous Vote (Tallied 7 PM EST)'}
          </button>
        </div>
      )}

      {/* 7:00 PM EST Settlement Info Banner */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-2 text-center">
        <span className="text-[10px] font-mono font-black uppercase text-yellow-400 flex items-center justify-center gap-1">
          <Award size={14} /> 7:00 PM EST Daily Settlement Protocol
        </span>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto font-sans leading-relaxed">
          At 7:00 PM EST every day, the 300-session limit locks and resets. All anonymous votes are
          cryptographically tallied, rankings are announced, and top-rated drops win promo boosts!
        </p>
      </div>
    </div>
  );
};

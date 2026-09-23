import { useState } from 'react';
import { GraduationCap, Award, CheckCircle2, ChevronRight, Sparkles, BookOpen, Trophy, ShieldCheck, Flame, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../lib/firebase';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { audioEngine } from '../lib/audioEngine';

interface LearningAcademyProps {
  userId?: string;
  onRewardEarned?: (bucks: number, xp: number) => void;
}

interface LevelQuiz {
  level: number;
  title: string;
  subtitle: string;
  xpReward: number;
  bucksReward: number;
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

const ACADEMY_LEVELS: LevelQuiz[] = [
  {
    level: 1,
    title: 'Level 1: Beat Making Basics & 808 Sub-Bass',
    subtitle: 'Rhythm, Pocket & Low-End Control',
    xpReward: 100,
    bucksReward: 10,
    question: 'Where should the 808 sub-bass kick typically sit to avoid muddy clashing with the kick drum?',
    options: [
      'In the exact same frequency band (60Hz) with zero sidechain compression',
      'Tuned to the key of the track, with kick punched around 80-100Hz and sidechain dip',
      'Boosted at 5kHz for harsh treble punch',
      'Rendered in full stereo with high-frequency reverb',
    ],
    correctIdx: 1,
    explanation: 'Tuning your 808 to the song key while carving pocket room for the kick punch guarantees deep, clean sub bass without muddy distortion.',
  },
  {
    level: 2,
    title: 'Level 2: Vocal Tuning, Key Scales & Auto-Tune',
    subtitle: 'Pitch Correction & Formant Mastery',
    xpReward: 150,
    bucksReward: 15,
    question: 'When dialing in hard-tune for modern trap vocals, what setting dictates how fast the pitch snaps?',
    options: [
      'Reverb decay time (ms)',
      'Retune speed (set to 0–5ms for instant hard snap)',
      'High-pass shelf gain (+12dB)',
      'Dynamic threshold reduction',
    ],
    correctIdx: 1,
    explanation: 'Fast retune speed (0 to 5ms) snaps pitch instantaneously to the chromatic/minor scale grid for that signature hard-tune aesthetic.',
  },
  {
    level: 3,
    title: 'Level 3: Songwriting Lyric Structure & Rhymes',
    subtitle: 'Multi-Syllabic Cadence & Bar Density',
    xpReward: 200,
    bucksReward: 20,
    question: 'What defines a multi-syllabic rhyme scheme in high-stakes rap battlegrounds?',
    options: [
      'Rhyming only the final letter of every sentence',
      'Matching multiple consecutive vowel and consonant syllable sounds across measure endings',
      'Speaking fast without staying on the metronome beat grid',
      'Repeating the exact same word four times in a row',
    ],
    correctIdx: 1,
    explanation: 'Multi-syllabic rhymes (e.g. "tactical advantage" / "practical enchantress") elevate bar density, winning crowd respect and tie-breaker scores.',
  },
  {
    level: 4,
    title: 'Level 4: Studio EQ, Low-Cut Filters & Compression',
    subtitle: 'Dynamic Range & Professional Vocal Polish',
    xpReward: 250,
    bucksReward: 25,
    question: 'Why is a high-pass / low-cut filter set around 80–100Hz standard practice on lead vocals?',
    options: [
      'To mute the singer completely',
      'To remove microphone handling rumble, AC hum, and sub muddiness before compression',
      'To turn the vocal into an 808 synthesizer',
      'To boost the master volume to +6dB',
    ],
    correctIdx: 1,
    explanation: 'Cutting frequencies below 80Hz removes useless room hum and mic thumps, giving compressors headroom to focus on pure vocal tone.',
  },
  {
    level: 5,
    title: 'Level 5: Cash Stage Battle Master & Fair Play',
    subtitle: 'Anonymous Voting & Integrity Enforcement',
    xpReward: 300,
    bucksReward: 30,
    question: 'Why does Cash Stage lock anonymous votes permanently and ban synthetic AI vocals?',
    options: [
      'To protect authentic human artistry, prevent vote-trading collusion, and ensure fair competition',
      'To make voting slow and tedious',
      'To favor artists with the most social media followers',
      'Because the server runs out of disk space',
    ],
    correctIdx: 0,
    explanation: 'Cash Stage is a 100% human arena. Cryptographic anonymous locking eliminates popularity bias, giving pure skill the crown.',
  },
  {
    level: 6,
    title: 'Level 6: Mixing 101 & Stereo Field Panning',
    subtitle: 'Spatial Separation & Headroom Balance',
    xpReward: 350,
    bucksReward: 35,
    question: 'In a professional hip hop vocal mix, where should lead vocals and 808 bass be placed in the stereo field?',
    options: [
      'Panned hard 100% Left and 100% Right',
      'Dead center in mono to anchor power, punch, and mono-compatibility on club systems',
      'Rendered through an out-of-phase stereo widener plugin',
      'Silenced completely to let ad-libs shine',
    ],
    correctIdx: 1,
    explanation: 'Keeping Lead Vocals and Sub-bass dead center provides maximum translation and punch across phone speakers and arena sound systems.',
  },
  {
    level: 7,
    title: 'Level 7: Hardware DSP & Analog Saturation Crunch',
    subtitle: 'Tube Warmth & Harmonic Overtone Color',
    xpReward: 400,
    bucksReward: 40,
    question: 'What does analog tube saturation add to dry digital microphone recordings?',
    options: [
      'Digital clipping noise and dropouts',
      'Even-order harmonic overtones that make vocals sound full, warm, and forward in the mix',
      'Pitch degradation and tempo slowdown',
      'Automatic autotune detuning',
    ],
    correctIdx: 1,
    explanation: 'Tube saturation introduces musical harmonics, softening harsh high frequencies while glueing vocals into the instrumental beat.',
  },
  {
    level: 8,
    title: 'Level 8: Transient Beat-Grid Alignment',
    subtitle: 'Micro-Timing Variance & Pocket Consistency',
    xpReward: 450,
    bucksReward: 45,
    question: 'How does the Cash Stage tie-breaker evaluate an artist’s "pocket consistency" between 80–162 BPM?',
    options: [
      'By counting how many likes their friends gave them',
      'By analyzing waveform onset transients against the exact beat downbeat and sub-division grid',
      'By rolling random dice',
      'By checking the length of their track title',
    ],
    correctIdx: 1,
    explanation: 'Waveform transient analysis calculates timing drift in milliseconds against the tempo grid; tighter pocket lock wins the tie-break score.',
  },
  {
    level: 9,
    title: 'Level 9: Spin Team Audio Sentinel & Anti-AI Verification',
    subtitle: 'Spectral Entropy & Harmonic Variance Auditing',
    xpReward: 500,
    bucksReward: 50,
    question: 'What spectral threshold does the Spin Team Audio Sentinel require to certify 100% human authenticity?',
    options: [
      'Greater than 98% natural human harmonic variation and breath transient dynamics',
      '0% human vocal variation',
      'Only synthetic robot vocoders',
      'Zero microphone input',
    ],
    correctIdx: 0,
    explanation: 'Natural human voices have micro-fluctuations in formant pitch and breath dynamics. Synthetic AI clones fail the 98% entropy test.',
  },
  {
    level: 10,
    title: 'Level 10: Battle Stanza Economics & Silver Vault',
    subtitle: 'Purse Allocations, Protocol Rake & Royalty Pools',
    xpReward: 600,
    bucksReward: 60,
    question: 'How is the gross arena battle pot distributed upon settlement on Cash Stage?',
    options: [
      '100% kept by the platform owners',
      '85% net purse deposited to victor Bama Wallet, with 15% dedicated to the Silver Vault and top evaluator royalty pool',
      'Distributed evenly to all active chat users',
      'Converted into useless digital credits',
    ],
    correctIdx: 1,
    explanation: 'Winners earn 85% real purse yield, while 15% funds protocol liquidity and rewards accurate human voters who judged the battle.',
  },
  {
    level: 11,
    title: 'Level 11: Crew Syndicate Leadership & Collab Royalties',
    subtitle: '30-Member Capacity, Admin Roles & Split Sheets',
    xpReward: 750,
    bucksReward: 75,
    question: 'What is the maximum roster capacity and admin hierarchy permitted for a verified Cash Stage Crew Syndicate?',
    options: [
      'Unlimited members with no admins',
      'Up to 30 members, up to 4 admins, and 1–2 designated owner creators with non-transferable leadership',
      'Only 2 artists per crew',
      '100 members with bot moderators',
    ],
    correctIdx: 1,
    explanation: 'Crews are strictly capped at 30 members with up to 4 admins to maintain tight syndicate brotherhood and fair competition.',
  },
  {
    level: 12,
    title: 'Level 12: Grand Champion & Golden Seal Legitimacy',
    subtitle: 'Master Certification & Official Industry Verification',
    xpReward: 1000,
    bucksReward: 100,
    question: 'What unlocks when an artist completes Level 12 Grand Champion certification on Cash Stage?',
    options: [
      'The Golden Seal verification stamp, priority feed queueing, and entry into national cash tournaments',
      'Account deletion',
      'Loss of all Bama Bucks',
      'Nothing at all',
    ],
    correctIdx: 0,
    explanation: 'Level 12 certifies an unsigned veteran as a Cash Stage Grand Champion, permanently bestowing the Golden Seal on all published drops.',
  },
];

export const LearningAcademy = ({ userId, onRewardEarned }: LearningAcademyProps) => {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<Record<number, boolean>>({});

  const currentQuiz = ACADEMY_LEVELS.find((q) => q.level === selectedLevel) || ACADEMY_LEVELS[0];
  const completedCount = Object.keys(completedLevels).length;

  const handleSubmitAnswer = async () => {
    if (selectedOption === null) return;
    const correct = selectedOption === currentQuiz.correctIdx;
    setIsCorrect(correct);
    setQuizSubmitted(true);

    if (correct && !completedLevels[currentQuiz.level]) {
      audioEngine.playJackpotChime();
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#39ff14', '#ffd700', '#a855f7'],
      });

      setCompletedLevels((prev) => ({ ...prev, [currentQuiz.level]: true }));

      if (userId) {
        try {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            bamaBucks: increment(currentQuiz.bucksReward),
            xp: increment(currentQuiz.xpReward),
            learningLevel: currentQuiz.level,
          });

          await addDoc(collection(db, 'ledger'), {
            userId,
            amount: currentQuiz.bucksReward,
            type: 'quiz_reward',
            description: `Completed Academy Level ${currentQuiz.level}: ${currentQuiz.title}`,
            timestamp: serverTimestamp(),
          });

          if (onRewardEarned) {
            onRewardEarned(currentQuiz.bucksReward, currentQuiz.xpReward);
          }
        } catch (e) {
          console.warn('Quiz reward error:', e);
        }
      }
    }
  };

  const handleNextLevel = () => {
    setSelectedOption(null);
    setQuizSubmitted(false);
    setSelectedLevel((prev) => (prev < 12 ? prev + 1 : 1));
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Academy Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-zinc-950 to-yellow-950/40 border-2 border-yellow-500/40 rounded-3xl p-6 space-y-3 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-yellow-400" size={26} />
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 px-3 py-0.5 rounded-full border border-yellow-400/30">
              12-Level MC Academy Certification
            </span>
          </div>
          <span className="text-xs font-mono font-black text-lime-400 bg-lime-400/10 px-3 py-1 rounded-full border border-lime-400/30">
            {completedCount} / 12 Levels Completed
          </span>
        </div>

        <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">
          Cash Stage MC Academy
        </h2>
        <p className="text-xs text-zinc-300 font-medium max-w-md leading-relaxed">
          From "Mixing 101" masterclasses to "Bar Mastery" quizzes, evolve from an unsigned contender to a certified <span className="text-yellow-400 font-bold">Level 12 Grand Champion</span> with the Golden Seal.
        </p>
      </div>

      {/* 12-Level Progression Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-mono font-black uppercase text-zinc-400 tracking-wider">
            Select Certification Level (1–12):
          </span>
          <span className="text-[10px] font-mono font-bold text-yellow-400">
            GRAND PRIZE: $100 CS BUCKS
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {ACADEMY_LEVELS.map((lvl) => {
            const isSelected = selectedLevel === lvl.level;
            const isDone = completedLevels[lvl.level];

            return (
              <button
                key={lvl.level}
                onClick={() => {
                  setSelectedLevel(lvl.level);
                  setSelectedOption(null);
                  setQuizSubmitted(false);
                }}
                className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${
                  isSelected
                    ? 'bg-purple-600 border-yellow-400 text-white shadow-lg shadow-purple-600/30 scale-105'
                    : isDone
                    ? 'bg-lime-950/40 border-lime-400/50 text-lime-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-tight">LVL {lvl.level}</span>
                {isDone ? (
                  <CheckCircle2 size={15} className="text-lime-400" />
                ) : (
                  <span className="text-[9px] font-mono font-bold text-yellow-400">+${lvl.bucksReward}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Quiz Evaluation Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider block">
              {currentQuiz.subtitle}
            </span>
            <h3 className="text-base font-black italic tracking-tighter uppercase text-white">
              {currentQuiz.title}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Certification Yield</span>
            <span className="text-xs font-mono font-black text-lime-400">
              +{currentQuiz.xpReward} XP / +${currentQuiz.bucksReward} CS BUCKS
            </span>
          </div>
        </div>

        {/* Question */}
        <p className="text-sm font-bold text-zinc-100 leading-snug">
          {currentQuiz.question}
        </p>

        {/* Multiple Choice Options */}
        <div className="space-y-2.5">
          {currentQuiz.options.map((opt, idx) => {
            const isChosen = selectedOption === idx;
            let btnClass = 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700';

            if (quizSubmitted) {
              if (idx === currentQuiz.correctIdx) {
                btnClass = 'bg-lime-950/60 border-lime-400 text-lime-300 font-bold';
              } else if (isChosen && !isCorrect) {
                btnClass = 'bg-red-950/60 border-red-500 text-red-300';
              }
            } else if (isChosen) {
              btnClass = 'bg-purple-900/60 border-purple-500 text-white font-bold';
            }

            return (
              <button
                key={idx}
                disabled={quizSubmitted}
                onClick={() => setSelectedOption(idx)}
                className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all flex items-start gap-3 ${btnClass}`}
              >
                <span className="w-5 h-5 rounded-full bg-black/50 border border-zinc-700 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1 leading-relaxed">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation Alert */}
        {quizSubmitted && (
          <div
            className={`p-4 rounded-2xl border ${
              isCorrect ? 'bg-lime-950/30 border-lime-500/40 text-lime-300' : 'bg-red-950/30 border-red-500/40 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {isCorrect ? <CheckCircle2 size={16} /> : <Award size={16} />}
              <span className="text-xs font-black uppercase">
                {isCorrect ? 'Correct! Knowledge Verified' : 'Incorrect — Review The Principle'}
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">{currentQuiz.explanation}</p>
          </div>
        )}

        {/* Submit / Next Button */}
        {!quizSubmitted ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={selectedOption === null}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-lime-400 via-yellow-400 to-lime-500 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-lime-400/20 active:scale-95 disabled:opacity-40 transition-all"
          >
            Submit Answer for Evaluation
          </button>
        ) : (
          <button
            onClick={handleNextLevel}
            className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Proceed to Next Academy Level</span>
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

import { useState } from 'react';
import { GraduationCap, Award, CheckCircle2, ChevronRight, Sparkles, BookOpen, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../lib/firebase';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
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
    xpReward: 150,
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
    xpReward: 250,
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
    xpReward: 350,
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
    xpReward: 450,
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
    xpReward: 600,
    bucksReward: 50,
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
];

export const LearningAcademy = ({ userId, onRewardEarned }: LearningAcademyProps) => {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<Record<number, boolean>>({});

  const currentQuiz = ACADEMY_LEVELS.find((q) => q.level === selectedLevel) || ACADEMY_LEVELS[0];

  const handleSubmitAnswer = async () => {
    if (selectedOption === null) return;
    const correct = selectedOption === currentQuiz.correctIdx;
    setIsCorrect(correct);
    setQuizSubmitted(true);

    if (correct && !completedLevels[currentQuiz.level]) {
      // Award XP and CS Bucks
      audioEngine.playJackpotChime();
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#39ff14', '#ffd700', '#bd00ff'],
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
            description: `Completed Academy ${currentQuiz.title}`,
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
    setSelectedLevel((prev) => (prev < 5 ? prev + 1 : 1));
  };

  return (
    <div className="space-y-6">
      {/* Academy Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-zinc-950 to-yellow-950/40 border border-zinc-800 rounded-3xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="text-yellow-400" size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 px-2.5 py-0.5 rounded-full border border-yellow-400/30">
            MC Academy & Certification
          </span>
        </div>
        <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">
          Music Learning Competitions
        </h2>
        <p className="text-xs text-zinc-400 font-bold max-w-sm">
          5-Level Educational Progression. Level up your production theory, mixing chops, and battle strategy to earn real CS Bucks.
        </p>
      </div>

      {/* Level Selection Tabs */}
      <div className="grid grid-cols-5 gap-1.5">
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
                  ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/30 scale-105'
                  : isDone
                  ? 'bg-lime-950/30 border-lime-500/40 text-lime-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span className="text-[10px] font-black uppercase">LVL {lvl.level}</span>
              {isDone ? (
                <CheckCircle2 size={14} className="text-lime-400" />
              ) : (
                <span className="text-[9px] font-mono font-bold">+${lvl.bucksReward}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Interactive Quiz Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">
              {currentQuiz.subtitle}
            </span>
            <h3 className="text-base font-black italic tracking-tighter uppercase text-white">
              {currentQuiz.title}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Reward</span>
            <span className="text-xs font-mono font-black text-lime-400">
              +{currentQuiz.xpReward} XP / +${currentQuiz.bucksReward} CS BUCKS
            </span>
          </div>
        </div>

        {/* Question Text */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-zinc-200 leading-snug">
            {currentQuiz.question}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {currentQuiz.options.map((opt, idx) => {
            const isChosen = selectedOption === idx;
            let btnClass = 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600';

            if (quizSubmitted) {
              if (idx === currentQuiz.correctIdx) {
                btnClass = 'bg-lime-500/20 border-lime-400 text-lime-300 font-bold';
              } else if (isChosen) {
                btnClass = 'bg-red-500/20 border-red-500 text-red-300';
              }
            } else if (isChosen) {
              btnClass = 'bg-purple-600/30 border-purple-500 text-white font-bold';
            }

            return (
              <button
                key={idx}
                onClick={() => !quizSubmitted && setSelectedOption(idx)}
                disabled={quizSubmitted}
                className={`w-full text-left p-4 rounded-2xl border text-xs leading-relaxed transition-all flex items-start gap-3 ${btnClass}`}
              >
                <span className="w-5 h-5 rounded-full border border-zinc-600 flex items-center justify-center text-[10px] font-mono shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Quiz Evaluation Result */}
        {quizSubmitted && (
          <div
            className={`p-4 rounded-2xl border space-y-1.5 ${
              isCorrect
                ? 'bg-lime-500/10 border-lime-500/40 text-lime-300'
                : 'bg-red-500/10 border-red-500/40 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2 font-black uppercase text-xs">
              {isCorrect ? <CheckCircle2 size={16} /> : null}
              {isCorrect ? 'Correct! Knowledge Check Passed' : 'Incorrect. Review the theory below:'}
            </div>
            <p className="text-[11px] text-zinc-300 leading-normal">{currentQuiz.explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          {!quizSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl ${
                selectedOption === null
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-lime-400 hover:bg-lime-300 text-black shadow-lime-400/20 active:scale-95'
              }`}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNextLevel}
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-purple-600/30 active:scale-95"
            >
              Next Level <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Live Academy Scoreboard */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-400" size={18} />
            <h3 className="text-sm font-black uppercase text-white">Top Academy Earners Scoreboard</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">REAL-TIME RANKINGS</span>
        </div>

        <div className="space-y-2">
          {[
            { rank: 1, name: 'VetProducer_99', xp: 2450, bucks: 195, level: 'L5 Maestro' },
            { rank: 2, name: 'MissBamaSlammer', xp: 2180, bucks: 170, level: 'L5 Maestro' },
            { rank: 3, name: 'CadenceKing', xp: 1800, bucks: 140, level: 'L4 Engineer' },
            { rank: 4, name: 'SubZero808', xp: 1450, bucks: 110, level: 'L3 Lyricist' },
          ].map((item) => (
            <div
              key={item.rank}
              className="bg-zinc-900/80 border border-zinc-800/80 px-4 py-3 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-black text-xs ${
                    item.rank === 1
                      ? 'bg-yellow-400 text-black'
                      : item.rank === 2
                      ? 'bg-zinc-300 text-black'
                      : item.rank === 3
                      ? 'bg-amber-600 text-white'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {item.rank}
                </span>
                <div>
                  <h4 className="text-xs font-black text-white">{item.name}</h4>
                  <span className="text-[10px] text-purple-400 font-bold">{item.level}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-black text-lime-400">${item.bucks} CS BUCKS</span>
                <p className="text-[10px] font-mono text-zinc-500">{item.xp} XP</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

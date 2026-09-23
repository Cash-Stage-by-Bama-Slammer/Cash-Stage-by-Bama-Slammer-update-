import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, Sparkles, Trophy, Users, ShieldAlert, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../lib/audioEngine';
import { db } from '../lib/firebase';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface DiceRollerProps {
  userId?: string;
  currentBalance?: number;
  onBalanceUpdated?: (newBalance: number) => void;
  onPairMatched?: (genre: string, partnerType: string) => void;
}

const GENRES = ["Hip hop", "Rap", "Gospel", "Alternative", "R&B", "Blues", "Country"];
const ROLES = ["Lead Lyricist", "Pocket Rhymer", "Chorus Specialist", "Beatmaker", "Battle Specialist"];

export const DiceRoller = ({
  userId,
  currentBalance = 0,
  onBalanceUpdated,
  onPairMatched,
}: DiceRollerProps) => {
  const [rolling, setRolling] = useState(false);
  const [die1, setDie1] = useState(3);
  const [die2, setDie2] = useState(4);
  const [outcomeMessage, setOutcomeMessage] = useState<string | null>(null);
  const [isSnakeEyes, setIsSnakeEyes] = useState(false);
  const [freeRollsRemaining, setFreeRollsRemaining] = useState(1);
  const [pairedMatch, setPairedMatch] = useState<{ genre: string; role: string; partnerName: string } | null>(null);

  const rollTheDice = async () => {
    if (rolling) return;
    setRolling(true);
    setOutcomeMessage(null);
    setIsSnakeEyes(false);

    audioEngine.playDiceRoll();

    // Animate rolling effect over 1.2 seconds
    const interval = setInterval(() => {
      setDie1(Math.floor(Math.random() * 6) + 1);
      setDie2(Math.floor(Math.random() * 6) + 1);
    }, 80);

    setTimeout(async () => {
      clearInterval(interval);

      // Deterministic outcome calculation
      const val1 = Math.floor(Math.random() * 6) + 1;
      const val2 = Math.floor(Math.random() * 6) + 1;
      setDie1(val1);
      setDie2(val2);

      const snakeEyes = val1 === 1 && val2 === 1;
      setIsSnakeEyes(snakeEyes);

      // Random genre & partner match
      const matchedGenre = GENRES[Math.floor(Math.random() * GENRES.length)];
      const matchedRole = ROLES[Math.floor(Math.random() * ROLES.length)];
      const randomPartnerName = `@Vet_Lyricist_${Math.floor(Math.random() * 900 + 100)}`;
      setPairedMatch({ genre: matchedGenre, role: matchedRole, partnerName: randomPartnerName });
      if (onPairMatched) {
        onPairMatched(matchedGenre, matchedRole);
      }

      if (snakeEyes) {
        // SNAKE EYES WILD CARD HIT!
        audioEngine.playJackpotChime();
        confetti({
          particleCount: 250,
          spread: 120,
          origin: { y: 0.6 },
          colors: ['#39ff14', '#bd00ff', '#ffd700', '#ffffff'],
        });

        const rewardAmount = 50.0;
        setOutcomeMessage(
          `🎲 SNAKE EYES! WILD CARD! You won $50.00 FREE Cash Stage Bucks + 1 Extra Free Roll!`
        );
        setFreeRollsRemaining((prev) => prev + 1);

        if (userId) {
          try {
            // Update Firestore user balance
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
              bamaBucks: increment(rewardAmount),
            });

            // Write to /ledger audit trail
            await addDoc(collection(db, 'ledger'), {
              userId,
              amount: rewardAmount,
              type: 'dice_snake_eyes',
              description: 'Snake Eyes Wild Card (1+1) $50.00 CS Bucks Bonus',
              timestamp: serverTimestamp(),
            });

            if (onBalanceUpdated) {
              onBalanceUpdated(currentBalance + rewardAmount);
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
          }
        }
      } else {
        const sum = val1 + val2;
        const smallBonus = sum >= 10 ? 5.0 : 1.0;
        setOutcomeMessage(
          `Rolled ${val1} & ${val2} (Total ${sum}). Paired for ${matchedGenre} with ${matchedRole}!`
        );

        if (userId && smallBonus > 0) {
          try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
              bamaBucks: increment(smallBonus),
            });
            await addDoc(collection(db, 'ledger'), {
              userId,
              amount: smallBonus,
              type: 'dice_roll',
              description: `Daily Dice Roll Bonus (${val1}+${val2})`,
              timestamp: serverTimestamp(),
            });
            if (onBalanceUpdated) {
              onBalanceUpdated(currentBalance + smallBonus);
            }
          } catch (e) {
            console.warn('Ledger update note:', e);
          }
        }
        setFreeRollsRemaining((prev) => Math.max(0, prev - 1));
      }

      setRolling(false);
    }, 1200);
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background Neon Glow */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Dices size={22} className="text-yellow-400 animate-bounce" />
            <h3 className="text-lg font-black italic tracking-tighter uppercase text-white">
              Roll The Dice
            </h3>
          </div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Snake Eyes = $50.00 Wild Card Jackpot + Extra Free Roll
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl text-right">
          <span className="text-[9px] font-black uppercase text-zinc-400 block">Free Rolls</span>
          <span className="text-sm font-mono font-black text-lime-400">{freeRollsRemaining}</span>
        </div>
      </div>

      {/* Dice Visual Display */}
      <div className="flex justify-center items-center gap-6 py-4">
        {[die1, die2].map((dieVal, idx) => (
          <motion.div
            key={idx}
            animate={
              rolling
                ? {
                    rotateX: [0, 360, 720],
                    rotateY: [0, 360, 720],
                    scale: [1, 1.15, 1],
                  }
                : { rotateX: 0, rotateY: 0, scale: 1 }
            }
            transition={{ duration: 0.3, repeat: rolling ? Infinity : 0 }}
            className={`w-20 h-20 rounded-2xl flex items-center justify-center font-mono font-black text-3xl shadow-2xl border-2 transition-all ${
              isSnakeEyes
                ? 'bg-gradient-to-br from-yellow-400 via-lime-400 to-yellow-500 text-black border-white shadow-[0_0_25px_rgba(255,215,0,0.6)]'
                : 'bg-zinc-900 border-zinc-700 text-white shadow-black'
            }`}
          >
            {/* Render dots or number */}
            <div className="flex flex-col items-center">
              <span>{dieVal}</span>
              <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-sans">
                {dieVal === 1 ? 'DOT' : 'DOTS'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Outcome Banner */}
      <AnimatePresence>
        {outcomeMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border text-center font-black uppercase text-xs tracking-tight ${
              isSnakeEyes
                ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300'
            }`}
          >
            {isSnakeEyes && <Sparkles className="inline-block mr-1 text-yellow-400" size={16} />}
            {outcomeMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Matched Collab / Battle Pairing Info */}
      {pairedMatch && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block">
              Random Pairing Generated
            </span>
            <p className="text-xs font-black text-white uppercase">
              {pairedMatch.genre} • <span className="text-purple-400">{pairedMatch.role}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-bold text-zinc-500">Partner Pick</span>
            <p className="text-xs font-mono font-bold text-lime-400">{pairedMatch.partnerName}</p>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={rollTheDice}
        disabled={rolling}
        className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 ${
          rolling
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-lime-400 via-yellow-400 to-lime-500 text-black shadow-lime-400/20 hover:brightness-110'
        }`}
      >
        <Dices size={20} />
        {rolling ? 'Rolling The Stage...' : 'Roll The Dice Now'}
      </button>
    </div>
  );
};

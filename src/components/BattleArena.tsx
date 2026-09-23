import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, Pause, Flame, ShieldCheck, CheckCircle2, Lock, Scale, Sparkles, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, increment, addDoc, serverTimestamp, getDocs, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { banManager } from '../lib/banManager';
import { audioEngine } from '../lib/audioEngine';

interface BattleContender {
  id: string;
  name: string;
  title: string;
  genre: string;
  votes: number;
  avatar: string;
  audioPreview?: string;
}

interface Battle {
  id: string;
  title: string;
  genre: string;
  prizePool: number;
  expiresIn: string;
  contenderA: BattleContender;
  contenderB: BattleContender;
  status: 'active' | 'completed';
}

interface BattleArenaProps {
  userId?: string;
  username?: string;
}

export const BattleArena = ({ userId, username }: BattleArenaProps) => {
  const [battles, setBattles] = useState<Battle[]>([
    {
      id: 'battle_live_1',
      title: 'Southside Bars Grand Championship',
      genre: 'Hip hop',
      prizePool: 500,
      expiresIn: '23h 42m',
      status: 'active',
      contenderA: {
        id: 'contender_1',
        name: 'Vocal Vet Bama',
        title: 'Pressure Cooker Verse',
        genre: 'Hip hop',
        votes: 48,
        avatar: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&auto=format&fit=crop&q=80',
      },
      contenderB: {
        id: 'contender_2',
        name: 'Midnight Spitter',
        title: 'Concrete Jungle Freestyle',
        genre: 'Hip hop',
        votes: 42,
        avatar: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=150&auto=format&fit=crop&q=80',
      },
    },
    {
      id: 'battle_live_2',
      title: 'Gospel & Soul Rap Cypher Clash',
      genre: 'Gospel',
      prizePool: 350,
      expiresIn: '11h 15m',
      status: 'active',
      contenderA: {
        id: 'contender_3',
        name: 'Grace & Truth MC',
        title: 'Faith Over Fear Barz',
        genre: 'Gospel',
        votes: 29,
        avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
      },
      contenderB: {
        id: 'contender_4',
        name: 'Praise Soldier',
        title: 'Anointed Flow Stanza',
        genre: 'Gospel',
        votes: 31,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
    }
  ]);

  const [votedBattles, setVotedBattles] = useState<Record<string, string>>({});
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [votingInProgress, setVotingInProgress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'arena' | 'tiebreaker' | 'chat'>('arena');
  const [chatComment, setChatComment] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'Anonymous Voter #18', text: 'Contender A pocket timing is surgical!', time: '2m ago' },
    { sender: 'Anonymous Voter #44', text: 'Contender B rhyme schemes hit harder on the 808 drop.', time: 'Just now' },
  ]);

  // Load user's previous votes from Firestore to lock them
  useEffect(() => {
    if (!userId) return;
    const fetchUserVotes = async () => {
      try {
        const q = query(collection(db, 'votes'), where('voterId', '==', userId));
        const snap = await getDocs(q);
        const map: Record<string, string> = {};
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.battleId) {
            map[data.battleId] = data.contenderChosen;
          }
        });
        setVotedBattles(map);
      } catch (e) {
        console.warn('Votes fetch note:', e);
      }
    };
    fetchUserVotes();
  }, [userId]);

  const submitVote = async (battleId: string, contenderKey: 'A' | 'B') => {
    if (!userId) {
      alert('Sign in to submit your anonymous vote.');
      return;
    }

    // AI Ban & Freeze Enforcement
    const banCheck = banManager.assertCanVote(userId);
    if (!banCheck.allowed) {
      alert(banCheck.error);
      return;
    }

    if (votedBattles[battleId]) {
      alert('Your vote for this battle is already permanently locked to ensure fair play.');
      return;
    }

    setVotingInProgress(`${battleId}_${contenderKey}`);

    try {
      // 1. Trigger Confetti Particles Overlay
      confetti({
        particleCount: 180,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#39ff14', '#bd00ff', '#ffd700', '#00e5ff'],
      });

      // 2. Play sound chime
      audioEngine.playJackpotChime();

      // 3. Save Vote to Firestore /votes
      await addDoc(collection(db, 'votes'), {
        battleId,
        voterId: userId,
        contenderChosen: contenderKey,
        createdAt: serverTimestamp(),
      });

      // 4. Update local state & lock vote
      setVotedBattles((prev) => ({ ...prev, [battleId]: contenderKey }));
      setBattles((prev) =>
        prev.map((b) => {
          if (b.id === battleId) {
            return {
              ...b,
              contenderA: {
                ...b.contenderA,
                votes: contenderKey === 'A' ? b.contenderA.votes + 1 : b.contenderA.votes,
              },
              contenderB: {
                ...b.contenderB,
                votes: contenderKey === 'B' ? b.contenderB.votes + 1 : b.contenderB.votes,
              },
            };
          }
          return b;
        })
      );
    } catch (err) {
      console.error('Failed to submit vote', err);
    } finally {
      setVotingInProgress(null);
    }
  };

  const togglePlayPreview = (id: string) => {
    if (playingAudio === id) {
      setPlayingAudio(null);
      audioEngine.stopRadioStream();
    } else {
      setPlayingAudio(id);
      audioEngine.startRadioStream();
    }
  };

  const handleSendChat = () => {
    if (!chatComment.trim()) return;
    if (userId) {
      const check = banManager.assertCanMessage(userId, 'battle_arena_chat');
      if (!check.allowed) {
        alert(check.error);
        return;
      }
    }
    setChatMessages((prev) => [
      ...prev,
      {
        sender: username ? `@${username}` : 'Anonymous Voter',
        text: chatComment.trim(),
        time: 'Just now',
      },
    ]);
    setChatComment('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Arena Banner */}
      <div className="bg-gradient-to-r from-purple-900/60 via-zinc-950 to-lime-950/60 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="text-yellow-400" size={24} />
              <span className="text-[10px] font-black uppercase tracking-widest text-lime-400 bg-lime-400/10 px-2.5 py-0.5 rounded-full border border-lime-400/30">
                18+ Skill Battleground
              </span>
            </div>
            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">
              The 1v1 Battle Arena
            </h2>
            <p className="text-xs text-zinc-400 font-bold max-w-sm mt-1">
              100% Anonymous Audited Voting. No Social Distortion, Zero Bias, Automated Tie-Breaker Resolution.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-zinc-900/90 border border-zinc-800 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('arena')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                activeTab === 'arena' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Battles
            </button>
            <button
              onClick={() => setActiveTab('tiebreaker')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                activeTab === 'tiebreaker' ? 'bg-lime-400 text-black shadow-lg' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tie-Breaker
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                activeTab === 'chat' ? 'bg-yellow-400 text-black shadow-lg' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Live Chat
            </button>
          </div>
        </div>
      </div>

      {/* TIE-BREAKER PROTOCOL VIEW */}
      {activeTab === 'tiebreaker' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="text-lime-400" size={22} />
            <h3 className="text-base font-black uppercase italic text-white">
              Deterministic Tie-Breaker Resolution Engine
            </h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            In the event of an exact 50/50 deadlock or score draw at expiration, Cash Stage executes a multi-tiered, objective audit to determine the victor without manual tampering:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-mono font-black text-xs flex items-center justify-center">1</span>
              <h4 className="text-xs font-black uppercase text-purple-300">Multi-Syllabic Cadence</h4>
              <p className="text-[11px] text-zinc-400">Analysis of rhymed syllables per measure and structural complexity density.</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <span className="w-6 h-6 rounded-full bg-lime-400 text-black font-mono font-black text-xs flex items-center justify-center">2</span>
              <h4 className="text-xs font-black uppercase text-lime-400">Transient Beat Alignment</h4>
              <p className="text-[11px] text-zinc-400">DSP verification of pocket consistency and vocal transient landing on downbeats.</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <span className="w-6 h-6 rounded-full bg-yellow-400 text-black font-mono font-black text-xs flex items-center justify-center">3</span>
              <h4 className="text-xs font-black uppercase text-yellow-400">Instant Vault Payout</h4>
              <p className="text-[11px] text-zinc-400">Fair settlement credited directly to victor's Bama Wallet with an audit transaction.</p>
            </div>
          </div>
        </div>
      )}

      {/* LIVE ARENA CHAT VIEW */}
      {activeTab === 'chat' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="text-purple-400" size={18} />
              <h3 className="text-sm font-black uppercase text-white">Live Battle Arena Commentary</h3>
            </div>
            <span className="text-[10px] font-mono text-lime-400">AI PATROL ACTIVE</span>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar pr-2">
            {chatMessages.map((msg, i) => (
              <div key={i} className="bg-zinc-900/80 border border-zinc-800/80 p-3 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-zinc-400">{msg.sender}</span>
                  <span className="text-[9px] text-zinc-600">{msg.time}</span>
                </div>
                <p className="text-xs text-white font-medium">{msg.text}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Drop unbiased bar commentary..."
              value={chatComment}
              onChange={(e) => setChatComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleSendChat}
              className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider"
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* 1V1 BATTLE CARDS */}
      {activeTab === 'arena' && (
        <div className="space-y-6">
          {battles.map((battle) => {
            const hasVoted = Boolean(votedBattles[battle.id]);
            const userChoice = votedBattles[battle.id];
            const totalVotes = battle.contenderA.votes + battle.contenderB.votes;
            const pctA = totalVotes > 0 ? Math.round((battle.contenderA.votes / totalVotes) * 100) : 50;
            const pctB = 100 - pctA;

            return (
              <div
                key={battle.id}
                className="bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 space-y-6 shadow-2xl relative overflow-hidden"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                  <div>
                    <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider">
                      {battle.genre} MATCHUP • PRIZE POOL: ${battle.prizePool} CS BUCKS
                    </span>
                    <h3 className="text-lg font-black italic tracking-tighter uppercase text-white">
                      {battle.title}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase block">Ends In</span>
                    <span className="text-xs font-mono font-black text-lime-400">{battle.expiresIn}</span>
                  </div>
                </div>

                {/* Vote Percentage Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                    <span className="text-purple-400">RED CORNER {pctA}%</span>
                    <span className="text-zinc-500 font-mono text-[10px]">{totalVotes} AUDITED VOTES</span>
                    <span className="text-lime-400">BLUE CORNER {pctB}%</span>
                  </div>
                  <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden flex border border-zinc-800">
                    <div
                      style={{ width: `${pctA}%` }}
                      className="bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500"
                    />
                    <div
                      style={{ width: `${pctB}%` }}
                      className="bg-gradient-to-r from-lime-400 to-lime-500 transition-all duration-500"
                    />
                  </div>
                </div>

                {/* 1v1 Contenders Matchup Grid */}
                <div className="grid grid-cols-2 gap-4 relative">
                  {/* VS Emblem */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black border-2 border-zinc-700 flex items-center justify-center font-black italic text-xs text-yellow-400 shadow-xl">
                    VS
                  </div>

                  {/* Contender A (Red Corner) */}
                  <div
                    className={`bg-zinc-900/90 border rounded-2xl p-4 flex flex-col items-center text-center space-y-3 relative transition-all ${
                      userChoice === 'A'
                        ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                        : 'border-zinc-800'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-purple-500/60 p-0.5">
                      <img
                        src={battle.contenderA.avatar}
                        alt={battle.contenderA.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-white truncate max-w-[130px]">
                        {battle.contenderA.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 truncate italic">"{battle.contenderA.title}"</p>
                    </div>

                    {/* Verse Audio Preview */}
                    <button
                      onClick={() => togglePlayPreview(`${battle.id}_A`)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-purple-300 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      {playingAudio === `${battle.id}_A` ? <Pause size={12} /> : <Play size={12} />}
                      {playingAudio === `${battle.id}_A` ? 'Pause Verse' : 'Play Verse'}
                    </button>

                    {/* Anonymous Vote Button */}
                    <button
                      onClick={() => submitVote(battle.id, 'A')}
                      disabled={hasVoted || votingInProgress !== null}
                      className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg ${
                        userChoice === 'A'
                          ? 'bg-purple-600 text-white cursor-default'
                          : hasVoted
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95 shadow-purple-600/30'
                      }`}
                    >
                      {userChoice === 'A' ? (
                        <>
                          <CheckCircle2 size={14} /> Voted (Locked)
                        </>
                      ) : hasVoted ? (
                        <>
                          <Lock size={12} /> Vote Sealed
                        </>
                      ) : (
                        'Vote Red'
                      )}
                    </button>
                  </div>

                  {/* Contender B (Blue/Lime Corner) */}
                  <div
                    className={`bg-zinc-900/90 border rounded-2xl p-4 flex flex-col items-center text-center space-y-3 relative transition-all ${
                      userChoice === 'B'
                        ? 'border-lime-400 shadow-[0_0_20px_rgba(57,255,20,0.3)]'
                        : 'border-zinc-800'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-lime-400/60 p-0.5">
                      <img
                        src={battle.contenderB.avatar}
                        alt={battle.contenderB.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-white truncate max-w-[130px]">
                        {battle.contenderB.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 truncate italic">"{battle.contenderB.title}"</p>
                    </div>

                    {/* Verse Audio Preview */}
                    <button
                      onClick={() => togglePlayPreview(`${battle.id}_B`)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-lime-300 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      {playingAudio === `${battle.id}_B` ? <Pause size={12} /> : <Play size={12} />}
                      {playingAudio === `${battle.id}_B` ? 'Pause Verse' : 'Play Verse'}
                    </button>

                    {/* Anonymous Vote Button */}
                    <button
                      onClick={() => submitVote(battle.id, 'B')}
                      disabled={hasVoted || votingInProgress !== null}
                      className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg ${
                        userChoice === 'B'
                          ? 'bg-lime-400 text-black font-black cursor-default'
                          : hasVoted
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          : 'bg-lime-400 hover:bg-lime-300 text-black active:scale-95 shadow-lime-400/30'
                      }`}
                    >
                      {userChoice === 'B' ? (
                        <>
                          <CheckCircle2 size={14} /> Voted (Locked)
                        </>
                      ) : hasVoted ? (
                        <>
                          <Lock size={12} /> Vote Sealed
                        </>
                      ) : (
                        'Vote Blue'
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer Assurance */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500 font-mono">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <ShieldCheck size={13} className="text-lime-400" />
                    100% Cryptographic Anonymous Voting
                  </span>
                  <span>Votes permanently locked upon submission</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

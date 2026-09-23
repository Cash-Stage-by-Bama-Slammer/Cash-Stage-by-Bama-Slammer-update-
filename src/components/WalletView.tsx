import { useState, useEffect } from 'react';
import { Wallet, Coins, ArrowUpRight, ArrowDownLeft, ShieldCheck, Sparkles, Award, Trophy } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';

interface WalletViewProps {
  userId?: string;
  balance?: number;
}

interface LedgerTx {
  id: string;
  amount: number;
  type: string;
  description: string;
  timestamp: string;
}

export const WalletView = ({ userId, balance = 50.0 }: WalletViewProps) => {
  const [transactions, setTransactions] = useState<LedgerTx[]>([
    {
      id: 'tx_snake_eyes_init',
      amount: 50.0,
      type: 'dice_snake_eyes',
      description: 'Snake Eyes (1+1) $50.00 Free Cash Stage Bucks Reward',
      timestamp: 'Today',
    },
    {
      id: 'tx_welcome_grant',
      amount: 25.0,
      type: 'welcome_airdrop',
      description: 'Unsigned Vets Platform Entry Grant',
      timestamp: 'Yesterday',
    },
  ]);

  useEffect(() => {
    if (!userId) return;
    const fetchLedger = async () => {
      try {
        const q = query(
          collection(db, 'ledger'),
          where('userId', '==', userId),
          limit(20)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list: LedgerTx[] = [];
          snap.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              amount: data.amount || 0,
              type: data.type || 'reward',
              description: data.description || 'CS Bucks Transaction',
              timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toLocaleDateString() : 'Recent',
            });
          });
          setTransactions(list);
        }
      } catch (e) {
        console.warn('Ledger fetch note:', e);
      }
    };
    fetchLedger();
  }, [userId]);

  return (
    <div className="space-y-6 pb-12">
      {/* Wallet Balance Hero Card */}
      <div className="bg-gradient-to-br from-yellow-950/60 via-zinc-950 to-purple-950/60 border border-yellow-500/30 rounded-3xl p-6 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="text-yellow-400" size={22} />
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
              Bama Silver Vault & Ledger
            </span>
          </div>
          <span className="text-[10px] font-mono font-black text-lime-400 bg-lime-400/10 px-2.5 py-0.5 rounded-full border border-lime-400/30">
            CLOSED-LOOP LEDGER
          </span>
        </div>

        <div>
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">
            Total Cash Stage Bucks
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-mono font-black tracking-tighter text-white">
              ${balance.toFixed(2)}
            </span>
            <span className="text-xs font-mono font-bold text-yellow-400">CS BUCKS</span>
          </div>
        </div>

        {/* Keepsake Coins Showcase */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 flex items-center justify-center text-black font-black text-xs shadow-lg shadow-yellow-500/20">
              <Coins size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-white">5-Year Term Keepsake Coin</h4>
              <p className="text-[10px] text-zinc-400">Awarded to Grand Champion artists & top battle rankers</p>
            </div>
          </div>
          <span className="text-xs font-mono font-black text-yellow-400">1 EARNED</span>
        </div>
      </div>

      {/* Weekly League Prize Pool Structure */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-400" size={18} />
            <h3 className="text-sm font-black uppercase text-white">Weekly League Top 10 Prize Structure</h3>
          </div>
          <span className="text-[10px] font-mono text-lime-400">$1,000+ TOTAL PURSE</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-zinc-900 border border-yellow-500/40 p-3 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-yellow-400 block">1ST PLACE</span>
            <p className="text-base font-mono font-black text-white">$500</p>
            <span className="text-[9px] text-zinc-400 font-mono">Grand Champ</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-zinc-300 block">2ND PLACE</span>
            <p className="text-base font-mono font-black text-white">$300</p>
            <span className="text-[9px] text-zinc-400 font-mono">Runner Up</span>
          </div>
          <div className="bg-zinc-900 border border-amber-600/40 p-3 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-amber-500 block">3RD PLACE</span>
            <p className="text-base font-mono font-black text-white">$100</p>
            <span className="text-[9px] text-zinc-400 font-mono">Bronze Spot</span>
          </div>
        </div>

        <p className="text-[11px] text-zinc-400 text-center font-mono">
          Positions 4th through 10th win exclusive Unsigned Vets Promo Bundles & 10 Radio Live Sends.
        </p>
      </div>

      {/* Server-Authoritative Transaction Ledger */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-black uppercase text-white">CS Bucks Transaction Ledger</h3>
          <span className="text-[10px] font-mono text-zinc-500">AUDIT TRAIL</span>
        </div>

        <div className="space-y-2.5">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400">
                  <ArrowDownLeft size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-white truncate max-w-[200px]">
                    {tx.description}
                  </h4>
                  <span className="text-[9px] font-mono text-zinc-500">{tx.timestamp}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-black text-lime-400">
                  +${tx.amount.toFixed(2)}
                </span>
                <p className="text-[9px] font-mono text-zinc-500 uppercase">Settled</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

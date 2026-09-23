import { useState, useEffect } from 'react';
import { ShieldAlert, Snowflake, UserX, UserCheck, AlertTriangle, Activity, Lock, RefreshCw } from 'lucide-react';
import { banManager } from '../lib/banManager';

interface AiModerationCenterProps {
  currentUserId?: string;
}

export const AiModerationCenter = ({ currentUserId }: AiModerationCenterProps) => {
  const [targetUser, setTargetUser] = useState('');
  const [banDuration, setBanDuration] = useState<'24h' | '1m' | 'perm'>('24h');
  const [banReason, setBanReason] = useState('Suspected AI Vocal cloning / scamming');
  const [logs, setLogs] = useState<Array<{ time: string; action: string; badge: string }>>([
    { time: '10:14 AM', action: 'AI Sentinel scanned Battle Track #104 — 100% Human vocal confirmed', badge: 'PASS' },
    { time: '09:48 AM', action: 'AI Patrol blocked spam attempt in Public Stage', badge: 'ALERT' },
    { time: '08:30 AM', action: 'Deterministic tie-breaker executed for Live Battle #88', badge: 'AUDIT' },
  ]);

  const [isPublicFrozen, setIsPublicFrozen] = useState(false);
  const [, setTrigger] = useState(0);

  useEffect(() => {
    setIsPublicFrozen(banManager.isRoomFrozen('public_stage'));
    return banManager.subscribe(() => {
      setIsPublicFrozen(banManager.isRoomFrozen('public_stage'));
      setTrigger((prev) => prev + 1);
    });
  }, []);

  const handleToggleFreeze = () => {
    const nextState = !isPublicFrozen;
    banManager.setRoomFrozen('public_stage', nextState);
    setLogs((prev) => [
      {
        time: new Date().toLocaleTimeString(),
        action: nextState ? 'Public Stage Room FROZEN by AI Patrol' : 'Public Stage Room UNFROZEN',
        badge: nextState ? 'FROZEN' : 'ACTIVE',
      },
      ...prev,
    ]);
  };

  const handleApplyBan = () => {
    if (!targetUser.trim()) return;
    banManager.banUser(targetUser.trim(), banDuration, banReason);
    setLogs((prev) => [
      {
        time: new Date().toLocaleTimeString(),
        action: `User [${targetUser.trim()}] banned (${banDuration}): ${banReason}`,
        badge: 'BANNED',
      },
      ...prev,
    ]);
    alert(`Account [${targetUser.trim()}] restricted. Messaging, voting, recording, and playing blocked.`);
    setTargetUser('');
  };

  const handleUnban = () => {
    if (!targetUser.trim()) return;
    banManager.unbanUser(targetUser.trim());
    setLogs((prev) => [
      {
        time: new Date().toLocaleTimeString(),
        action: `User [${targetUser.trim()}] unbanned and restored.`,
        badge: 'RESTORED',
      },
      ...prev,
    ]);
    alert(`Account [${targetUser.trim()}] privileges restored.`);
    setTargetUser('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Sentinel Header */}
      <div className="bg-gradient-to-r from-red-950/50 via-zinc-950 to-purple-950/50 border border-zinc-800 rounded-3xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-red-400" size={24} />
            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">
              24/7 AI Patrol & Moderation
            </h2>
          </div>
          <span className="text-[10px] font-mono font-black text-lime-400 bg-lime-400/10 px-2.5 py-0.5 rounded-full border border-lime-400/30">
            SENTINEL ENGINE ACTIVE
          </span>
        </div>
        <p className="text-xs text-zinc-400 font-bold max-w-md">
          Zero-tolerance anti-mayhem controls. Immediate room freeze, AI synthetic voice fraud detection, and multi-tier account ban enforcement.
        </p>
      </div>

      {/* Instant Emergency Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Room Freeze Action */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Snowflake className={isPublicFrozen ? 'text-cyan-400 animate-spin' : 'text-zinc-500'} size={20} />
            <h3 className="text-sm font-black uppercase text-white">Live Room Freeze Control</h3>
          </div>
          <p className="text-xs text-zinc-400">
            Pause public chatter, comments, and battle commentary instantly if mayhem or spam occurs.
          </p>
          <button
            onClick={handleToggleFreeze}
            className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 ${
              isPublicFrozen
                ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700'
            }`}
          >
            <Snowflake size={16} />
            {isPublicFrozen ? 'Room Frozen (Click to Unfreeze)' : 'Freeze Public Stage'}
          </button>
        </div>

        {/* Enforced Restrictions Overview */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-2.5">
          <div className="flex items-center gap-2">
            <Lock className="text-red-400" size={18} />
            <h3 className="text-sm font-black uppercase text-white">Enforced Ban Restrictions</h3>
          </div>
          <ul className="text-[11px] text-zinc-400 space-y-1.5 font-medium">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Messaging Blocked (Public chat, private lounge & crew DMs)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Voting Blocked (1v1 battle arena submission locked out)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Audio & Playing Blocked (Radio stream & preview playback muted)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Recording Blocked (DAW recording & stem rendering restricted)
            </li>
          </ul>
        </div>
      </div>

      {/* Ban Enforcement Console */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-black uppercase text-white">Account Ban & Suspension Desk</h3>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Username or User UID to restrict"
            value={targetUser}
            onChange={(e) => setTargetUser(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setBanDuration('24h')}
              className={`py-2 rounded-xl text-xs font-black uppercase border transition-all ${
                banDuration === '24h'
                  ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              24-Hour Mute
            </button>
            <button
              onClick={() => setBanDuration('1m')}
              className={`py-2 rounded-xl text-xs font-black uppercase border transition-all ${
                banDuration === '1m'
                  ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              1-Month Ban
            </button>
            <button
              onClick={() => setBanDuration('perm')}
              className={`py-2 rounded-xl text-xs font-black uppercase border transition-all ${
                banDuration === 'perm'
                  ? 'bg-red-500/20 border-red-500 text-red-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              Permanent Ban
            </button>
          </div>

          <input
            type="text"
            placeholder="Reason for violation"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleApplyBan}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/30 active:scale-95 flex items-center justify-center gap-1.5"
          >
            <UserX size={15} /> Apply Ban & Restrict
          </button>
          <button
            onClick={handleUnban}
            className="py-3 px-5 rounded-xl bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <UserCheck size={15} /> Restore
          </button>
        </div>
      </div>

      {/* Sentinel Live Activity Log */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="text-lime-400" size={18} />
            <h3 className="text-sm font-black uppercase text-white">AI Patrol Audit Trail</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">LIVE FEED</span>
        </div>

        <div className="space-y-2">
          {logs.map((item, idx) => (
            <div
              key={idx}
              className="bg-zinc-900/80 border border-zinc-800 px-4 py-3 rounded-2xl flex items-center justify-between text-xs"
            >
              <div>
                <span className="text-zinc-300 font-medium">{item.action}</span>
                <span className="text-[10px] font-mono text-zinc-500 block">{item.time}</span>
              </div>
              <span
                className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase ${
                  item.badge === 'PASS'
                    ? 'bg-lime-400/20 text-lime-400'
                    : item.badge === 'FROZEN' || item.badge === 'BANNED'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}
              >
                {item.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

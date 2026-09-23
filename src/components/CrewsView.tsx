import { useState, useEffect } from 'react';
import { Users, Shield, Crown, Plus, UserCheck, Flame, Check } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface Crew {
  id: string;
  name: string;
  description?: string;
  owners: string[];
  admins: string[];
  members: string[];
  avatarUrl?: string;
}

interface CrewsViewProps {
  userId?: string;
  username?: string;
}

export const CrewsView = ({ userId, username }: CrewsViewProps) => {
  const [crews, setCrews] = useState<Crew[]>([
    {
      id: 'crew_1',
      name: 'Bama Slammers Syndicate',
      description: 'Official flagship crew. Heavy 808s, street anthems, and lyrical mastery.',
      owners: ['creator_1'],
      admins: ['admin_1', 'admin_2'],
      members: Array(22).fill('member_uid'),
      avatarUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'crew_2',
      name: 'Gospel Verse Vanguard',
      description: 'Spirit-filled lyricists dropping faith, salvation, and hard-hitting cyphers.',
      owners: ['creator_2'],
      admins: ['admin_3'],
      members: Array(14).fill('member_uid'),
      avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'crew_3',
      name: 'Southern Country Trap Vets',
      description: 'Twang acoustic riffs layered over 808 sub bass and fast multi-syllabic pocket flows.',
      owners: ['creator_3'],
      admins: ['admin_4', 'admin_5'],
      members: Array(28).fill('member_uid'),
      avatarUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=150&auto=format&fit=crop&q=80',
    },
  ]);

  const [joinedCrews, setJoinedCrews] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCrewName, setNewCrewName] = useState('');
  const [newCrewDesc, setNewCrewDesc] = useState('');

  const handleJoinCrew = async (crewId: string) => {
    if (!userId) {
      alert('Please sign in to join a syndicate.');
      return;
    }
    const crew = crews.find((c) => c.id === crewId);
    if (crew && crew.members.length >= 30) {
      alert('This crew has reached the maximum capacity limit of 30 members.');
      return;
    }

    setJoinedCrews((prev) => ({ ...prev, [crewId]: true }));
    setCrews((prev) =>
      prev.map((c) => (c.id === crewId ? { ...c, members: [...c.members, userId] } : c))
    );
    alert('Successfully joined syndicate! You are now eligible for 30-member crew cyphers.');
  };

  const handleCreateCrew = async () => {
    if (!newCrewName.trim() || !userId) return;

    const newCrew: Crew = {
      id: `crew_${Date.now()}`,
      name: newCrewName.trim(),
      description: newCrewDesc.trim() || 'Unsigned Vets Syndicate',
      owners: [userId],
      admins: [],
      members: [userId],
    };

    setCrews((prev) => [newCrew, ...prev]);
    setJoinedCrews((prev) => ({ ...prev, [newCrew.id]: true }));
    setShowCreateModal(false);
    setNewCrewName('');
    setNewCrewDesc('');

    try {
      await addDoc(collection(db, 'crews'), {
        ...newCrew,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Crew creation note:', e);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950/50 via-zinc-950 to-lime-950/40 border border-zinc-800 rounded-3xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-lime-400" size={24} />
            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">
              Crew Syndicates
            </h2>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-lime-400 hover:bg-lime-300 text-black px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 shadow-lg shadow-lime-400/20 transition-all active:scale-95"
          >
            <Plus size={16} /> Create Crew
          </button>
        </div>
        <p className="text-xs text-zinc-400 font-bold max-w-sm">
          Up to 30 members per crew. Up to 4 admins, 1-2 owner creators (non-transferable). Collab on 2-crew cyphers.
        </p>
      </div>

      {/* Crew Cards */}
      <div className="space-y-4">
        {crews.map((crew) => {
          const isMember = joinedCrews[crew.id] || (userId && crew.members.includes(userId));
          const isFull = crew.members.length >= 30;

          return (
            <div
              key={crew.id}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center overflow-hidden">
                    {crew.avatarUrl ? (
                      <img src={crew.avatarUrl} alt={crew.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={20} className="text-purple-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black italic tracking-tight uppercase text-white">
                      {crew.name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{crew.description}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-zinc-400 block">
                    {crew.members.length} / 30 MEMBERS
                  </span>
                  <span className="text-[9px] font-mono text-purple-400">
                    {crew.admins.length} Admins • {crew.owners.length} Owner
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 font-mono">
                  {isFull ? 'CAPACITY REACHED' : `${30 - crew.members.length} SLOTS OPEN`}
                </span>

                <button
                  onClick={() => handleJoinCrew(crew.id)}
                  disabled={isMember || isFull}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    isMember
                      ? 'bg-zinc-800 text-lime-400 border border-lime-500/30 cursor-default'
                      : isFull
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 active:scale-95'
                  }`}
                >
                  {isMember ? <Check size={14} /> : null}
                  {isMember ? 'Joined' : isFull ? 'Crew Full' : 'Join Syndicate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Crew Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-base font-black uppercase italic text-white">Create New Syndicate</h3>
            <p className="text-xs text-zinc-400">
              Form your 30-member crew. You become the Non-Transferable Owner Creator.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Crew Name"
                value={newCrewName}
                onChange={(e) => setNewCrewName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
              />
              <textarea
                placeholder="Crew Mission / Bio"
                value={newCrewDesc}
                onChange={(e) => setNewCrewDesc(e.target.value)}
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-black uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCrew}
                className="flex-1 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-black text-xs font-black uppercase shadow-lg shadow-lime-400/20"
              >
                Launch Crew
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

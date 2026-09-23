/**
 * Cash Stage: Unsigned Vets Platform
 * Designed by Bama Slammer
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Disc,
  Mic,
  Trophy,
  LayoutGrid,
  User as UserIcon,
  Search,
  LogIn,
  LogOut,
  Radio,
  Dices,
  GraduationCap,
  Users,
  MessagesSquare,
  ShieldAlert,
  Wallet,
  Play,
  Pause,
  Flame,
  Heart,
  Share2,
  DollarSign,
  AlertTriangle,
  MoreVertical,
  Plus,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  ShieldCheck,
  Award,
  Headphones,
  Camera,
  Edit3,
  MapPin,
  Clock,
  Palette,
  PhoneCall,
  Music,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Firebase Imports
import { auth, db } from './lib/firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  limit,
  orderBy,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';

// Integrated Specialized Components
import { DiceRoller } from './components/DiceRoller';
import { BattleArena } from './components/BattleArena';
import { StudioDaw } from './components/StudioDaw';
import { LearningAcademy } from './components/LearningAcademy';
import { LiveRadio } from './components/LiveRadio';
import { CrewsView } from './components/CrewsView';
import { ChatRoomsView } from './components/ChatRoomsView';
import { WalletView } from './components/WalletView';
import { AiModerationCenter } from './components/AiModerationCenter';
import { MediaUploadModal } from './components/MediaUploadModal';
import { Listen4ListenSession } from './components/Listen4ListenSession';
import { ProfileCustomizerModal } from './components/ProfileCustomizerModal';
import { LiveCallsModal } from './components/LiveCallsModal';
import { BeatMarketplaceModal } from './components/BeatMarketplaceModal';
import { banManager } from './lib/banManager';
import { audioEngine } from './lib/audioEngine';

// Types
export type Tier = 'Free' | 'Platinum' | 'VIP' | 'Top Shelf';

export interface UserStats {
  solo: number;
  collab: number;
  battle: number;
  crew: number;
  feature: number;
  video: number;
}

export interface UserProfile {
  uid: string;
  username: string;
  avatarUrl: string | null;
  bannerTheme?: string;
  profileTheme?: 'neon_green' | 'purple' | 'gold';
  bio?: string;
  location?: string;
  primaryGenre?: string;
  tier: Tier;
  bamaBucks?: number;
  xp?: number;
  learningLevel?: number;
  verified18Plus?: boolean;
  ratings: UserStats;
}

export interface Track {
  id: string;
  authorId: string;
  authorName?: string;
  title: string;
  audioUrl: string;
  videoUrl?: string | null;
  type: 'solo' | 'collab' | 'battle' | 'cypher';
  genre?: string;
  plays: number;
  views: number;
  likes: number;
  createdAt: any;
  promoType: string;
}

const GENRES = ['ALL', 'HIP HOP', 'RAP', 'GOSPEL', 'ALTERNATIVE', 'R&B', 'BLUES', 'COUNTRY'];
const CATEGORIES = ['ALL', 'SOLO', 'COLLAB', 'CYPHER', 'BATTLE'];

export default function App() {
  const [view, setView] = useState<'feed' | 'studio' | 'arena' | 'hub' | 'profile'>('feed');
  const [hubTab, setHubTab] = useState<'l4l' | 'dice' | 'learning' | 'crews' | 'chat' | 'radio' | 'wallet' | 'moderation' | 'shop' | 'calls' | 'beats'>('l4l');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showProfileCustomizer, setShowProfileCustomizer] = useState(false);
  const [showLiveCallsModal, setShowLiveCallsModal] = useState(false);
  const [showBeatMarketplaceModal, setShowBeatMarketplaceModal] = useState(false);

  // Sync Auth & Profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              username: currentUser.displayName || 'Unsigned Vet',
              avatarUrl: currentUser.photoURL || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&auto=format&fit=crop&q=80',
              bannerTheme: 'gold',
              profileTheme: 'neon_green',
              bio: '100% human unsigned lyricist. Drama-free zone. 18+ verified.',
              location: 'Birmingham, AL',
              primaryGenre: 'Rap',
              tier: 'Free',
              bamaBucks: 50.0,
              xp: 100,
              learningLevel: 1,
              verified18Plus: true,
              ratings: { solo: 4.8, collab: 4.9, battle: 4.7, crew: 5.0, feature: 4.8, video: 4.9 },
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          } else {
            setProfile(userDoc.data() as UserProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleUpdateProfileTheme = async (newTheme: 'neon_green' | 'purple' | 'gold') => {
    if (!profile || !user) return;
    try {
      const updated: UserProfile = { ...profile, profileTheme: newTheme };
      setProfile(updated);
      await updateDoc(doc(db, 'users', user.uid), { profileTheme: newTheme });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const logout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-lime-400 rounded-full animate-spin" />
        <span className="font-mono text-xs font-black uppercase tracking-widest text-zinc-500">
          Loading Cash Stage...
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute w-96 h-96 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-zinc-950 border-2 border-yellow-400/80 flex items-center justify-center mb-6 shadow-[0_0_35px_rgba(255,215,0,0.3)]">
            <Zap className="text-yellow-400" size={42} fill="currentColor" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter mb-2 bg-gradient-to-r from-purple-400 via-yellow-400 to-lime-400 bg-clip-text text-transparent uppercase">
            CASH STAGE
          </h1>
          <p className="text-zinc-400 mb-2 max-w-xs text-xs font-black uppercase tracking-widest">
            Unsigned Vets • Drama-Free Zone
          </p>
          <p className="text-zinc-500 mb-8 max-w-xs text-[11px] leading-relaxed">
            Listen 4 Listen sessions (Limit 300, reset 7 PM EST), 59 FX Studio, $50 Snake Eyes dice, 1v1 anonymous battles, and real CS Bucks.
          </p>

          <button
            onClick={login}
            className="bg-gradient-to-r from-lime-400 via-yellow-400 to-lime-500 text-black px-10 py-4 rounded-full font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:brightness-110 transition-all active:scale-95 shadow-2xl shadow-lime-400/20"
          >
            <LogIn size={18} /> Enter Unsigned Stage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-black/85 backdrop-blur-xl border-b border-zinc-800 flex items-center justify-between px-5 z-50">
        <div className="flex items-center gap-2.5">
          <div className="bg-purple-600 p-1.5 rounded-lg rotate-3 shadow-[0_0_15px_rgba(147,51,234,0.4)]">
            <Zap size={18} fill="white" stroke="none" />
          </div>
          <div>
            <h1 className="font-display font-black text-xl tracking-tighter italic scale-y-105 origin-bottom bg-gradient-to-r from-purple-400 via-yellow-400 to-lime-400 bg-clip-text text-transparent">
              CASH STAGE
            </h1>
            <span className="text-[8px] font-mono text-zinc-500 font-bold block -mt-1 uppercase tracking-widest">
              UNSIGNED VETS
            </span>
          </div>
        </div>

        {/* Top Header Quick Actions & Balance */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLiveCallsModal(true)}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 hover:border-lime-400 text-lime-400 flex items-center justify-center transition-colors shadow-sm"
            title="Live Audio Calls & Battle Invites"
          >
            <PhoneCall size={14} />
          </button>

          <button
            onClick={() => setShowBeatMarketplaceModal(true)}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 hover:border-yellow-400 text-yellow-400 flex items-center justify-center transition-colors shadow-sm"
            title="Beat Marketplace (1000+ Free Beats)"
          >
            <Music size={14} />
          </button>

          <button
            onClick={() => {
              setView('hub');
              setHubTab('wallet');
            }}
            className="bg-zinc-900 border border-zinc-800 hover:border-yellow-400/50 px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors"
          >
            <Wallet size={12} className="text-yellow-400" />
            <span className="text-xs font-mono font-black text-lime-400">
              ${(profile?.bamaBucks ?? 50.0).toFixed(2)}
            </span>
          </button>

          <button
            onClick={() => setView('profile')}
            className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden ring-2 ring-purple-600/30"
          >
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="User" className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={16} className="text-zinc-500" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="pt-18 pb-24 max-w-md mx-auto min-h-screen px-3">
        <AnimatePresence mode="wait">
          {view === 'feed' && (
            <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FeedView
                profile={profile}
                onNavigateToStudio={() => setView('studio')}
                onNavigateToArena={() => setView('arena')}
                onNavigateToDice={() => {
                  setView('hub');
                  setHubTab('dice');
                }}
                onNavigateToRadio={() => {
                  setView('hub');
                  setHubTab('radio');
                }}
                onNavigateToL4L={() => {
                  setView('hub');
                  setHubTab('l4l');
                }}
                onOpenLiveCalls={() => setShowLiveCallsModal(true)}
                onOpenBeats={() => setShowBeatMarketplaceModal(true)}
              />
            </motion.div>
          )}

          {view === 'studio' && (
            <motion.div key="studio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <StudioDaw
                userId={user?.uid}
                username={profile?.username}
                onTrackDropped={() => setView('feed')}
              />
            </motion.div>
          )}

          {view === 'arena' && (
            <motion.div key="arena" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BattleArena
                userId={user?.uid}
                username={profile?.username}
              />
            </motion.div>
          )}

          {view === 'hub' && (
            <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HubView
                profile={profile}
                setProfile={setProfile}
                userId={user?.uid}
                activeTab={hubTab}
                setActiveTab={setHubTab}
                onOpenLiveCalls={() => setShowLiveCallsModal(true)}
                onOpenBeats={() => setShowBeatMarketplaceModal(true)}
              />
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ProfileView
                profile={profile}
                logout={logout}
                onOpenUpload={() => setShowMediaModal(true)}
                onOpenCustomize={() => setShowProfileCustomizer(true)}
                onThemeChange={handleUpdateProfileTheme}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 flex items-center justify-around px-2 z-50">
        <NavItem
          label="Feed"
          icon={Disc}
          active={view === 'feed'}
          onClick={() => setView('feed')}
        />
        <NavItem
          label="Hub"
          icon={LayoutGrid}
          active={view === 'hub'}
          onClick={() => setView('hub')}
        />
        <div className="relative -top-5">
          <button
            onClick={() => setView('studio')}
            className="w-16 h-16 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-800 rounded-full shadow-[0_0_25px_rgba(147,51,234,0.5)] flex items-center justify-center text-white ring-8 ring-black transition-transform active:scale-95 group"
          >
            <Mic size={30} className="group-hover:scale-110 transition-transform text-white" />
          </button>
        </div>
        <NavItem
          label="Arena"
          icon={Trophy}
          active={view === 'arena'}
          onClick={() => setView('arena')}
        />
        <NavItem
          label="Profile"
          icon={UserIcon}
          active={view === 'profile'}
          onClick={() => setView('profile')}
        />
      </nav>

      {/* Media Upload Modal */}
      {showMediaModal && (
        <MediaUploadModal
          userId={user?.uid}
          username={profile?.username}
          onClose={() => setShowMediaModal(false)}
        />
      )}

      {/* Profile & Photo Customizer Modal */}
      {showProfileCustomizer && (
        <ProfileCustomizerModal
          profile={profile}
          onClose={() => setShowProfileCustomizer(false)}
          onProfileUpdated={(updated) => setProfile(updated)}
        />
      )}

      {/* Live Audio Calls & Battle Invites Modal */}
      {showLiveCallsModal && (
        <LiveCallsModal
          userId={user?.uid}
          username={profile?.username}
          onClose={() => setShowLiveCallsModal(false)}
          onStartBattleCall={(artist) => {
            setShowLiveCallsModal(false);
            setView('arena');
          }}
        />
      )}

      {/* Beat Marketplace Modal */}
      {showBeatMarketplaceModal && (
        <BeatMarketplaceModal
          onClose={() => setShowBeatMarketplaceModal(false)}
          onSelectBeatForStudio={(title, bpm) => {
            setShowBeatMarketplaceModal(false);
            setView('studio');
          }}
        />
      )}
    </div>
  );
}

const NavItem = ({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: any;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 transition-all ${
      active ? 'text-lime-400 scale-105 font-bold' : 'text-zinc-600 hover:text-zinc-400'
    }`}
  >
    <Icon size={22} className={active ? 'drop-shadow-[0_0_8px_rgba(57,255,20,0.5)]' : ''} />
    <span className="text-[10px] uppercase font-bold tracking-tighter">{label}</span>
  </button>
);

// --- Feed View ---
const FeedView = ({
  profile,
  onNavigateToStudio,
  onNavigateToArena,
  onNavigateToDice,
  onNavigateToRadio,
  onNavigateToL4L,
  onOpenLiveCalls,
  onOpenBeats,
}: {
  profile: UserProfile | null;
  onNavigateToStudio: () => void;
  onNavigateToArena: () => void;
  onNavigateToDice: () => void;
  onNavigateToRadio: () => void;
  onNavigateToL4L: () => void;
  onOpenLiveCalls: () => void;
  onOpenBeats: () => void;
}) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [judgingTrack, setJudgingTrack] = useState<Track | null>(null);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  // Seed sample tracks if collection is empty
  useEffect(() => {
    let q = query(collection(db, 'tracks'), orderBy('createdAt', 'desc'), limit(25));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setTracks(
            snapshot.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            })) as Track[]
          );
        } else {
          // Default Unsigned Vets showcase tracks
          setTracks([
            {
              id: 't_demo_1',
              title: 'Southside Concrete Anthem',
              authorId: 'user_bama_1',
              authorName: 'Miss Bama Slammer',
              audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
              type: 'solo',
              genre: 'Rap',
              plays: 142,
              views: 290,
              likes: 45,
              promoType: 'Top Shelf VIP',
              createdAt: new Date().toISOString(),
            },
            {
              id: 't_demo_2',
              title: 'Anointed 808 Cypher',
              authorId: 'user_gospel_1',
              authorName: 'Grace & Truth MC',
              audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
              type: 'collab',
              genre: 'Gospel',
              plays: 98,
              views: 180,
              likes: 38,
              promoType: 'Live Feed Bundle',
              createdAt: new Date().toISOString(),
            },
            {
              id: 't_demo_3',
              title: 'Tennessee Mud Drift Barz',
              authorId: 'user_country_1',
              authorName: 'Country Trap Vet',
              audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
              type: 'cypher',
              genre: 'Country',
              plays: 67,
              views: 130,
              likes: 24,
              promoType: 'none',
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'tracks')
    );
    return unsubscribe;
  }, []);

  const filteredTracks = tracks.filter((t) => {
    const genreMatch = selectedGenre === 'ALL' || t.genre?.toUpperCase() === selectedGenre;
    const catMatch = selectedCategory === 'ALL' || t.type?.toUpperCase() === selectedCategory;
    return genreMatch && catMatch;
  });

  const togglePlay = (trackId: string) => {
    if (playingTrackId === trackId) {
      setPlayingTrackId(null);
      audioEngine.stopRadioStream();
    } else {
      setPlayingTrackId(trackId);
      audioEngine.startRadioStream();
    }
  };

  const handleLike = (trackId: string) => {
    setLikeCounts((prev) => ({
      ...prev,
      [trackId]: (prev[trackId] ?? 0) + 1,
    }));
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#39ff14', '#ffd700'],
    });
  };

  const handleTip = (track: Track) => {
    alert(`Tipped $1.00 CS Bucks to @${track.authorName || 'Unsigned Artist'}!`);
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Official Google Play Store Banner */}
      <div className="bg-gradient-to-r from-purple-950/90 via-zinc-950 to-yellow-950/80 border border-yellow-500/40 p-4 rounded-3xl space-y-2 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-black text-xs shadow-md shadow-yellow-400/20">
              CS
            </div>
            <div>
              <span className="text-[9px] font-mono text-yellow-400 uppercase font-black tracking-widest block">
                Official Google Play Release
              </span>
              <h3 className="text-xs font-black uppercase text-white">
                Cash Stage by Miss Bama Slammer
              </h3>
            </div>
          </div>

          <a
            href="https://play.google.com/store/apps/details?id=com.cash.missalabamaslammer.cashstage"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-lime-400 text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
          >
            Play Store <ExternalLink size={10} />
          </a>
        </div>
        <p className="text-[11px] text-zinc-400 leading-snug">
          Where Bars Turn Into Bankrolls • 100% Human Music Battle Arena • Anti-AI Deepfake Sentinel Active.
        </p>

        {/* Quick Launchers: Live Calls & Beat Marketplace */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onOpenLiveCalls}
            className="py-2 px-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-lime-400/40 text-lime-400 text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <PhoneCall size={12} /> Live Calls
          </button>
          <button
            onClick={onOpenBeats}
            className="py-2 px-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-yellow-400/40 text-yellow-400 text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Music size={12} /> Beats Store (1000+)
          </button>
        </div>
      </div>

      {/* Listen 4 Listen Spotlight Card */}
      <button
        onClick={onNavigateToL4L}
        className="w-full bg-gradient-to-r from-purple-950/80 via-zinc-950 to-lime-950/70 border border-purple-500/40 hover:border-lime-400 p-4 rounded-3xl flex items-center justify-between text-left transition-all shadow-xl group"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-lime-400 group-hover:scale-105 transition-transform">
            <Headphones size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-full border border-lime-400/30">
                LIMIT 300 • RESET 7 PM EST
              </span>
            </div>
            <h3 className="text-sm font-black uppercase text-white mt-0.5">
              Listen 4 Listen Sessions
            </h3>
            <p className="text-[10px] text-zinc-400">Multiple-choice sessions • Anonymous voting tallied at 7 PM EST</p>
          </div>
        </div>
        <span className="text-xs font-mono font-black text-lime-400 shrink-0">JOIN</span>
      </button>

      {/* Quick Action Ticker */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onNavigateToDice}
          className="bg-gradient-to-r from-yellow-500/20 to-lime-500/20 border border-yellow-500/40 p-3 rounded-2xl flex items-center justify-between text-left hover:border-yellow-400 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Dices size={18} className="text-yellow-400" />
            <div>
              <span className="text-[9px] font-black uppercase text-yellow-400 block">Roll Dice</span>
              <span className="text-[11px] font-black text-white">$50 Snake Eyes</span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-lime-400">PLAY</span>
        </button>

        <button
          onClick={onNavigateToRadio}
          className="bg-gradient-to-r from-purple-500/20 to-red-500/20 border border-purple-500/40 p-3 rounded-2xl flex items-center justify-between text-left hover:border-purple-400 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Radio size={18} className="text-purple-400" />
            <div>
              <span className="text-[9px] font-black uppercase text-purple-400 block">Vets Radio FM</span>
              <span className="text-[11px] font-black text-white">24/7 Unsigned</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-red-400 animate-pulse">LIVE</span>
        </button>
      </div>

      {/* Category Pills (Solo, Collab, Cypher, Battle) */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all border ${
              selectedCategory === cat
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {cat === 'ALL' ? 'ALL DROPS' : `${cat} DROPS`}
          </button>
        ))}
      </div>

      {/* Genre Filter Scroll */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g)}
            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition-all border ${
              selectedGenre === g
                ? 'bg-lime-400 text-black border-lime-400 shadow-md shadow-lime-400/20'
                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Live Feed Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse shadow-[0_0_8px_#39ff14]" />
          <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
            Unsigned Vets Live Feed
          </h2>
        </div>
        <span className="text-[9px] text-zinc-500 font-mono">DRAMA FREE ZONE</span>
      </div>

      {/* Track Cards */}
      <div className="space-y-4">
        {filteredTracks.map((track) => {
          const isPlaying = playingTrackId === track.id;
          const currentLikes = track.likes + (likeCounts[track.id] || 0);

          return (
            <div
              key={track.id}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl relative overflow-hidden"
            >
              <div className="flex items-center gap-2 flex-wrap">
                {/* Promo Badge */}
                {track.promoType && track.promoType !== 'none' && (
                  <div className="bg-gradient-to-r from-purple-600 to-lime-500 text-black px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-block">
                    {track.promoType}
                  </div>
                )}
                {/* Golden / Silver Seal Human Verification Badge */}
                <span className="bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 px-2.5 py-0.5 rounded-full text-[8px] font-mono font-black uppercase tracking-wider flex items-center gap-1">
                  👑 Golden Seal • 100% Human Audio Verified
                </span>
              </div>

              {/* Title & Author */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-black italic uppercase tracking-tight text-white truncate max-w-[220px]">
                    {track.title}
                  </h3>
                  <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                    <span className="text-purple-400 font-bold">@{track.authorName || 'UnsignedVet'}</span>
                    {' • '}
                    <span className="text-zinc-500">{track.genre || 'Hip hop'}</span>
                    {' • '}
                    <span className="text-lime-400 font-bold uppercase">{track.type} DROP</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-lime-400 font-bold block">
                    {track.views} VIEWS
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">
                    {track.plays} PLAYS
                  </span>
                </div>
              </div>

              {/* Player Waveform Simulation */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                <button
                  onClick={() => togglePlay(track.id)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 shrink-0 ${
                    isPlaying
                      ? 'bg-red-500 text-white shadow-red-500/30'
                      : 'bg-lime-400 hover:bg-lime-300 text-black shadow-lime-400/20'
                  }`}
                >
                  {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                </button>

                {/* Animated Audio Bars */}
                <div className="flex-1 flex items-center gap-1 h-8">
                  {[40, 75, 50, 90, 60, 30, 85, 45, 95, 70, 40, 80, 55, 65, 35].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: isPlaying ? `${Math.max(15, Math.round(h * Math.random()))}%` : '20%' }}
                      className={`flex-1 rounded-full transition-all duration-150 ${
                        isPlaying ? 'bg-lime-400' : 'bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Card Action Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleLike(track.id)}
                    className="flex items-center gap-1 text-xs font-mono font-bold text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <Heart size={15} className="text-red-500" /> {currentLikes}
                  </button>

                  <button
                    onClick={() => setJudgingTrack(track)}
                    className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 transition-all"
                  >
                    <Flame size={12} className="text-orange-400" /> Anonymous Rate
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTip(track)}
                    className="bg-zinc-900 border border-zinc-800 hover:border-lime-400 text-zinc-400 hover:text-lime-400 p-2 rounded-xl transition-colors"
                    title="Tip CS Bucks"
                  >
                    <DollarSign size={14} />
                  </button>
                  <button
                    onClick={() => alert(`Share link for "${track.title}" copied to clipboard!`)}
                    className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 p-2 rounded-xl transition-colors"
                  >
                    <Share2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3-Question Anonymous Judging Modal */}
      {judgingTrack && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[9px] font-mono text-purple-400 uppercase font-bold block">
                  100% Anonymous Evaluation
                </span>
                <h3 className="text-sm font-black uppercase text-white">
                  Judge "{judgingTrack.title}"
                </h3>
              </div>
              <button
                onClick={() => setJudgingTrack(null)}
                className="text-xs text-zinc-500 hover:text-white"
              >
                Close
              </button>
            </div>

            {/* 3 Mandated Questions */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                  1. How many people are on the track you just heard?
                </label>
                <select className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white">
                  <option>1 (Solo Artist)</option>
                  <option>2 (Collab Duo)</option>
                  <option>3+ (Cypher / Crew)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                  2. Feature worthy track?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2 rounded-xl bg-purple-600 text-white font-black text-xs uppercase">
                    Yes, Heat 🔥
                  </button>
                  <button className="py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 font-black text-xs uppercase">
                    Needs Polish
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                  3. Favorite line they said?
                </label>
                <input
                  type="text"
                  placeholder="Drop the hardest bar..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500"
                />
              </div>
            </div>

            <button
              onClick={() => {
                confetti({
                  particleCount: 120,
                  spread: 80,
                  origin: { y: 0.6 },
                  colors: ['#39ff14', '#bd00ff', '#ffd700'],
                });
                alert('Anonymous rating submitted! Artist received your unbiased feedback.');
                setJudgingTrack(null);
              }}
              className="w-full py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-lime-400/20 active:scale-95"
            >
              Submit Anonymous Rating
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Hub View ---
const HubView = ({
  profile,
  setProfile,
  userId,
  activeTab,
  setActiveTab,
  onOpenLiveCalls,
  onOpenBeats,
}: {
  profile: UserProfile | null;
  setProfile: (p: UserProfile) => void;
  userId?: string;
  activeTab: 'l4l' | 'dice' | 'learning' | 'crews' | 'chat' | 'radio' | 'wallet' | 'moderation' | 'shop' | 'calls' | 'beats';
  setActiveTab: (t: any) => void;
  onOpenLiveCalls: () => void;
  onOpenBeats: () => void;
}) => {
  const tabs = [
    { id: 'l4l', label: 'Listen 4 Listen', icon: Headphones },
    { id: 'calls', label: 'Live Calls', icon: PhoneCall },
    { id: 'beats', label: 'Beats (1000+)', icon: Music },
    { id: 'dice', label: 'Roll Dice', icon: Dices },
    { id: 'learning', label: 'Academy', icon: GraduationCap },
    { id: 'crews', label: 'Crews', icon: Users },
    { id: 'chat', label: 'Chat', icon: MessagesSquare },
    { id: 'radio', label: 'Radio FM', icon: Radio },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'moderation', label: 'AI Patrol', icon: ShieldAlert },
    { id: 'shop', label: 'Shop', icon: Zap },
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Subnav Tabs */}
      <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto no-scrollbar gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-lime-400 text-black shadow-md shadow-lime-400/20'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Selected Hub Subview wrapped in motion.div */}
      <AnimatePresence mode="wait">
        {activeTab === 'l4l' && (
          <motion.div key="l4l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Listen4ListenSession userId={userId} username={profile?.username} />
          </motion.div>
        )}

        {activeTab === 'calls' && (
          <motion.div key="calls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-lime-400 text-black shadow-md shadow-lime-400/20">
                    <PhoneCall size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase italic text-white">Live Calling & Battle Invites</h3>
                    <p className="text-[10px] text-zinc-400 font-mono">1v1 Direct Audio Huddle & Cypher Challenges</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-400">
                Place direct real-time calls to verified unsigned artists, initiate spontaneous audio cyphers, or challenge contenders to an arena match.
              </p>
              <button
                onClick={onOpenLiveCalls}
                className="w-full py-3.5 rounded-2xl bg-lime-400 hover:bg-lime-300 text-black text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-lime-400/20"
              >
                Open Live Calling Huddle
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'beats' && (
          <motion.div key="beats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-yellow-400 text-black shadow-md shadow-yellow-400/20">
                    <Music size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase italic text-white">Beat Marketplace (1,000+ Beats)</h3>
                    <p className="text-[10px] text-zinc-400 font-mono">Royalty-Free & Licensed Trap, Boom Bap, Gospel & Country</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-400">
                Browse, stream, and license high-energy instrumentals or upload your own beats to earn CS Bucks directly from other artists.
              </p>
              <button
                onClick={onOpenBeats}
                className="w-full py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-yellow-400/20"
              >
                Launch Beat Store
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'dice' && (
          <motion.div key="dice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DiceRoller
              userId={userId}
              currentBalance={profile?.bamaBucks ?? 50.0}
              onBalanceUpdated={(newBal) => {
                if (profile) setProfile({ ...profile, bamaBucks: newBal });
              }}
            />
          </motion.div>
        )}

        {activeTab === 'learning' && (
          <motion.div key="learning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LearningAcademy
              userId={userId}
              onRewardEarned={(bucks, xp) => {
                if (profile) {
                  setProfile({
                    ...profile,
                    bamaBucks: (profile.bamaBucks || 50) + bucks,
                    xp: (profile.xp || 100) + xp,
                  });
                }
              }}
            />
          </motion.div>
        )}

        {activeTab === 'crews' && (
          <motion.div key="crews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CrewsView userId={userId} username={profile?.username} />
          </motion.div>
        )}

        {activeTab === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ChatRoomsView userId={userId} username={profile?.username} />
          </motion.div>
        )}

        {activeTab === 'radio' && (
          <motion.div key="radio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LiveRadio />
          </motion.div>
        )}

        {activeTab === 'wallet' && (
          <motion.div key="wallet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WalletView userId={userId} balance={profile?.bamaBucks ?? 50.0} />
          </motion.div>
        )}

        {activeTab === 'moderation' && (
          <motion.div key="moderation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AiModerationCenter currentUserId={userId} />
          </motion.div>
        )}

        {activeTab === 'shop' && (
          <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ShopView profile={profile} setProfile={setProfile} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Shop View (Memberships & Promos) ---
const ShopView = ({
  profile,
  setProfile,
}: {
  profile: UserProfile | null;
  setProfile: (p: UserProfile) => void;
}) => {
  const handleUpgradeTier = async (newTier: Tier) => {
    if (!profile) return;
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, { tier: newTier });
      setProfile({ ...profile, tier: newTier });
      confetti({
        particleCount: 180,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#39ff14', '#ffd700'],
      });
      alert(`Upgraded to ${newTier} Membership!`);
    } catch (e) {
      console.warn('Tier upgrade note:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-950/40 via-zinc-950 to-purple-950/40 border border-zinc-800 rounded-3xl p-6 space-y-3">
        <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">
          Cash Stage Market
        </h2>
        <p className="text-xs text-zinc-400 font-bold max-w-sm">
          Promote your drops on the live feed, buy radio rotation packages, or unlock VIP memberships.
        </p>
      </div>

      {/* Promos */}
      <div className="space-y-3">
        <div className="bg-zinc-950 border border-purple-500/40 rounded-3xl p-5 space-y-3 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-mono font-black text-yellow-400">$6.99 LIVE FEED BUNDLE</span>
              <h4 className="text-base font-black uppercase text-white italic">2 Plays On Live Feed</h4>
            </div>
            <span className="text-[10px] font-mono text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-md">
              LOOP ~3H
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Every drop gets played with timestamp & date stamped. Loops back around in approx 3 hours.
          </p>
          <button
            onClick={() => alert('Purchased $6.99 Live Feed Bundle! Your track timestamp is queued.')}
            className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/30 active:scale-95"
          >
            Order $6.99 Promo
          </button>
        </div>

        <div className="bg-zinc-950 border border-lime-500/40 rounded-3xl p-5 space-y-3 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-mono font-black text-lime-400">$9.99 SQUAD PROMO</span>
              <h4 className="text-base font-black uppercase text-white italic">3 Songs + 2 Plays Each</h4>
            </div>
            <span className="text-[10px] font-mono text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-md">
              50 VIEWS GUARANTEED
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            3 songs, 2 plays each, guaranteed 50 views and priority judging in the unsigned queue.
          </p>
          <button
            onClick={() => alert('Purchased $9.99 Squad Promo! 50 guaranteed views enabled.')}
            className="w-full py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-lime-400/20 active:scale-95"
          >
            Order $9.99 Promo
          </button>
        </div>
      </div>

      {/* Monthly Memberships */}
      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase text-white">Monthly Memberships</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              tier: 'Top Shelf' as Tier,
              price: '$22.99 / mo',
              perk: 'Get 7 drops a day free + Gold Profile border + VIP Radio',
              border: 'border-yellow-400',
              badgeColor: 'text-yellow-400',
            },
            {
              tier: 'VIP' as Tier,
              price: '$17.99 / mo',
              perk: 'Priority judging + 4 free drops daily + Verified badge',
              border: 'border-purple-500',
              badgeColor: 'text-purple-400',
            },
            {
              tier: 'Platinum' as Tier,
              price: '$14.99 / mo',
              perk: 'Platinum tier styling + 2 free drops daily',
              border: 'border-zinc-500',
              badgeColor: 'text-zinc-300',
            },
          ].map((m) => (
            <div
              key={m.tier}
              className={`bg-zinc-950 border ${m.border} rounded-3xl p-5 space-y-3 shadow-xl`}
            >
              <div className="flex justify-between items-center">
                <h4 className={`text-sm font-black uppercase italic ${m.badgeColor}`}>{m.tier}</h4>
                <span className="text-xs font-mono font-black text-white">{m.price}</span>
              </div>
              <p className="text-xs text-zinc-400">{m.perk}</p>
              <button
                onClick={() => handleUpgradeTier(m.tier)}
                className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider ${
                  profile?.tier === m.tier
                    ? 'bg-zinc-800 text-lime-400 cursor-default'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700'
                }`}
              >
                {profile?.tier === m.tier ? 'Current Plan' : `Upgrade to ${m.tier}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Profile View ---
const ProfileView = ({
  profile,
  logout,
  onOpenUpload,
  onOpenCustomize,
  onThemeChange,
}: {
  profile: UserProfile | null;
  logout: () => void;
  onOpenUpload: () => void;
  onOpenCustomize: () => void;
  onThemeChange: (theme: 'neon_green' | 'purple' | 'gold') => void;
}) => {
  const currentTheme = profile?.profileTheme || 'neon_green';

  const themeStyles: Record<'neon_green' | 'purple' | 'gold', {
    name: string;
    badgeLabel: string;
    badgeClass: string;
    borderClass: string;
    ringClass: string;
    textClass: string;
    cardShadow: string;
    actionButton: string;
    uploadButton: string;
    ratingAccent: string;
  }> = {
    neon_green: {
      name: 'Neon Green',
      badgeLabel: 'Neon Green Theme Active',
      badgeClass: 'bg-lime-400/10 text-lime-400 border-lime-400/40',
      borderClass: 'border-lime-400/60',
      ringClass: 'ring-lime-400',
      textClass: 'text-lime-400',
      cardShadow: 'shadow-[0_0_30px_rgba(57,255,20,0.15)]',
      actionButton: 'border-lime-400 text-lime-400 hover:bg-lime-400/10',
      uploadButton: 'bg-lime-400 hover:bg-lime-300 text-black shadow-lg shadow-lime-400/20',
      ratingAccent: 'text-lime-400',
    },
    purple: {
      name: 'Electric Purple',
      badgeLabel: 'Electric Purple Theme Active',
      badgeClass: 'bg-purple-900/30 text-purple-300 border-purple-500/40',
      borderClass: 'border-purple-500/60',
      ringClass: 'ring-purple-500',
      textClass: 'text-purple-400',
      cardShadow: 'shadow-[0_0_30px_rgba(168,85,247,0.15)]',
      actionButton: 'border-purple-500 text-purple-400 hover:bg-purple-500/10',
      uploadButton: 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30',
      ratingAccent: 'text-purple-400',
    },
    gold: {
      name: 'Burnished Gold',
      badgeLabel: 'Burnished Gold Theme Active',
      badgeClass: 'bg-yellow-400/10 text-yellow-300 border-yellow-400/40',
      borderClass: 'border-yellow-400/60',
      ringClass: 'ring-yellow-400',
      textClass: 'text-yellow-400',
      cardShadow: 'shadow-[0_0_30px_rgba(255,215,0,0.15)]',
      actionButton: 'border-yellow-400 text-yellow-400 hover:bg-yellow-400/10',
      uploadButton: 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-400/20',
      ratingAccent: 'text-yellow-400',
    },
  };

  const activeThemeStyle = themeStyles[currentTheme];

  const bannerGradients: Record<string, string> = {
    gold: 'bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-800',
    neon: 'bg-gradient-to-r from-lime-600 via-emerald-500 to-zinc-900',
    purple: 'bg-gradient-to-r from-purple-700 via-indigo-600 to-zinc-950',
    obsidian: 'bg-gradient-to-r from-zinc-900 via-zinc-800 to-black',
  };

  const bannerStyle = bannerGradients[profile?.bannerTheme || 'gold'] || bannerGradients.gold;

  return (
    <div className="space-y-6 pb-12">
      {/* Profile Card with Banner */}
      <div className={`bg-zinc-950 border-2 ${activeThemeStyle.borderClass} ${activeThemeStyle.cardShadow} rounded-3xl overflow-hidden shadow-2xl relative transition-all duration-300`}>
        {/* Customizable Cover Banner */}
        <div className={`h-28 w-full ${bannerStyle} relative flex items-end justify-between p-3`}>
          {/* Active Theme Badge on Cover */}
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-black uppercase tracking-wider backdrop-blur-md border bg-black/60 ${activeThemeStyle.badgeClass}`}>
            ● {activeThemeStyle.name} Scheme
          </span>

          <button
            onClick={onOpenCustomize}
            className="bg-black/70 hover:bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase text-white flex items-center gap-1.5 border border-white/20 transition-all shadow-lg active:scale-95"
          >
            <Camera size={12} className={activeThemeStyle.textClass} /> Customize Photo & Theme
          </button>
        </div>

        {/* Profile Details Container */}
        <div className="p-6 pt-0 text-center space-y-4">
          {/* Avatar with Camera Badge */}
          <div className="relative -top-12 -mb-10 inline-block">
            <div className={`w-24 h-24 rounded-full p-1 shadow-2xl relative bg-zinc-900 ring-4 ${activeThemeStyle.ringClass} transition-all duration-300`}>
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={40} className="text-zinc-600" />
                )}
              </div>
              {/* Quick Photo Edit Badge */}
              <button
                onClick={onOpenCustomize}
                className={`absolute bottom-0 right-0 w-7 h-7 rounded-full text-black flex items-center justify-center shadow-lg border-2 border-zinc-950 hover:scale-110 transition-transform ${activeThemeStyle.uploadButton}`}
                title="Change Photo"
              >
                <Camera size={13} />
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-xl font-black italic uppercase text-white">
                {profile?.username || 'Unsigned Artist'}
              </h2>
              <ShieldCheck size={18} className={activeThemeStyle.textClass} />
            </div>

            <p className="text-[10px] font-mono text-zinc-400 flex items-center justify-center gap-1.5 mt-0.5">
              <MapPin size={11} className={activeThemeStyle.textClass} /> {profile?.location || 'Birmingham, AL'} •{' '}
              <span className={`font-bold ${activeThemeStyle.textClass}`}>{profile?.primaryGenre || 'Rap'}</span>
            </p>

            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block mt-1">
              {profile?.tier || 'Free'} Member • 18+ Verified Authentic
            </span>

            {/* Bio */}
            {profile?.bio && (
              <p className="text-xs text-zinc-300 italic max-w-xs mx-auto mt-2 font-sans">
                "{profile.bio}"
              </p>
            )}
          </div>

          {/* Quick UI Color Scheme Toggle on Profile */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Palette size={12} className={activeThemeStyle.textClass} /> Profile Color Scheme:
              </span>
              <span className={`text-[9px] font-mono font-bold uppercase ${activeThemeStyle.textClass}`}>
                {activeThemeStyle.name}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'neon_green' as const, label: '🟢 Neon Green', border: 'border-lime-400', activeBg: 'bg-lime-400/20 text-lime-400 border-lime-400' },
                { id: 'purple' as const, label: '🟣 Purple', border: 'border-purple-500', activeBg: 'bg-purple-900/40 text-purple-300 border-purple-500' },
                { id: 'gold' as const, label: '🟡 Gold', border: 'border-yellow-400', activeBg: 'bg-yellow-400/20 text-yellow-300 border-yellow-400' },
              ].map((theme) => {
                const isSelected = currentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => onThemeChange(theme.id)}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-mono font-black uppercase transition-all border ${
                      isSelected
                        ? `${theme.activeBg} shadow-md`
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white'
                    }`}
                  >
                    {theme.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customize Profile Button */}
          <div className="pt-1">
            <button
              onClick={onOpenCustomize}
              className={`w-full py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border ${activeThemeStyle.actionButton} text-xs font-black uppercase flex items-center justify-center gap-2 transition-all shadow-md active:scale-95`}
            >
              <Edit3 size={14} /> Open Full Theme & Photo Studio
            </button>
          </div>

          {/* 6 Core Ratings Matrix */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80">
            <div className="bg-zinc-900/80 p-2.5 rounded-2xl">
              <span className="text-[9px] font-black uppercase text-zinc-500 block">Solo Rating</span>
              <span className={`text-sm font-mono font-black ${activeThemeStyle.ratingAccent}`}>
                {profile?.ratings.solo ?? 4.8}
              </span>
            </div>
            <div className="bg-zinc-900/80 p-2.5 rounded-2xl">
              <span className="text-[9px] font-black uppercase text-zinc-500 block">Collab Rating</span>
              <span className="text-sm font-mono font-black text-purple-400">
                {profile?.ratings.collab ?? 4.9}
              </span>
            </div>
            <div className="bg-zinc-900/80 p-2.5 rounded-2xl">
              <span className="text-[9px] font-black uppercase text-zinc-500 block">Battle Rating</span>
              <span className="text-sm font-mono font-black text-yellow-400">
                {profile?.ratings.battle ?? 4.7}
              </span>
            </div>
            <div className="bg-zinc-900/80 p-2.5 rounded-2xl">
              <span className="text-[9px] font-black uppercase text-zinc-500 block">Crew Rating</span>
              <span className="text-sm font-mono font-black text-white">
                {profile?.ratings.crew ?? 5.0}
              </span>
            </div>
            <div className="bg-zinc-900/80 p-2.5 rounded-2xl">
              <span className="text-[9px] font-black uppercase text-zinc-500 block">Feature Rating</span>
              <span className={`text-sm font-mono font-black ${activeThemeStyle.ratingAccent}`}>
                {profile?.ratings.feature ?? 4.8}
              </span>
            </div>
            <div className="bg-zinc-900/80 p-2.5 rounded-2xl">
              <span className="text-[9px] font-black uppercase text-zinc-500 block">Video Rating</span>
              <span className="text-sm font-mono font-black text-purple-400">
                {profile?.ratings.video ?? 4.9}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Media Vault & Upload Action */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase text-white">Creator Media Vault</h3>
            <p className="text-[10px] text-zinc-500 font-mono">Upload tracks, music videos & profile pics</p>
          </div>
          <button
            onClick={onOpenUpload}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all active:scale-95 ${activeThemeStyle.uploadButton}`}
          >
            <Plus size={16} /> Upload Media
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-square bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-2 text-center"
            >
              <ImageIcon size={20} className="text-zinc-600 mb-1" />
              <span className="text-[9px] font-mono text-zinc-400 uppercase">Drop #{i}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cash Stage Official Store & Anti-AI Human Certification */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-lime-400 text-black font-black flex items-center justify-center text-xs shadow-md">
              CS
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-white">Cash Stage Official Store App</h4>
              <p className="text-[10px] text-zinc-400 font-mono">com.cash.missalabamaslammer.cashstage</p>
            </div>
          </div>
          <a
            href="https://play.google.com/store/apps/details?id=com.cash.missalabamaslammer.cashstage"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-xl bg-lime-400 text-black text-[10px] font-black uppercase flex items-center gap-1 hover:bg-lime-300 transition-all shadow-md shadow-lime-400/20"
          >
            Google Play <ExternalLink size={10} />
          </a>
        </div>

        <div className="bg-zinc-900 border border-zinc-800/80 p-3 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-lime-400" />
            <div>
              <span className="text-[10px] font-black uppercase text-white block">Anti-AI Deepfake Shield</span>
              <span className="text-[9px] font-mono text-zinc-400">Spectral Entropy: 99.4% Authentic Human Voice</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[8px] font-mono font-black uppercase tracking-wider bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
            👑 Golden Seal
          </span>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-red-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
      >
        <LogOut size={16} /> Log Out Account
      </button>
    </div>
  );
};

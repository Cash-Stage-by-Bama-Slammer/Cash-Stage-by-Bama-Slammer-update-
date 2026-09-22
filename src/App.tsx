/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Mic, 
  Trophy, 
  Users, 
  Zap, 
  User as UserIcon, 
  Search, 
  Play, 
  MoreVertical,
  Dice5,
  ShieldCheck,
  Disc,
  Flame,
  Volume2,
  LogIn,
  LogOut,
  Camera,
  Radio,
  Image as ImageIcon,
  AudioLines,
  Upload,
  Settings2,
  Video,
  Music,
  MessagesSquare,
  Gift,
  LayoutGrid
} from 'lucide-react';

// Firebase Imports
import { auth, db } from './lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  limit, 
  orderBy,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';

import { useAudioRecorder } from './hooks/useAudioRecorder';
import confetti from 'canvas-confetti';

// Types
type Tier = 'Free' | 'Platinum' | 'VIP' | 'Top Shelf';

interface UserStats {
  solo: number;
  collab: number;
  battle: number;
  crew: number;
  feature: number;
  video: number;
}

interface UserProfile {
  uid: string;
  username: string;
  avatarUrl: string | null;
  tier: Tier;
  ratings: UserStats;
}

interface Track {
  id: string;
  authorId: string;
  authorName?: string;
  title: string;
  audioUrl: string;
  type: 'solo' | 'collab' | 'battle' | 'cypher';
  genre?: string;
  plays: number;
  views: number;
  createdAt: any;
  promoType: string;
}

const GENRES = ["Hip hop", "Rap", "Gospel", "Alternative", "R&B", "Blues", "Country"];
const TRACK_TYPES = ["solo", "collab", "cypher"] as const;

// --- Components ---
const NavItem = ({ id, label, icon: Icon, active, onClick }: { id: string, label: string, icon: any, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 transition-all ${
      active ? 'text-purple-500 scale-110 font-bold' : 'text-zinc-600 hover:text-zinc-400'
    }`}
  >
    <Icon size={24} className={active ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : ''} />
    <span className="text-[10px] uppercase font-bold tracking-tighter">{label}</span>
  </button>
);

export default function App() {
  const [view, setView] = useState('feed');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Sync Profile
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              username: currentUser.displayName || 'Unnamed Rapper',
              avatarUrl: currentUser.photoURL,
              tier: 'Free',
              ratings: { solo: 0, collab: 0, battle: 0, crew: 0, feature: 0, video: 0 }
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
      console.error("Login failed", error);
    }
  };

  const logout = () => signOut(auth);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <Zap className="text-purple-500 mb-6 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]" size={64} />
      <h1 className="text-4xl font-black italic tracking-tighter mb-2 italic bg-gradient-to-r from-purple-400 via-yellow-500 to-lime-400 bg-clip-text text-transparent">CASH STAGE</h1>
      <p className="text-zinc-500 mb-12 max-w-xs font-bold leading-tight">The ultimate rap battleground. Record, compete, and rise.</p>
      <button 
        onClick={login}
        className="bg-white text-black px-12 py-4 rounded-full font-black uppercase text-sm tracking-widest flex items-center gap-3 hover:bg-zinc-200 transition-all active:scale-95 shadow-2xl shadow-purple-500/20"
      >
        <LogIn size={20} /> Sign In with Google
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-b border-zinc-800 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 p-1.5 rounded-sm rotate-3 shadow-[0_0_15px_rgba(147,51,234,0.4)]">
            <Zap size={20} fill="white" stroke="none" />
          </div>
          <h1 className="font-display font-black text-2xl tracking-tighter italic scale-y-110 origin-bottom bg-gradient-to-r from-purple-400 via-yellow-500 to-lime-400 bg-clip-text text-transparent">
            CASH STAGE
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-zinc-400 hover:text-white transition-colors">
            <Search size={22} />
          </button>
          <button 
            onClick={() => setView('profile')}
            className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden ring-2 ring-purple-600/30"
          >
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="User" className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={18} className="text-zinc-500" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-16 pb-24 max-w-md mx-auto min-h-screen relative overflow-hidden">
    <AnimatePresence mode="wait">
      {view === 'feed' && <FeedView key="feed" profile={profile} />}
      {view === 'studio' && <StudioView key="studio" profile={profile} />}
      {view === 'arena' && <ArenaView key="arena" />}
      {view === 'hub' && <HubView key="hub" profile={profile} setProfile={setProfile} />}
      {view === 'profile' && <ProfileView key="profile" profile={profile} logout={logout} />}
    </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 flex items-center justify-around px-2 z-50">
        <NavItem id="feed" label="Feed" icon={Disc} active={view === 'feed'} onClick={() => setView('feed')} />
        <NavItem id="hub" label="Hub" icon={LayoutGrid} active={view === 'hub'} onClick={() => setView('hub')} />
        <div className="relative -top-6">
          <button 
            onClick={() => setView('studio')}
            className="w-16 h-16 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-800 rounded-full shadow-[0_0_25px_rgba(147,51,234,0.5)] flex items-center justify-center text-white ring-8 ring-black transition-transform active:scale-95 group"
          >
            <Mic size={32} className="group-hover:scale-110 transition-transform text-white" />
          </button>
        </div>
        <NavItem id="arena" label="Arena" icon={Trophy} active={view === 'arena'} onClick={() => setView('arena')} />
        <NavItem id="profile" label="Stat" icon={UserIcon} active={view === 'profile'} onClick={() => setView('profile')} />
      </nav>
    </div>
  );
}

// --- Views ---

const FeedView = ({ profile, key }: { profile: UserProfile | null, key?: string }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [viewingTrack, setViewingTrack] = useState<Track | null>(null);
  const [voting, setVoting] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const genres = ['ALL', 'HIP HOP', 'RAP', 'GOSPEL', 'ALTERNATIVE', 'R&B', 'BLUES', 'COUNTRY'];

  useEffect(() => {
    let q = query(collection(db, 'tracks'), orderBy('createdAt', 'desc'), limit(20));
    if (filter !== 'ALL') {
      q = query(collection(db, 'tracks'), where('genre', '==', filter), orderBy('createdAt', 'desc'), limit(20));
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTracks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Track)));
    }, error => handleFirestoreError(error, OperationType.LIST, 'tracks'));
    return unsubscribe;
  }, [filter]);

  const handleVote = async (trackId: string, rating: number, commentary: string) => {
    if (voting) return;
    setVoting(true);
    try {
      const voteRef = collection(db, 'votes');
      await addDoc(voteRef, {
        trackId,
        voterId: auth.currentUser?.uid,
        rating,
        commentary,
        createdAt: serverTimestamp()
      });
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#a3e635', '#eab308']
      });
      
      setViewingTrack(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'votes');
    } finally {
      setVoting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="p-4 space-y-6"
    >
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {genres.map(g => (
          <button 
            key={g}
            onClick={() => setFilter(g)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap border transition-all ${
              filter === g ? 'bg-lime-400 text-black border-lime-400' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-zinc-500 tracking-widest uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse shadow-[0_0_8px_#a3e635]" />
          Vets Live Feed
        </h2>
        <span className="text-[10px] text-zinc-600 font-mono italic">UNSIGNED_VETS_FM</span>
      </div>

      <div className="space-y-4 pb-12">
        {tracks.length === 0 ? (
          <div className="py-20 text-center opacity-40">
             <Disc size={48} className="mx-auto mb-4 animate-spin-slow" />
             <p className="font-bold">No drops yet. Be the first.</p>
          </div>
        ) : tracks.map((track) => (
          <div key={track.id} className="space-y-2">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden group hover:border-purple-500/30 transition-all">
              <div 
                className="relative aspect-video bg-zinc-800 flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => setViewingTrack(track)}
              >
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                 <Play className="text-white opacity-40 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10" size={48} />
                
                {track.promoType !== 'none' && (
                  <div className="absolute top-4 left-4 bg-purple-600/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold border border-white/20 uppercase tracking-tighter z-10">
                    PROMOTED SLOT
                  </div>
                )}
                
                <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                   <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold border border-white/10 flex items-center gap-1 text-lime-400">
                     <Users size={12} /> {track.views}
                   </div>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg leading-none mb-1 group-hover:text-purple-400 transition-colors uppercase tracking-tight truncate max-w-[200px]">
                    {track.title}
                  </h3>
                  <p className="text-zinc-500 text-[10px] font-black flex items-center gap-2 uppercase tracking-tighter">
                    <span className="text-purple-400">@{track.authorId.slice(0, 8)}</span> 
                    <span className="text-yellow-500">•</span> 
                    <span>{track.genre || 'Hip hop'}</span>
                    <span className="text-yellow-500">•</span> 
                    <span className="text-white">{track.type} RATING 0.0</span>
                  </p>
                </div>
                <button className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                  <MoreVertical size={20} className="text-zinc-400" />
                </button>
              </div>
            </div>
            
            <AnimatePresence>
              {viewingTrack?.id === track.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl space-y-4 shadow-inner">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-black uppercase text-purple-400 tracking-widest">Judging Phase (Anonymous)</h4>
                      <button onClick={() => setViewingTrack(null)} className="text-zinc-500 hover:text-white">Close</button>
                    </div>
                    
                    <div className="space-y-4">
                       <JudgingForm 
                        trackId={track.id} 
                        onSubmit={(rating, comm) => handleVote(track.id, rating, comm)} 
                        loading={voting}
                       />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const JudgingForm = ({ trackId, onSubmit, loading }: { trackId: string, onSubmit: (rating: number, commentary: string) => void, loading: boolean }) => {
  const [rating, setRating] = useState(0);
  const [commentary, setCommentary] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Rating (1-5 Fire Emoji)</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button 
              key={n} 
              onClick={() => setRating(n)}
              className={`flex-1 py-3 rounded font-bold text-xl transition-all ${
                rating === n ? 'bg-orange-500 scale-105 shadow-lg' : 'bg-zinc-900 grayscale opacity-40'
              }`}
            >
              🔥
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Tell 'em what you liked</label>
        <textarea 
          className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded font-medium text-xs focus:ring-1 focus:ring-purple-600 outline-none min-h-[80px]"
          placeholder="That 2nd verse was crazy..."
          value={commentary}
          onChange={(e) => setCommentary(e.target.value)}
        />
      </div>

      <button 
        disabled={loading || rating === 0}
        onClick={() => onSubmit(rating, commentary)}
        className="w-full bg-purple-600 py-3 rounded-lg font-black uppercase text-xs tracking-widest shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:grayscale transition-all"
      >
        {loading ? 'Submitting...' : 'Submit Final Judge'}
      </button>
    </div>
  );
};

const StudioView = ({ profile }: { profile: UserProfile | null, key?: string }) => {
  const { isRecording, audioUrl, recordingTime, formatTime, startRecording, stopRecording, clearRecording } = useAudioRecorder();
  const [title, setTitle] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('Hip hop');
  const [selectedType, setSelectedType] = useState<typeof TRACK_TYPES[number]>('solo');
  
  // FX State
  const [fxEnabled, setFxEnabled] = useState(true);
  const [autotune, setAutotune] = useState(50);
  const [compression, setCompression] = useState(30);
  const [reverb, setReverb] = useState(10);
  const [showFx, setShowFx] = useState(false);

  const submitDrop = async () => {
    if (!title) return alert("Give your drop a title!");
    if (!profile) return;
    if (!audioUrl) return alert("Record something first!");

    setPublishing(true);
    try {
      await addDoc(collection(db, 'tracks'), {
        authorId: profile.uid,
        title: title,
        audioUrl: audioUrl, 
        type: selectedType,
        genre: selectedGenre,
        fxSettings: fxEnabled ? { autotune, compression, reverb } : null,
        createdAt: serverTimestamp(),
        plays: 0,
        views: 0,
        promoType: 'none'
      });
      
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.3 }
      });
      
      setTitle('');
      clearRecording();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tracks');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 flex flex-col min-h-[calc(100vh-140px)] gap-6"
    >
      <div className="flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 p-8 flex flex-col items-center justify-center relative overflow-hidden">
        {/* FX Overlay */}
        <AnimatePresence>
          {showFx && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute inset-0 bg-zinc-950/95 z-40 p-6 flex flex-col gap-6 border-l border-zinc-800"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-black italic uppercase tracking-tighter text-lime-400">Professional Studio FX</h3>
                <button onClick={() => setShowFx(false)} className="text-zinc-500 hover:text-white">CLOSE</button>
              </div>

              <div className="space-y-6 flex-1 overflow-y-auto pr-2 no-scrollbar">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-zinc-400">Master FX Engine</span>
                  <button 
                    onClick={() => setFxEnabled(!fxEnabled)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${fxEnabled ? 'bg-lime-400' : 'bg-zinc-800'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-black transition-all ${fxEnabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <FxSlider label="Auto-Tune (Pitch Core)" value={autotune} onChange={setAutotune} disabled={!fxEnabled} color="bg-purple-600" />
                <FxSlider label="Hard-Tune Strength" value={compression} onChange={setCompression} disabled={!fxEnabled} color="bg-blue-600" />
                <FxSlider label="EQ Reverb (Room Size)" value={reverb} onChange={setReverb} disabled={!fxEnabled} color="bg-yellow-500" />
                
                <div className="pt-4 grid grid-cols-2 gap-2">
                  <button className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-[8px] font-black uppercase hover:border-lime-400 transition-all">Limiter On</button>
                  <button className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-[8px] font-black uppercase hover:border-lime-400 transition-all">De-Esser</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waveform Visualization Mock */}
        <div className="flex items-end gap-1 h-32 mb-8">
           {[...Array(24)].map((_, i) => (
             <motion.div 
               key={i}
               animate={isRecording ? { height: [20, 60, 30, 80, 40] } : { height: 20 }}
               transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
               className={`w-1.5 rounded-full ${isRecording ? 'bg-gradient-to-t from-purple-600 via-yellow-500 to-lime-400' : 'bg-zinc-800'}`}
             />
           ))}
        </div>
        
        <div className="text-center">
          <p className="font-mono text-zinc-500 text-sm tracking-widest mb-2 uppercase">Input Gain Peak</p>
          <div className={`text-4xl font-black font-mono ${isRecording ? 'text-lime-400 animate-pulse' : 'text-zinc-600'}`}>
            {isRecording ? `REC ${formatTime(recordingTime)}` : audioUrl ? 'PLAYBACK READY' : 'READY'}
          </div>
        </div>

        {/* Playback Controls */}
        {audioUrl && !isRecording && (
          <div className="mt-8 flex items-center gap-4">
            <audio src={audioUrl} controls className="h-10 rounded-full" />
            <button onClick={clearRecording} className="text-red-500 text-xs font-bold uppercase underline transition-all hover:text-red-400">Discard</button>
          </div>
        )}

        {/* Studio Controls */}
        <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-4">
          <div className="bg-black/40 border border-zinc-800 p-3 rounded-lg flex flex-col items-center gap-1">
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">FX Engine</span>
            <div className={`w-3 h-3 rounded-full ${fxEnabled ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-zinc-700'}`} />
          </div>
          <div className="bg-black/40 border border-zinc-800 p-3 rounded-lg flex flex-col items-center gap-1">
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Comp / EQ</span>
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
          </div>
          <div className="bg-black/40 border border-zinc-800 p-3 rounded-lg flex flex-col items-center gap-1">
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Monitoring</span>
            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.8)]' : 'bg-zinc-700'}`} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Drop Settings */}
        <div className="grid grid-cols-3 gap-2">
           <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-[8px] font-black uppercase outline-none focus:border-purple-600 appearance-none text-center"
           >
             {TRACK_TYPES.map(t => <option key={t} value={t}>{t} ARTIST</option>)}
           </select>
           <select 
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-[8px) font-black uppercase outline-none focus:border-purple-600 appearance-none text-center"
           >
             {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
           </select>
           <button 
            onClick={() => setShowFx(true)}
            className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-2 hover:border-lime-400 transition-all"
           >
             <Settings2 size={12} /> Studio FX
           </button>
        </div>

        {isRecording ? (
          <button 
            onClick={stopRecording}
            className="w-full bg-red-600 p-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-red-500 transition-all text-sm uppercase tracking-widest shadow-lg shadow-red-900/40"
          >
            STOP RECORDING
          </button>
        ) : (
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="GIVE YOUR VET DROP A NAME..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center font-black italic uppercase tracking-tighter focus:border-purple-600 outline-none transition-colors"
            />
            <div className="grid grid-cols-2 gap-4">
               <button 
                onClick={startRecording}
                className="bg-purple-600 p-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-purple-500 transition-all shadow-lg shadow-purple-900/40 text-[10px] uppercase tracking-tighter"
              >
                <Mic size={20} /> {audioUrl ? 'RECORD AGAIN' : 'START MIC'}
              </button>
              <button 
                onClick={submitDrop}
                disabled={publishing || !audioUrl}
                className="bg-lime-400 text-black p-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-lime-300 transition-all text-[10px] uppercase tracking-tighter disabled:opacity-50 disabled:grayscale"
              >
                {publishing ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Plus size={20} />} 
                PUBLISH DROP
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const FxSlider = ({ label, value, onChange, disabled, color }: { label: string, value: number, onChange: (v: number) => void, disabled: boolean, color: string }) => (
  <div className={`space-y-2 ${disabled ? 'opacity-30' : ''}`}>
    <div className="flex justify-between items-center text-[8px] font-black uppercase text-zinc-500 tracking-widest">
      <span>{label}</span>
      <span className="text-white">{value}%</span>
    </div>
    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden relative">
      <div 
        className={`absolute h-full left-0 top-0 transition-all ${color}`}
        style={{ width: `${value}%` }}
      />
      <input 
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </div>
  </div>
);

const ArenaView = () => {
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<string | null>(null);

  const startMatchmaking = () => {
    setMatching(true);
    setMatchResult(null);
    setTimeout(() => {
      setMatching(false);
      setMatchResult("MOCK_USER_" + Math.floor(Math.random() * 1000));
    }, 3000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-4 space-y-6"
    >
      <div className="bg-gradient-to-br from-zinc-800 via-zinc-900 to-black rounded-2xl p-6 relative overflow-hidden shadow-2xl border border-zinc-700/50">
         <div className="relative z-10">
           <h3 className="text-2xl font-black underline decoration-lime-400/50 decoration-4 underline-offset-4 tracking-tighter mb-2 italic uppercase">VETS ARENA</h3>
           <p className="text-zinc-400 text-sm font-bold mb-4">Meet, collab, and battle unsigned talent. Drama-free zone.</p>
           
           {matchResult ? (
             <div className="space-y-4">
                <div className="bg-lime-400 text-black px-4 py-2 rounded font-black text-xs uppercase inline-block">MATCH FOUND: @{matchResult}</div>
                <div className="flex gap-2">
                  <button onClick={() => setMatchResult(null)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded font-bold text-xs uppercase">Decline</button>
                  <button className="bg-lime-400 text-black px-4 py-2 rounded font-black text-xs uppercase">Accept Battle</button>
                </div>
             </div>
           ) : (
             <button 
              onClick={startMatchmaking}
              disabled={matching}
              className="bg-lime-400 text-black px-6 py-2.5 rounded-full font-black text-sm uppercase flex items-center gap-3 shadow-[0_0_20px_rgba(163,230,53,0.4)] active:scale-95 transition-all disabled:opacity-50"
            >
              {matching ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Dice5 size={20} /> Roll The Dice
                </>
              )}
            </button>
           )}
         </div>
         <Flame className="absolute -right-4 -bottom-4 text-yellow-500/10 w-48 h-48 rotate-12" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-1">
          <h4 className="text-purple-400 text-[10px] font-bold uppercase tracking-widest">Active Battles</h4>
           <p className="text-3xl font-black font-mono tracking-tighter text-white">482</p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-1">
          <h4 className="text-yellow-500 text-[10px] font-bold uppercase tracking-widest">Daily Contest</h4>
           <p className="text-3xl font-black font-mono tracking-tighter text-lime-400">$2.5K</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Pairing Modes</h3>
        {[
          { label: 'Solo Artists', icon: UserIcon },
          { label: 'Live Battles', icon: Flame },
          { label: 'Video Upload Battles', icon: Video },
          { label: 'Audio Only', icon: Volume2 },
        ].map((mode) => (
          <button key={mode.label} className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between group hover:border-purple-500 transition-colors">
            <div className="flex items-center gap-3">
              <mode.icon size={20} className="text-purple-400" />
              <span className="font-bold text-zinc-100 uppercase tracking-tighter text-sm">{mode.label}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-lime-400 group-hover:text-black transition-colors">
              <Plus size={16} />
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

const HubView = ({ profile, setProfile, key }: { profile: UserProfile | null, setProfile: (p: UserProfile) => void, key?: string }) => {
  const [subView, setSubView] = useState<'crews' | 'chats' | 'beats' | 'contests' | 'shop' | 'radio'>('chats');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 space-y-6"
    >
      <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 overflow-x-auto no-scrollbar">
        {[
          { id: 'chats', icon: MessagesSquare, label: 'Chat' },
          { id: 'crews', icon: Users, label: 'Crews' },
          { id: 'beats', icon: Music, label: 'Beats' },
          { id: 'contests', icon: Trophy, label: 'Win' },
          { id: 'radio', icon: Radio, label: 'Live' },
          { id: 'shop', icon: Zap, label: 'Shop' },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setSubView(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
              subView === tab.id ? 'bg-zinc-800 text-lime-400 border border-white/5' : 'text-zinc-500'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {subView === 'chats' && <ChatListView key="chats" />}
        {subView === 'crews' && <CrewListView key="crews" profile={profile} />}
        {subView === 'beats' && <BeatsListView key="beats" />}
        {subView === 'contests' && <ContestsListView key="contests" />}
        {subView === 'radio' && <RadioView key="radio" />}
        {subView === 'shop' && <MarketView key="shop" profile={profile} setProfile={setProfile} />}
      </AnimatePresence>
    </motion.div>
  );
};

const RadioView = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 relative overflow-hidden group">
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
          <span className="text-[10px] font-black uppercase text-red-500">On Air</span>
        </div>
      </div>
      
      <div className="relative z-10">
        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-1">Vets Radio FM</h3>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Broadcasting Unsigned Heat 24/7</p>
        
        <div className="bg-black/60 rounded-xl p-4 flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-red-500">
            <AudioLines size={24} />
          </div>
          <div>
            <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">Now Playing</p>
            <h4 className="text-sm font-black uppercase">Street Anthem (Remix)</h4>
            <p className="text-[10px] font-bold text-zinc-500">@unsigned_vet_04</p>
          </div>
        </div>

        <button className="w-full bg-red-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 uppercase text-xs tracking-widest shadow-xl shadow-red-900/20 active:scale-95 transition-all">
          <Radio size={20} /> Listen Live (3.2k Vets)
        </button>
      </div>
    </div>
  </motion.div>
);

const MarketView = ({ profile, setProfile, key }: { profile: UserProfile | null, setProfile: (p: UserProfile) => void, key?: string }) => {
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const upgradeTier = async (tier: Tier) => {
    if (!profile) return;
    setUpgrading(tier);
    try {
      const userRef = doc(db, 'users', profile.uid);
      const updatedProfile = { ...profile, tier };
      await setDoc(userRef, updatedProfile);
      setProfile(updatedProfile);
      
      confetti({
        particleCount: 200,
        spread: 120,
        colors: ['#eab308', '#ffffff']
      });
      
      alert(`Upgraded to ${tier}!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="text-center mb-4">
        <h2 className="text-xl font-black tracking-tighter italic bg-gradient-to-r from-yellow-500 via-white to-yellow-500 bg-clip-text text-transparent uppercase">BOOST YOUR HUSTLE</h2>
        <p className="text-purple-400 text-[10px] font-bold tracking-widest uppercase mt-1">Real views • Real promo • Real cash</p>
      </div>

      <div className="space-y-4">
        <div className="bg-zinc-900 border-2 border-purple-600 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-black leading-tight text-white italic truncate pr-8 uppercase">
                <span className="text-yellow-500">$6.99</span><br/>LIVE FEED BUNDLE
              </h3>
              <Zap size={24} className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" fill="currentColor" />
            </div>
            <ul className="text-[10px] font-bold text-zinc-400 space-y-2 mb-6 uppercase">
              <li className="flex items-center gap-2">2 Plays on main feed</li>
              <li className="flex items-center gap-2">Looping play (3h)</li>
            </ul>
            <button className="w-full bg-purple-600 text-white font-black py-3 rounded-xl uppercase tracking-tighter text-xs hover:bg-purple-500 transition-colors">Purchase</button>
          </div>
        </div>

         <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-black leading-tight text-white tracking-tighter italic uppercase">
                <span className="text-lime-400">$9.99</span><br/>SQUAD PROMO
              </h3>
              <Users size={24} className="text-purple-500" />
            </div>
            <button className="w-full bg-zinc-800 border border-zinc-700 text-yellow-500 font-black py-3 rounded-xl uppercase tracking-tighter text-xs hover:border-yellow-500/50 transition-colors">Get Guaranteed 50 Views</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         {(['Top Shelf', 'VIP'] as Tier[]).map(t => {
           const details = t === 'Top Shelf' 
             ? { price: '22.99', desc: '7 drops a day free', color: 'text-yellow-500' }
             : { price: '17.99', desc: 'Priority judging', color: 'text-purple-400' };
           
           const isActive = profile?.tier === t;

           return (
             <button 
                key={t} 
                onClick={() => upgradeTier(t)}
                disabled={isActive || upgrading !== null}
                className={`bg-zinc-900 border-2 p-4 rounded-2xl text-center transition-all ${isActive ? 'border-lime-400 scale-95 opacity-50' : 'border-zinc-800 hover:border-zinc-500'}`}
             >
                <h4 className={`font-black text-[10px] mb-1 uppercase italic ${details.color}`}>{t}</h4>
                <p className="text-xl font-black mb-1">${details.price}</p>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight leading-tight mb-2">{details.desc}</p>
             </button>
           );
         })}
      </div>
    </motion.div>
  );
};

const ChatListView = ({ key }: { key?: string }) => {
  const chats = [
    { id: 'pub1', name: 'Main Lobby', type: 'public', members: 482, limit: 500, active: true },
    { id: 'pub2', name: 'Battle Ground', type: 'public', members: 129, limit: 500, active: true },
    { id: 'priv1', name: 'The Inner Circle', type: 'private', members: 12, limit: 60, active: false },
    { id: 'priv2', name: 'Production Unit', type: 'private', members: 58, limit: 60, active: true },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {chats.map(chat => (
        <button key={chat.id} className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between group hover:border-purple-600 transition-all">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${chat.type === 'public' ? 'bg-lime-400/10 text-lime-400' : 'bg-purple-600/10 text-purple-400'}`}>
               <MessagesSquare size={20} />
            </div>
            <div className="text-left">
              <h4 className="font-black italic uppercase tracking-tighter">{chat.name}</h4>
              <p className="text-[10px] font-bold text-zinc-500 uppercase">{chat.type} • {chat.members}/{chat.limit} USERS</p>
            </div>
          </div>
          {chat.active && <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />}
        </button>
      ))}
    </motion.div>
  );
};

const CrewListView = ({ profile, key }: { profile: UserProfile | null, key?: string }) => {
  const crews = [
    { id: 'c1', name: 'GLITCH MOB', members: 28, status: 'Active' },
    { id: 'c2', name: 'CYBER PUNKS', members: 30, status: 'Full' },
    { id: 'c3', name: 'NEON KNIGHTS', members: 14, status: 'Recruiting' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="bg-purple-600/20 border border-purple-600/30 p-4 rounded-xl text-center mb-6">
        <h4 className="text-xs font-black text-white italic uppercase tracking-widest mb-1">Crew Rules</h4>
        <p className="text-[9px] font-bold text-purple-200 uppercase leading-snug">Max 30 Members • 4 Admins • 2 Owners max • Non-Transferable Ownership</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {crews.map(crew => (
          <div key={crew.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center font-black italic text-zinc-600">
                {crew.name.slice(0, 2)}
              </div>
              <div>
                <h4 className="font-black italic uppercase tracking-tighter">{crew.name}</h4>
                <p className="text-[10px] font-bold text-zinc-500 uppercase">{crew.members}/30 MEMBERS</p>
              </div>
            </div>
            <button className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${crew.status === 'Full' ? 'bg-zinc-800 text-zinc-600' : 'bg-lime-400 text-black shadow-lg shadow-lime-400/20'}`}>
              {crew.status === 'Full' ? 'FULL' : 'JOIN'}
            </button>
          </div>
        ))}
      </div>
      
      <button className="w-full bg-zinc-950 border-2 border-dashed border-zinc-800 p-4 rounded-xl text-zinc-500 font-black uppercase text-xs hover:border-purple-600 hover:text-purple-400 transition-all">
        + Create Original Crew
      </button>
    </motion.div>
  );
};

const BeatsListView = ({ key }: { key?: string }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
    <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-4 rounded-xl text-black">
      <h4 className="text-xl font-black italic uppercase italic tracking-tighter">1000+ FREE BEATS</h4>
      <p className="text-xs font-black uppercase tracking-widest opacity-80">Royalty Free • High Quality • New Weekly</p>
    </div>
    
    <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar py-1">
      {['All', 'Trap', 'Lofi', 'Boom Bap', 'Drill', 'R&B'].map(cat => (
        <button key={cat} className="px-4 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-bold uppercase whitespace-nowrap hover:border-lime-400 transition-all">{cat}</button>
      ))}
    </div>

    <div className="space-y-2">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center justify-between group hover:border-lime-400 transition-all">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center text-zinc-600 group-hover:text-lime-400">
               <Music size={16} />
             </div>
             <div>
               <h4 className="text-xs font-black uppercase">BEAT_PACK_0{i}_NAME</h4>
               <p className="text-[9px] font-bold text-zinc-500 uppercase">PROD BY_CASH_STAGE</p>
             </div>
          </div>
          <button className="p-2 hover:bg-zinc-800 rounded-full transition-all">
            <Plus size={16} className="text-zinc-500" />
          </button>
        </div>
      ))}
    </div>
  </motion.div>
);

const ContestsListView = ({ key }: { key?: string }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div className="space-y-4">
      <div className="bg-zinc-900 border-2 border-yellow-500 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-2xl font-black italic uppercase italic tracking-tighter text-yellow-500">WEEKLY LEAGUE</h4>
            <Gift size={24} className="text-yellow-500" />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black/40 p-3 rounded-lg">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Prize Pool</p>
              <p className="text-xl font-black text-lime-400">$1,500.00</p>
            </div>
            <div className="bg-black/40 p-3 rounded-lg">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Time Left</p>
              <p className="text-xl font-black text-white">4D 12H</p>
            </div>
          </div>
          <button className="w-full bg-yellow-500 text-black font-black py-3 rounded-xl uppercase tracking-tighter text-sm flex items-center justify-center gap-2">
            Enter Contest <Plus size={18} />
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Prize Structure</h4>
        {[
          { pos: '1st PLACE', prize: '$500 CASH' },
          { pos: '2nd PLACE', prize: '$300 CASH' },
          { pos: '3rd PLACE', prize: '$100 CASH' },
          { pos: '4th - 10th', prize: 'PROMO BUNDLE' },
        ].map((p, i) => (
          <div key={i} className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
             <span className="text-[10px] font-black uppercase text-zinc-400">{p.pos}</span>
             <span className="text-[10px] font-black uppercase text-lime-400">{p.prize}</span>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

const ProfileView = ({ profile, logout }: { profile: UserProfile | null, logout: () => Promise<void> | void, key?: string }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="p-4 space-y-6"
  >
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center relative overflow-hidden">
      <div className="absolute top-4 right-4 group">
        <button className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
          <MoreVertical size={20} className="text-zinc-500" />
        </button>
      </div>
      
      <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 mb-4 p-1 shadow-2xl relative">
        <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
           {profile?.avatarUrl ? (
             <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
           ) : (
             <UserIcon size={64} className="text-zinc-700" />
           )}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-lime-400 text-black text-[10px] font-black px-2 py-1 rounded-full border-2 border-zinc-900">
          PRO
        </div>
      </div>

      <h2 className="text-2xl font-black tracking-tighter italic uppercase">{profile?.username || 'UNSIGNED_VET'}</h2>
      <p className="text-purple-400 text-xs font-bold tracking-widest uppercase mb-4">{profile?.tier} ARTIST</p>
      
      <div className="flex justify-center gap-8 border-t border-zinc-800 pt-6">
        <div>
          <p className="text-xl font-black text-white">0.0</p>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rating</p>
        </div>
        <div>
          <p className="text-xl font-black text-white">0</p>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Plays</p>
        </div>
        <div>
          <p className="text-xl font-black text-white">0</p>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Drops</p>
        </div>
      </div>
    </div>

    {/* Media Actions */}
    <div className="grid grid-cols-3 gap-2">
      <MediaAction icon={Upload} label="Upload Music" />
      <MediaAction icon={ImageIcon} label="Post Photo" />
      <MediaAction icon={Video} label="Add Video" />
    </div>

    <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden">
       <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/10">
         <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Latest Content</h3>
         <LayoutGrid size={16} className="text-zinc-700" />
       </div>
       <div className="grid grid-cols-3 gap-1 p-1 min-h-[300px]">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-square bg-zinc-900/50 rounded flex items-center justify-center border border-zinc-800/30 group hover:border-lime-400 transition-all">
               <AudioLines size={20} className="text-zinc-800 group-hover:text-lime-400 transition-colors" />
            </div>
          ))}
       </div>
    </div>

    <button 
      onClick={() => logout()}
      className="w-full bg-zinc-900 border border-zinc-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-red-950/20 hover:border-red-900/30 transition-all uppercase text-xs tracking-widest"
    >
      <LogOut size={20} /> Logout Account
    </button>
  </motion.div>
);

const MediaAction = ({ icon: Icon, label }: { icon: any, label: string }) => (
  <button className="flex flex-col items-center gap-2 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-lime-400 transition-all group">
    <Icon size={20} className="text-zinc-500 group-hover:text-lime-400 transition-colors" />
    <span className="text-[8px] font-black uppercase text-zinc-500 group-hover:text-white transition-colors">{label}</span>
  </button>
);



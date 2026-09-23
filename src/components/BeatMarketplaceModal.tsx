import { useState } from 'react';
import { Music, Play, Pause, Download, DollarSign, Tag, Filter, X, Sparkles, Check, Upload } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../lib/audioEngine';

interface Beat {
  id: string;
  title: string;
  producer: string;
  genre: string;
  bpm: number;
  key: string;
  price: number; // 0 for free
  isFree: boolean;
  audioPreview: string;
  tags: string[];
}

interface BeatMarketplaceModalProps {
  onClose: () => void;
  onSelectBeatForStudio?: (beatTitle: string, bpm: number) => void;
}

const BEAT_CATEGORIES = ['ALL', 'TRAP', 'DRILL', 'BOOM BAP', 'COUNTRY RAP', 'GOSPEL', 'ALTERNATIVE', 'R&B'];

export const BeatMarketplaceModal = ({ onClose, onSelectBeatForStudio }: BeatMarketplaceModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [playingBeatId, setPlayingBeatId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadBpm, setUploadBpm] = useState(140);
  const [uploadGenre, setUploadGenre] = useState('TRAP');
  const [uploadPrice, setUploadPrice] = useState(0);

  const [beats, setBeats] = useState<Beat[]>([
    {
      id: 'beat_1',
      title: 'Southside 808 Earthquake',
      producer: 'Bama Beat Labs',
      genre: 'TRAP',
      bpm: 140,
      key: 'C Minor',
      price: 0,
      isFree: true,
      audioPreview: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
      tags: ['Heavy 808', 'Dark', 'Aggressive'],
    },
    {
      id: 'beat_2',
      title: 'Grace & Glory Organ Cypher',
      producer: 'Kingdom Sounds',
      genre: 'GOSPEL',
      bpm: 92,
      key: 'Eb Major',
      price: 0,
      isFree: true,
      audioPreview: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
      tags: ['Hammond Organ', 'Choir Chords', 'Soul Kick'],
    },
    {
      id: 'beat_3',
      title: 'Muddy Creek Banjo Trap',
      producer: 'Southern Gold Rush',
      genre: 'COUNTRY RAP',
      bpm: 132,
      key: 'G Major',
      price: 15,
      isFree: false,
      audioPreview: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
      tags: ['Acoustic Riffs', 'Sliding 808', 'Country Vibe'],
    },
    {
      id: 'beat_4',
      title: 'Ghost Sliding Drill Cadence',
      producer: 'UK & Chi Transit',
      genre: 'DRILL',
      bpm: 144,
      key: 'F Minor',
      price: 0,
      isFree: true,
      audioPreview: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
      tags: ['Sliding 808', 'Off-Beat Hi-Hat', 'Eerie Piano'],
    },
    {
      id: 'beat_5',
      title: 'Golden Era Vinyl Stanza',
      producer: 'Old School Vets',
      genre: 'BOOM BAP',
      bpm: 90,
      key: 'A Minor',
      price: 20,
      isFree: false,
      audioPreview: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
      tags: ['Vinyl Crackle', 'Acoustic Snare', 'Jazz Chords'],
    },
  ]);

  const filteredBeats = beats.filter((b) => {
    if (selectedCategory === 'ALL') return true;
    return b.genre === selectedCategory;
  });

  const togglePlay = (beatId: string) => {
    if (playingBeatId === beatId) {
      setPlayingBeatId(null);
      audioEngine.stopRadioStream();
    } else {
      setPlayingBeatId(beatId);
      audioEngine.startRadioStream();
    }
  };

  const handleUseBeat = (beat: Beat) => {
    if (onSelectBeatForStudio) {
      onSelectBeatForStudio(beat.title, beat.bpm);
    }
    alert(`Loaded "${beat.title}" (${beat.bpm} BPM) into Studio DAW!`);
    onClose();
  };

  const handleUploadBeat = () => {
    if (!uploadTitle.trim()) return;
    const newBeat: Beat = {
      id: `beat_${Date.now()}`,
      title: uploadTitle.trim(),
      producer: 'Unsigned Producer',
      genre: uploadGenre,
      bpm: uploadBpm,
      key: 'C Minor',
      price: uploadPrice,
      isFree: uploadPrice === 0,
      audioPreview: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
      tags: ['Producer Upload', 'New Heat'],
    };
    setBeats([newBeat, ...beats]);
    setShowUploadModal(false);
    setUploadTitle('');
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#39ff14', '#ffd700'],
    });
    alert('Beat uploaded to Cash Stage Beat Marketplace!');
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-950 border-2 border-yellow-500/50 rounded-3xl p-6 w-full max-w-lg space-y-5 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-yellow-400 text-black shadow-lg shadow-yellow-400/20">
              <Music size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase italic text-white">
                Beat Marketplace (1,000+ Free Beats)
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono">Royalty-Free Instrumentals & Licensing</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Upload Producer Action */}
        <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
          <div>
            <span className="text-xs font-black uppercase text-white block">Are you a Beat Producer?</span>
            <span className="text-[10px] text-zinc-400 font-mono">Upload and license your tracks to unsigned artists</span>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <Upload size={12} /> Upload Beat
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
          {BEAT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-yellow-400 text-black border-yellow-400 font-black shadow-md'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Beats List */}
        <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar pr-1">
          {filteredBeats.map((beat) => {
            const isPlaying = playingBeatId === beat.id;
            return (
              <div
                key={beat.id}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-yellow-400/50 p-4 rounded-2xl flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => togglePlay(beat.id)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isPlaying
                        ? 'bg-red-500 text-white'
                        : 'bg-lime-400 hover:bg-lime-300 text-black shadow-md shadow-lime-400/20'
                    }`}
                  >
                    {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  </button>

                  <div>
                    <h4 className="text-xs font-black uppercase text-white truncate max-w-[170px]">
                      {beat.title}
                    </h4>
                    <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                      {beat.bpm} BPM • {beat.genre} • <span className="text-purple-400">{beat.producer}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md ${
                    beat.isFree ? 'bg-lime-400/10 text-lime-400 border border-lime-400/30' : 'bg-yellow-400/10 text-yellow-300 border border-yellow-400/30'
                  }`}>
                    {beat.isFree ? 'FREE' : `$${beat.price}`}
                  </span>

                  <button
                    onClick={() => handleUseBeat(beat)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all"
                  >
                    Use in Studio
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Upload Beat Modal Form */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-60 flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h4 className="text-xs font-black uppercase text-white">Upload New Beat</h4>
                <button onClick={() => setShowUploadModal(false)} className="text-zinc-500 hover:text-white">
                  Cancel
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Beat Title (e.g. Muddy Trap Anthems)"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">BPM</label>
                    <input
                      type="number"
                      value={uploadBpm}
                      onChange={(e) => setUploadBpm(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">Genre</label>
                    <select
                      value={uploadGenre}
                      onChange={(e) => setUploadGenre(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      {BEAT_CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-400 block mb-1">Price (0 = Free)</label>
                  <input
                    type="number"
                    value={uploadPrice}
                    onChange={(e) => setUploadPrice(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <button
                onClick={handleUploadBeat}
                className="w-full py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black uppercase tracking-wider active:scale-95 shadow-lg shadow-yellow-400/20"
              >
                Publish Beat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Camera, Image as ImageIcon, Sparkles, Check, X, ShieldCheck, MapPin, Music } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../App';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface ProfileCustomizerModalProps {
  profile: UserProfile | null;
  onClose: () => void;
  onProfileUpdated: (updated: UserProfile) => void;
}

const AVATAR_PRESETS = [
  { name: 'Bama Slammer', url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&auto=format&fit=crop&q=80' },
  { name: 'Gospel Vanguard', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80' },
  { name: 'Trap Maestro', url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=200&auto=format&fit=crop&q=80' },
  { name: 'Midnight MC', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { name: 'Country Rhymer', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
];

const BANNER_THEMES = [
  { id: 'gold', name: 'Gold Rush', style: 'bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-800' },
  { id: 'neon', name: 'Electric Lime', style: 'bg-gradient-to-r from-lime-600 via-emerald-500 to-zinc-900' },
  { id: 'purple', name: 'Purple Haze', style: 'bg-gradient-to-r from-purple-700 via-indigo-600 to-zinc-950' },
  { id: 'obsidian', name: 'Dark Obsidian', style: 'bg-gradient-to-r from-zinc-900 via-zinc-800 to-black' },
];

const GENRES = ["Hip hop", "Rap", "Gospel", "Alternative", "R&B", "Blues", "Country"];

export const ProfileCustomizerModal = ({ profile, onClose, onProfileUpdated }: ProfileCustomizerModalProps) => {
  const [username, setUsername] = useState(profile?.username || 'Unsigned Vet');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || AVATAR_PRESETS[0].url);
  const [bannerTheme, setBannerTheme] = useState(BANNER_THEMES[0].id);
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [bio, setBio] = useState('100% human unsigned lyricist. Drama free zone. Ready for battles & collabs.');
  const [location, setLocation] = useState('Birmingham, AL');
  const [primaryGenre, setPrimaryGenre] = useState('Rap');
  const [saving, setSaving] = useState(false);

  const handleApplyPreset = (url: string) => {
    setAvatarUrl(url);
    setCustomAvatarInput('');
  };

  const handleCustomUrlApply = () => {
    if (customAvatarInput.trim()) {
      setAvatarUrl(customAvatarInput.trim());
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);

    try {
      const updated: UserProfile = {
        ...profile,
        username: username.trim() || profile.username,
        avatarUrl: avatarUrl,
      };

      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        username: updated.username,
        avatarUrl: updated.avatarUrl,
        bio,
        location,
        primaryGenre,
        bannerTheme,
      });

      onProfileUpdated(updated);
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#39ff14', '#ffd700', '#bd00ff'],
      });

      alert('Profile customization saved successfully!');
      onClose();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const selectedBanner = BANNER_THEMES.find((b) => b.id === bannerTheme) || BANNER_THEMES[0];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl relative my-8">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Camera className="text-lime-400" size={20} />
            <h3 className="text-base font-black uppercase italic text-white">
              Customize Artist Profile & Photos
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-zinc-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Live Profile Header Preview */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-bold uppercase text-zinc-400">Live Preview</span>
          <div className="rounded-2xl overflow-hidden border border-zinc-800 relative bg-zinc-900">
            {/* Banner */}
            <div className={`h-16 w-full ${selectedBanner.style}`} />
            {/* Avatar & Info */}
            <div className="p-4 pt-0 flex items-end justify-between relative -top-6">
              <div className="flex items-end gap-3">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-black ring-2 ring-lime-400 shadow-xl bg-zinc-900 shrink-0">
                  <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="pb-1">
                  <h4 className="text-sm font-black uppercase text-white truncate max-w-[160px]">
                    {username}
                  </h4>
                  <p className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                    <MapPin size={10} className="text-lime-400" /> {location} • {primaryGenre}
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-mono font-black text-lime-400 bg-black/70 px-2 py-0.5 rounded-full border border-lime-400/30">
                18+ PRO
              </span>
            </div>
          </div>
        </div>

        {/* Avatar Photo Section */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
            1. Choose Avatar Photo Preset or Add Custom Image URL:
          </label>
          {/* Preset Chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {AVATAR_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => handleApplyPreset(p.url)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                  avatarUrl === p.url
                    ? 'bg-lime-400 text-black border-lime-400 shadow-md shadow-lime-400/20'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <img src={p.url} alt={p.name} className="w-4 h-4 rounded-full object-cover" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>

          {/* Custom Avatar URL Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste custom photo URL (https://...)"
              value={customAvatarInput}
              onChange={(e) => setCustomAvatarInput(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
            />
            <button
              onClick={handleCustomUrlApply}
              className="bg-zinc-800 hover:bg-zinc-700 text-lime-400 px-3 py-2 rounded-xl text-xs font-black uppercase"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Banner Cover Theme */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
            2. Profile Header Banner Theme:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {BANNER_THEMES.map((b) => (
              <button
                key={b.id}
                onClick={() => setBannerTheme(b.id)}
                className={`py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                  bannerTheme === b.id
                    ? 'border-white text-white scale-105 shadow-md'
                    : 'border-zinc-800 text-zinc-400'
                } ${b.style}`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* Text Details Customization */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
              Stage Name / Handle
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                City / State
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                Primary Genre
              </label>
              <select
                value={primaryGenre}
                onChange={(e) => setPrimaryGenre(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
              Artist Bio / Mission (Drama-Free)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-zinc-900 text-zinc-400 text-xs font-black uppercase"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex-1 py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-lime-400/20 active:scale-95"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Camera, Sparkles, X, ShieldCheck, MapPin, Palette, Check } from 'lucide-react';
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

export type ProfileTheme = 'neon_green' | 'purple' | 'gold';

interface ThemeOption {
  id: ProfileTheme;
  name: string;
  tagline: string;
  primaryColor: string;
  borderClass: string;
  badgeClass: string;
  ringClass: string;
  swatchBg: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'neon_green',
    name: 'Neon Green',
    tagline: 'Radioactive Lime • Underground Vibe',
    primaryColor: '#39ff14',
    borderClass: 'border-lime-400',
    badgeClass: 'bg-lime-400/10 text-lime-400 border-lime-400/40',
    ringClass: 'ring-lime-400',
    swatchBg: 'bg-lime-400',
  },
  {
    id: 'purple',
    name: 'Electric Purple',
    tagline: 'Royal Stage • Midnight Freestyle',
    primaryColor: '#a855f7',
    borderClass: 'border-purple-500',
    badgeClass: 'bg-purple-900/30 text-purple-300 border-purple-500/40',
    ringClass: 'ring-purple-500',
    swatchBg: 'bg-purple-600',
  },
  {
    id: 'gold',
    name: 'Burnished Gold',
    tagline: 'Championship VIP • Bankroll Gold',
    primaryColor: '#ffd700',
    borderClass: 'border-yellow-400',
    badgeClass: 'bg-yellow-400/10 text-yellow-300 border-yellow-400/40',
    ringClass: 'ring-yellow-400',
    swatchBg: 'bg-yellow-400',
  },
];

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

const GENRES = ['Hip hop', 'Rap', 'Gospel', 'Alternative', 'R&B', 'Blues', 'Country'];

export const ProfileCustomizerModal = ({ profile, onClose, onProfileUpdated }: ProfileCustomizerModalProps) => {
  const [username, setUsername] = useState(profile?.username || 'Unsigned Vet');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || AVATAR_PRESETS[0].url);
  const [bannerTheme, setBannerTheme] = useState(profile?.bannerTheme || BANNER_THEMES[0].id);
  const [profileTheme, setProfileTheme] = useState<ProfileTheme>(profile?.profileTheme || 'neon_green');
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [bio, setBio] = useState(profile?.bio || '100% human unsigned lyricist. Drama free zone. Ready for battles & collabs.');
  const [location, setLocation] = useState(profile?.location || 'Birmingham, AL');
  const [primaryGenre, setPrimaryGenre] = useState(profile?.primaryGenre || 'Rap');
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
        bannerTheme,
        profileTheme,
        bio,
        location,
        primaryGenre,
      };

      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        username: updated.username,
        avatarUrl: updated.avatarUrl,
        bannerTheme,
        profileTheme,
        bio,
        location,
        primaryGenre,
      });

      onProfileUpdated(updated);
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#39ff14', '#ffd700', '#a855f7'],
      });

      alert(`Profile updated! Color scheme set to ${profileTheme.replace('_', ' ').toUpperCase()}.`);
      onClose();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const selectedBanner = BANNER_THEMES.find((b) => b.id === bannerTheme) || BANNER_THEMES[0];
  const selectedThemeOption = THEME_OPTIONS.find((t) => t.id === profileTheme) || THEME_OPTIONS[0];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl relative my-8">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Palette className="text-lime-400" size={20} />
            <h3 className="text-base font-black uppercase italic text-white">
              Profile Customizer & Theme Studio
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-zinc-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Live Profile Header Preview (dynamically themed!) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold uppercase text-zinc-400">Live Preview</span>
            <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full border ${selectedThemeOption.badgeClass}`}>
              Theme: {selectedThemeOption.name}
            </span>
          </div>
          <div className={`rounded-2xl overflow-hidden border-2 relative bg-zinc-900 transition-all ${selectedThemeOption.borderClass}`}>
            {/* Banner */}
            <div className={`h-16 w-full ${selectedBanner.style}`} />
            {/* Avatar & Info */}
            <div className="p-4 pt-0 flex items-end justify-between relative -top-6">
              <div className="flex items-end gap-3">
                <div className={`w-16 h-16 rounded-full overflow-hidden border-2 border-black ring-2 shadow-xl bg-zinc-900 shrink-0 ${selectedThemeOption.ringClass}`}>
                  <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="pb-1">
                  <h4 className="text-sm font-black uppercase text-white truncate max-w-[160px]">
                    {username}
                  </h4>
                  <p className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                    <MapPin size={10} style={{ color: selectedThemeOption.primaryColor }} /> {location} • {primaryGenre}
                  </p>
                </div>
              </div>
              <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full border bg-black/80 ${selectedThemeOption.badgeClass}`}>
                18+ VET
              </span>
            </div>
          </div>
        </div>

        {/* 1. THEME SELECTOR (Neon Green, Purple, Gold) */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5">
            <Palette size={14} className="text-yellow-400" />
            <label className="text-[11px] font-black uppercase tracking-wider text-white">
              1. Profile Color Scheme Theme:
            </label>
          </div>
          <p className="text-[10px] text-zinc-400 font-sans -mt-1">
            Choose your signature color scheme. Saved directly to your Firebase profile.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((theme) => {
              const isSelected = profileTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setProfileTheme(theme.id)}
                  className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? `bg-zinc-900 ${theme.borderClass} shadow-lg scale-102`
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-4 h-4 rounded-full ${theme.swatchBg} shadow-sm`} />
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center text-[9px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-white block leading-tight">
                      {theme.name}
                    </span>
                    <span className="text-[8px] text-zinc-400 block font-mono mt-0.5 line-clamp-1">
                      {theme.id === 'neon_green' ? 'Neon Lime' : theme.id === 'purple' ? 'Stage Purple' : 'Gold Rush'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Avatar Photo Section */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5">
            <Camera size={14} className="text-lime-400" />
            <label className="text-[11px] font-black uppercase tracking-wider text-white">
              2. Avatar Photo:
            </label>
          </div>
          {/* Preset Chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {AVATAR_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p.url)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                  avatarUrl === p.url
                    ? 'bg-zinc-800 text-white border-white shadow-md'
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
              type="button"
              onClick={handleCustomUrlApply}
              className="bg-zinc-800 hover:bg-zinc-700 text-lime-400 px-3 py-2 rounded-xl text-xs font-black uppercase"
            >
              Apply
            </button>
          </div>
        </div>

        {/* 3. Banner Cover Theme */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-white block">
            3. Header Banner Art:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {BANNER_THEMES.map((b) => (
              <button
                key={b.id}
                type="button"
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

        {/* 4. Text Details Customization */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
              Stage Name / Handle
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
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
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                Primary Genre
              </label>
              <select
                value={primaryGenre}
                onChange={(e) => setPrimaryGenre(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
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
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-zinc-900 text-zinc-400 text-xs font-black uppercase"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex-1 py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-lime-400/20 active:scale-95 transition-all"
          >
            {saving ? 'Saving Theme...' : 'Save & Apply Theme'}
          </button>
        </div>
      </div>
    </div>
  );
};

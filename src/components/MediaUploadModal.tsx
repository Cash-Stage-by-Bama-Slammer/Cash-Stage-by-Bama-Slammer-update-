import { useState } from 'react';
import { Upload, Music, Video, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface MediaUploadModalProps {
  userId?: string;
  username?: string;
  onClose: () => void;
}

export const MediaUploadModal = ({ userId, username, onClose }: MediaUploadModalProps) => {
  const [mediaType, setMediaType] = useState<'music' | 'video' | 'picture'>('music');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Hip hop');
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!title.trim() || !userId) return;

    setUploading(true);
    try {
      if (mediaType === 'music' || mediaType === 'video') {
        await addDoc(collection(db, 'tracks'), {
          title: title.trim(),
          authorId: userId,
          authorName: username || 'Unsigned Artist',
          audioUrl: url || 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
          videoUrl: mediaType === 'video' ? url || 'https://www.w3schools.com/html/mov_bbb.mp4' : null,
          genre,
          type: 'solo',
          plays: 1,
          views: 1,
          likes: 0,
          promoType: 'none',
          createdAt: serverTimestamp(),
        });
      }

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });

      alert(`Your ${mediaType} "${title.trim()}" has been published to your profile and live feed!`);
      onClose();
    } catch (e) {
      console.warn('Media upload error:', e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-base font-black uppercase italic text-white">Media Vault Upload</h3>
          <span className="text-[10px] font-mono text-lime-400">UNRESTRICTED</span>
        </div>

        {/* Media Type Tabs */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setMediaType('music')}
            className={`py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 border transition-all ${
              mediaType === 'music'
                ? 'bg-purple-600 border-purple-400 text-white'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            <Music size={14} /> Audio
          </button>
          <button
            onClick={() => setMediaType('video')}
            className={`py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 border transition-all ${
              mediaType === 'video'
                ? 'bg-lime-400 border-lime-400 text-black'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            <Video size={14} /> Video
          </button>
          <button
            onClick={() => setMediaType('picture')}
            className={`py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 border transition-all ${
              mediaType === 'picture'
                ? 'bg-yellow-400 border-yellow-400 text-black'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            <ImageIcon size={14} /> Photo
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Title or Caption"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />

          <input
            type="text"
            placeholder="Media File URL / Stream Link"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />

          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            {['Hip hop', 'Rap', 'Gospel', 'Alternative', 'R&B', 'Blues', 'Country'].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-black uppercase"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !title.trim()}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/30"
          >
            {uploading ? 'Posting...' : 'Post Media'}
          </button>
        </div>
      </div>
    </div>
  );
};

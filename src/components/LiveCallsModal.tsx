import { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, Video, VideoOff, Bell, BellOff, Mic, MicOff, Users, Flame, ShieldCheck, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../lib/audioEngine';

interface LiveCallsModalProps {
  userId?: string;
  username?: string;
  onClose: () => void;
  onStartBattleCall?: (artistName: string) => void;
}

interface OnlineArtist {
  id: string;
  name: string;
  avatar: string;
  genre: string;
  status: 'online' | 'in_battle' | 'studio';
  rank: string;
}

export const LiveCallsModal = ({ userId, username, onClose, onStartBattleCall }: LiveCallsModalProps) => {
  const [activeCall, setActiveCall] = useState<OnlineArtist | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connected'>('idle');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [ringtoneEnabled, setRingtoneEnabled] = useState(true);

  const onlineArtists: OnlineArtist[] = [
    {
      id: 'artist_1',
      name: 'Miss Bama Slammer',
      avatar: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&auto=format&fit=crop&q=80',
      genre: 'Southern Rap',
      status: 'online',
      rank: 'Level 12 Grand Champion',
    },
    {
      id: 'artist_2',
      name: 'Grace & Truth MC',
      avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
      genre: 'Gospel Cypher',
      status: 'online',
      rank: 'Level 9 MC Specialist',
    },
    {
      id: 'artist_3',
      name: 'Country Trap Vet',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      genre: 'Country Rap',
      status: 'studio',
      rank: 'Level 8 Lyricist',
    },
    {
      id: 'artist_4',
      name: 'Concrete Cypher 808',
      avatar: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=150&auto=format&fit=crop&q=80',
      genre: 'Trap / Drill',
      status: 'online',
      rank: 'Level 7 MC Contender',
    },
  ];

  const handleStartCall = (artist: OnlineArtist) => {
    setActiveCall(artist);
    setCallStatus('ringing');
    if (ringtoneEnabled) {
      audioEngine.playJackpotChime();
    }
    // Simulate auto connect after 2.5 seconds
    setTimeout(() => {
      setCallStatus('connected');
    }, 2500);
  };

  const handleEndCall = () => {
    setActiveCall(null);
    setCallStatus('idle');
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border-2 border-yellow-500/50 rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-yellow-400 text-black shadow-lg shadow-yellow-400/20">
              <PhoneCall size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase italic text-white">
                Live Audio & Battle Calling
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono">1v1 Direct Audio Huddle • Drama-Free Zone</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Global Controls: Ringtone Toggle */}
        <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 px-4 py-2.5 rounded-2xl">
          <span className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-2">
            {ringtoneEnabled ? <Bell size={14} className="text-lime-400" /> : <BellOff size={14} className="text-zinc-500" />}
            Calling Chime / Ringtone
          </span>
          <button
            onClick={() => setRingtoneEnabled(!ringtoneEnabled)}
            className={`px-3 py-1 rounded-xl text-[10px] font-mono font-black uppercase transition-all ${
              ringtoneEnabled ? 'bg-lime-400 text-black font-bold' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {ringtoneEnabled ? 'ON' : 'MUTED'}
          </button>
        </div>

        {/* Active Call In-Progress View */}
        {activeCall && (
          <div className="bg-gradient-to-b from-zinc-900 to-black border-2 border-purple-500/60 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="relative inline-block">
              <img
                src={activeCall.avatar}
                alt={activeCall.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-purple-500 shadow-xl mx-auto"
              />
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-lime-400 border-2 border-black animate-pulse" />
            </div>

            <div>
              <h4 className="text-base font-black uppercase text-white">{activeCall.name}</h4>
              <p className="text-xs font-mono text-purple-400">{activeCall.rank}</p>
              <span className="text-[10px] font-mono font-black text-yellow-400 uppercase tracking-widest mt-1 block">
                {callStatus === 'ringing' ? 'Ringing contender...' : 'Live Huddle Connected'}
              </span>
            </div>

            {/* In-Call Controls: Mute, Video, End */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isMuted ? 'bg-red-500 text-white' : 'bg-zinc-800 text-white hover:bg-zinc-700'
                }`}
                title="Toggle Mic"
              >
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  !isVideoEnabled ? 'bg-zinc-800 text-zinc-500' : 'bg-purple-600 text-white'
                }`}
                title="Toggle Video"
              >
                {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
              </button>

              <button
                onClick={handleEndCall}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 active:scale-95 transition-all"
                title="End Call"
              >
                <PhoneOff size={22} />
              </button>
            </div>
          </div>
        )}

        {/* Online Artists Ready for Battles & Huddles */}
        {!activeCall && (
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-black uppercase text-zinc-400 tracking-wider block">
              Online Unsigned Artists (1-Tap Call / Battle Invite):
            </span>

            <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar pr-1">
              {onlineArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="bg-zinc-900 border border-zinc-800 hover:border-yellow-400/60 p-3 rounded-2xl flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img src={artist.avatar} alt={artist.name} className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
                    <div>
                      <h4 className="text-xs font-black uppercase text-white">{artist.name}</h4>
                      <p className="text-[10px] font-mono text-zinc-400">{artist.genre} • {artist.rank}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartCall(artist)}
                    className="px-3.5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-lime-400/20 active:scale-95 transition-all"
                  >
                    <Phone size={12} /> Call
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { Radio, Play, Pause, Disc, Users, Clock, Flame, Calendar, Sparkles } from 'lucide-react';
import { audioEngine } from '../lib/audioEngine';

interface LiveRadioProps {
  onRSVP?: (slotName: string) => void;
}

export const LiveRadio = ({ onRSVP }: LiveRadioProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBar, setCurrentBar] = useState(0);
  const [listeners, setListeners] = useState(148);
  const [rsvpSlot, setRsvpSlot] = useState<string | null>(null);

  const playlist = [
    { title: 'Bama Heat Vol. 4', artist: 'Miss Bama Slammer', genre: 'Rap', bpm: 136 },
    { title: 'Midnight Stanza', artist: 'Vet Lyricist #88', genre: 'Hip hop', bpm: 140 },
    { title: 'Grace on the Block', artist: 'Praise Soldier', genre: 'Gospel', bpm: 92 },
    { title: 'Tennessee Backroad Barz', artist: 'Country Rap Vet', genre: 'Country', bpm: 128 },
  ];

  const currentTrack = playlist[currentBar % playlist.length];

  const toggleRadio = () => {
    if (isPlaying) {
      audioEngine.stopRadioStream();
      setIsPlaying(false);
    } else {
      audioEngine.startRadioStream((bar) => {
        setCurrentBar(bar);
      });
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    // Random fluctuations in listener count
    const interval = setInterval(() => {
      setListeners((prev) => Math.max(120, prev + Math.floor(Math.random() * 5) - 2));
    }, 4000);
    return () => {
      clearInterval(interval);
      audioEngine.stopRadioStream();
    };
  }, []);

  const handleBookSlot = (time: string) => {
    setRsvpSlot(time);
    if (onRSVP) onRSVP(time);
    alert(`DJ Slot booked for ${time}! 10 plays will be scheduled on Vets Radio FM.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Radio Broadcast Header */}
      <div className="bg-gradient-to-br from-purple-950/60 via-zinc-950 to-lime-950/40 border border-zinc-800 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="text-lime-400" size={24} />
            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">
              Vets Radio FM
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPlaying ? 'bg-lime-400 animate-ping' : 'bg-red-500'
              }`}
            />
            <span className="text-[10px] font-mono font-black uppercase text-zinc-300">
              {isPlaying ? 'ON AIR' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Vinyl Turntable Display */}
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div
            className={`w-36 h-36 rounded-full bg-zinc-900 border-4 border-zinc-700 flex items-center justify-center shadow-2xl relative transition-transform ${
              isPlaying ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '4s' }}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-lime-400 p-1 flex items-center justify-center shadow-inner">
              <Disc size={28} className="text-black" />
            </div>
          </div>

          <div className="text-center">
            <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">
              {currentTrack.genre} • {currentTrack.bpm} BPM
            </span>
            <h3 className="text-lg font-black text-white uppercase italic tracking-tight">
              {currentTrack.title}
            </h3>
            <p className="text-xs font-mono font-bold text-zinc-400">{currentTrack.artist}</p>
          </div>

          {/* Listener Count */}
          <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-full text-xs font-mono text-zinc-400">
            <Users size={14} className="text-lime-400" />
            <span>{listeners} Active Unsigned Listeners</span>
          </div>

          {/* Play/Pause Stream Button */}
          <button
            onClick={toggleRadio}
            className={`px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2.5 transition-all shadow-xl active:scale-95 ${
              isPlaying
                ? 'bg-red-500 text-white shadow-red-500/30'
                : 'bg-lime-400 text-black shadow-lime-400/30 hover:bg-lime-300'
            }`}
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            {isPlaying ? 'Pause Stream' : 'Listen Live FM'}
          </button>
        </div>
      </div>

      {/* DJ Slots RSVP Section */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="text-yellow-400" size={18} />
            <h3 className="text-sm font-black uppercase text-white">DJ Slots RSVP (Send to Radio)</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">10 PLAYS ROTATION</span>
        </div>

        <p className="text-xs text-zinc-400 font-sans">
          Reserve your verified DJ rotation slot. VIP members receive up to 5 free radio sends daily; Platinum members receive 2 free sends.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
          {['Today 6:00 PM EST', 'Tonight 9:30 PM EST', 'Tomorrow 3:00 PM EST'].map((slot, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between"
            >
              <div>
                <span className="text-[9px] font-mono text-lime-400 uppercase font-bold block">Open Slot</span>
                <p className="text-xs font-black text-white">{slot}</p>
              </div>
              <button
                onClick={() => handleBookSlot(slot)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  rsvpSlot === slot
                    ? 'bg-lime-500 text-black'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {rsvpSlot === slot ? 'Booked' : 'RSVP'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

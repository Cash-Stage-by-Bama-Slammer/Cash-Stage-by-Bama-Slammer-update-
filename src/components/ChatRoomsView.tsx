import { useState, useEffect } from 'react';
import { MessagesSquare, Lock, Globe, Send, ShieldAlert, Users, Snowflake } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { banManager } from '../lib/banManager';

interface ChatRoomsViewProps {
  userId?: string;
  username?: string;
}

interface Message {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: any;
}

export const ChatRoomsView = ({ userId, username }: ChatRoomsViewProps) => {
  const [activeRoom, setActiveRoom] = useState<'public_stage' | 'private_vip'>('public_stage');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      roomId: 'public_stage',
      authorId: 'user_1',
      authorName: 'Miss Bama Slammer',
      text: 'Welcome unsigned vets! Remember: Drama Free Zone. Keep your battles in the arena.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'm2',
      roomId: 'public_stage',
      authorId: 'user_2',
      authorName: '808_Maestro',
      text: 'Just dropped a new trap instrumental in the Beat Studio. Check the 16-step grid!',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [, setUpdateTrigger] = useState(0);

  // Subscribe to ban manager updates
  useEffect(() => {
    return banManager.subscribe(() => {
      setUpdateTrigger((prev) => prev + 1);
    });
  }, []);

  const isRoomFrozen = banManager.isRoomFrozen(activeRoom);
  const isBanned = userId ? banManager.isUserBanned(userId) : false;

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    if (!userId) {
      alert('Please sign in to send messages.');
      return;
    }

    // AI Ban & Freeze Enforcement
    const check = banManager.assertCanMessage(userId, activeRoom);
    if (!check.allowed) {
      alert(check.error);
      return;
    }

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      roomId: activeRoom,
      authorId: userId,
      authorName: username || 'Unsigned Artist',
      text: inputText.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    try {
      await addDoc(collection(db, 'messages'), {
        ...newMsg,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Chat send note:', e);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header with Room Tabs */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessagesSquare className="text-purple-400" size={22} />
            <h2 className="text-xl font-black italic tracking-tighter uppercase text-white">
              Vets Chat Hub
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold text-lime-400 bg-lime-400/10 px-2.5 py-0.5 rounded-full border border-lime-400/30">
            DRAMA-FREE ZONE
          </span>
        </div>

        {/* Room Switcher */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveRoom('public_stage')}
            className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
              activeRoom === 'public_stage'
                ? 'bg-purple-600/30 border-purple-500 text-white shadow-lg'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-purple-400" />
              <div>
                <h4 className="text-xs font-black uppercase">Public Stage</h4>
                <span className="text-[9px] text-zinc-400">Limit 500 Artists</span>
              </div>
            </div>
            <Users size={14} className="text-zinc-500" />
          </button>

          <button
            onClick={() => setActiveRoom('private_vip')}
            className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
              activeRoom === 'private_vip'
                ? 'bg-lime-500/20 border-lime-400 text-white shadow-lg'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-lime-400" />
              <div>
                <h4 className="text-xs font-black uppercase">Private Lounge</h4>
                <span className="text-[9px] text-zinc-400">Max 60 Members</span>
              </div>
            </div>
            <Users size={14} className="text-zinc-500" />
          </button>
        </div>
      </div>

      {/* Frozen Alert */}
      {isRoomFrozen && (
        <div className="bg-cyan-950/40 border border-cyan-500/50 rounded-2xl p-4 flex items-center gap-3 text-cyan-300">
          <Snowflake size={20} className="animate-spin" />
          <div className="text-xs">
            <span className="font-black uppercase block">Room Frozen by 24/7 AI Patrol</span>
            Commentary is temporarily paused to maintain fair play and safety.
          </div>
        </div>
      )}

      {/* Messages Feed */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-4 min-h-[350px] max-h-[420px] overflow-y-auto no-scrollbar flex flex-col justify-end">
        <div className="space-y-3">
          {messages
            .filter((m) => m.roomId === activeRoom)
            .map((msg) => {
              const isMe = msg.authorId === userId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[10px] font-mono font-bold text-zinc-400">
                      {msg.authorName}
                    </span>
                    <span className="text-[9px] text-zinc-600">Just now</span>
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed ${
                      isMe
                        ? 'bg-purple-600 text-white rounded-br-sm'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Input Box */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder={
            isBanned
              ? 'Account suspended. Messaging blocked.'
              : isRoomFrozen
              ? 'Room frozen by AI patrol...'
              : `Message ${activeRoom === 'public_stage' ? 'Public Stage' : 'Private VIP'}...`
          }
          disabled={isBanned || isRoomFrozen}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
        />
        <button
          onClick={handleSendMessage}
          disabled={isBanned || isRoomFrozen || !inputText.trim()}
          className="bg-lime-400 hover:bg-lime-300 disabled:bg-zinc-800 text-black px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
        >
          <Send size={14} /> Send
        </button>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { rideService } from '../../services/rideService';
import { Send, MessageSquare } from 'lucide-react';

export const InRideChat = ({ rideId, currentUser, isDriver, socket }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Load chat history from REST endpoint
  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      try {
        setLoading(true);
        const history = await rideService.getRideMessages(rideId);
        if (isMounted) {
          setMessages(history || []);
        }
      } catch (err) {
        console.warn('Could not load chat history:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [rideId]);

  // Subscribe to real-time chat messages via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      setMessages((prev) => {
        if (newMsg._id && prev.some((m) => m._id === newMsg._id)) {
          return prev;
        }
        return [...prev, newMsg];
      });
    };

    socket.on('chat:message', handleNewMessage);

    return () => {
      socket.off('chat:message', handleNewMessage);
    };
  }, [socket]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !socket) return;

    socket.emit('chat:message', { text });
    setInputText('');
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[480px] bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">In-ride group chat</h3>
        </div>
        <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1.5 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      {/* Message List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FCFDFD]">
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400">Loading conversation...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
            <MessageSquare className="w-8 h-8 text-slate-300" />
            <p className="font-semibold text-slate-600">No messages yet</p>
            <p className="text-[11px] text-slate-400">Coordinate pickup details or ask any ride questions here.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe =
              msg.sender === currentUser?._id ||
              msg.sender === currentUser?.id ||
              msg.sender?._id === currentUser?._id;
            const isMsgDriver = msg.senderRole === 'driver';

            return (
              <div
                key={msg._id || idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    {msg.senderName}
                    {isMsgDriver && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                        Driver
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)}</span>
                </div>

                <div
                  className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs break-words shadow-xs ${
                    isMe
                      ? 'bg-emerald-600 text-white font-medium rounded-tr-none'
                      : isMsgDriver
                      ? 'bg-amber-50/90 border border-amber-200 text-slate-900 rounded-tl-none font-medium'
                      : 'bg-slate-100 text-slate-800 rounded-tl-none font-medium'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
        <input
          id="in-ride-chat-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message to ride members..."
          autoComplete="off"
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-medium transition shadow-xs"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-3.5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold transition disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

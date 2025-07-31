// frontend/src/components/Chat.jsx
import { useRef, useEffect } from 'react';

export default function Chat({ messages }) {
  // Ref to scroll to bottom of chat
  const chatRef = useRef(null);
  

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
        <div className="text-gray-400">
          <h3 className="text-xl font-semibold mb-2">Welcome to AI Debate</h3>
          <p>Select models and start a debate!</p>
        </div>
        <p className="text-xs text-gray-500">
          💬 Press <kbd className="px-1 bg-gray-700 rounded">Space</kbd> to start a debate
        </p>
      </div>
    );
  }

  return (
    <div ref={chatRef} className="space-y-4 h-full overflow-y-auto px-1">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-xs sm:max-w-md p-3 rounded-2xl shadow-sm space-y-1 ${
              msg.sender === 'user'
                ? 'bg-green-600 text-white ml-auto'
                : 'bg-gray-800 text-gray-100 mr-auto'
            }`}
          >
            {/* Model Label */}
            {msg.model && (
            <div className="flex items-center gap-1 text-xs font-semibold opacity-80">
              <img
                src={`/assets/avatars/${msg.model.toLowerCase() === 'gpt-4' ? 'gpt4.png' : msg.model.toLowerCase()}.png`}
                alt={msg.model}
                className="w-4 h-4 rounded-full"
              />
              {msg.model}
            </div>
          )}
            {/* Message Text */}
            <div>{msg.text}</div>
            {/* Timestamp */}
            <div className="text-xs opacity-70 mt-1">{msg.timestamp}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
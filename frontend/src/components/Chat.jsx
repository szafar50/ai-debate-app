// frontend/src/components/Chat.jsx
import { useRef, useEffect } from 'react';

export default function Chat({ messages, thinkingModels }) {
  const chatRef = useRef(null);

  // Scroll to bottom when messages or thinkingModels change
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, thinkingModels]);

  if (messages.length === 0 && (!thinkingModels || thinkingModels.size === 0)) {
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
      {/* Render Messages */}
      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
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

      {/* Show Thinking Models in Chat */}
      {thinkingModels && Array.from(thinkingModels).length > 0 && (
        <div className="flex flex-col space-y-1 px-2">
          {Array.from(thinkingModels).map((model) => (
            <div
              key={`thinking-${model}`}
              className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900/50 px-3 py-1.5 rounded-lg max-w-xs"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>
                {model} is thinking...
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
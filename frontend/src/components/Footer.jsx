// frontend/src/components/Footer.jsx
import { useState } from 'react';

export default function Footer({
  input,
  setInput,
  selectedModels,
  sendMessage,
  clearMessages,
  setMessages
}) {
  const [isLoading, setIsLoading] = useState(false);

  const openPastResponses = async () => {
    try {
      const res = await fetch('http://localhost:8000/messages');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const messages = data.messages.slice(-40).reverse();
      const popup = window.open('', 'Past Responses', 'width=800,height=600,resizable,scrollbars=yes');
      popup.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Past Responses</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: system-ui, sans-serif; background: #111; color: #ddd; padding: 20px; }
            .message { margin: 16px 0; padding: 12px; background: #1e1e1e; border-radius: 8px; }
            .meta { font-size: 0.8em; color: #888; margin-bottom: 4px; }
            .text { white-space: pre-wrap; line-height: 1.5; }
            .sender-user { border-left: 4px solid #3b82f6; }
            .sender-bot { border-left: 4px solid #10b981; }
          </style>
        </head>
        <body>
          <h2>📜 Last 40 Messages</h2>
          ${messages.map(msg => `
            <div class="message sender-${msg.sender}">
              <div class="meta">
                <strong>${msg.model || msg.sender}</strong> • ${msg.timestamp || 'N/A'}
              </div>
              <div class="text">${msg.text}</div>
            </div>
          `).join('')}
        </body>
        </html>
      `);
      popup.document.close();
    } catch (err) {
      alert("Failed to load messages: " + err.message);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    await sendMessage(
      input,
      selectedModels,
      setInput,
      setMessages,
      () => {},
      () => {},
      () => {}
    );
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim()) return;
      handleSend();
    }
  };

  return (
    <footer className="p-4 bg-black border-t border-purple-500/30">
      <div className="flex flex-col gap-3">
        {/* Input + Send */}
        <form onSubmit={handleSend}>
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question..."
              className="flex-1 bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={{
                minHeight: '2.5rem',
                maxHeight: '6rem',
                overflowY: 'auto'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            onClick={openPastResponses}
            className="px-4 py-2 text-xs text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition"
          >
            📜 Past Responses
          </button>
          <button
            type="button"
            onClick={() => clearMessages(setMessages, setInput)}
            disabled={isLoading}
            className="px-4 py-2 text-xs text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition"
          >
            🧹 Clear
          </button>
        </div>
      </div>
    </footer>
  );
}
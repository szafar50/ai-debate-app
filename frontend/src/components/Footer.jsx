// frontend/src/components/Footer.jsx
import { useState } from 'react';
export default function Footer({
  input,
  setInput,
  selectedModels,
  sendMessage,
  clearMessages,
  setIsThinking,
  setThinkingMessage,
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
      setIsThinking,
      setThinkingMessage
    );
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <footer className="p-4 bg-gray-800 border-t border-gray-700">
      <div className="flex flex-col gap-3">
        {/* Input + Send */}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question..."
            className="flex-1 input resize-none py-2"
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
            onClick={handleSend}
            disabled={isLoading}
            className="btn btn-blue whitespace-nowrap px-6"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openPastResponses}
            className="btn btn-gray flex-1 text-xs"
          >
            📜 Past Responses
          </button>
          <button
            onClick={() => clearMessages(setMessages, setInput)}
            disabled={isLoading}
            className="btn btn-gray flex-1 text-xs"
          >
            🧹 Clear
          </button>
        </div>
      </div>
    </footer>
  );
}
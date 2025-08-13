// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import './index.css';
import Header from './components/Header';
import Chat from './components/Chat';
import Footer from './components/Footer';
import BackgroundEffect from './components/BackgroundEffect';
import { sendMessage, clearMessages, startDebate } from './utils/functions';

function App() {
  const [selectedModels, setSelectedModels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('');
  const [availableModels, setAvailableModels] = useState([]);

  // Load models from backend
  useEffect(() => {
    const loadModels = async () => {
      try {
        const res = await fetch('http://localhost:8000/models');
        const data = await res.json();
        if (data.models) setAvailableModels(data.models);
        console.log("Loaded models:", data.models);
      } catch (err) {
        console.error("Failed to load models:", err);
      }
    };
    loadModels();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-black text-gray-100 relative">
      <BackgroundEffect />
      
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700">
        <Header
          selectedModels={selectedModels}
          setSelectedModels={setSelectedModels}
          availableModels={availableModels}
        />
      </header>

      {/* Chat */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <Chat messages={messages} />
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 z-10 bg-gray-800 border-t border-gray-700">
        <Footer
          input={input}
          setInput={setInput}
          selectedModels={selectedModels}
          sendMessage={sendMessage}
          clearMessages={clearMessages}
          startDebate={startDebate}
          setIsThinking={setIsThinking}
          setThinkingMessage={setThinkingMessage}
          setMessages={setMessages}
        />
      </footer>

      {/* Thinking Popup */}
      {isThinking && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={() => setIsThinking(false)}
        >
          <div
            className="bg-green-900 bg-opacity-90 text-white p-6 rounded-lg shadow-xl max-w-sm mx-4 border border-green-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-3">🤖 AI Is Thinking…</h3>
            <p className="text-sm mb-4 opacity-90">{thinkingMessage}</p>
            <button
              onClick={() => setIsThinking(false)}
              className="w-full py-2 bg-green-700 hover:bg-green-600 rounded text-sm font-medium transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
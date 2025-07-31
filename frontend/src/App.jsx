// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import './index.css';
import Header from './components/Header';
import Chat from './components/Chat';
import Footer from './components/Footer';
import BackgroundEffect from './components/BackgroundEffect';// from components
import { sendMessage, clearMessages, startDebate } from './utils/functions';

function App() {
  const [selectedModels, setSelectedModels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('');
  const [availableModels, setAvailableModels] = useState([]); // State to hold available models
  
  // UseEffect to load models from backend


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
  
  //useEffect(() => {
   // const handleKeyDown = (e) => {
   //   if (e.key === ' ' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
   //     e.preventDefault();
   //     if (selectedModels.length >= 2) {
   //       startDebate(selectedModels, setMessages);
   //     }
   //   }
   // };
   // window.addEventListener('keydown', handleKeyDown);
   // return () => window.removeEventListener('keydown', handleKeyDown);
  //}, [selectedModels, startDebate, setMessages]);

  //useEffect(() => {
  // const handleKeyDown = (e) => {
  //   if (e.key === ' ' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
  //     e.preventDefault();
  //     if (selectedModels.length >= 2) {
  //       startDebate(selectedModels, setMessages);
  //     }
  //   }
  // };
  // window.addEventListener('keydown', handleKeyDown);
  // return () => window.removeEventListener('keydown', handleKeyDown);
  //}, [selectedModels, startDebate, setMessages]);

  return (
  <div className="flex flex-col min-h-screen bg-black text-gray-100 relative">
    <BackgroundEffect />
    
    {/* Fixed Header */}
    <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700">
      <Header
        selectedModels={selectedModels}
        setSelectedModels={setSelectedModels}
        availableModels={availableModels}
      />
    </header>

    {/* Scrollable Chat Area */}
    <main className="flex-1 overflow-y-auto p-4 space-y-4">
      <Chat messages={messages} />
    </main>

    {/* Fixed Footer */}
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
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in"
    onClick={() => setIsThinking(false)}
  >
    <div
      className="bg-gray-800 text-white rounded-lg shadow-2xl p-6 max-w-sm mx-4 border border-blue-600"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center space-x-3">
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        <h3 className="text-lg font-semibold">Debate in Progress</h3>
      </div>
      <p className="text-sm text-gray-300 mt-3">
        {thinkingMessage || "Waiting for AI responses..."}
      </p>

      {/* Typing indicator */}
      <div className="flex justify-center mt-4 space-x-1">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>

      <button
        onClick={() => setIsThinking(false)}
        className="mt-5 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition"
      >
        Wait
      </button>
    </div>
  </div>
)}
  </div>
  );
}

export default App;
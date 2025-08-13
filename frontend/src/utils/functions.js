// frontend/src/utils/functions.js

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const getRecentContext = async (currentQuestion) => {
  try {
    const res = await fetch('http://localhost:8000/messages');
    const data = await res.json();
    const messages = data.messages || [];

    const recent = messages.slice(-6); // Last 6 messages

    let context = "### Recent Debate\n";
    recent.forEach(msg => {
      if (msg.sender === 'user') {
        context += `User: ${msg.text}\n`;
      } else {
        context += `${msg.model}: ${msg.text}\n`;
      }
    });
    context += `### Current Question\nUser: ${currentQuestion}`;
    return context;
  } catch {
    return `User: ${currentQuestion}`; // Fallback
  }
};




export const startDebate = async (selectedModels, setMessages) => {
  if (selectedModels.length < 2) {
    alert("Please select at least 2 models to start a debate!");
    return;
  }

  setMessages((prev) => [
    ...prev,
    {
      id: crypto.randomUUID(),
      text: `💬 The debate begins among ${selectedModels.join(", ")}!`,
      sender: "system",
      timestamp: formatTime(new Date()),
    },
  ]);

  

  try {
    const res = await fetch('http://localhost:8000/debate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        models: selectedModels, 
        question: null
      }),
    });
    

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const botMessages = data.responses.map((resp) => ({
      id: crypto.randomUUID(),
      text: resp.response,
      sender: 'bot',
      timestamp: formatTime(new Date()),
      model: resp.model,
    }));

    setMessages((prev) => [...prev, ...botMessages]);
  } catch (err) {
    console.error("Debate error:", err);
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: "❌ Failed to start debate. Check console for details.",
        sender: 'bot',
        timestamp: formatTime(new Date()),
      },
    ]);
  }
};

export const sendMessage = async (
  input,
  selectedModels,
  setInput,
  setMessages,
  setIsThinking,
  setThinkingMessage,
  setThinkingModels
) => {
  if (!input.trim()) return;
  if (selectedModels.length < 2) return;

  const context = await getRecentContext(input);

  const enhancedInput = `
  ## Context from Previous Conversation
  ${context}

  ## New Question
  User: "${input}"
  `.trim();

  setIsThinking(true);
  setThinkingModels(new Set(selectedModels));

  const userMessage = {
    id: crypto.randomUUID(),
    text: input,
    sender: 'user',
    timestamp: formatTime(new Date()),
  };
  setMessages(prev => [...prev, userMessage]);
  setInput('');

  try {
    // ✅ Call backend ONCE with all models
    const res = await fetch('http://localhost:8000/debate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', },
      body: JSON.stringify({ models: selectedModels, question: enhancedInput }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.responses?.length) throw new Error('Invalid response format');

    // ✅ Now simulate staggered display
    for (const resp of data.responses) {
      setThinkingMessage(`${resp.model} is responding...`);

      // Simulate typing effect
      await new Promise(resolve => setTimeout(resolve, 800));

      const botMessage = {
        id: crypto.randomUUID(),
        text: resp.response,
        sender: 'bot',
        timestamp: formatTime(new Date()),
        model: resp.model,
      };

      setMessages(prev => [...prev, botMessage]);

      // Remove from thinking set
      setThinkingModels(prev => {
        const next = new Set(prev);
        next.delete(resp.model);
        return next;
      });

      // Delay between models
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  } catch (err) {
    console.error("Send error:", err);
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      text: `❌ ${err.message}`,
      sender: 'bot',
      timestamp: formatTime(new Date()),
    }]);
  } finally {
    setIsThinking(false);
    setThinkingMessage("");
    setThinkingModels(new Set());
  }
};

export const clearMessages = (setMessages, setInput) => {
  const confirmed = window.confirm("Are you sure you want to clear the chat?");
  if (confirmed) {
    setMessages([]);
    if (setInput) setInput('');
    console.log("Chat cleared!");
  }
};

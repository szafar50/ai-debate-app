// frontend/src/utils/functions.js

// ✅ Add helper function
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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
  setThinkingMessage
) => {
  if (!input.trim()) return;
  if (selectedModels.length < 2) return;

  setIsThinking(true);

  const userMessage = {
    id: crypto.randomUUID(),
    text: input,
    sender: 'user',
    timestamp: formatTime(new Date()),
  };
  setMessages(prev => [...prev, userMessage]);
  setInput('');

  try {
    // Show dynamic thinking message
    for (const model of selectedModels) {
      setThinkingMessage(`${model} is analyzing your point...`);
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate staggered thinking
    }

    setThinkingMessage("Debate in progress...");

    const res = await fetch('http://localhost:8000/debate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ models: selectedModels, question: input }),
    });

    const data = await res.json();

    if (!res.ok || !data.responses) {
      throw new Error(data.error || 'Invalid response');
    }

    // Add responses one by one with delay (like typing)
    for (const resp of data.responses) {
      setThinkingMessage(`${resp.model} is replying...`);

      // Simulate typing effect
      await new Promise(resolve => setTimeout(resolve, 1200));

      const botMessage = {
        id: crypto.randomUUID(),
        text: resp.response,
        sender: 'bot',
        timestamp: formatTime(new Date()),
        model: resp.model,
      };

      setMessages(prev => [...prev, botMessage]);
    }
  } catch (err) {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      text: `❌ ${err.message}`,
      sender: 'bot',
      timestamp: formatTime(new Date()),
    }]);
  } finally {
    setIsThinking(false);
    setThinkingMessage('');
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
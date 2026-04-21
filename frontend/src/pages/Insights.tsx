import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Insights: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Fluxo's AI analyst. Ask me anything about demand trends, product performance, or seasonal patterns."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "Which product has the highest demand?",
    "How does demand spike during festival weeks?",
    "Which zone drives the most sales?",
    "Show year over year demand trend"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const userMessage: Message = { role: 'user', content: trimmedText };
    // Get last 6 messages formatting them as {role, content}
    const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      console.log("SENDING MESSAGE:", trimmedText);
      const BASE = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${BASE}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedText,
          history
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      const aiContent = data.response || data.answer || data.message || data.reply || (typeof data === 'string' ? data : "Received response successfully.");

      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Service unavailable. Make sure the AI server is running." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    sendMessage(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] text-gray-100 font-sans">
      {/* Header */}
      <div className="flex-none p-6 border-b border-gray-800 bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">AI Demand Insights</h1>
        <p className="text-sm text-gray-400 mt-1">Powered by Fluxo RAG</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-md ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-sm' 
                    : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-bl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-sm px-5 py-4 shadow-md flex items-center space-x-1.5 h-[52px]">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && !loading && (
        <div className="flex-none px-4 sm:px-6 pb-4 max-w-4xl mx-auto w-full">
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(q)}
                className="text-xs sm:text-sm bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-indigo-500 transition-colors duration-200 rounded-full px-4 py-2 text-gray-300 hover:text-white"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-none p-4 pb-6 sm:pb-8 bg-[#0A0A0A] border-t border-gray-800 w-full relative z-10">
        <div className="max-w-4xl mx-auto flex items-end bg-gray-900 border border-gray-700 rounded-xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all duration-200 shadow-lg">
          <textarea
            className="flex-1 max-h-48 min-h-[56px] bg-transparent text-gray-100 p-4 resize-none focus:outline-none text-sm sm:text-base"
            placeholder="Ask about demand trends..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="mb-2 mr-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white transition-colors duration-200 flex items-center justify-center h-10 w-10 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 -rotate-45 ml-1 mb-1">
              <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
            </svg>
          </button>
        </div>
        <div className="text-center mt-2 text-xs text-gray-500 max-w-4xl mx-auto">
          Press Enter to send, Shift + Enter for new line
        </div>
      </div>
    </div>
  );
};

export default Insights;

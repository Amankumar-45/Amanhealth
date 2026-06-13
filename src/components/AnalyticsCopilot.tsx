import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, BrainCircuit, Activity, HelpCircle, MessagesSquare } from 'lucide-react';

interface AnalyticsCopilotProps {
  onSendMessage: (msg: string) => Promise<string>;
  apiKeyStatus: boolean;
}

export default function AnalyticsCopilot({
  onSendMessage,
  apiKeyStatus
}: AnalyticsCopilotProps) {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    { 
      sender: 'assistant', 
      text: `### Clinical Analytics Companion Active
Hello! I am your hospital's Chief Medical Information Officer (CMIO) Co-Pilot. 

I can analyze live bed rates, performance stats, monthly financial reports, and demographics across our clinic sectors. What data audit or trend summary would you like to review?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "Summarize current clinic success performance and doctor loads.",
    "Are we experiencing immediate bed occupancy issues?",
    "Review regional caseload of heart disease patients.",
    "Deliver a brief financial health audit of revenue vs. costs."
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSubmit = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    const userMessage = textToSend;
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setIsSending(true);

    try {
      const response = await onSendMessage(userMessage);
      setMessages(prev => [...prev, { sender: 'assistant', text: response }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { 
        sender: 'assistant', 
        text: `### System Error
        Failed to fetch analytics intelligence: ${err.message || 'Check your internet connection or server logs.'}` 
      }]);
    } finally {
      setIsSending(false);
    }
  };

  // Safe inline markdown representation
  const renderInlineBold = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, index) => 
      index % 2 === 1 ? <strong key={index} className="font-extrabold text-gray-900">{part}</strong> : part
    );
  };

  const parseMarkdownToReact = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('### ')) {
        return <h4 key={i} className="text-xs font-bold text-blue-950 mt-3 mb-1 tracking-tight uppercase flex items-center space-x-1.5"><Activity className="h-3 w-3 text-blue-500 shrink-0" /><span>{trimmed.replace('### ', '')}</span></h4>;
      }
      if (trimmed.startsWith('#### ')) {
        return <h5 key={i} className="text-[10px] font-bold text-gray-500 mt-2 mb-1 tracking-wider uppercase font-mono">{trimmed.replace('#### ', '')}</h5>;
      }
      if (trimmed.startsWith('## ')) {
        return <h3 key={i} className="text-sm font-extrabold text-gray-900 mt-4 mb-2 tracking-tight border-b border-gray-100 pb-1">{trimmed.replace('## ', '')}</h3>;
      }
      if (trimmed.startsWith('- ')) {
        return (
          <li key={i} className="text-[11px] text-gray-600 list-none pl-3.5 relative my-1 leading-relaxed font-sans font-medium">
            <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <span>{renderInlineBold(trimmed.replace('- ', ''))}</span>
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={i} className="h-2" />;
      }
      return <p key={i} className="text-[11px] text-gray-600 leading-relaxed my-1 font-sans font-medium">{renderInlineBold(trimmed)}</p>;
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-xs flex flex-col h-[580px] overflow-hidden" id="analytics-copilot-panel">
      
      {/* Copilot Header */}
      <div className="p-5 border-b border-[#E5E7EB] bg-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <MessagesSquare className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#1A1A1A] tracking-tight">CMIO Clinical Copilot</h3>
            <p className="text-[9px] text-gray-400 font-mono uppercase tracking-wider">Generative Medical Analytics Engine</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] text-emerald-700 font-bold font-sans uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">{apiKeyStatus ? 'Live AI' : 'Sandbox Limits'}</span>
        </div>
      </div>

      {/* Messages Scroll container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white" id="copilot-log-feed">
        {messages.map((m, idx) => (
          <div 
            key={idx} 
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-3xs ${
              m.sender === 'user' 
              ? 'bg-blue-600 text-white rounded-tr-none text-xs font-bold leading-relaxed' 
              : 'bg-gray-50 border border-[#E5E7EB] text-[#1A1A1A] rounded-tl-none font-sans font-semibold'
            }`}>
              {m.sender === 'user' ? (
                <p className="text-xs leading-normal font-sans font-semibold">{m.text}</p>
              ) : (
                <div className="space-y-1">
                  {parseMarkdownToReact(m.text)}
                </div>
              )}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-[#E5E7EB] text-gray-400 rounded-2xl rounded-tl-none p-4 max-w-[80%] flex items-center space-x-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-spin shrink-0" />
              <span className="text-xs font-bold font-sans animate-pulse">Gathering hospital records, computing clinical correlations...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggested chips panel */}
      <div className="px-5 py-3 bg-white border-t border-b border-[#E5E7EB] space-y-2">
        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1">
          <HelpCircle className="h-3.5 w-3.5 text-gray-400 font-bold" />
          <span>Recommended Analytical Audits:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              id={`suggested-question-chip-${i}`}
              onClick={() => handleSubmit(q)}
              className="text-[10px] bg-white border border-[#E5E7EB] hover:border-blue-600 hover:text-blue-600 text-gray-500 font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-3xs shrink-0"
              disabled={isSending}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input panel Form */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSubmit(input); }} 
        className="p-4 border-t border-[#E5E7EB] bg-white flex items-center space-x-2"
        id="copilot-input-form"
      >
        <input
          id="copilot-text-input"
          type="text"
          placeholder="Ask analytical summaries (e.g., 'Compare North and South regions')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-gray-50 border border-[#E5E7EB] px-4 py-2.5 rounded-full text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-blue-600 outline-hidden transition-all text-[#1A1A1A]"
          disabled={isSending}
        />
        <button
          id="send-copilot-query"
          type="submit"
          className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full transition-all shadow-3xs shrink-0 cursor-pointer"
          disabled={!input.trim() || isSending}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

    </div>
  );
}

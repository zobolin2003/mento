import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello! I am your Mento AI assistant. I can help you summarize notes, brainstorm ideas, or answer questions. How can I help you today?',
    timestamp: Date.now(),
  }
];

export default function AI() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('mento-ai-chat');
    return saved ? JSON.parse(saved) : initialMessages;
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('mento-ai-chat', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Placeholder for Claude API call
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `This is a simulated response from the AI assistant. In a real application, this would connect to the Claude API to process your request: "${userMessage.content}"\n\n**Example Markdown:**\n- Point 1\n- Point 2\n\n\`\`\`javascript\nconsole.log("Hello World");\n\`\`\``,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages(initialMessages);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-[calc(100vh-8rem)] max-w-4xl mx-auto flex flex-col card-container overflow-hidden"
    >
      <header className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--title)]">Mento AI</h1>
            <p className="text-xs text-[var(--muted)]">Powered by Claude (Placeholder)</p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="text-sm text-[var(--muted)] hover:text-red-500 transition-colors"
        >
          Clear Chat
        </button>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-[var(--background)]/30">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              "flex gap-4 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
              msg.role === 'user' 
                ? "bg-[var(--color-primary)] text-white" 
                : "bg-[var(--card)] border border-[var(--border)] text-[var(--color-primary)]"
            )}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={cn(
              "p-4 rounded-2xl",
              msg.role === 'user' 
                ? "bg-[var(--color-primary)] text-white rounded-tr-sm" 
                : "bg-[var(--card)] border border-[var(--border)] text-[var(--body)] rounded-tl-sm shadow-sm"
            )}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="prose dark:prose-invert max-w-none prose-p:text-[var(--body)] prose-headings:text-[var(--title)] prose-a:text-[var(--color-primary)] prose-sm sm:prose-base">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0 mt-1">
              <Bot size={16} />
            </div>
            <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-[var(--body)] rounded-tl-sm shadow-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-[var(--color-primary)]" />
              <span className="text-sm text-[var(--muted)]">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[var(--card)] border-t border-[var(--border)]">
        <form 
          onSubmit={handleSend}
          className="flex items-end gap-2 bg-[var(--background)] rounded-2xl border border-[var(--border)] p-2 focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 focus-within:border-[var(--color-primary)] transition-all"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Ask Mento AI anything..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none resize-none focus:ring-0 text-[var(--body)] p-2.5 custom-scrollbar"
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 mb-0.5"
          >
            <Send size={20} />
          </button>
        </form>
        <p className="text-center text-xs text-[var(--muted)] mt-2">
          AI can make mistakes. Consider verifying important information.
        </p>
      </div>
    </motion.div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { SLASH_COMMANDS } from './SlashCommands';
import ChatMessage from './ChatMessage';
import api from '../../api/client';

function SendIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-2 pl-7">
      <div className="flex gap-1 py-2">
        {[0, 150, 300].map(delay => (
          <span
            key={delay}
            className="w-1.5 h-1.5 rounded-full bg-indigo-400/50 dark:bg-indigo-400/40 animate-bounce"
            style={{ animationDelay: `${delay}ms`, animationDuration: '900ms' }}
          />
        ))}
      </div>
    </div>
  );
}

export default function CommandBar({ isOpen, onClose, contextId, contextName }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acList, setAcList] = useState([]);   // filtered slash command autocomplete
  const [acIndex, setAcIndex] = useState(0);

  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  // Focus + clear on open/close
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setMessages([]);
      setInput('');
      setAcList([]);
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Slash command autocomplete
  useEffect(() => {
    if (input.startsWith('/') && !input.includes(' ')) {
      const q = input.slice(1).toLowerCase();
      setAcList(SLASH_COMMANDS.filter(c => c.command.startsWith(q)));
      setAcIndex(0);
    } else {
      setAcList([]);
    }
  }, [input]);

  const selectAutocomplete = (cmd) => {
    setInput(`/${cmd.command} `);
    setAcList([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { onClose(); return; }

    if (acList.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setAcIndex(i => Math.min(i + 1, acList.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setAcIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        selectAutocomplete(acList[acIndex]);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setAcList([]);

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      let reply;

      if (text.startsWith('/')) {
        const [rawCmd, ...rest] = text.slice(1).split(' ');
        const { reply: r } = await api.post('/ai/command', {
          command: rawCmd,
          args: rest.join(' '),
          contextId,
        });
        reply = r;
        // Signal workspace to refresh cards if something was created/updated
        window.dispatchEvent(new CustomEvent('personal-os:data-changed'));
      } else {
        const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
        const { reply: r } = await api.post('/ai/chat', { messages: history, contextId });
        reply = r;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `**Error:** ${err.message}`,
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasContent = messages.length > 0 || loading;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 pb-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/35 dark:bg-black/55 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-[640px] flex flex-col rounded-2xl overflow-hidden surface-overlay"
        style={{ maxHeight: '68vh' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-2.5 px-4 py-3 shrink-0
          border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="w-5 h-5 rounded-full shrink-0
            bg-gradient-to-br from-indigo-500 to-violet-600
            flex items-center justify-center text-white text-[9px] font-bold">
            OS
          </div>
          <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Personal OS</span>
          {contextName && (
            <span className="text-[11px] px-2 py-0.5 rounded-full
              bg-indigo-500/10 dark:bg-indigo-500/15
              text-indigo-600 dark:text-indigo-400 font-medium">
              {contextName}
            </span>
          )}
          <div className="flex-1" />
          <kbd className="text-[11px] font-mono px-1.5 py-0.5 rounded
            bg-black/[0.06] dark:bg-white/[0.07]
            text-gray-400 dark:text-gray-600">
            esc
          </kbd>
        </div>

        {/* ── Messages ── */}
        {hasContent && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {messages.map((m, i) => <ChatMessage key={i} message={m} />)}
            {loading && <ThinkingDots />}
            <div ref={bottomRef} />
          </div>
        )}

        {/* ── Slash command autocomplete ── */}
        {acList.length > 0 && (
          <div className="border-t border-black/[0.05] dark:border-white/[0.05] py-1.5 px-2">
            {acList.map((cmd, i) => (
              <button
                key={cmd.command}
                onMouseDown={e => { e.preventDefault(); selectAutocomplete(cmd); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors duration-100 ${
                  i === acIndex
                    ? 'bg-indigo-500/[0.09] dark:bg-indigo-500/[0.14]'
                    : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-[12px] font-mono font-semibold text-indigo-500 dark:text-indigo-400 w-[88px] shrink-0">
                  /{cmd.command}
                </span>
                <span className="text-[12px] text-gray-500 dark:text-gray-500 flex-1 truncate">
                  {cmd.description}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── Input ── */}
        <div className={`flex items-center gap-3 px-4 py-3.5 shrink-0 ${
          hasContent || acList.length > 0 ? 'border-t border-black/[0.06] dark:border-white/[0.06]' : ''
        }`}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder={messages.length ? 'Reply or type / for commands…' : 'Ask anything or type / for commands…'}
            className="flex-1 text-[14px] bg-transparent outline-none
              text-gray-900 dark:text-white
              placeholder-gray-400/55 dark:placeholder-gray-600
              disabled:opacity-40"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
            className="p-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white
              shadow-sm shadow-indigo-500/30
              disabled:opacity-30 disabled:cursor-default disabled:shadow-none
              transition-all duration-150 active:scale-95 shrink-0"
          >
            <SendIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hint bar — only when no messages yet */}
        {!hasContent && acList.length === 0 && (
          <div className="px-4 pb-3 flex gap-4">
            {['/task', '/find', '/stale', '/summarize'].map(cmd => (
              <button
                key={cmd}
                onClick={() => { setInput(cmd + ' '); inputRef.current?.focus(); }}
                className="text-[11px] font-mono text-gray-400/60 dark:text-gray-700
                  hover:text-indigo-500 dark:hover:text-indigo-400
                  transition-colors duration-120"
              >
                {cmd}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

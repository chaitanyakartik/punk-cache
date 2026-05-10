import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-2`}>
      {!isUser && (
        <div className="w-5 h-5 rounded-full shrink-0 mb-0.5
          bg-gradient-to-br from-indigo-500 to-violet-600
          flex items-center justify-center text-white text-[9px] font-bold">
          AI
        </div>
      )}

      <div className={`max-w-[84%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-[1.6] ${
        isUser
          ? 'bg-indigo-500 text-white rounded-br-md'
          : message.isError
            ? 'bg-red-500/[0.08] dark:bg-red-500/[0.12] text-red-600 dark:text-red-400 border border-red-400/20 rounded-bl-md'
            : 'bg-black/[0.045] dark:bg-white/[0.07] text-gray-800 dark:text-gray-200 border border-black/[0.04] dark:border-white/[0.06] rounded-bl-md'
      }`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none
            [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
            prose-p:leading-[1.6] prose-p:my-1
            prose-ul:my-1.5 prose-ul:pl-4 prose-li:my-0.5
            prose-ol:my-1.5 prose-ol:pl-4
            prose-strong:font-semibold
            prose-code:text-[11.5px] prose-code:font-mono prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-code:bg-black/[0.06] dark:prose-code:bg-white/[0.08]
            prose-pre:my-2 prose-pre:bg-black/[0.05] dark:prose-pre:bg-white/[0.06] prose-pre:rounded-xl prose-pre:p-3">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

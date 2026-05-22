"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { memo } from "react";

interface SmartMarkdownProps {
  content: string;
  className?: string;
}

/** Regex: detects if text needs full Markdown rendering */
const NEEDS_MARKDOWN = /[*_`~|$\\]|\[IMG_\d+\]|^\s*[-+]\s|^\s*\d+\.\s|#{1,6}\s/m;

/**
 * SmartMarkdown: only activates the heavy ReactMarkdown pipeline
 * when the text actually contains Markdown/LaTeX syntax.
 * For plain text (majority of exam questions), it renders a simple <span>.
 * This avoids ~80% of unnecessary ReactMarkdown renders.
 */
function SmartMarkdownInner({ content, className }: SmartMarkdownProps) {
  if (!content || !content.trim()) {
    return <span className="text-slate-400 italic text-sm">Không có nội dung</span>;
  }

  // Fast path: plain text — skip the whole plugin pipeline
  if (!NEEDS_MARKDOWN.test(content)) {
    return <span className={className}>{content}</span>;
  }

  // Slow path: text with Markdown/LaTeX — use full renderer
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        table: ({ node, ...props }) => <div className="overflow-x-auto my-2"><table className="text-sm border-collapse w-full" {...props} /></div>,
        th: ({ node, ...props }) => <th className="border border-slate-300 bg-slate-100 dark:bg-cyan-950/50 dark:text-slate-300 px-3 py-1.5 text-left font-bold" {...props} />,
        td: ({ node, ...props }) => <td className="border border-slate-200 dark:border-cyan-950/40 px-3 py-1.5" {...props} />,
        p: ({ node, ...props }) => <span {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export const SmartMarkdown = memo(SmartMarkdownInner);

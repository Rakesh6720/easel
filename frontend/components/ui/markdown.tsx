import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        'prose prose-sm max-w-none text-muted-foreground',
        // Override prose styles to match our design system
        'prose-headings:text-foreground prose-headings:font-semibold',
        'prose-h1:text-lg prose-h1:mb-3',
        'prose-h2:text-base prose-h2:mb-2',
        'prose-h3:text-sm prose-h3:mb-2',
        'prose-h4:text-sm prose-h4:mb-1',
        'prose-p:mb-2 prose-p:leading-relaxed',
        'prose-ul:mb-2 prose-ol:mb-2',
        'prose-li:mb-1',
        'prose-strong:text-foreground prose-strong:font-semibold',
        'prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs',
        'prose-pre:bg-muted prose-pre:border prose-pre:rounded-md prose-pre:p-4',
        'prose-blockquote:border-l-4 prose-blockquote:border-azure-blue prose-blockquote:pl-4 prose-blockquote:italic',
        'prose-a:text-azure-blue prose-a:no-underline hover:prose-a:underline',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom components for better styling
          h1: ({ children }) => <h1 className="text-lg font-semibold mb-3 text-foreground">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 text-foreground">{children}</h3>,
          h4: ({ children }) => <h4 className="text-sm font-medium mb-1 text-foreground">{children}</h4>,
          p: ({ children }) => <p className="mb-2 leading-relaxed text-muted-foreground">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 space-y-1 list-disc list-inside text-muted-foreground">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 space-y-1 list-decimal list-inside text-muted-foreground">{children}</ol>,
          li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => (
            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-muted border rounded-md p-4 overflow-x-auto text-sm">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-azure-blue pl-4 italic my-2 text-muted-foreground">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-azure-blue hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // Table components for better table styling
          table: ({ children }) => (
            <table className="w-full border-collapse border border-border text-sm mb-4">
              {children}
            </table>
          ),
          thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
          th: ({ children }) => (
            <th className="border border-border px-3 py-2 text-left font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-muted-foreground">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
"use client";

import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";

type ChapterMarkdownProps = {
  content: string;
};

export function ChapterMarkdown({ content }: ChapterMarkdownProps) {
  return (
    <div className="space-y-5 text-[#32415f]">
      <ReactMarkdown
        components={{
          h1({ children }) {
            return (
              <h1 className="text-[2rem] font-semibold tracking-[-0.05em] text-[#16214d]">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-[1.65rem] font-semibold tracking-[-0.05em] text-[#16214d]">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-[1.35rem] font-semibold tracking-[-0.04em] text-[#16214d]">
                {children}
              </h3>
            );
          },
          p({ children }) {
            return <p className="text-base leading-8 text-[#4d5f83]">{children}</p>;
          },
          ul({ children }) {
            return <ul className="space-y-3 pl-6">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="space-y-3 pl-6">{children}</ol>;
          },
          li({ children }) {
            return <li className="list-disc text-base leading-8 text-[#4d5f83]">{children}</li>;
          },
          strong({ children }) {
            return <strong className="font-semibold text-[#16214d]">{children}</strong>;
          },
          pre({ children }) {
            return (
              <pre className="overflow-x-auto rounded-[1.25rem] border border-[#dbe3f0] bg-[#0f1728] px-5 py-4 text-sm leading-7 text-[#dbe8ff] shadow-[0_24px_54px_-34px_rgba(15,23,40,0.45)]">
                {children}
              </pre>
            );
          },
          code({ children, className, ...props }: ComponentProps<"code">) {
            const isBlock = className?.includes("language-");

            if (isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }

            return (
              <code
                className="rounded-md bg-[#f2f5fb] px-1.5 py-0.5 text-[0.92em] text-[#294468]"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

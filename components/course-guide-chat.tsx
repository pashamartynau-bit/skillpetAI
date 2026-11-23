"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useState } from "react";

type GuideCourse = {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  href: string;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  courses?: GuideCourse[];
};

const STARTER_PROMPTS = [
  "How does AI learn?",
  "Help me write better prompts",
  "What is an AI agent?",
];

export function CourseGuideChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Tell me what you want to learn and your experience level. I’ll help you find a course that fits.",
    },
  ]);
  const [nextMessageId, setNextMessageId] = useState(1);

  async function sendMessage(message: string) {
    const query = message.trim();
    if (!query || isThinking) {
      return;
    }

    setInput("");
    setMessages((currentMessages) => [
      ...currentMessages,
      { id: `user-${nextMessageId}`, role: "user", text: query },
    ]);
    setNextMessageId((currentId) => currentId + 1);
    setIsThinking(true);

    try {
      const history = [
        ...messages.map((message) => ({ role: message.role, text: message.text })),
        { role: "user" as const, text: query },
      ];
      const response = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const payload = (await response.json()) as {
        courses?: GuideCourse[];
        error?: string;
        text?: string;
      };

      if (!response.ok || !payload.text) {
        throw new Error(payload.error ?? "Grok could not answer just now.");
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: payload.text ?? "",
          courses: payload.courses,
        },
      ]);
    } catch (error) {
      console.error("Failed to ask Omni Guide:", error);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: error instanceof Error ? error.message : "I couldn’t reach Grok just now. Please try again.",
        },
      ]);
    } finally {
      setNextMessageId((currentId) => currentId + 1);
      setIsThinking(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen ? (
        <section
          aria-label="Omni Guide course assistant"
          className="flex h-[min(36rem,calc(100dvh-6rem))] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-[#dce6d7] bg-white shadow-[0_24px_80px_-24px_rgba(16,35,18,0.35)] dark:border-white/10 dark:bg-[#152118]"
          role="dialog"
        >
          <header className="flex items-center justify-between bg-[#102312] px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#3cc74f] text-[#102312]">
                <Sparkles aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">Omni Guide</p>
                <p className="text-xs text-white/70">Find your next course</p>
              </div>
            </div>
            <button
              aria-label="Close Omni Guide"
              className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </header>

          <div
            aria-live="polite"
            className="flex-1 space-y-4 overflow-y-auto bg-[#f7faf4] px-4 py-5 dark:bg-[#101910]"
            role="log"
          >
            {messages.map((message) => (
              <div
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                key={message.id}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "rounded-br-md bg-[#102312] text-white"
                      : "rounded-bl-md border border-[#e5ecdf] bg-white text-[#344536] dark:border-white/10 dark:bg-[#1c2a20] dark:text-[#e8f3e6]"
                  }`}
                >
                  <p>{message.text}</p>
                  {message.courses?.map((course) => (
                    <Link
                      className="mt-3 block rounded-xl border border-[#e5ecdf] bg-[#fbfdf9] p-3 transition hover:border-[#3cc74f] hover:bg-[#f4fbf2] dark:border-white/10 dark:bg-[#152118] dark:hover:bg-[#243228]"
                      href={course.href}
                      key={course.id}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="flex items-center justify-between gap-2 font-semibold text-[#18331b] dark:text-[#e8f3e6]">
                        <span className="flex items-center gap-2">
                          <BookOpen aria-hidden="true" className="h-4 w-4 shrink-0 text-[#2ca949]" />
                          {course.name}
                        </span>
                        <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
                      </span>
                      <span className="mt-1 block text-xs text-[#687669] dark:text-[#a8b7a6]">
                        {course.difficulty} · {course.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            {isThinking ? (
              <p className="text-sm text-[#687669] dark:text-[#a8b7a6]" role="status">
                Asking Grok…
              </p>
            ) : null}
          </div>

          {messages.length === 1 ? (
            <div className="flex flex-wrap gap-2 border-t border-[#e5ecdf] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#152118]">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  className="rounded-full border border-[#dce6d7] px-3 py-1.5 text-xs font-medium text-[#425344] transition hover:border-[#3cc74f] hover:bg-[#f4fbf2] disabled:opacity-50 dark:border-white/15 dark:text-[#d5e6d2] dark:hover:bg-[#243228]"
                  disabled={isThinking}
                  key={prompt}
                  onClick={() => void sendMessage(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}

          <form
            className="flex items-center gap-2 border-t border-[#e5ecdf] bg-white p-3 dark:border-white/10 dark:bg-[#152118]"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <input
              aria-label="Ask Omni Guide for a course recommendation"
              className="min-w-0 flex-1 rounded-full bg-[#f3f6f0] px-4 py-3 text-sm text-[#243327] outline-none placeholder:text-[#899489] focus:ring-2 focus:ring-[#3cc74f]/50 dark:bg-[#101910] dark:text-[#e8f3e6] dark:placeholder:text-[#8ea48c]"
              onChange={(event) => setInput(event.target.value)}
              placeholder="What would you like to learn?"
              value={input}
            />
            <button
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3cc74f] text-[#102312] transition hover:bg-[#31b643] disabled:opacity-50"
              disabled={!input.trim() || isThinking}
              type="submit"
            >
              <Send aria-hidden="true" className="h-4 w-4" />
            </button>
          </form>
          <p className="bg-white px-4 pb-3 text-center text-[10px] text-[#849084] dark:bg-[#152118] dark:text-[#8ea48c]">
            Omni Guide answers with Grok using the Omni AI course catalog.
          </p>
        </section>
      ) : null}

      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close Omni Guide" : "Open Omni Guide course assistant"}
        className="flex h-14 items-center gap-2 rounded-full bg-[#3cc74f] px-5 font-semibold text-[#102312] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#31b643]"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        {isOpen ? (
          <X aria-hidden="true" className="h-5 w-5" />
        ) : (
          <MessageCircle aria-hidden="true" className="h-5 w-5" />
        )}
        {isOpen ? "Close" : "Find a course"}
      </button>
    </div>
  );
}

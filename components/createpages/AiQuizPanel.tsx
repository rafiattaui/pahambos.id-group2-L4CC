'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ChevronDown,
  Loader2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Types ────────────────────────────────────────────────────────────────────

type QuestionType = 'multiple-choice' | 'multiple-select-choice';

type Question = {
  order: number;
  dbId?: string;
  type: QuestionType;
  time?: number;
  question: string;
  answer?: string[];
  correctAnswers: number[];
  imageUrl?: string | null;
  rawImageUrl?: string | null;
  imageRemoved?: boolean;
};

interface AiQuizPanelProps {
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
  title: string;
  description: string;
}

// ── Tool call types (mirror API route) ───────────────────────────────────────

type ToolCall =
  | { tool: 'add_question'; question: Omit<Question, 'order' | 'dbId'> }
  | {
      tool: 'edit_question';
      order: number;
      patch: Partial<Omit<Question, 'order' | 'dbId'>>;
    }
  | { tool: 'remove_question'; order: number }
  | { tool: 'reorder_questions'; newOrder: number[] };

// ── Message types ─────────────────────────────────────────────────────────────

type Message =
  | { role: 'user'; content: string }
  | {
      role: 'assistant';
      content: string;
      toolCalls?: ToolCall[];
      applied?: boolean;
    };

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyToolCalls(
  questions: Question[],
  toolCalls: ToolCall[]
): Question[] {
  let q = [...questions];

  for (const call of toolCalls) {
    if (call.tool === 'add_question') {
      const padded = [...(call.question.answer ?? []), '', '', '', ''].slice(
        0,
        4
      );
      q = [
        ...q,
        {
          ...call.question,
          answer: padded,
          order: q.length,
        },
      ];
    } else if (call.tool === 'edit_question') {
      q = q.map((item) =>
        item.order === call.order ? { ...item, ...call.patch } : item
      );
    } else if (call.tool === 'remove_question') {
      q = q
        .filter((item) => item.order !== call.order)
        .map((item, i) => ({ ...item, order: i }));
    } else if (call.tool === 'reorder_questions') {
      const map = new Map(q.map((item) => [item.order, item]));
      q = call.newOrder
        .map((oldOrder, newIdx) => {
          const item = map.get(oldOrder);
          return item ? { ...item, order: newIdx } : null;
        })
        .filter(Boolean) as Question[];
    }
  }

  return q;
}

function ToolCallBadge({ call }: { call: ToolCall }) {
  const labels: Record<ToolCall['tool'], string> = {
    add_question: '➕ Add question',
    edit_question: '✏️ Edit question',
    remove_question: '🗑 Remove question',
    reorder_questions: '🔀 Reorder questions',
  };
  return (
    <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
      {labels[call.tool]}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AiQuizPanel({
  questions,
  onQuestionsChange,
  title,
  description,
}: AiQuizPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm your quiz editor assistant. I can add, edit, remove, or reorder questions — just tell me what you'd like to change.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleApply = useCallback(
    (msgIndex: number, toolCalls: ToolCall[]) => {
      const updated = applyToolCalls(questions, toolCalls);
      onQuestionsChange(updated);
      setMessages((prev) =>
        prev.map((m, i) =>
          i === msgIndex && m.role === 'assistant' ? { ...m, applied: true } : m
        )
      );
    },
    [questions, onQuestionsChange]
  );

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai-quiz-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          questions,
          title,
          description,
        }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.message ?? '',
        toolCalls: data.toolCalls ?? [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:scale-110 hover:bg-blue-700 active:scale-95"
          aria-label="Open AI assistant"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed right-6 bottom-6 z-50 flex h-[560px] w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-body text-sm font-bold text-white">
                Quiz AI Assistant
              </p>
              <p className="font-body text-xs text-blue-100">
                {questions.length} question{questions.length !== 1 ? 's' : ''}{' '}
                in quiz
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Bot className="h-3 w-3 text-blue-600" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}
                >
                  {msg.content && (
                    <div
                      className={`font-body rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'rounded-tr-sm bg-blue-600 text-white'
                          : 'rounded-tl-sm bg-slate-100 text-slate-800'
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}

                  {/* Tool call badges + apply button */}
                  {msg.role === 'assistant' &&
                    msg.toolCalls &&
                    msg.toolCalls.length > 0 && (
                      <div className="w-full space-y-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                        <p className="font-body text-xs font-semibold text-blue-700">
                          Proposed changes:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {msg.toolCalls.map((tc, j) => (
                            <ToolCallBadge key={j} call={tc} />
                          ))}
                        </div>
                        {msg.applied ? (
                          <p className="font-body text-xs font-medium text-green-600">
                            ✓ Changes applied
                          </p>
                        ) : (
                          <Button
                            size="sm"
                            className="font-body h-7 bg-blue-600 text-xs font-bold hover:bg-blue-700"
                            onClick={() => handleApply(i, msg.toolCalls!)}
                          >
                            Apply changes
                          </Button>
                        )}
                      </div>
                    )}
                </div>

                {msg.role === 'user' && (
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600">
                    <User className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <Bot className="h-3 w-3 text-blue-600" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggestions (shown only at start) */}
          {messages.length === 1 && (
            <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 px-3 py-2">
              {[
                'Add a true/false question',
                'Make question 1 multiple-select',
                'Remove the last question',
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="font-body shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-100"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-end gap-2 border-t border-slate-100 px-3 py-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me to edit your quiz…"
              className="font-body flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-all hover:bg-blue-700 disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

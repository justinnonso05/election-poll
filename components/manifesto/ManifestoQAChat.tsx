'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Candidate {
  id: string;
  name: string;
  position: string;
  photoUrl?: string | null;
}

interface ManifestoQAChatProps {
  electionId: string;
  candidates: Candidate[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function ThinkingBubble() {
  return (
    <div className="flex items-end gap-2 justify-start">
      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-semibold text-muted-foreground">
        AI
      </div>
      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}

export function ManifestoQAChat({ electionId, candidates }: ManifestoQAChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('all');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const candidateOptions = [
    { id: 'all', name: 'All Candidates', position: '' },
    ...candidates,
  ];

  const selectedCandidate = candidateOptions.find((c) => c.id === selectedCandidateId);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const body: Record<string, unknown> = {
        electionId,
        question: text,
      };

      if (selectedCandidateId !== 'all') {
        body.candidateIds = [selectedCandidateId];
      }

      const res = await fetch('/api/ai/manifesto-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          toast.error('Daily limit reached. You can only ask 5 questions per day.');
        } else {
          toast.error(json.message || 'Something went wrong');
        }
        return;
      }

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'ai',
        content: json.data?.answer || 'No answer available.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-[600px] rounded-xl border bg-card overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center">
            <span className="text-background text-xs font-bold">AI</span>
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Manifesto Assistant</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Powered by Gemini 2.5 Flash
            </p>
          </div>
        </div>

        {/* Candidate Selector */}
        <Select value={selectedCandidateId} onValueChange={setSelectedCandidateId}>
          <SelectTrigger className="w-48 h-8 text-xs">
            <SelectValue>
              <span className="truncate">
                {selectedCandidateId === 'all'
                  ? 'All Candidates'
                  : (selectedCandidate?.name ?? 'Select candidate')}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">
              All Candidates
            </SelectItem>
            {candidates.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-sm">
                <div className="flex flex-col">
                  <span>{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.position}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-12">
            <p className="text-sm font-medium text-foreground">Ask about candidate manifestos</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Select a candidate or ask about all of them. You have 5 questions per day.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'ai' && (
              <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 text-xs font-bold text-background">
                AI
              </div>
            )}

            <div className="max-w-[75%]">
              <div
                className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-foreground text-background rounded-2xl rounded-br-sm'
                    : 'bg-muted text-foreground rounded-2xl rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
              <p
                className={`text-[10px] text-muted-foreground mt-1 ${
                  msg.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                {formatTime(msg.timestamp)}
              </p>
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-semibold text-muted-foreground">
                U
              </div>
            )}
          </div>
        ))}

        {isLoading && <ThinkingBubble />}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t flex-shrink-0 flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question... (Enter to send)"
          className="flex-1 min-h-[40px] max-h-[120px] resize-none text-sm rounded-xl py-2.5 px-3"
          disabled={isLoading}
          rows={1}
        />
        <Button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          size="icon"
          className="h-10 w-10 rounded-xl flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
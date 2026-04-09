"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  Reply,
  Bot,
  User,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
} from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import { queryGemini, validatePortfolioQuery } from "@/lib/gemini";
import { useToast } from "./use-toast";

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
  reactions?: {
    liked: boolean;
    disliked: boolean;
  };
}

interface Profile {
  full_name: string;
  bio: string;
  role: string;
  avatar_url?: string;
  skills?: string[];
  projects?: any[];
  experience?: any[];
}

interface ChatWidgetProps {
  profile: Profile;
  className?: string;
  initialOpen?: boolean;
  speakGreeting?: boolean;
  onSpeakGreetingDone?: () => void;
}

interface Profile {
  full_name: string;
  bio: string;
  role: string;
  avatar_url?: string;
  skills?: string[];
  projects?: any[];
  experience?: any[];
}

const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-1 p-3">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-[#C6A86B]/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-[#C6A86B]/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-[#C6A86B]/60 rounded-full animate-bounce"></div>
      </div>
      <span className="text-[#F5F1E8]/60 text-sm ml-2">Typing...</span>
    </div>
  );
};

const MessageBubble = ({
  message,
  isLast,
  onReply,
  onReaction,
  profile,
}: {
  message: ChatMessage;
  isLast: boolean;
  onReply?: (messageText: string) => void;
  onReaction?: (messageId: string, type: "like" | "dislike") => void;
  profile: Profile;
}) => {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      className={`flex ${message.isUser ? "justify-end" : "justify-start"} ${isLast ? "mb-3" : "mb-5"} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar for bot messages */}
      {!message.isUser && (
        <div className="w-8 h-8 rounded-full bg-[#C6A86B] flex items-center justify-center mr-3 mt-1 flex-shrink-0 overflow-hidden">
          <Bot className="w-5 h-5 text-[#0B0B0C]" />
        </div>
      )}

      <div className="flex flex-col max-w-[100%] sm:max-w-[85%]">
        <div
          className={cn(
            "p-3 sm:p-4 rounded-2xl text-sm relative shadow-lg backdrop-blur-sm break-words",
            message.isUser
              ? "bg-[#C6A86B] text-[#0B0B0C] ml-auto"
              : "bg-[#1A1A1A] text-[#F5F1E8]/95 border border-[#222222]",
          )}
        >
          {/* Message tail */}
          {!message.isUser && (
            <div className="absolute -left-2 top-4 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-[#1A1A1A]"></div>
          )}
          {message.isUser && (
            <div className="absolute -right-2 top-4 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[10px] border-l-[#C6A86B]"></div>
          )}

          {/* Message content */}
          <div className="space-y-2">
            <p className="leading-relaxed whitespace-pre-wrap">
              {message.text}
            </p>

            {/* Timestamp and status */}
            <div className="flex items-center justify-between text-xs opacity-70">
              <span>
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {message.isUser && (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                  <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                  <span className="text-xs">Delivered</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message actions */}
        <AnimatePresence>
          {showActions && !message.isUser && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-1 mt-2 ml-2"
            >
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-[#F5F1E8]/60 hover:text-[#F5F1E8] hover:bg-[#C6A86B]/10"
                onClick={() => onReply?.(message.text)}
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-[#F5F1E8]/60 hover:text-[#F5F1E8] hover:bg-[#C6A86B]/10"
                onClick={handleCopy}
              >
                <Copy className="w-3 h-3 mr-1" />
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={`h-6 px-2 text-xs hover:bg-[#C6A86B]/10 ${
                  message.reactions?.liked
                    ? "text-[#C6A86B]"
                    : "text-[#F5F1E8]/60 hover:text-[#F5F1E8]"
                }`}
                onClick={() => onReaction?.(message.id, "like")}
              >
                <ThumbsUp className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={`h-6 px-2 text-xs hover:bg-[#C6A86B]/10 ${
                  message.reactions?.disliked
                    ? "text-red-400"
                    : "text-[#F5F1E8]/60 hover:text-[#F5F1E8]"
                }`}
                onClick={() => onReaction?.(message.id, "dislike")}
              >
                <ThumbsDown className="w-3 h-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Avatar for user messages */}
      {message.isUser && (
        <div className="w-8 h-8 rounded-full bg-[#222222] border border-[#C6A86B]/30 flex items-center justify-center ml-3 mt-1 flex-shrink-0">
          <User className="w-4 h-4 text-[#C6A86B]" />
        </div>
      )}
    </motion.div>
  );
};

const SuggestedQuestions = ({
  onQuestionClick,
  profile,
}: {
  onQuestionClick: (question: string) => void;
  profile: Profile;
}) => {
  const questions = [
    `What are ${profile.full_name.split(" ")[0]}'s main technical skills?`,
    `Tell me about ${profile.full_name.split(" ")[0]}'s recent projects`,
    `What's ${profile.full_name.split(" ")[0]}'s development experience?`,
    `Am I suitable for your job?`,
    `How can I contact ${profile.full_name.split(" ")[0]} for work?`,
  ];

  return (
    <div className="space-y-2 p-3 sm:p-4">
      <p className="text-[#F5F1E8]/60 text-xs sm:text-sm mb-3 text-center">
        Ask me anything about {profile.full_name}'s portfolio!
      </p>
      {questions.map((question, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onQuestionClick(question)}
          className="block w-full text-left text-xs text-[#F5F1E8]/50 hover:text-[#F5F1E8]/80 p-2 sm:p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#222222] transition-all duration-200 border border-[#222222] hover:border-[#C6A86B]/30 line-clamp-2"
        >
          {question}
        </motion.button>
      ))}
    </div>
  );
};

export default function ChatWidget({ profile, className, initialOpen, speakGreeting, onSpeakGreetingDone }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [queryCount, setQueryCount] = useState(0);
  const [lastQueryTime, setLastQueryTime] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialOpen) setIsOpen(true);
  }, [initialOpen]);

  // Auto-enable voice mode and speak greeting when avatar accepts
  useEffect(() => {
    if (!speakGreeting) return;
    setVoiceMode(true);
    const greeting = `Hi there! I'm Ramya's AI portfolio assistant. Feel free to ask me anything about Ramya's skills, projects, or experience!`;
    setTimeout(() => {
      speakText(greeting);
      onSpeakGreetingDone?.();
    }, 900);
  }, [speakGreeting]); // intentionally not depending on voiceMode

  const phonetic = (text: string): string =>
    text
      // possessive must come first so the apostrophe doesn't merge into the vowel
      .replace(/Ramya\s+Lakhani's/gi, "Rum-yah Laakhaani's")
      .replace(/Ramya\s+Lakhani/gi, 'Rum-yah Laakhaani')
      .replace(/Ramya's/gi, "Rum-yah's")
      .replace(/Ramya/gi, 'Rum-yah')
      .replace(/Lakhani's/gi, "Laakhaani's")
      .replace(/Lakhani/gi, 'Laakhaani');

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const doSpeak = (voices: SpeechSynthesisVoice[]) => {
      const utterance = new SpeechSynthesisUtterance(phonetic(text));
      utterance.rate = 0.92;
      utterance.pitch = 1.05;
      utterance.volume = 1;
      // Prefer a natural-sounding en-US voice; fall back to any English, then any voice
      // Prefer a natural-sounding male English voice
      const preferred =
        voices.find(v => /google uk english male/i.test(v.name)) ||
        voices.find(v => /microsoft david|microsoft mark|microsoft guy/i.test(v.name)) ||
        voices.find(v => /^alex$|^daniel$|^oliver$|^fred$/i.test(v.name)) ||
        voices.find(v => v.lang.startsWith('en') && /male/i.test(v.name)) ||
        voices.find(v => v.lang.startsWith('en-US') && !/female|samantha|zira|victoria|karen|moira|susan|linda/i.test(v.name)) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0];
      if (preferred) utterance.voice = preferred;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      doSpeak(voices);
    } else {
      // Chrome loads voices asynchronously — wait for the event
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        doSpeak(window.speechSynthesis.getVoices());
      };
      // Kick Chrome into loading voices
      window.speechSynthesis.getVoices();
    }
  };

  // Wrap speak so it respects voiceMode for AI responses
  const speak = (text: string) => {
    if (!voiceMode) return;
    speakText(text);
  };

  const startListening = () => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast({ title: "Voice input not supported", description: "Try Chrome or Edge browser.", variant: "destructive" });
      return;
    }

    // Stop any previous session and reset accumulated text
    recognitionRef.current?.abort();
    finalTranscriptRef.current = '';
    setInput('');

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;        // keep listening until user clicks stop
    recognition.interimResults = true;    // show words as they're spoken
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += result[0].transcript + ' ';
        } else {
          interim = result[0].transcript;
        }
      }
      // final text + live interim preview
      setInput((finalTranscriptRef.current + interim).trim());
    };

    recognition.onerror = (event: any) => {
      // 'no-speech' is normal — just restart silently
      if (event.error === 'no-speech') {
        recognition.stop();
        recognition.start();
        return;
      }
      setIsListening(false);
    };

    // With continuous=true, onend fires only when we call stop() or an unrecoverable error
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  };

  // Rate limiting check
  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const timeSinceLastQuery = now - lastQueryTime;

    if (timeSinceLastQuery < 20000) {
      // 20 seconds between queries
      if (queryCount >= 3) {
        toast({
          title: "Rate limit reached",
          description:
            "Please wait a moment before asking another question. Limit: 3 queries per minute.",
          variant: "destructive",
        });
        return false;
      }
    } else {
      setQueryCount(0);
    }

    return true;
  };

  const handleReply = (messageText: string) => {
    setReplyingTo(messageText);
    setInput(
      `Regarding "${messageText.substring(0, 50)}${messageText.length > 50 ? "..." : ""}": `,
    );
  };

  const handleReaction = (messageId: string, type: "like" | "dislike") => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            reactions: {
              liked: type === "like" ? !msg.reactions?.liked : false,
              disliked: type === "dislike" ? !msg.reactions?.disliked : false,
            },
          };
        }
        return msg;
      }),
    );
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    // Rate limiting
    if (!checkRateLimit()) return;

    // Input validation
    if (text.length > 500) {
      toast({
        title: "Message too long",
        description: "Please keep your question under 500 characters.",
        variant: "destructive",
      });
      return;
    }

    // Validate if question is portfolio-related
    if (!validatePortfolioQuery(text)) {
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        text: `I can only answer questions about ${profile.full_name}'s portfolio, skills, and professional experience. Please ask about their technical background or projects.`,
        isUser: false,
        timestamp: new Date(),
        reactions: { liked: false, disliked: false },
      };
      setMessages((prev) => [...prev, botMessage]);
      setInput("");
      setReplyingTo(null);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setReplyingTo(null);
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: "typing",
      text: "Analyzing your question...",
      isUser: false,
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingMessage]);

    try {
      const response = await queryGemini(text, profile);

      // Remove typing indicator and add real response
      setMessages((prev) => prev.filter((msg) => msg.id !== "typing"));

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
        reactions: { liked: false, disliked: false },
      };

      setMessages((prev) => [...prev, botMessage]);
      setQueryCount((prev) => prev + 1);
      setLastQueryTime(Date.now());
      if (voiceMode) speak(response);
    } catch (error) {
      console.error("Chat error:", error);

      // Remove typing indicator
      setMessages((prev) => prev.filter((msg) => msg.id !== "typing"));

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble right now. Please try again later or contact directly through the form.",
        isUser: false,
        timestamp: new Date(),
        reactions: { liked: false, disliked: false },
      };
      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: "Connection error",
        description: "Unable to process your question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className={cn("fixed bottom-2 sm:bottom-4 right-2 sm:right-4 md:bottom-6 md:right-6 z-50", className)}>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`absolute bottom-14 sm:bottom-16 md:bottom-20 right-0 bg-[#111111]/95 backdrop-blur-2xl border border-[#222222] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
              isMinimized ? "w-64 sm:w-72 md:w-80 h-16" : "w-[min(calc(100vw-1rem),calc(100vw-2rem))] sm:w-80 md:w-96 max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-8rem)]"
            }`}
          >
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-[#222222] bg-[#0B0B0C]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#C6A86B] flex items-center justify-center relative overflow-hidden flex-shrink-0">
                    <Bot className="w-5 h-5 text-[#0B0B0C]" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0B0B0C] animate-pulse"></div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[#F5F1E8] font-medium text-sm truncate">
                      Ramya's Portfolio Assistant
                    </h3>
                    <p className="text-[#F5F1E8]/60 text-xs flex items-center gap-1 truncate">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></span>
                      <span className="truncate">Online</span>
                      {isSpeaking && (
                        <div className="flex items-center gap-0.5 ml-1">
                          {[0,1,2].map(i => (
                            <div key={i} className={`w-0.5 bg-[#C6A86B] rounded-full animate-bounce`}
                              style={{ height: `${6 + i * 3}px`, animationDelay: `${i * 0.1}s` }} />
                          ))}
                        </div>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => {
                      setVoiceMode(!voiceMode);
                      if (voiceMode) {
                        window.speechSynthesis?.cancel();
                        setIsSpeaking(false);
                      }
                    }}
                    className="text-[#F5F1E8]/60 hover:text-[#F5F1E8] transition-colors p-1 rounded-full hover:bg-[#C6A86B]/10"
                    title={voiceMode ? "Disable voice" : "Enable voice"}
                  >
                    {voiceMode ? <Volume2 className="w-4 h-4 text-[#C6A86B]" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="text-[#F5F1E8]/60 hover:text-[#F5F1E8] transition-colors p-1 rounded-full hover:bg-[#C6A86B]/10"
                  >
                    {isMinimized ? (
                      <Maximize2 className="w-4 h-4" />
                    ) : (
                      <Minimize2 className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-[#F5F1E8]/60 hover:text-[#F5F1E8] transition-colors p-1 rounded-full hover:bg-[#C6A86B]/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <div className="h-40 sm:h-48 md:h-60 lg:h-80 overflow-y-auto p-3 sm:p-4 space-y-2 custom-scrollbar">
                {messages.length === 0 ? (
                  <SuggestedQuestions
                    onQuestionClick={handleSendMessage}
                    profile={profile}
                  />
                ) : (
                  messages.map((message, index) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isLast={index === messages.length - 1}
                      onReply={handleReply}
                      onReaction={handleReaction}
                      profile={profile}
                    />
                  ))
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input */}
            {!isMinimized && (
              <form
                onSubmit={handleSubmit}
                className="p-3 sm:p-4 border-t border-[#222222] bg-[#0B0B0C]/80"
              >
                {replyingTo && (
                  <div className="mb-3 p-2 bg-[#1A1A1A] rounded-lg border border-[#222222]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-[#F5F1E8]/60">
                        <Reply className="w-3 h-3" />
                        <span>Replying to:</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo(null);
                          setInput("");
                        }}
                        className="text-[#F5F1E8]/40 hover:text-[#F5F1E8]/60"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-[#F5F1E8]/50 mt-1 truncate">
                      "{replyingTo.substring(0, 60)}..."
                    </p>
                  </div>
                )}
                <div className="flex gap-1.5 sm:gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-[#1A1A1A] border-[#222222] text-[#F5F1E8] placeholder:text-[#F5F1E8]/40 focus:border-[#C6A86B] focus:ring-[#C6A86B]/20 rounded-xl text-xs sm:text-sm h-9 sm:h-10"
                    maxLength={500}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`h-9 sm:h-10 w-9 sm:w-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                      isListening
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-[#1A1A1A] border border-[#222222] text-[#F5F1E8]/60 hover:text-[#C6A86B] hover:border-[#C6A86B]/30"
                    }`}
                    title={isListening ? "Stop listening" : "Speak your question"}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!input.trim() || isLoading}
                    className="bg-[#C6A86B] hover:bg-[#D4B87A] text-[#0B0B0C] border-0 px-2.5 sm:px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex-shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-2 text-xs text-[#F5F1E8]/40">
                  <span>{input.length}/500 characters</span>
                  <div className="flex items-center gap-2">
                    <span>Queries: {3 - queryCount}/3 remaining</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Ready</span>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Minimized quick input */}
            {isMinimized && (
              <div className="px-2 sm:px-4 py-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask..."
                    className="flex-1 bg-[#1A1A1A] border-[#222222] text-[#F5F1E8] placeholder:text-[#F5F1E8]/40 text-xs h-7 sm:h-8"
                    onFocus={() => setIsMinimized(false)}
                  />
                  <Button
                    size="sm"
                    onClick={() => setIsMinimized(false)}
                    className="bg-[#C6A86B] hover:bg-[#D4B87A] text-[#0B0B0C] h-7 sm:h-8 px-1.5 sm:px-2 text-xs flex-shrink-0"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 sm:w-14 sm:h-14 bg-[#C6A86B] hover:bg-[#D4B87A] rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[#C6A86B]/25"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6 text-[#0B0B0C]" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="w-6 h-6 text-[#0B0B0C]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

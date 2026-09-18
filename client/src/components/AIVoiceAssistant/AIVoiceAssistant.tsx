import React, { useState, useEffect, useRef } from 'react';
import { useAgriStore } from '../../context/useAgriStore';
import { SUPPORTED_LANGUAGES, type PreferredLanguage } from '@types';
import { SpeechProvider } from '../../services/voice/speechProvider';
import { AssistantService } from '../../services/voice/assistantService';
import { AudioWaveform } from './AudioWaveform';
import { t, isRTL } from '../../services/i18n';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  audioBase64?: string;
}

export const AIVoiceAssistant: React.FC = () => {
  const { language: appLanguage, showToast } = useAgriStore();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [syncWithApp, setSyncWithApp] = useState<boolean>(true);
  const [assistantLanguage, setAssistantLanguage] = useState<PreferredLanguage>(appLanguage);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);

  // Speech & Audio States
  const [isListening, setIsListening] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep assistant language synced with application language if syncWithApp is enabled
  useEffect(() => {
    if (syncWithApp) {
      setAssistantLanguage(appLanguage);
    }
  }, [appLanguage, syncWithApp]);

  // Scroll to bottom when messages update or panel opens
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isThinking]);

  // Initial greeting and suggested prompts when language changes or first load
  useEffect(() => {
    const welcome = t('assistant.welcomeMessage', assistantLanguage);
    const defaults = [
      t('assistant.quickMandi', assistantLanguage),
      t('assistant.quickEscrow', assistantLanguage),
      t('assistant.quickLogistics', assistantLanguage),
      t('assistant.quickSell', assistantLanguage),
    ];
    setSuggestedPrompts(defaults);

    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'assistant',
          text: welcome,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [assistantLanguage]);

  // Cleanup active audio when unmounting
  useEffect(() => {
    return () => {
      SpeechProvider.stopSpeaking();
      SpeechProvider.stopListening();
    };
  }, []);

  const handleSendMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed) return;

    SpeechProvider.stopSpeaking();
    setIsSpeaking(false);
    setSpeakingMessageId(null);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsThinking(true);

    try {
      const response = await AssistantService.sendMessage({
        message: trimmed,
        language: assistantLanguage,
        synthesizeSpeech: autoSpeak,
        history: messages.map((m) => ({ sender: m.sender, text: m.text })),
      });

      const assistantMsgId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioBase64: response.audioBase64,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (response.suggestedPrompts?.length) {
        setSuggestedPrompts(response.suggestedPrompts);
      }

      // Auto-speak response if enabled
      if (autoSpeak) {
        playAssistantSpeech(assistantMessage);
      }
    } catch (err) {
      console.error('[AIVoiceAssistant] Error sending message:', err);
      showToast(t('assistant.errorState', assistantLanguage), 'error');
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: 'assistant',
          text: t('assistant.errorState', assistantLanguage),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleMicToggle = async () => {
    if (isListening) {
      // Stop listening and process whatever was captured
      setIsListening(false);
      setAudioLevel(0);
      await SpeechProvider.stopListening();
      if (inputValue.trim()) {
        handleSendMessage(inputValue);
      }
    } else {
      // Start listening
      SpeechProvider.stopSpeaking();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      setIsListening(true);

      await SpeechProvider.startListening(assistantLanguage, {
        onTranscript: (transcript, isFinal) => {
          setInputValue(transcript);
          if (isFinal && transcript.trim().length > 3) {
            // Auto-send upon final transcript pause
            setIsListening(false);
            setAudioLevel(0);
            SpeechProvider.stopListening();
            handleSendMessage(transcript);
          }
        },
        onAudioLevel: (lvl) => {
          setAudioLevel(lvl);
        },
        onError: (err) => {
          console.warn('[AIVoiceAssistant] Speech recognition error:', err);
          setIsListening(false);
          setAudioLevel(0);
        },
      });
    }
  };

  const playAssistantSpeech = (msg: ChatMessage) => {
    if (speakingMessageId === msg.id && isSpeaking) {
      SpeechProvider.stopSpeaking();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }

    SpeechProvider.stopSpeaking();
    setIsSpeaking(true);
    setSpeakingMessageId(msg.id);

    SpeechProvider.speakText(msg.text, assistantLanguage, msg.audioBase64, () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    });
  };

  const handleClearChat = () => {
    SpeechProvider.stopSpeaking();
    setIsSpeaking(false);
    setSpeakingMessageId(null);
    setMessages([
      {
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: t('assistant.welcomeMessage', assistantLanguage),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const isAssistantRTL = isRTL(assistantLanguage);

  return (
    <>
      {/* 1. FLOATING ACTION LAUNCHER BUTTON */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 150);
            }
          }}
          className={`group relative flex items-center gap-2.5 px-4 py-3 rounded-full shadow-elevation-3 transition-all duration-300 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
            isOpen
              ? 'bg-secondary text-on-secondary scale-95 shadow-secondary/30'
              : 'bg-primary text-on-primary hover:bg-primary-container hover:scale-105 active:scale-95 shadow-primary/30'
          }`}
          aria-label={t('assistant.floatingLabel', appLanguage)}
          title={t('assistant.title', appLanguage)}
        >
          {/* Subtle glowing pulse ring */}
          <span className="absolute -inset-1 rounded-full bg-secondary/30 animate-ping opacity-40 group-hover:opacity-80 -z-10" />

          <div className="relative flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px] text-secondary-fixed">
              {isOpen ? 'chat_bubble' : 'smart_toy'}
            </span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-secondary border-2 border-primary" />
          </div>

          <div className="flex flex-col items-start text-left">
            <span className="text-xs font-bold leading-none tracking-wide text-secondary-fixed">
              {t('assistant.floatingLabel', appLanguage)}
            </span>
            <span className="text-[10px] text-primary-fixed-dim font-medium leading-tight">
              {SUPPORTED_LANGUAGES[assistantLanguage]?.nativeName || '22 Languages'}
            </span>
          </div>
        </button>
      </div>

      {/* 2. EXPANDABLE CONVERSATIONAL ASSISTANT PANEL */}
      {isOpen && (
        <div
          role="dialog"
          aria-labelledby="assistant-title"
          className="fixed bottom-22 right-4 sm:right-6 z-50 w-[94vw] sm:w-[440px] max-h-[82vh] sm:max-h-[640px] flex flex-col bg-surface-container-lowest border border-outline-variant shadow-elevation-3 rounded-2xl overflow-hidden animate-fadeIn transition-all duration-200"
        >
          {/* A. HEADER */}
          <div className="p-3.5 sm:p-4 bg-primary text-on-primary border-b border-outline-variant flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-container text-secondary-fixed flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </div>
              <div>
                <h3 id="assistant-title" className="font-bold text-sm text-secondary-fixed leading-tight">
                  {t('assistant.title', assistantLanguage)}
                </h3>
                <div className="flex items-center gap-1 text-[11px] text-primary-fixed-dim">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  <span>{t('assistant.statusOnline', assistantLanguage)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Clear chat history */}
              <button
                type="button"
                onClick={handleClearChat}
                className="w-8 h-8 rounded-lg hover:bg-primary-container text-primary-fixed flex items-center justify-center transition-colors select-none cursor-pointer"
                title={t('assistant.clearChat', assistantLanguage)}
                aria-label="Clear chat"
              >
                <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
              </button>

              {/* Close panel */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  SpeechProvider.stopSpeaking();
                  SpeechProvider.stopListening();
                  setIsListening(false);
                  setIsSpeaking(false);
                }}
                className="w-8 h-8 rounded-lg hover:bg-primary-container text-primary-fixed flex items-center justify-center transition-colors select-none cursor-pointer"
                title={t('common.close', assistantLanguage)}
                aria-label="Close assistant"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* B. CONTROLS & LANGUAGE BAR */}
          <div className="px-3 py-2 bg-surface-container-low border-b border-outline-variant flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Assistant Language Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">translate</span>
              <select
                value={assistantLanguage}
                onChange={(e) => {
                  const newLang = e.target.value as PreferredLanguage;
                  setAssistantLanguage(newLang);
                  setSyncWithApp(false);
                }}
                className="bg-surface-container-lowest text-primary font-bold text-xs py-1 px-2 rounded-lg border border-outline-variant focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                aria-label="Select Assistant Language"
              >
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, meta]) => (
                  <option key={code} value={code}>
                    {meta.nativeName} ({meta.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 cursor-pointer select-none text-[11px] text-on-surface-variant hover:text-primary">
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                  className="rounded text-primary focus:ring-secondary cursor-pointer"
                />
                <span className="material-symbols-outlined text-[15px] text-secondary">volume_up</span>
                <span className="hidden sm:inline">{t('assistant.autoSpeak', assistantLanguage)}</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setSyncWithApp(!syncWithApp);
                  if (!syncWithApp) {
                    setAssistantLanguage(appLanguage);
                  }
                }}
                className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors ${
                  syncWithApp
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'text-outline hover:text-primary'
                }`}
                title="Synchronize assistant language with current application screen language"
              >
                {syncWithApp ? '✓ Synced' : 'Sync Screen'}
              </button>
            </div>
          </div>

          {/* C. MESSAGES SCROLLABLE BODY */}
          <div
            className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 min-h-[220px] max-h-[380px] bg-surface"
            dir={isAssistantRTL ? 'rtl' : 'ltr'}
          >
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isCurrentSpeaking = speakingMessageId === msg.id && isSpeaking;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-primary text-secondary-fixed flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                    </div>
                  )}

                  <div className={`max-w-[84%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-primary text-on-primary rounded-tr-none'
                          : 'bg-surface-container-low text-on-surface border border-outline-variant rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>

                      {/* Read Aloud Button for Assistant Messages */}
                      {!isUser && (
                        <div className="mt-2 pt-1.5 border-t border-outline-variant/40 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => playAssistantSpeech(msg)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all select-none cursor-pointer ${
                              isCurrentSpeaking
                                ? 'bg-secondary text-on-secondary shadow-xs animate-pulse'
                                : 'bg-surface-container hover:bg-surface-variant text-secondary'
                            }`}
                            title={isCurrentSpeaking ? t('assistant.stopSpeaking', assistantLanguage) : t('assistant.speakResponse', assistantLanguage)}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {isCurrentSpeaking ? 'stop' : 'volume_up'}
                            </span>
                            <span>
                              {isCurrentSpeaking
                                ? t('assistant.stopSpeaking', assistantLanguage)
                                : t('assistant.speakResponse', assistantLanguage)}
                            </span>
                          </button>

                          {isCurrentSpeaking && (
                            <AudioWaveform isActive={true} audioLevel={60} barCount={5} colorClass="bg-secondary" />
                          )}
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-outline mt-1 px-1">{msg.timestamp}</span>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-secondary text-on-secondary flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <span className="material-symbols-outlined text-[16px]">person</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Thinking / Analyzing Indicator */}
            {isThinking && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary text-secondary-fixed flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-2xl rounded-tl-none border border-outline-variant text-xs text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary animate-spin">progress_activity</span>
                  <span>{t('assistant.thinking', assistantLanguage)}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* D. QUICK PROMPTS CHIPS */}
          {suggestedPrompts.length > 0 && (
            <div className="px-3 py-2 bg-surface-container-lowest border-t border-outline-variant overflow-x-auto flex items-center gap-1.5 scrollbar-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline shrink-0 mr-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-secondary">lightbulb</span>
              </span>
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-secondary-container hover:text-on-secondary-container text-primary border border-outline-variant transition-all select-none cursor-pointer active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* E. INPUT & MICROPHONE TRAY */}
          <div className="p-3 bg-surface-container-low border-t border-outline-variant">
            {/* Live recording status & waveform */}
            {isListening && (
              <div className="mb-2 p-2 rounded-xl bg-error-container/20 border border-error/30 flex items-center justify-between text-xs animate-pulse">
                <div className="flex items-center gap-2 text-error font-bold">
                  <span className="w-2 h-2 rounded-full bg-error animate-ping" />
                  <span>{t('assistant.listeningFeedback', assistantLanguage)} ({SUPPORTED_LANGUAGES[assistantLanguage]?.nativeName})</span>
                </div>
                <AudioWaveform isActive={true} audioLevel={audioLevel} barCount={9} colorClass="bg-error" />
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex items-center gap-2"
            >
              {/* Vernacular Speech Microphone Button */}
              <button
                type="button"
                onClick={handleMicToggle}
                className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-all select-none cursor-pointer shadow-sm active:scale-95 ${
                  isListening
                    ? 'bg-error text-white animate-pulse border-2 border-error-container'
                    : 'bg-primary text-on-primary hover:bg-primary-container'
                }`}
                title={isListening ? 'Stop listening and send' : 'Speak with your voice'}
                aria-label="Voice input"
              >
                <span className="material-symbols-outlined text-[22px] text-secondary-fixed">
                  {isListening ? 'stop' : 'mic'}
                </span>
              </button>

              {/* Text Input Field */}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('assistant.inputPlaceholder', assistantLanguage)}
                dir={isAssistantRTL ? 'rtl' : 'ltr'}
                className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all select-none cursor-pointer active:scale-95 shadow-xs"
                title="Send Message"
                aria-label="Send message"
              >
                <span className="material-symbols-outlined text-[20px] rtl-flip">send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

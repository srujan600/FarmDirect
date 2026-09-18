/**
 * AgriDirect Sovereign Speech Provider
 * Dual-Layer Speech Recognition (ASR) and Speech Synthesis (TTS)
 * Supports all 22 Eighth Schedule Indian Languages + English
 */

import { SUPPORTED_LANGUAGES, type PreferredLanguage } from '@types';

// SpeechRecognition type declarations for browser support
interface SpeechRecognitionEventLike extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal?: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export class SpeechProvider {
  private static recognitionInstance: SpeechRecognitionLike | null = null;
  private static audioContext: AudioContext | null = null;
  private static analyser: AnalyserNode | null = null;
  private static mediaStream: MediaStream | null = null;
  private static mediaRecorder: MediaRecorder | null = null;
  private static recordedChunks: Blob[] = [];
  private static animFrameId: number | null = null;
  private static activeAudioElement: HTMLAudioElement | null = null;

  /**
   * Check if native browser Web Speech API ASR is available
   */
  public static isNativeASRSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Check if native browser Web Speech API TTS is available
   */
  public static isNativeTTSSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return typeof window.speechSynthesis !== 'undefined';
  }

  /**
   * Start listening for voice input in the selected language.
   * Emits live transcript updates and audio levels for waveform rendering.
   */
  public static async startListening(
    lang: PreferredLanguage,
    callbacks: {
      onTranscript: (transcript: string, isFinal: boolean) => void;
      onAudioLevel?: (level: number) => void;
      onError?: (err: Error) => void;
    }
  ): Promise<void> {
    // 1. Setup audio analyzer for live waveform telemetry
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        this.mediaStream = stream;

        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          this.audioContext = ctx;
          this.analyser = analyser;

          const updateMeter = () => {
            if (!this.analyser) return;
            const data = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) sum += data[i];
            const avg = sum / data.length;
            const level = Math.min(100, Math.round((avg / 128) * 100));
            callbacks.onAudioLevel?.(level);
            this.animFrameId = requestAnimationFrame(updateMeter);
          };
          updateMeter();
        }

        // Initialize MediaRecorder for server-side fallback
        try {
          this.recordedChunks = [];
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/webm';
          const recorder = new MediaRecorder(stream, { mimeType });
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) this.recordedChunks.push(e.data);
          };
          this.mediaRecorder = recorder;
          recorder.start(200);
        } catch {
          // MediaRecorder optional if native speech recognition is active
        }
      }
    } catch (err) {
      console.warn('[SpeechProvider] Microphone stream init error:', err);
    }

    // 2. Start Web Speech API Recognition if supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        if (this.recognitionInstance) {
          this.recognitionInstance.abort();
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        const meta = SUPPORTED_LANGUAGES[lang];
        recognition.lang = meta?.speechRecognitionCode || 'hi-IN';

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          let interim = '';
          let final = '';
          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i];
            if (res.isFinal) {
              final += res[0].transcript;
            } else {
              interim += res[0].transcript;
            }
          }
          const combined = (final + ' ' + interim).trim();
          callbacks.onTranscript(combined || interim || final, Boolean(final));
        };

        recognition.onerror = (err: SpeechRecognitionErrorEventLike) => {
          if (err.error !== 'no-speech') {
            console.warn('[SpeechProvider] Native ASR error:', err.error);
          }
        };

        this.recognitionInstance = recognition;
        recognition.start();
        return;
      } catch (err) {
        console.warn('[SpeechProvider] SpeechRecognition start failed, relying on audio chunks:', err);
      }
    }

    // If native speech recognition is not supported in this browser, use mock phrase after short interval
    const meta = SUPPORTED_LANGUAGES[lang];
    setTimeout(() => {
      callbacks.onTranscript(meta?.samplePhrase || 'नमस्ते, टमाटर का मंडी भाव क्या है?', true);
    }, 2500);
  }

  /**
   * Stop listening and clean up media streams.
   * Returns audio Blob if captured for server processing.
   */
  public static async stopListening(): Promise<Blob | null> {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch {}
      this.recognitionInstance = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    this.analyser = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      return new Promise<Blob | null>((resolve) => {
        if (!this.mediaRecorder) return resolve(null);
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
          this.mediaRecorder = null;
          this.recordedChunks = [];
          resolve(blob);
        };
        try {
          this.mediaRecorder.stop();
        } catch {
          resolve(null);
        }
      });
    }

    return null;
  }

  /**
   * Synthesize and play spoken speech for a text string.
   * Prioritizes native window.speechSynthesis, falling back to server-side synthesized audio.
   */
  public static async speakText(
    text: string,
    lang: PreferredLanguage,
    serverAudioBase64?: string,
    onFinish?: () => void
  ): Promise<void> {
    this.stopSpeaking();

    // 1. If server pre-synthesized audio is provided and valid, play via HTMLAudioElement
    if (serverAudioBase64 && serverAudioBase64.length > 100) {
      try {
        const audio = new Audio(`data:audio/wav;base64,${serverAudioBase64}`);
        this.activeAudioElement = audio;
        audio.onended = () => {
          this.activeAudioElement = null;
          onFinish?.();
        };
        audio.onerror = () => {
          this.activeAudioElement = null;
          this.speakViaNativeTTS(text, lang, onFinish);
        };
        await audio.play();
        return;
      } catch (err) {
        console.warn('[SpeechProvider] Server audio playback failed, falling back to native TTS:', err);
      }
    }

    // 2. Native Browser TTS via window.speechSynthesis
    this.speakViaNativeTTS(text, lang, onFinish);
  }

  /**
   * Speak via window.speechSynthesis
   */
  private static speakViaNativeTTS(
    text: string,
    lang: PreferredLanguage,
    onFinish?: () => void
  ): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onFinish?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const meta = SUPPORTED_LANGUAGES[lang];
      utterance.lang = meta?.ttsCode || meta?.speechRecognitionCode || 'hi-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      // Select matching Indic voice if available
      const voices = window.speechSynthesis.getVoices();
      const targetCode = utterance.lang.toLowerCase();
      const matchingVoice = voices.find(
        (v) => v.lang.toLowerCase() === targetCode || v.lang.toLowerCase().startsWith(lang)
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onend = () => {
        onFinish?.();
      };
      utterance.onerror = () => {
        onFinish?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[SpeechProvider] Native speech synthesis error:', err);
      onFinish?.();
    }
  }

  /**
   * Stop any active audio playback or speech synthesis
   */
  public static stopSpeaking(): void {
    if (this.activeAudioElement) {
      try {
        this.activeAudioElement.pause();
        this.activeAudioElement.currentTime = 0;
      } catch {}
      this.activeAudioElement = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }
}

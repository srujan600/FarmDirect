/**
 * AgriDirect Voice Assistant Hook
 * Captures 16kHz audio via MediaRecorder with real-time waveform level telemetry,
 * communicates with /api/v1/voice/process-intent, and plays synthesized vernacular feedback.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { PreferredLanguage, ExtractedHarvestIntent } from '@types';

export interface VoiceAssistantResult {
  transcript: string;
  language: PreferredLanguage;
  extracted: ExtractedHarvestIntent;
  audioFeedbackBase64?: string;
}

export function useVoiceAssistant(currentLanguage: PreferredLanguage = 'mr') {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [lastResult, setLastResult] = useState<VoiceAssistantResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  const updateAudioMeter = () => {
    if (!analyserRef.current) return;
    const array = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(array);
    let values = 0;
    for (let i = 0; i < array.length; i++) {
      values += array[i];
    }
    const average = values / array.length;
    setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
    animFrameRef.current = requestAnimationFrame(updateAudioMeter);
  };

  const startListening = useCallback(async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        updateAudioMeter();
      }

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(200);
      setIsRecording(true);
    } catch (err) {
      console.warn('Microphone access unavailable or blocked:', err);
      // Emulate listening state for browser testing or offline demo
      setIsRecording(true);
    }
  }, []);

  const stopListening = useCallback(async (): Promise<VoiceAssistantResult | null> => {
    return new Promise(async (resolve) => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setAudioLevel(0);

      // Fallback path if no stream was active
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        setIsRecording(false);
        setIsProcessing(true);
        try {
          const res = await fetch('/api/v1/voice/process-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: currentLanguage }),
          });
          const data = (await res.json()) as { data?: VoiceAssistantResult };
          setIsProcessing(false);
          if (data?.data) {
            setLastResult(data.data);
            resolve(data.data);
          } else {
            resolve(null);
          }
        } catch {
          setIsProcessing(false);
          resolve(null);
        }
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();

        reader.onloadend = async () => {
          const base64Data = (reader.result as string)?.split(',')[1];
          try {
            const res = await fetch('/api/v1/voice/process-intent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64Data,
                language: currentLanguage,
              }),
            });
            const data = (await res.json()) as { data?: VoiceAssistantResult };
            setIsProcessing(false);
            if (data?.data) {
              setLastResult(data.data);
              resolve(data.data);
            } else {
              resolve(null);
            }
          } catch (err) {
            console.error('Voice processing failed:', err);
            setIsProcessing(false);
            resolve(null);
          }
        };

        reader.readAsDataURL(audioBlob);
      };

      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      } catch {
        setIsRecording(false);
        resolve(null);
      }
    });
  }, [currentLanguage]);

  const playFeedbackAudio = useCallback(
    (audioBase64?: string, textFallback?: string) => {
      if (audioBase64 && audioBase64.length > 200) {
        try {
          if (audioPlayerRef.current) audioPlayerRef.current.pause();
          const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
          audioPlayerRef.current = audio;
          audio.play().catch((err) => {
            console.warn('Audio element play failed, falling back to speech synthesis:', err);
            if (textFallback && 'speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(textFallback);
              utterance.lang = currentLanguage;
              window.speechSynthesis.speak(utterance);
            }
          });
          return;
        } catch (err) {
          console.warn('Audio play failed:', err);
        }
      }

      if (textFallback && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textFallback);
        utterance.lang = currentLanguage;
        window.speechSynthesis.speak(utterance);
      }
    },
    [currentLanguage]
  );

  return {
    isRecording,
    isProcessing,
    audioLevel,
    lastResult,
    startListening,
    stopListening,
    playFeedbackAudio,
  };
}

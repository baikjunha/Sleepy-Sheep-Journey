import { useState, useEffect, useRef, useCallback } from "react";

const TTS_ENDPOINT = `${import.meta.env.BASE_URL}api/tts`.replace("//api", "/api");

export function useSpeech(language = "ko-KR") {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthesisRef.current = window.speechSynthesis;

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = language;
      }
    }
  }, [language]);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  // Fallback to browser TTS if ElevenLabs is unavailable
  const speakWithBrowser = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!synthesisRef.current) {
        if (onEnd) onEnd();
        return;
      }
      synthesisRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.8;
      utterance.pitch = 0.9;
      utterance.volume = 0.7;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };
      synthesisRef.current.speak(utterance);
    },
    [language],
  );

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      // Stop any ongoing speech or recognition
      if (synthesisRef.current) synthesisRef.current.cancel();
      cleanupAudio();
      stopListening();

      if (!text.trim()) {
        if (onEnd) onEnd();
        return;
      }

      setIsSpeaking(true);

      void (async () => {
        try {
          const res = await fetch(TTS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });

          if (!res.ok) {
            throw new Error(`TTS request failed: ${res.status}`);
          }

          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          audioUrlRef.current = url;

          const audio = new Audio(url);
          audio.volume = 0.85;
          audioRef.current = audio;

          const finish = () => {
            setIsSpeaking(false);
            cleanupAudio();
            if (onEnd) onEnd();
          };

          audio.onended = finish;
          audio.onerror = () => {
            setIsSpeaking(false);
            cleanupAudio();
            // Fall back to browser TTS on playback error
            speakWithBrowser(text, onEnd);
          };

          await audio.play();
        } catch (err) {
          console.error("ElevenLabs TTS failed, falling back to browser", err);
          cleanupAudio();
          speakWithBrowser(text, onEnd);
        }
      })();
    },
    [cleanupAudio, speakWithBrowser],
  );

  const startListening = useCallback((onResult: (text: string, isFinal: boolean) => void) => {
    if (!recognitionRef.current) return;

    // Stop speaking if listening
    if (synthesisRef.current) synthesisRef.current.cancel();
    setIsSpeaking(false);

    try {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript("");
      setInterimTranscript("");

      recognitionRef.current.onresult = (event: any) => {
        let final = "";
        let interim = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (final) {
          setTranscript((prev) => prev + final);
          onResult(final, true);
        }
        setInterimTranscript(interim);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Sometimes it ends abruptly, we might need to handle silence
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

    } catch (e) {
      console.error("Error starting recognition", e);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return {
    speak,
    isSpeaking,
    startListening,
    stopListening,
    isListening,
    transcript,
    interimTranscript
  };
}

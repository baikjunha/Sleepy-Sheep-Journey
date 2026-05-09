import { useState, useEffect, useRef, useCallback } from "react";

export function useSpeech(language = "ko-KR") {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

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

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!synthesisRef.current) return;
    
    // Stop any ongoing speech or recognition
    synthesisRef.current.cancel();
    stopListening();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.8; // Calming rate
    utterance.pitch = 0.9;
    utterance.volume = 0.7;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = (e) => {
      console.error("Speech synthesis error", e);
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };

    synthesisRef.current.speak(utterance);
  }, [language]);

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

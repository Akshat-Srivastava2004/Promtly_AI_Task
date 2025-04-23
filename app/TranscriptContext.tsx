// context/TranscriptContext.tsx
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define the types for our context
type TranscriptContextType = {
  transcript: string;
  setTranscript: (text: string) => void;
  transcriptionResult: string;
  setTranscriptionResult: (text: string) => void;
};

// Create context with default values
const TranscriptContext = createContext<TranscriptContextType | undefined>(undefined);

// Context provider component
export const TranscriptProvider = ({ children }: { children: ReactNode }) => {
  const [transcript, setTranscript] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("transcript") || "";
    }
    return "";
  });

  const [transcriptionResult, setTranscriptionResult] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("transcriptionResult") || "";
    }
    return "";
  });

  // Sync transcriptionResult with localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("transcriptionResult", transcriptionResult);
    }
  }, [transcriptionResult]);

  // Sync transcript with localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("transcript", transcript);
    }
  }, [transcript]);

  return (
    <TranscriptContext.Provider value={{ transcript, setTranscript, transcriptionResult, setTranscriptionResult }}>
      {children}
    </TranscriptContext.Provider>
  );
};

// Custom hook to use context
export const useTranscriptContext = (): TranscriptContextType => {
  const context = useContext(TranscriptContext);
  if (!context) {
    throw new Error("useTranscriptContext must be used within a TranscriptProvider");
  }
  return context;
};

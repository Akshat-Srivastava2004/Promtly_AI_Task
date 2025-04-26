"use client";

import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranscriptContext } from "../TranscriptContext";
import Link from "next/link";

export default function AudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const { transcript, setTranscript } = useTranscriptContext();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (transcript) {
      sendToGemini();
    }
  }, [transcript]);

  const sendToGemini = async () => {
    try {
      const response = await fetch("/api/matchTextWithGemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioTranscript: transcript }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error:", errorText);
        throw new Error("Failed to match text with Gemini");
      }

      const data = await response.json();
      console.log("Gemini API Response:", data);
      setTimestamp(data.timestamp);
      setVideoUrl(data.videoUrl);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send data to Gemini.");
    }
  };

  const getSupportedMimeType = () => {
    const possibleTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/mpeg",
      "audio/aac",
    ];
    for (const type of possibleTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  };

  const handleStartRecording = async () => {
    try {
      setTranscript("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        toast.error("No supported audio format found!");
        return;
      }

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size === 0) {
          toast.error("No audio recorded. Please try again.");
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        setLoading(true);
        toast.info("Uploading your audio...");

        try {
          const res = await fetch("/api/speech-to-text", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (!res.ok) {
            toast.error(data.error || "Transcription failed.");
            setLoading(false);
            return;
          }

          if (data.text) {
            setTranscript(data.text);
            toast.success("Transcription completed!");
          } else {
            setTranscript("No text detected.");
            toast.warning("No text detected in the audio.");
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to upload audio.");
        } finally {
          setLoading(false);
        }
      };

      mediaRecorderRef.current.start(1000);
      setRecording(true);
      toast.success("Recording started!");
    } catch (err) {
      console.error("Start Recording Error:", err);
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        toast.error("Microphone permission denied!");
      } else {
        toast.error("Failed to start recording.");
      }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      toast.info("Processing your recording...");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg shadow-md space-y-6 bg-white">
      <h2 className="text-xl font-semibold text-center">🎙️ AI Voice-Based Assistant</h2>

      <div className="flex justify-center">
        <button
          onClick={recording ? handleStopRecording : handleStartRecording}
          disabled={loading}
          className={`px-6 py-3 text-white rounded-full font-medium transition-all ${
            recording ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "Processing..." : recording ? "Stop Recording" : "Start Recording"}
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        </div>
      )}

      {transcript && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-2">Transcript:</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{transcript}</p>

          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(transcript);
                toast.success("Transcript copied!");
              }}
              className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
            >
              Copy
            </button>
            <button
              onClick={() => localStorage.clear()}
              className="text-sm px-3 py-1 bg-red-200 hover:bg-red-300 rounded"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {timestamp && videoUrl && (
        <div className="mt-4 text-center">
          <Link
            href={`/VideoPlayer?timestamp=${timestamp}&videourl=${videoUrl}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
          >
            Go to Video
          </Link>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">Powered by AssemblyAI and Gemini</p>
    </div>
  );
}

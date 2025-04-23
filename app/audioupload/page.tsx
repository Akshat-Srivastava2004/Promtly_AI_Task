"use client"

import { useRef, useState, useEffect } from "react"
import { toast } from "sonner"
import { useTranscriptContext } from "../TranscriptContext"

export default function AudioRecorder() {
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const { transcript, setTranscript, transcriptionResult } = useTranscriptContext();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // ✅ Send to Gemini once both audio and video transcriptions are available
  useEffect(() => {
    console.log('Transcript:', transcript);
    console.log('Transcription Result:', transcriptionResult);
  
    if (transcript && transcriptionResult) {
      sendToGemini();
    }
  }, [transcript, transcriptionResult]);

  const sendToGemini = async () => {
    
     const audioTranscript= transcript
     const videoTranscript= transcriptionResult
    console.log("the value of audio to text is ",audioTranscript)
    console.log("the value of video to text is ",videoTranscript)

    

    try {
      const response = await fetch("/api/matchTextWithGemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({audioTranscript,videoTranscript}),
      })

      if (!response.ok) {
        const text = await response.text();
        console.error("Error response:", text);
        throw new Error("Server error");
      }
      
      const data = await response.json(); // only called if response.ok
      console.log("Data from Gemini API:", data);
    } catch (err) {
      console.error("Error sending to Gemini:", err)
      toast.error("Failed to send to Gemini. Please try again.")
    }
  }

  const handleStartRecording = async () => {
    try {
      setTranscript("") // Reset transcript

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const options = {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000,
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        streamRef.current?.getAudioTracks().forEach((track) => track.stop())

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })

        if (audioBlob.size === 0) {
          toast.error("No audio recorded. Please try again.")
          setLoading(false)
          return
        }

        const formData = new FormData()
        formData.append("audio", audioBlob, "recording.webm")

        setLoading(true)
        toast.info("Uploading and transcribing your audio...")

        try {
          const res = await fetch("/api/speech-to-text", {
            method: "POST",
            body: formData,
          })

          let data
          try {
            data = await res.json()
          } catch (e) {
            console.log("the error is ",e)
            const text = await res.text()
            console.error("Non-JSON response:", text)
            toast.error("Received invalid response from server")
            setLoading(false)
            return
          }

          if (!res.ok) {
            console.error("API error:", data)
            if (res.status === 202) {
              toast.info("Transcription is taking longer than expected. Please wait...")
            } else {
              toast.error(`Error: ${data.error || "Unknown error"}`)
            }
            setLoading(false)
            return
          }

          if (data.text) {
            setTranscript(data.text) // ✅ Let useEffect trigger Gemini send
            toast.success("Transcription complete!")
          } else {
            setTranscript("No text transcribed")
            toast.warning("No text was detected in your recording")
          }
        } catch (err) {
          console.error("Fetch error:", err)
          toast.error("Network error. Please check your connection.")
        } finally {
          setLoading(false)
        }
      }

      mediaRecorderRef.current.start(1000)
      setRecording(true)
      toast.info("Recording started. Speak now...")
    } catch (err) {
      console.error("Recording error:", err)
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        toast.error("Microphone access denied. Please allow microphone access.")
      } else {
        toast.error("Failed to start recording. Please try again.")
      }
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      toast.info("Processing your audio...")
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg shadow-md space-y-6 bg-white">
      <h2 className="text-xl font-semibold text-center">Speech to Text Converter</h2>

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

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                navigator.clipboard.writeText(transcript)
                toast.success("Copied to clipboard!")
              }}
              className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              Copy Text
            </button>
            <button onClick={() => localStorage.clear()}>Reset Transcript</button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">Powered by AssemblyAI. Click the button and start speaking.</p>
    </div>
  )
}

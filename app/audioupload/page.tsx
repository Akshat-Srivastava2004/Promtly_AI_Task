"use client"

import { useRef, useState, useEffect } from "react"
import { toast } from "sonner"
import { useTranscriptContext } from "../TranscriptContext"
import { Mic, Square } from "lucide-react"
import VideoPlayer from "../VideoPlayer/VideoPlayerComponent"

export default function AudioRecorder() {
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [timestamp, setTimestamp] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [transcript, setLocalTranscript] = useState("")
  const { setTranscript } = useTranscriptContext()

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Reset everything on page refresh
  useEffect(() => {
    setTimestamp("")
    setVideoUrl("")
    setLocalTranscript("")
    setTranscript("")
  }, [])

  useEffect(() => {
    if (transcript) {
      sendToGemini()
    }
  }, [transcript])

  const sendToGemini = async () => {
    try {
      const response = await fetch("/api/matchTextWithGemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioTranscript: transcript }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error:", errorText)
        throw new Error("Failed to match text with Gemini")
      }

      const data = await response.json()
      console.log("Gemini API Response:", data)
      setTimestamp(data.timestamp)
      setVideoUrl(data.videoUrl)
    } catch (err) {
      console.error(err)
      toast.error("Failed to send data to Gemini.")
    }
  }

  const getSupportedMimeType = () => {
    const possibleTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg", "audio/aac"]
    for (const type of possibleTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    return ""
  }

  const handleStartRecording = async () => {
    try {
      setTranscript("")
      setLocalTranscript("")
      // Reset video data when starting a new recording
      setTimestamp("")
      setVideoUrl("")

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = getSupportedMimeType()
      if (!mimeType) {
        toast.error("No supported audio format found!")
        return
      }

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType })
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        if (audioBlob.size === 0) {
          toast.error("No audio recorded. Please try again.")
          setLoading(false)
          return
        }

        const formData = new FormData()
        formData.append("audio", audioBlob, "recording.webm")

        setLoading(true)
        toast.info("Uploading your audio...")

        try {
          const res = await fetch("/api/speech-to-text", {
            method: "POST",
            body: formData,
          })

          const data = await res.json()

          if (!res.ok) {
            toast.error(data.error || "Transcription failed.")
            setLoading(false)
            return
          }

          if (data.text) {
            setLocalTranscript(data.text)
            setTranscript(data.text)
            toast.success("Transcription completed!")
          } else {
            setLocalTranscript("No text detected.")
            setTranscript("No text detected.")
            toast.warning("No text detected in the audio.")
          }
        } catch (err) {
          console.error(err)
          toast.error("Failed to upload audio.")
        } finally {
          setLoading(false)
        }
      }

      mediaRecorderRef.current.start(1000)
      setRecording(true)
      toast.success("Recording started!")
    } catch (err) {
      console.error("Start Recording Error:", err)
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        toast.error("Microphone permission denied!")
      } else {
        toast.error("Failed to start recording.")
      }
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      toast.info("Processing your recording...")
    }
  }

  const handleClear = () => {
    setLocalTranscript("")
    setTranscript("")
    setTimestamp("")
    setVideoUrl("")
  }

  return (
    <>
    {/* Admin Panel Button */}
    <div className="fixed top-6 left-6 z-50">
      <a href="./admin">
        <button className="px-5 py-2 bg-gradient-to-r from-pink-300 to-purple-300 text-purple-800 font-semibold rounded-full shadow-md hover:scale-105 hover:shadow-xl transition-all duration-300">
          Admin Panel
        </button>
      </a>
    </div>
  
    {/* Main Container */}
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-8">
      <div className="max-w-3xl w-full p-10 sm:p-16 backdrop-blur-lg bg-white/60 rounded-3xl border border-black/10 shadow-2xl space-y-10 transition-all duration-500">
  
        {/* Heading */}
        <h2 className="text-4xl font-extrabold text-center text-purple-800 tracking-wide drop-shadow-md animate-fade-in">
          🎙️ Pedu AI
        </h2>
  
        {/* Record Button */}
        <div className="flex justify-center">
          <button
            onClick={recording ? handleStopRecording : handleStartRecording}
            disabled={loading}
            className={`p-6 rounded-full text-white font-bold shadow-lg transition-all duration-300 hover:scale-110 ${
              recording
                ? "bg-red-400 hover:bg-red-500"
                : "bg-green-400 hover:bg-green-500"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-label={recording ? "Stop recording" : "Start recording"}
          >
            {loading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : recording ? (
              <Square className="h-8 w-8 text-white" />
            ) : (
              <Mic className="h-8 w-8 text-white" />
            )}
          </button>
        </div>
  
        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-400"></div>
          </div>
        )}
  
        {/* Transcript Section */}
        {transcript && (
          <div className="p-6 bg-white/70 rounded-2xl border border-pink-200 shadow-inner backdrop-blur-md text-purple-900 space-y-4">
            <h3 className="text-2xl font-bold text-pink-700">Transcript:</h3>
            <p className="whitespace-pre-wrap leading-relaxed">{transcript}</p>
  
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(transcript);
                  toast.success("Transcript copied!");
                }}
                className="px-4 py-2 text-sm bg-purple-300 hover:bg-purple-400 text-purple-900 rounded-full shadow hover:scale-105 transition-all duration-300"
              >
                Copy
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm bg-pink-300 hover:bg-pink-400 text-pink-900 rounded-full shadow hover:scale-105 transition-all duration-300"
              >
                Clear
              </button>
            </div>
          </div>
        )}
  
        {/* Video Section */}
        {timestamp && videoUrl && (
          <div className="w-full">
            <h3 className="text-2xl font-bold text-purple-700 mb-4">Video Result:</h3>
            <VideoPlayer timestamp={timestamp} videoUrl={videoUrl} />
          </div>
        )}
  
        {/* Footer */}
        <p className="text-xs text-center text-purple-400">
          Powered by <span className="font-semibold">AssemblyAI</span> & <span className="font-semibold">Gemini</span>
        </p>
  
      </div>
    </div>
  </>
  
  

  )
}

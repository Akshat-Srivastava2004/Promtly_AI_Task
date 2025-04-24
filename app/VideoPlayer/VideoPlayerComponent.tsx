"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

const VideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const searchParams = useSearchParams()

  const [timestamp, setTimestamp] = useState<string>("")
  const [videoUrl, setVideoUrl] = useState<string>("")

  useEffect(() => {
    const ts = searchParams.get("timestamp") || ""
    const url = searchParams.get("videourl") || ""

    setTimestamp(ts)
    setVideoUrl(url)
  }, [searchParams])

  useEffect(() => {
    if (videoRef.current && timestamp) {
      const [minutes, seconds] = timestamp.split(":").map(Number)
      const timeInSeconds = minutes * 60 + seconds

      if (!isNaN(timeInSeconds)) {
        videoRef.current.currentTime = timeInSeconds

        videoRef.current
          .play()
          .then(() => {
            console.log("Video playing from:", timeInSeconds)
          })
          .catch((err) => {
            console.warn("Autoplay failed. Waiting for user interaction.", err)
          })
      } else {
        console.error("Invalid timestamp:", timestamp)
      }
    }
  }, [timestamp])

  if (!videoUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>No video URL provided. Please go back and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-pink-100">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-3xl">
        <h1 className="text-2xl font-bold mb-4">Video Player</h1>
        <p className="mb-4">Playing video at timestamp: {timestamp}</p>

        <div className="relative w-full aspect-video bg-black rounded overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full"
            controls
            muted
            preload="auto"
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <p>{videoUrl}</p>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
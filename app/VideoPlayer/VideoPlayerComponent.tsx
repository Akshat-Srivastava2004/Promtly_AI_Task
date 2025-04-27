"use client"

// import { withCoalescedInvoke } from "next/dist/lib/coalesced-function"
import { useEffect, useRef } from "react"

interface VideoPlayerProps {
  timestamp: string
  videoUrl: string
}

const VideoPlayer = ({ timestamp, videoUrl }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)

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
  }, [timestamp, videoUrl])

  if (!videoUrl) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>No video URL provided. Please go back and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <p className="mb-2">Playing video at timestamp: {timestamp}</p>

      <div className="relative w-full aspect-video bg-black rounded overflow-hidden">
        <video ref={videoRef}  className="w-full h-full" controls preload="auto">
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  )
}

export default VideoPlayer

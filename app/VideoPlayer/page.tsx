"use client"

import dynamic from "next/dynamic"

// Dynamically import the VideoPlayer component with SSR disabled
const VideoPlayer = dynamic(() => import("./VideoPlayerComponent"), { ssr: false })

const Page = () => {
  return <VideoPlayer />
}

export default Page
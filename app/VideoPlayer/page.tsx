'use client';

import React, { useEffect, useRef } from 'react';


type VideoPlayerProps = {
  timestamp: string; // Timestamp is already in seconds or in a valid format
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ timestamp }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  

  // Get the videoUrl from localStorage
  const videoUrl = localStorage.getItem('videoUrl') || '';

  // Function to extract timestamp from query string
  const extractTimestampFromUrl = (url: string) => {
    const match = url.match(/timestamp=(\d+:\d+)/);
    return match ? match[1] : ''; // Extract timestamp in format `0:04`
  };

  useEffect(() => {
    // Get the timestamp from URL or props
    const queryTimestamp = extractTimestampFromUrl(window.location.href) || timestamp;

    if (videoRef.current && queryTimestamp) {
      // Handle the timestamp if it's in the correct format (e.g., 0:04)
      const [minutes, seconds] = queryTimestamp.split(':').map(Number);
      const timeInSeconds = minutes * 60 + seconds;

      if (!isNaN(timeInSeconds)) {
        videoRef.current.currentTime = timeInSeconds;
        videoRef.current.play(); // Play the video after seeking
      } else {
        console.error('Invalid timestamp:', queryTimestamp);
      }
    }
  }, [timestamp]);

  return (
    <div>
      <video
        ref={videoRef}
        width="640"
        height="360"
        controls
        preload="auto"
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;

import React, { useEffect, useRef } from 'react';

type VideoPlayerProps = {
  videoUrl: string;
  timestamp: string;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, timestamp }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Function to convert timestamp to seconds
  const convertTimestampToSeconds = (timestamp: string): number => {
    const [minutes, seconds] = timestamp.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  // Use useEffect to trigger video playback when the component is mounted or timestamp changes
  useEffect(() => {
    if (videoRef.current && timestamp) {
      const timeInSeconds = convertTimestampToSeconds(timestamp);
      videoRef.current.currentTime = timeInSeconds;
      videoRef.current.play(); // Play the video after seeking
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

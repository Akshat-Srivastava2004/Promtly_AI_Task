"use client";

import { useState,useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadVideoToS3 } from "../component/UploadVideo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle } from "lucide-react";
import { useTranscriptContext } from "../TranscriptContext"
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mlximpcadurwyjdewrxz.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1seGltcGNhZHVyd3lqZGV3cnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjgyNjMsImV4cCI6MjA2MTAwNDI2M30.aSSnn2PzrCTuYNllzRqAvFRfOxfXjpeGGwwJqGNc3qE"
const supabase = createClient(supabaseUrl, supabaseKey);
function UploadVideo() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { transcriptionResult,setTranscriptionResult}=useTranscriptContext();
  console.log("the transcription data is ",transcriptionResult);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (transcriptionResult) {
      // Log or do something when transcriptionResult updates
      console.log("Updated transcription result:", transcriptionResult);
      // You can also show a success alert or do further actions here
    }
  }, [transcriptionResult]); // This runs whenever transcriptionResult changes
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadResult({ success: false, message: "Please select a video file." });
      return;
    }

    setUploading(true);
    setUploadResult(null); // Clear previous result

    try {
      // Step 1: Upload the video to S3
      const response = await uploadVideoToS3(selectedFile);
      console.log("the response of the video url is ",response.videoUrl);
      localStorage.setItem("videoUrl", response.videoUrl);
      // Step 2: Call the transcription API with the uploaded video's URL
      console.log(response)
      const transcriptionRes = await fetch("/api/video-to-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: response.videoUrl }),
      });

      const transcriptionData = await transcriptionRes.json();
      console.log(transcriptionData)
      if (transcriptionRes.ok) {
        setTranscriptionResult(transcriptionData.transcription.text);
        const { data, error } = await supabase.from("videos").insert([
          {
            title:"video",
            url: response.videoUrl,
            transcript: transcriptionData.transcription.text,
          },
        ]);
        setUploadResult({
          success: true,
          message: `Video uploaded successfully. Transcription: ${transcriptionData.transcription.text}`,
          
        });
        if (error) {
          console.error("Error inserting data into Supabase:", error.message);
          setUploadResult({
            success: false,
            message: `Video uploaded and transcribed, but failed to save to database: ${error.message}`,
          });
        } else {
          console.log("Data inserted into Supabase:", data);
          setUploadResult({
            success: true,
            message: `Video uploaded successfully. Transcription: ${transcriptionData.transcription.text}`,
          });
        }
      } else {
        setUploadResult({
          success: false,
          message: `Upload and transcription failed: ${transcriptionData.error}`,
        });
      }
    } catch (error: unknown) {
      let message = "Unknown error";

      if (error instanceof Error) {
        message = error.message;
      }

      setUploadResult({
        success: false,
        message: `Upload or transcription failed: ${message}`,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Input type="file" accept="video/*" onChange={handleFileSelect} />
      <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
        {uploading ? "Uploading..." : "Upload Video"}
      </Button>

      {uploadResult && (
        <Alert variant={uploadResult.success ? "default" : "destructive"}>
          {uploadResult.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertTitle>{uploadResult.success ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{uploadResult.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ✅ Default export required for Next.js App Router
export default function Page() {
  return <UploadVideo />;
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadVideoToS3 } from "../component/UploadVideo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle } from "lucide-react";

function UploadVideo() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

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
      const response = await uploadVideoToS3(selectedFile);
      setUploadResult({
        success: true,
        message: `Video uploaded successfully. URL: ${response.videoUrl}`,
      });
    } catch (error: unknown) {
      let message = "Unknown error";

      if (error instanceof Error) {
        message = error.message;
      }

      setUploadResult({
        success: false,
        message: `Upload failed: ${message}`,
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

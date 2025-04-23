export async function uploadVideoToS3(file: File) {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
      }),
    });
  
    if (!res.ok) {
      const text = await res.text(); // get the HTML for debugging
      throw new Error(`Failed to get signed URL. Status: ${res.status}, Message: ${text}`);
    }
  
    const { signedUrl, finalUrl } = await res.json();
  
    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });
  
    if (!uploadRes.ok) {
      throw new Error(`Failed to upload video to S3. Status: ${uploadRes.status}`);
    }
  
    return { videoUrl: finalUrl };
  }
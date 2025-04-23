// app/api/transcribe/route.ts
export async function POST(req: Request) {
    
    try {
      const { videoUrl } = await req.json();
      const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY!;
  
      const transcriptRes = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: {
          authorization: assemblyApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({ audio_url: videoUrl }),
      });
  
      const { id: transcriptId } = await transcriptRes.json();
  
      let completed = false;
      let transcriptionResult = null;
  
      while (!completed) {
        const pollingRes = await fetch(
          `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
          { headers: { authorization: assemblyApiKey } }
        );
        const pollingData = await pollingRes.json();
  
        if (pollingData.status === "completed") {
          completed = true;
          transcriptionResult = pollingData;
        } else if (pollingData.status === "error") {
          throw new Error("Transcription failed");
        } else {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
  
      return new Response(
        JSON.stringify({ message: "Transcription completed", transcription: transcriptionResult }),
        { status: 200 }
      );
    } catch (err) {
      console.error("Transcription error:", err);
      return new Response(JSON.stringify({ error: "Transcription failed" }), {
        status: 500,
      });
    }
  }
  
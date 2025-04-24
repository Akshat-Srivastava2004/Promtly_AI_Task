import { type NextRequest, NextResponse } from "next/server"
import { AssemblyAI } from "assemblyai"

// Get API key from environment variable for security
const API_KEY = process.env.ASSEMBLYAI_API_KEY!
const client = new AssemblyAI({ apiKey: API_KEY })
console.log("the client id is ",client)

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData()
    const audioFile = formData.get("audio")

    // Check if audio file exists
    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json({ error: "Audio file missing or invalid" }, { status: 400 })
    }

    // Convert the blob to an array buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    try {
      // First, upload the file to AssemblyAI
      const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
        method: "POST",
        headers: {
          "Authorization": API_KEY,
          "Content-Type": "application/octet-stream",
        },
        body: buffer,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error("AssemblyAI upload error:", errorText)
        return NextResponse.json({ error: "Failed to upload audio", details: errorText }, { status: 500 })
      }

      const uploadResult = await uploadResponse.json()
      const audioUrl = uploadResult.upload_url

      if (!audioUrl) {
        return NextResponse.json({ error: "Failed to get upload URL" }, { status: 500 })
      }

      // Now create a transcription using the uploaded audio URL
      const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: {
          "Authorization": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          language_code: "en",
        }),
      })

      if (!transcriptResponse.ok) {
        const errorText = await transcriptResponse.text()
        console.error("AssemblyAI transcript error:", errorText)
        return NextResponse.json({ error: "Failed to create transcript", details: errorText }, { status: 500 })
      }

      const transcriptResult = await transcriptResponse.json()
      const transcriptId = transcriptResult.id

      if (!transcriptId) {
        return NextResponse.json({ error: "Failed to get transcript ID" }, { status: 500 })
      }

      // Poll for the transcription result
      let transcript = null
      const maxAttempts = 30 // 60 seconds max (30 * 2s)

      for (let i = 0; i < maxAttempts; i++) {
        // Wait before polling
        await new Promise((resolve) => setTimeout(resolve, 2000))

        const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          method: "GET",
          headers: {
            "Authorization": API_KEY,
          },
        })

        if (!pollingResponse.ok) {
          const errorText = await pollingResponse.text()
          console.error("AssemblyAI polling error:", errorText)
          return NextResponse.json({ error: "Failed to poll transcript", details: errorText }, { status: 500 })
        }

        const pollingResult = await pollingResponse.json()

        if (pollingResult.status === "completed") {
          transcript = pollingResult
          break
        } else if (pollingResult.status === "error") {
          return NextResponse.json(
            { error: "Transcription failed", details: pollingResult.error },
            { status: 500 }
          )
        }
        // Continue polling if status is 'queued' or 'processing'
      }

      if (!transcript) {
        return NextResponse.json(
          {
            text: "Transcription still in progress...",
            id: transcriptId,
            status: "processing",
          },
          { status: 202 }
        )
      }

      return NextResponse.json({
        text: transcript.text,
        status: "completed",
      })
    } catch (err) {
      console.error("AssemblyAI API error:", err)
      return NextResponse.json(
        {
          error: "Failed to transcribe",
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 500 }
      )
    }
  } catch (err) {
    console.error("Request processing error:", err)
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

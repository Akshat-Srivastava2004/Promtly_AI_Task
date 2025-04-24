import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase environment variables are not set")
}
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const { audioTranscript } = await req.json()

    if (!audioTranscript) {
      return NextResponse.json({ error: "Missing audio transcript" }, { status: 400 })
    }

    // Fetch all videos and their transcripts from Supabase
    const { data: videos, error } = await supabase.from("videos").select("url, transcript")
    console.log("the data is given to gemini is ",videos);

    if (error) {
      console.error("Error fetching videos from Supabase:", error)
      return NextResponse.json({ error: "Failed to fetch videos from database" }, { status: 500 })
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json({ error: "No videos found in database" }, { status: 404 })
    }

    const GeminiAPIKey = process.env.GEMINI_API_KEY!

    // Process each video transcript with Gemini
    let bestMatch = null

    for (const video of videos) {
      const prompt = `
      You are an AI assistant that matches text from different sources. 
      Below is an audio transcription and a video transcription. Please find the timestamp where the following audio transcription matches the video transcription. 

      Audio Transcription:
      ${audioTranscript}

      Video Transcription:
      ${video.transcript}

      Provide the timestamp where the audio transcription appears in the video transcription in the format "MM:SS" (e.g., "01:45"). 
      If no match is found, return "No match. and return me the same url of that video of which transcript is matched dont change the name or file path of that videourl "
      `

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GeminiAPIKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        },
      )

      // Log the response for debugging
      const responseText = await response.text()
      console.log("Gemini API Response for video:", video.url, responseText)

      if (!response.ok) {
        console.error(`Error from Gemini for video ${video.url}:`, responseText)
        continue // Try the next video
      }

      try {
        const data = JSON.parse(responseText)
        const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text

        if (!outputText) {
          console.log(`No output from Gemini for video ${video.url}`)
          continue
        }

        // Check if there's a match
        if (!outputText.includes("No match")) {
          // Extract timestamp in format MM:SS
          const timestampMatch = outputText.match(/\d+:\d+/)
          if (timestampMatch) {
            bestMatch = {
              timestamp: timestampMatch[0],
              videoUrl: video.url,  // Ensure that the exact video URL is associated with the timestamp
            }
            break // Found a match, no need to check other videos
          }
        }
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError)
        continue
      }
    }

    if (bestMatch) {
      return NextResponse.json(bestMatch)
    } else {
      return NextResponse.json({ error: "No match found in any video" }, { status: 404 })
    }
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
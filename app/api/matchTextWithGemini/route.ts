// app/api/matchTextWithGemini/route.ts

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { audioTranscript, videoTranscript } = await req.json();

    if (!audioTranscript || !videoTranscript) {
      return NextResponse.json({ error: 'Missing audio or video transcript' }, { status: 400 });
    }

    const GeminiAPIKey = process.env.GEMINI_API_KEY || "YOUR_DEFAULT_FALLBACK_KEY";

    const prompt = `
    You are an AI assistant that matches text from different sources. 
    Below is an audio transcription and a video transcription. Please find the timestamp where the following audio transcription matches the video transcription. 

    Audio Transcription:
    ${audioTranscript}

    Video Transcription:
    ${videoTranscript}

    Provide the timestamp where the audio transcription appears in the video transcription. If no match is found, return "No match."
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GeminiAPIKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    // Log the response for debugging
    const responseText = await response.text(); // Get the raw response as text
    console.log('Gemini API Response:', responseText);

    if (!response.ok) {
      return NextResponse.json({ error: `Error from Gemini: ${responseText}` }, { status: response.status });
    }

    const data = JSON.parse(responseText);
    const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!outputText) {
      return NextResponse.json({ error: 'No output from Gemini' }, { status: 500 });
    }

    const timestampMatch = outputText.includes("No match") ? null : outputText;

    if (timestampMatch) {
      return NextResponse.json({ timestamp: timestampMatch });
    } else {
      return NextResponse.json({ error: 'No match found' }, { status: 404 });
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

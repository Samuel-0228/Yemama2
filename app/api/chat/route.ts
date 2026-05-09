import { NextRequest, NextResponse } from 'next/server'

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      question?: string
      mode?: 'cycle' | 'pregnancy'
      contextSummary?: string
    }

    if (!body.question) {
      return NextResponse.json({ error: 'Please provide a question.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        answer: 'The assistant is not configured right now. Please try again later.',
      })
    }

    const prompt = [
      "You are a women's health tracking assistant.",
      `Current mode: ${body.mode ?? 'cycle'}.`,
      `Recent context: ${body.contextSummary ?? 'No context provided.'}`,
      `Question: ${body.question}`,
      "Rules: provide concise, non-diagnostic guidance, and include this exact disclaimer in every answer: 'This is informational only and not a medical diagnosis.'",
    ].join('\n')

    const geminiResponse = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
    })

    if (!geminiResponse.ok) {
      return NextResponse.json({ answer: 'The assistant is temporarily unavailable. Please try again soon.' })
    }

    const json = (await geminiResponse.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }

    const answer = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    return NextResponse.json({
      answer: answer ?? 'I could not generate an answer. Please ask again.',
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong while processing your request.' }, { status: 500 })
  }
}

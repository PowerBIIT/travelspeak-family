import { NextRequest, NextResponse } from 'next/server';
import { Language } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { audio, language } = await request.json();

    if (!audio || !language) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // For now, return mock transcription
    // TODO: Integrate with AssemblyAI API when API key is provided
    const mockText = 'Dzień dobry, czy jest wolny stolik?';

    // When AssemblyAI API key is available, use this:
    /*
    const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
    
    if (!ASSEMBLYAI_API_KEY) {
      console.warn('AssemblyAI API key not configured, using mock transcription');
      return NextResponse.json({ text: mockText });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64');

    // Upload audio to AssemblyAI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'authorization': ASSEMBLYAI_API_KEY,
        'content-type': 'application/octet-stream',
      },
      body: audioBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload audio');
    }

    const { upload_url } = await uploadResponse.json();

    // Language codes mapping
    const languageCodes: Record<Language, string> = {
      pl: 'pl',
      en: 'en',
      fr: 'fr',
    };

    // Create transcription job
    const transcribeResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': ASSEMBLYAI_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: upload_url,
        language_code: languageCodes[language as Language],
      }),
    });

    if (!transcribeResponse.ok) {
      throw new Error('Failed to create transcription job');
    }

    const { id } = await transcribeResponse.json();

    // Poll for transcription result
    let transcript;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
        headers: {
          'authorization': ASSEMBLYAI_API_KEY,
        },
      });

      transcript = await statusResponse.json();

      if (transcript.status === 'completed') {
        break;
      } else if (transcript.status === 'error') {
        throw new Error('Transcription failed');
      }

      // Wait 1 second before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!transcript || transcript.status !== 'completed') {
      throw new Error('Transcription timeout');
    }

    return NextResponse.json({ text: transcript.text });
    */

    return NextResponse.json({ text: mockText });
  } catch (error) {
    console.error('Speech-to-text error:', error);
    return NextResponse.json(
      { error: 'Speech-to-text failed' },
      { status: 500 }
    );
  }
}
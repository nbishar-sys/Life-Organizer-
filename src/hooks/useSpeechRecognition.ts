import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Wraps the browser's built-in Web Speech API behind a small interface so a
 * future provider (e.g. an OpenAI Whisper-backed one, recording audio and
 * sending it to an API) can be swapped in later without the capture UI
 * changing — it just needs the same start/stop/interimTranscript shape.
 */
export interface UseSpeechRecognitionOptions {
  /** Called once per finalized phrase, so the caller can append it to their draft text. */
  onFinalTranscript?: (text: string) => void
}

export interface UseSpeechRecognitionResult {
  isSupported: boolean
  isListening: boolean
  /** The current in-progress (not yet finalized) phrase, for live feedback. */
  interimTranscript: string
  error: string | null
  start: () => void
  stop: () => void
}

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined
  return window.SpeechRecognition ?? window.webkitSpeechRecognition
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionResult {
  const SpeechRecognitionCtor = getSpeechRecognitionCtor()
  const isSupported = Boolean(SpeechRecognitionCtor)

  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Kept in a ref so the recognizer's event handlers (set up once per
  // start()) always call the latest callback without needing to be rebuilt.
  const onFinalTranscriptRef = useRef(options.onFinalTranscript)
  onFinalTranscriptRef.current = options.onFinalTranscript

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  const start = useCallback(() => {
    if (recognitionRef.current) return // already listening
    if (!SpeechRecognitionCtor) {
      setError('Voice capture is not supported in this browser — you can still type.')
      return
    }

    setError(null)
    setInterimTranscript('')

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = navigator.language || 'en-US'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        if (result.isFinal) {
          const trimmed = text.trim()
          if (trimmed) onFinalTranscriptRef.current?.(trimmed)
        } else {
          interim += text
        }
      }
      setInterimTranscript(interim)
    }

    recognition.onerror = (event) => {
      // "no-speech" and "aborted" fire routinely (a pause, or the user
      // tapping stop) — not real errors worth interrupting them over.
      if (event.error === 'no-speech' || event.error === 'aborted') return
      setError(
        event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'Microphone access was denied — you can still type.'
          : 'Voice capture had a problem — you can still type.',
      )
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    setIsListening(true)
    recognition.start()
  }, [SpeechRecognitionCtor])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  return { isSupported, isListening, interimTranscript, error, start, stop }
}

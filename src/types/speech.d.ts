// Minimal ambient types for the still-not-fully-standardized Web Speech API.
// TypeScript's DOM lib doesn't ship these, so we declare just what this app uses.

export {}

declare global {
  interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
  }

  interface SpeechRecognitionResult {
    readonly length: number
    isFinal: boolean
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
  }

  interface SpeechRecognitionResultList {
    readonly length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number
    readonly results: SpeechRecognitionResultList
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string
    readonly message: string
  }

  interface SpeechRecognition extends EventTarget {
    lang: string
    continuous: boolean
    interimResults: boolean
    maxAlternatives: number
    start(): void
    stop(): void
    abort(): void
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown) | null
    onend: ((this: SpeechRecognition, ev: Event) => unknown) | null
    onstart: ((this: SpeechRecognition, ev: Event) => unknown) | null
  }

  interface SpeechRecognitionConstructor {
    new (): SpeechRecognition
  }

  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

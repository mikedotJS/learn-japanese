import { useCallback, useRef, useState, useEffect } from 'react';

let jaVoice = null;

function findJapaneseVoice() {
  if (jaVoice) return jaVoice;
  const voices = window.speechSynthesis?.getVoices() || [];
  // Prefer a native Japanese voice
  jaVoice = voices.find(v => v.lang === 'ja-JP' && !v.localService === false)
    || voices.find(v => v.lang === 'ja-JP')
    || voices.find(v => v.lang.startsWith('ja'))
    || null;
  return jaVoice;
}

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  // Load voices (they load async in some browsers)
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    findJapaneseVoice();
    const handleVoices = () => findJapaneseVoice();
    synth.addEventListener('voiceschanged', handleVoices);
    return () => synth.removeEventListener('voiceschanged', handleVoices);
  }, []);

  const speak = useCallback((text, rate = 0.85) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    // Cancel any ongoing speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = rate;
    utterance.pitch = 1;

    const voice = findJapaneseVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking };
}

// Standalone button component for convenience
export function SpeakButton({ text, rate, className = '' }) {
  const { speak, speaking } = useSpeech();

  if (!window.speechSynthesis) return null;

  return (
    <button
      className={`speak-btn ${speaking ? 'speaking' : ''} ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        speak(text, rate);
      }}
      title="Écouter la prononciation"
      type="button"
    >
      {speaking ? '◼' : '🔊'}
    </button>
  );
}

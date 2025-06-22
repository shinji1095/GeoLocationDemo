// hooks/useSpeak.ts
export const useSpeak = () => {
  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ja-JP';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };
  return { speak };
};

/*
 * WebView does not reliably provide browser SpeechSynthesis on Android.
 * Route the book's existing speechSynthesis fallback to Android's en-US TTS.
 * Existing verified MP3s and A–C legacy MP3s retain higher precedence.
 */
(function () {
  if (!window.AndroidSpeech) return;
  let speaking = null, sequence = 0;
  window.SpeechSynthesisUtterance = function (text) {
    this.text = String(text == null ? '' : text);
    this.lang = 'en-US';
    this.rate = 0.8;
    this.onend = null;
    this.onerror = null;
  };
  const nativeSpeech = {
    cancel() {
      speaking = null;
      sequence++;
      AndroidSpeech.stop();
    },
    speak(utterance) {
      if (!utterance || !utterance.text) return;
      sequence++;
      speaking = { id: sequence, utterance };
      AndroidSpeech.speak(
        String(utterance.text),
        Number(utterance.rate) || 0.8,
        sequence
      );
    }
  };
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true, value: nativeSpeech
  });
  window.__foundationTtsDone = function (id, ok) {
    if (!speaking || speaking.id !== id) return;
    const item = speaking.utterance;
    speaking = null;
    const callback = ok ? item.onend : item.onerror;
    if (typeof callback === 'function') callback();
  };
})();

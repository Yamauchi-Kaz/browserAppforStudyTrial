// 問題の読み上げ（ブラウザーにある音声合成 speechSynthesis を使うので無料）
(function (root) {
  'use strict';

  const synth = root.speechSynthesis;
  if (!synth || !root.SpeechSynthesisUtterance) {
    root.Speaker = null;
    return;
  }

  let voice = null;
  function pickVoice() {
    const voices = synth.getVoices();
    voice = voices.find((v) => /^ja/i.test(v.lang) && /Kyoko|O-ren|Nanami|Google/i.test(v.name))
      || voices.find((v) => /^ja/i.test(v.lang))
      || null;
  }
  pickVoice();
  if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice);

  root.Speaker = {
    // スマホは、ボタンを押したときに一度しゃべらせておかないと、あとで声が出ない
    unlock() {
      try { synth.speak(new SpeechSynthesisUtterance('')); } catch (e) { /* 読み上げなしでも遊べる */ }
    },
    // 読みおわったら resolve する（声が出ない環境でも、少し待てば先に進む）
    speak(text) {
      return new Promise((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve();
        };
        const timer = setTimeout(finish, 2000 + text.length * 250);
        try {
          synth.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = 'ja-JP';
          if (voice) u.voice = voice;
          u.rate = 0.95;
          u.pitch = 1.1;
          u.onend = finish;
          u.onerror = finish;
          synth.speak(u);
        } catch (e) {
          finish();
        }
      });
    },
    cancel() {
      try { synth.cancel(); } catch (e) { /* なにもしない */ }
    },
  };
})(window);

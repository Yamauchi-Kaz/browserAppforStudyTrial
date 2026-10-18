// 答えの判定（ブラウザー内だけで動く、APIを使わない判定）
// - ひらがな/カタカナ、全角/半角、大文字/小文字、空白や記号の違いをそろえる
// - 「です」「だよ」などの語尾を取りのぞく
// - 数の問題は、答えの中から数字（漢数字もOK）を取り出して比べる
// - 少しの打ちまちがいは、文字の近さ（レーベンシュタイン距離）でゆるす
(function (root) {
  'use strict';

  function toHiragana(s) {
    return s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  }

  const SUFFIXES = [
    'だとおもいます', 'だとおもう', 'とおもいます', 'とおもう', 'だと思います', 'だと思う', 'と思います', 'と思う',
    'でしょうか', 'でしょう', 'でした', 'です', 'だよね', 'だよ', 'だね', 'かな', 'かも', 'だ', 'よ', 'ね',
  ];
  const PREFIXES = ['こたえは', '答えは', 'こたえ', '答え', 'たぶん', 'えっと', 'えーと', 'えと'];
  const NEGATIONS = ['じゃない', 'ではない', 'ちがう', '違う', 'わからない', '分からない', 'しらない', '知らない'];

  function stripPunct(s) {
    return s.replace(/[\s、。,.!?「」『』()（）・~〜ー\-ｰ_'"]/g, '');
  }

  function normalize(input) {
    let s = String(input || '').normalize('NFKC').toLowerCase();
    s = toHiragana(s);
    s = stripPunct(s);
    let changed = true;
    while (changed && s) {
      changed = false;
      for (const p of PREFIXES) {
        const np = toHiragana(p);
        if (s.startsWith(np) && s.length > np.length) { s = s.slice(np.length); changed = true; }
      }
      for (const suf of SUFFIXES) {
        const ns = toHiragana(suf);
        if (s.endsWith(ns) && s.length > ns.length) { s = s.slice(0, -ns.length); changed = true; }
      }
    }
    return s;
  }

  // 漢数字（例: 二十五、百二、三千）を数に変える。読めなければ null
  function parseKanjiNumber(s) {
    const digits = { '〇': 0, '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
    const units = { '十': 10, '百': 100, '千': 1000 };
    const m = s.match(/[〇零一二三四五六七八九十百千万]+/g);
    if (!m) return null;
    const str = m[m.length - 1];
    let total = 0, section = 0, num = 0;
    for (const ch of str) {
      if (ch in digits) {
        num = num * 10 + digits[ch];
      } else if (ch in units) {
        section += (num || 1) * units[ch];
        num = 0;
      } else if (ch === '万') {
        total += (section + num || 1) * 10000;
        section = 0; num = 0;
      }
    }
    return total + section + num;
  }

  // 答えの中の数を取り出す（いちばん最後の数を使う）
  function extractNumber(input) {
    const s = String(input || '').normalize('NFKC').replace(/,/g, '');
    const m = s.match(/-?\d+(\.\d+)?/g);
    if (m) return Number(m[m.length - 1]);
    return parseKanjiNumber(s);
  }

  function levenshtein(a, b) {
    const A = Array.from(a), B = Array.from(b);
    const dp = Array.from({ length: A.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= B.length; j++) dp[0][j] = j;
    for (let i = 1; i <= A.length; i++) {
      for (let j = 1; j <= B.length; j++) {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1),
        );
      }
    }
    return dp[A.length][B.length];
  }

  function similarity(a, b) {
    const len = Math.max(Array.from(a).length, Array.from(b).length);
    return len === 0 ? 1 : 1 - levenshtein(a, b) / len;
  }

  function hasNegation(raw) {
    const s = toHiragana(String(raw || '').normalize('NFKC'));
    return NEGATIONS.some((n) => s.includes(toHiragana(n)));
  }

  // 結果: { result: 'correct' | 'close' | 'wrong' }
  function judge(input, question) {
    if (!String(input || '').trim()) return { result: 'wrong' };
    if (hasNegation(input)) return { result: 'wrong' };

    if (question.type === 'number') {
      const n = extractNumber(input);
      if (n === null || Number.isNaN(n)) return { result: 'wrong' };
      return { result: n === question.value ? 'correct' : 'wrong' };
    }

    const n = normalize(input);
    if (!n) return { result: 'wrong' };
    let best = 0;
    for (const ans of question.answers) {
      const na = normalize(ans);
      if (!na) continue;
      if (n === na) return { result: 'correct' };
      // 「とうきょうと」「りんごだとおもう」のように、正解をふくむ短い答えはOK
      if (Array.from(na).length >= 2 && n.includes(na) && Array.from(n).length <= Array.from(na).length + 3) {
        return { result: 'correct' };
      }
      const sim = similarity(n, na);
      // 長めの言葉なら1文字くらいの打ちまちがいはゆるす
      if (Array.from(na).length >= 4 && sim >= 0.75) return { result: 'correct' };
      best = Math.max(best, sim);
    }
    return { result: best >= 0.5 ? 'close' : 'wrong' };
  }

  const api = { normalize, extractNumber, parseKanjiNumber, similarity, judge };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Judge = api;
})(typeof window !== 'undefined' ? window : globalThis);

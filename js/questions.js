// 問題データ
// type: 'text'   … answers のどれかに合えば正解（漢字・ひらがな・別の言い方を並べておく）
// type: 'number' … value と同じ数なら正解（「12こ」「十二」などもOK）
// voice: 声でこたえたとき、音声認識が同じ読みの別の書き方に変えてしまうもの。これも正解にする
//        （例: 「そら」と言うと「空」になる。読み方の問題では、その漢字そのものも正解にする）
(function (root) {
  'use strict';

  const SUBJECTS = {
    math: { name: 'さんすう', icon: '🔢' },
    japanese: { name: 'こくご', icon: '📖' },
    english: { name: 'えいご', icon: '🔤' },
    social: { name: 'しゃかい', icon: '🗾' },
    science: { name: 'りか', icon: '🔬' },
  };

  // 問題文は小学1年生が読めるように、ひらがなで書く。
  // 漢字をつかうときは {漢字|よみ} と書くと、ふりがなが付く（例: {大|おお}きい）。
  // answers の1つ目は、時間ぎれのときに「こたえは〇〇」と見せる書き方（ひらがなにしておく）。
  const FIXED = [
    // こくご（「山」のように、読み方をきく漢字にはふりがなを付けない）
    { subject: 'japanese', q: '「山」の よみかたは？（ひらがなで）', type: 'text', answers: ['やま', 'さん'], voice: ['山', '3', '三'] },
    { subject: 'japanese', q: '「川」の よみかたは？（ひらがなで）', type: 'text', answers: ['かわ'], voice: ['川', '河', '皮', '革'] },
    { subject: 'japanese', q: '「花」の よみかたは？（ひらがなで）', type: 'text', answers: ['はな'], voice: ['花', '鼻', '華'] },
    { subject: 'japanese', q: '「空」の よみかたは？（ひらがなで）', type: 'text', answers: ['そら', 'くう', 'から'], voice: ['空'] },
    { subject: 'japanese', q: '「{大|おお}きい」の はんたいの ことばは？', type: 'text', answers: ['ちいさい', '小さい'] },
    { subject: 'japanese', q: '「あつい」の はんたいの ことばは？（てんきの こと）', type: 'text', answers: ['さむい', '寒い'] },
    { subject: 'japanese', q: '「{早|はや}い」の はんたいの ことばは？', type: 'text', answers: ['おそい', '遅い'] },
    { subject: 'japanese', q: '「あかるい」の はんたいの ことばは？', type: 'text', answers: ['くらい', '暗い'], voice: ['位', 'クライ'] },
    { subject: 'japanese', q: '「いぬも あるけば ○○に あたる」 ○○に はいる ことばは？', type: 'text', answers: ['ぼう', '棒'], voice: ['某', '坊'] },
    { subject: 'japanese', q: '「いしの うえにも ○ねん」 ○に はいる かずは？', type: 'number', value: 3 },

    // えいご（にほんごで こたえる）
    { subject: 'english', q: '「apple」を にほんごで いうと？', type: 'text', answers: ['りんご', 'リンゴ', '林檎'] },
    { subject: 'english', q: '「dog」を にほんごで いうと？', type: 'text', answers: ['いぬ', '犬'] },
    { subject: 'english', q: '「cat」を にほんごで いうと？', type: 'text', answers: ['ねこ', '猫'] },
    { subject: 'english', q: '「red」は なにいろ？', type: 'text', answers: ['あか', '赤', '赤色', 'あかいろ', '赤い', 'あかい'] },
    { subject: 'english', q: '「blue」は なにいろ？', type: 'text', answers: ['あお', '青', '青色', 'あおいろ', '青い', 'あおい'] },
    { subject: 'english', q: '「water」を にほんごで いうと？', type: 'text', answers: ['みず', '水', 'お水', 'おみず'] },
    { subject: 'english', q: '「book」を にほんごで いうと？', type: 'text', answers: ['ほん', '本'] },
    { subject: 'english', q: '「Monday」は なんようび？', type: 'text', answers: ['げつようび', '月曜日', '月曜', 'げつよう'] },
    { subject: 'english', q: '「five」は すうじで いくつ？', type: 'number', value: 5 },
    { subject: 'english', q: '「twelve」は すうじで いくつ？', type: 'number', value: 12 },
    { subject: 'english', q: '「teacher」を にほんごで いうと？', type: 'text', answers: ['せんせい', '先生', '教師', 'きょうし'] },
    { subject: 'english', q: '「school」を にほんごで いうと？', type: 'text', answers: ['がっこう', '学校'] },
    { subject: 'english', q: '「summer」は どの きせつ？', type: 'text', answers: ['なつ', '夏'] },
    { subject: 'english', q: '「Good morning」を にほんごで いうと？', type: 'text', answers: ['おはよう', 'おはようございます'] },

    // しゃかい（1ねんせいの せいかつで みぢかな ことを ふやす）
    { subject: 'social', q: 'にほんの しゅと（いちばん だいじな まち）は どこ？', type: 'text', answers: ['とうきょう', '東京', '東京都', 'とうきょうと'] },
    { subject: 'social', q: 'にほんで いちばん たかい やまは？', type: 'text', answers: ['ふじさん', '富士山', '富士', 'ふじ'] },
    { subject: 'social', q: 'にほんで いちばん おおきい みずうみは？', type: 'text', answers: ['びわこ', '琵琶湖'] },
    { subject: 'social', q: 'にほんの いちばん きたに ある、おおきな しまは？', type: 'text', answers: ['ほっかいどう', '北海道'] },
    { subject: 'social', q: 'しんごうが あかの ときは、すすむ？ とまる？', type: 'text', answers: ['とまる', '止まる', 'とまります', '止まります'] },
    { subject: 'social', q: 'みちを わたる ための、しろい しましまの ところは？', type: 'text', answers: ['おうだんほどう', '横断歩道'] },
    { subject: 'social', q: 'てがみを だす ときに いれる、あかい はこは？', type: 'text', answers: ['ポスト', 'ゆうびんポスト', '郵便ポスト'] },
    { subject: 'social', q: 'おこめを つくる ところは？（た○○）', type: 'text', answers: ['たんぼ', '田んぼ', '田圃', 'すいでん', '水田'] },
    { subject: 'social', q: 'にほんの はた（こっき）の なまえは？', type: 'text', answers: ['ひのまる', '日の丸', '日章旗', 'にっしょうき'] },
    { subject: 'social', q: '1ねんは なんかげつ？', type: 'number', value: 12 },
    { subject: 'social', q: 'かじの ときに でんわする ばんごうは？', type: 'number', value: 119 },

    // りか（1ねんせいの せいかつで みぢかな ことを ふやす）
    { subject: 'science', q: 'みずが こおると なにに なる？', type: 'text', answers: ['こおり', '氷'] },
    { subject: 'science', q: 'おゆが わくと でてくる、しろい けむりの ような ものは？（ゆ○）', type: 'text', answers: ['ゆげ', '湯気', 'すいじょうき', '水蒸気'] },
    { subject: 'science', q: 'こんちゅうの あしは なんぼん？', type: 'number', value: 6 },
    { subject: 'science', q: 'クモの あしは なんぼん？', type: 'number', value: 8 },
    { subject: 'science', q: 'たいようが のぼる ほうがくは？', type: 'text', answers: ['ひがし', '東'] },
    { subject: 'science', q: 'たいようが しずむ ほうがくは？', type: 'text', answers: ['にし', '西'] },
    { subject: 'science', q: 'あさがおの たねを まくと、さいしょに でる はっぱは なんまい？', type: 'number', value: 2 },
    { subject: 'science', q: 'じしゃくの N（エヌ）きょくと くっつくのは、なにきょく？', type: 'text', answers: ['エスきょく', 'S極', 'S', 'えす', 'えすきょく'] },
    { subject: 'science', q: 'オタマジャクシは おおきく なると なにに なる？', type: 'text', answers: ['かえる', 'カエル', '蛙'], voice: ['帰る', '変える', '返る', '代える'] },
    { subject: 'science', q: 'よるの そらに みえて、かたちが かわる ものは？', type: 'text', answers: ['つき', '月', 'おつきさま', 'お月様'] },
    { subject: 'science', q: 'あめの あとに そらに でる、なないろの はしは？', type: 'text', answers: ['にじ', '虹'] },
  ];

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // さんすうは毎回ランダムに作る
  // メインは 1けた±1けた。ときどき応用で「10〜19 ± 1けた」（たし算の答えは20まで）
  const APPLIED_RATE = { easy: 0.1, normal: 0.3, hard: 0.5 };

  function makeMathQuestion(level) {
    const applied = Math.random() < (APPLIED_RATE[level] ?? APPLIED_RATE.normal);
    const add = Math.random() < 0.5;
    let a, b;
    if (add) {
      if (applied) { a = rand(10, 19); b = rand(1, Math.min(9, 20 - a)); } // 例: 12 ＋ 5
      else { a = rand(1, 9); b = rand(1, 9); } // 例: 3 ＋ 5
      return { subject: 'math', q: `${a} ＋ ${b} ＝ ？`, type: 'number', value: a + b };
    }
    if (applied) { a = rand(10, 19); b = rand(1, 9); } // 例: 15 − 7
    else { a = rand(2, 9); b = rand(1, a); } // 例: 8 − 3
    return { subject: 'math', q: `${a} − ${b} ＝ ？`, type: 'number', value: a - b };
  }

  // えらんだ教科から、同じ問題が続かないように出題する
  function createQuestionDeck(subjects, level) {
    let pool = [];
    function refill() {
      pool = FIXED.filter((q) => subjects.includes(q.subject));
      for (let i = pool.length - 1; i > 0; i--) {
        const j = rand(0, i);
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }
    return function next() {
      const useMath = subjects.includes('math') && (subjects.length === 1 || Math.random() < 1 / subjects.length);
      if (useMath) return makeMathQuestion(level);
      if (pool.length === 0) refill();
      return pool.pop();
    };
  }

  // 「{大|おお}きい」→ [{ text: '大', ruby: 'おお' }, { text: 'きい' }]
  function parseRuby(str) {
    const parts = [];
    const re = /\{([^|}]+)\|([^}]+)\}/g;
    let last = 0, m;
    while ((m = re.exec(str))) {
      if (m.index > last) parts.push({ text: str.slice(last, m.index) });
      parts.push({ text: m[1], ruby: m[2] });
      last = re.lastIndex;
    }
    if (last < str.length) parts.push({ text: str.slice(last) });
    return parts;
  }

  // ふりがなを外した文（「{大|おお}きい」→「大きい」）
  const plainText = (str) => parseRuby(str).map((p) => p.text).join('');

  const api = { SUBJECTS, FIXED, makeMathQuestion, createQuestionDeck, parseRuby, plainText };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Questions = api;
})(typeof window !== 'undefined' ? window : globalThis);

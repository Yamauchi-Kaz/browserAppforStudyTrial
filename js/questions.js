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

  const FIXED = [
    // こくご
    { subject: 'japanese', q: '「山」の読み方は？（ひらがなで）', type: 'text', answers: ['やま', 'さん'], voice: ['山', '3', '三'] },
    { subject: 'japanese', q: '「川」の読み方は？（ひらがなで）', type: 'text', answers: ['かわ'], voice: ['川', '河', '皮', '革'] },
    { subject: 'japanese', q: '「大きい」の反対の言葉は？', type: 'text', answers: ['小さい', 'ちいさい'] },
    { subject: 'japanese', q: '「あつい」の反対の言葉は？（天気のこと）', type: 'text', answers: ['寒い', 'さむい'] },
    { subject: 'japanese', q: '「花」の読み方は？（ひらがなで）', type: 'text', answers: ['はな'], voice: ['花', '鼻', '華'] },
    { subject: 'japanese', q: '「早い」の反対の言葉は？', type: 'text', answers: ['遅い', 'おそい'] },
    { subject: 'japanese', q: '「犬も歩けば○○に当たる」○○に入る言葉は？', type: 'text', answers: ['棒', 'ぼう'], voice: ['某', '坊'] },
    { subject: 'japanese', q: '「石の上にも○年」○に入る数は？', type: 'number', value: 3 },
    { subject: 'japanese', q: '「空」の訓読みは？（ひらがなで）', type: 'text', answers: ['そら'], voice: ['空'] },
    { subject: 'japanese', q: '「明るい」の反対の言葉は？', type: 'text', answers: ['暗い', 'くらい'], voice: ['位', 'クライ'] },

    // えいご（日本語で答える）
    { subject: 'english', q: '「apple」を日本語でいうと？', type: 'text', answers: ['りんご', 'リンゴ', '林檎'] },
    { subject: 'english', q: '「dog」を日本語でいうと？', type: 'text', answers: ['犬', 'いぬ'] },
    { subject: 'english', q: '「cat」を日本語でいうと？', type: 'text', answers: ['猫', 'ねこ'] },
    { subject: 'english', q: '「red」を日本語でいうと？', type: 'text', answers: ['赤', 'あか', '赤色', 'あかいろ', '赤い', 'あかい'] },
    { subject: 'english', q: '「blue」を日本語でいうと？', type: 'text', answers: ['青', 'あお', '青色', 'あおいろ', '青い', 'あおい'] },
    { subject: 'english', q: '「water」を日本語でいうと？', type: 'text', answers: ['水', 'みず', 'お水', 'おみず'] },
    { subject: 'english', q: '「book」を日本語でいうと？', type: 'text', answers: ['本', 'ほん'] },
    { subject: 'english', q: '「Monday」は何曜日？', type: 'text', answers: ['月曜日', 'げつようび', '月曜', 'げつよう'] },
    { subject: 'english', q: '「five」は数字でいくつ？', type: 'number', value: 5 },
    { subject: 'english', q: '「twelve」は数字でいくつ？', type: 'number', value: 12 },
    { subject: 'english', q: '「teacher」を日本語でいうと？', type: 'text', answers: ['先生', 'せんせい', '教師', 'きょうし'] },
    { subject: 'english', q: '「school」を日本語でいうと？', type: 'text', answers: ['学校', 'がっこう'] },
    { subject: 'english', q: '「summer」はどの季節？', type: 'text', answers: ['夏', 'なつ'] },
    { subject: 'english', q: '「Good morning」を日本語でいうと？', type: 'text', answers: ['おはよう', 'おはようございます'] },

    // しゃかい
    { subject: 'social', q: '日本の首都はどこ？', type: 'text', answers: ['東京', 'とうきょう', '東京都', 'とうきょうと'] },
    { subject: 'social', q: '日本でいちばん高い山は？', type: 'text', answers: ['富士山', 'ふじさん', '富士', 'ふじ'] },
    { subject: 'social', q: '日本でいちばん大きい湖は？', type: 'text', answers: ['琵琶湖', 'びわこ'] },
    { subject: 'social', q: '日本でいちばん面積が大きい都道府県は？', type: 'text', answers: ['北海道', 'ほっかいどう'] },
    { subject: 'social', q: '日本の都道府県はいくつある？', type: 'number', value: 47 },
    { subject: 'social', q: '江戸幕府を開いた人はだれ？', type: 'text', answers: ['徳川家康', 'とくがわいえやす', '家康', 'いえやす'] },
    { subject: 'social', q: '大阪府の「府庁」がある市は？', type: 'text', answers: ['大阪市', 'おおさかし', '大阪', 'おおさか'] },
    { subject: 'social', q: '日本でいちばん長い川は？', type: 'text', answers: ['信濃川', 'しなのがわ'] },
    { subject: 'social', q: 'お米をつくる田んぼのことを漢字2文字で？（すいでん）', type: 'text', answers: ['水田', 'すいでん'] },
    { subject: 'social', q: '日本の国旗の名前は？', type: 'text', answers: ['日の丸', 'ひのまる', '日章旗', 'にっしょうき'] },
    { subject: 'social', q: '1年は何か月？', type: 'number', value: 12 },
    { subject: 'social', q: '火事のときに電話する番号は？', type: 'number', value: 119 },

    // りか
    { subject: 'science', q: '水がこおると何になる？', type: 'text', answers: ['氷', 'こおり'] },
    { subject: 'science', q: '水が沸とうすると出てくるものは？（○○○○き）', type: 'text', answers: ['水蒸気', 'すいじょうき', '湯気', 'ゆげ'] },
    { subject: 'science', q: '昆虫のあしは何本？', type: 'number', value: 6 },
    { subject: 'science', q: 'クモのあしは何本？', type: 'number', value: 8 },
    { subject: 'science', q: '太陽がのぼる方角は？', type: 'text', answers: ['東', 'ひがし'] },
    { subject: 'science', q: '太陽がしずむ方角は？', type: 'text', answers: ['西', 'にし'] },
    { subject: 'science', q: '植物が日光を受けてでんぷんをつくるはたらきは？', type: 'text', answers: ['光合成', 'こうごうせい'] },
    { subject: 'science', q: '磁石の2つの極は、N極と何極？', type: 'text', answers: ['S極', 'えすきょく', 'S', 'えす'] },
    { subject: 'science', q: 'オタマジャクシは大きくなると何になる？', type: 'text', answers: ['カエル', 'かえる', '蛙'], voice: ['帰る', '変える', '返る', '代える'] },
    { subject: 'science', q: '地球のまわりを回っている星は？', type: 'text', answers: ['月', 'つき'] },
    { subject: 'science', q: '水は何度でこおる？', type: 'number', value: 0 },
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

  const api = { SUBJECTS, FIXED, makeMathQuestion, createQuestionDeck };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Questions = api;
})(typeof window !== 'undefined' ? window : globalThis);

// 判定ロジックのテスト: node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const { judge, extractNumber } = require('../js/judge.js');
const { FIXED, makeMathQuestion, parseRuby, plainText } = require('../js/questions.js');

const tokyo = { type: 'text', answers: ['東京', 'とうきょう', '東京都', 'とうきょうと'] };
const ieyasu = { type: 'text', answers: ['徳川家康', 'とくがわいえやす', '家康', 'いえやす'] };
const apple = { type: 'text', answers: ['りんご', 'リンゴ', '林檎'] };
const num12 = { type: 'number', value: 12 };

const ok = (input, q) => assert.strictEqual(judge(input, q).result, 'correct', input);
const ng = (input, q) => assert.notStrictEqual(judge(input, q).result, 'correct', input);

test('表記ゆれを正解にする', () => {
  ok('東京', tokyo);
  ok('トウキョウ', tokyo);
  ok('とうきょう です', tokyo);
  ok('答えは東京だと思う', tokyo);
  ok('ﾘﾝｺﾞ', apple);
  ok('りんご！', apple);
  ok('徳川家康', ieyasu);
  ok('とくがわいえやす', ieyasu);
});

test('小さな打ちまちがいはゆるす', () => {
  ok('とくがわいえやつ', ieyasu);
});

test('ちがう答えや否定は不正解', () => {
  ng('大阪', tokyo);
  ng('東京じゃない', tokyo);
  ng('わからない', apple);
  ng('', apple);
  ng('みかん', apple);
});

test('おしい判定', () => {
  assert.strictEqual(judge('とうきよ', tokyo).result, 'close');
});

test('声でこたえたときに漢字に変わっても、読み方の問題は正解', () => {
  const sora = FIXED.find((q) => q.q.startsWith('「空」'));
  const hana = FIXED.find((q) => q.q.startsWith('「花」'));
  const kaeru = FIXED.find((q) => q.q.startsWith('オタマジャクシ'));
  ok('空', sora);
  ok('そら', sora);
  ok('空です', sora);
  ng('海', sora);
  ok('鼻', hana);
  ok('帰る', kaeru);
});

test('同じ答えを2回くりかえしても正解', () => {
  const east = FIXED.find((q) => q.q.startsWith('たいようが のぼる'));
  ok('東東', east);
  ok('東 東', east);
  ok('ひがし ひがし', east);
  ok('ひがし、ひがし', east);
  ok('ひがしひがし', east);
  ng('西西', east);
  ok('12 12', num12);
  ok('じゅうに 12', num12);
  ng('11 12', num12);
});

test('数の答え', () => {
  ok('12', num12);
  ok('１２', num12);
  ok('12こ', num12);
  ok('十二', num12);
  ok('答えは12です', num12);
  ng('13', num12);
  ng('いち', num12);
  assert.strictEqual(extractNumber('百十九'), 119);
  assert.strictEqual(extractNumber('二千三百'), 2300);
  assert.strictEqual(extractNumber('三万五千'), 35000);
});

test('さんすうは 1けた±1けた と 10〜19±1けた だけ', () => {
  for (let i = 0; i < 2000; i++) {
    for (const level of ['easy', 'normal', 'hard']) {
      const q = makeMathQuestion(level);
      const [, a, op, b] = q.q.match(/(\d+) (.) (\d+)/).map((x, j) => (j === 2 ? x : Number(x)));
      assert.ok(b >= 1 && b <= 9, q.q);
      assert.ok(a >= 1 && a <= 19, q.q);
      if (op === '＋') assert.ok(a <= 9 || a + b <= 20, q.q);
      else assert.ok(a - b >= 0, q.q);
    }
  }
});

test('ふりがなの書き方を読みとれる', () => {
  assert.deepStrictEqual(parseRuby('「{大|おお}きい」の はんたい'), [{ text: '「' }, { text: '大', ruby: 'おお' }, { text: 'きい」の はんたい' }]);
  assert.strictEqual(plainText('「{早|はや}い」'), '「早い」');
});

test('問題文の漢字には ふりがなが付いている（読み方をきく問題の漢字はのぞく）', () => {
  const kanji = /[\u4e00-\u9fff]/;
  for (const q of FIXED) {
    const bare = parseRuby(q.q).filter((p) => !p.ruby).map((p) => p.text).join('').replace(/「.」の よみかたは/, '');
    assert.ok(!kanji.test(bare), q.q);
    if (q.type === 'text') assert.ok(!kanji.test(q.answers[0]), `こたえの1つ目は ひらがな: ${q.q}`);
  }
});

test('問題データの正解は全部、自分自身で正解になる', () => {
  for (const q of FIXED) {
    if (q.type === 'number') ok(String(q.value), q);
    else for (const a of q.answers.concat(q.voice || [])) ok(a, q);
  }
  for (let i = 0; i < 200; i++) {
    for (const level of ['easy', 'normal', 'hard']) {
      const q = makeMathQuestion(level);
      assert.ok(Number.isInteger(q.value) && q.value >= 0, q.q);
      ok(String(q.value), q);
    }
  }
});

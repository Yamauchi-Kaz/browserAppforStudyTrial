// ゲーム本体
(function () {
  'use strict';

  const { SUBJECTS, createQuestionDeck } = window.Questions;
  const { judge } = window.Judge;

  const LEVELS = {
    easy: { time: 30 },
    normal: { time: 20 },
    hard: { time: 12 },
  };

  const ENEMIES = [
    { name: 'スライム', sprite: '🟢', hp: 60, attack: 10 },
    { name: 'おばけ', sprite: '👻', hp: 80, attack: 12 },
    { name: 'タコまじん', sprite: '🐙', hp: 100, attack: 15 },
    { name: 'ロボット', sprite: '🤖', hp: 120, attack: 18 },
    { name: 'ドラゴン', sprite: '🐉', hp: 200, attack: 25, boss: true },
  ];

  const PLAYER_MAX_HP = 100;
  const BASE_DAMAGE = 10;
  const SPEED_BONUS = 30; // 時間がたくさん残っているほど、最大これだけ追加ダメージ

  const $ = (id) => document.getElementById(id);
  const el = {
    subjectList: $('subject-list'),
    start: $('btn-start'),
    retry: $('btn-retry'),
    stage: $('stage-label'),
    score: $('score'),
    enemyName: $('enemy-name'),
    enemySprite: $('enemy-sprite'),
    enemyHpFill: $('enemy-hp-fill'),
    enemyHpText: $('enemy-hp-text'),
    damagePop: $('damage-pop'),
    subjectTag: $('subject-tag'),
    question: $('question-text'),
    timerFill: $('timer-fill'),
    form: $('answer-form'),
    input: $('answer-input'),
    mic: $('btn-mic'),
    feedback: $('feedback'),
    playerHpFill: $('player-hp-fill'),
    playerHpText: $('player-hp-text'),
    combo: $('combo'),
    mark: $('mark'),
  };

  let state = null;
  let timerId = null;
  let composing = false;

  // ---------- 効果音（Web Audio で作るので音声ファイル不要） ----------
  let audioCtx = null;
  function beep(freqs, duration = 0.12, type = 'square') {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = f;
        const t = audioCtx.currentTime + i * duration;
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + duration);
      });
    } catch (e) { /* 音が出せない環境では無視 */ }
  }
  const sound = {
    correct: () => beep([660, 880, 1320], 0.08),
    wrong: () => beep([200], 0.2, 'sawtooth'),
    damage: () => beep([300, 150], 0.15, 'sawtooth'),
    win: () => beep([523, 659, 784, 1047], 0.15),
  };

  // ---------- 画面 ----------
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    $('screen-' + name).classList.add('active');
  }

  function replay(node, cls) {
    node.classList.remove(cls);
    void node.offsetWidth; // アニメーションをやり直すため
    node.classList.add(cls);
  }

  function renderSubjects() {
    el.subjectList.innerHTML = '';
    for (const [key, s] of Object.entries(SUBJECTS)) {
      const label = document.createElement('label');
      label.className = 'chip';
      label.innerHTML = `<input type="checkbox" value="${key}" checked><span>${s.icon} ${s.name}</span>`;
      el.subjectList.appendChild(label);
    }
  }

  function renderHp() {
    const e = state.enemy;
    el.enemyHpFill.style.width = (100 * e.hp) / e.maxHp + '%';
    el.enemyHpText.textContent = `${e.hp} / ${e.maxHp}`;
    el.playerHpFill.style.width = (100 * state.hp) / PLAYER_MAX_HP + '%';
    el.playerHpText.textContent = `${state.hp} / ${PLAYER_MAX_HP}`;
    el.score.textContent = state.score;
    el.combo.textContent = state.combo >= 2 ? `${state.combo} れんぞくせいかい！` : '';
  }

  function setFeedback(text, cls) {
    el.feedback.textContent = text;
    el.feedback.className = 'feedback ' + (cls || '');
  }

  function showMark(ok) {
    el.mark.textContent = ok ? '○' : '×';
    el.mark.className = 'mark ' + (ok ? 'good' : 'bad');
    replay(el.mark, 'show');
  }

  function popDamage(text) {
    el.damagePop.textContent = text;
    replay(el.damagePop, 'show');
  }

  // ---------- ゲームの流れ ----------
  function startGame() {
    const subjects = [...el.subjectList.querySelectorAll('input:checked')].map((i) => i.value);
    if (subjects.length === 0) {
      el.start.textContent = 'きょうかを1つ以上えらんでね';
      setTimeout(() => { el.start.textContent = 'スタート！'; }, 1500);
      return;
    }
    const level = document.querySelector('input[name="level"]:checked').value;
    state = {
      level,
      timeLimit: LEVELS[level].time,
      nextQuestion: createQuestionDeck(subjects, level),
      hp: PLAYER_MAX_HP,
      score: 0,
      combo: 0,
      enemyIndex: 0,
      enemy: null,
      question: null,
      startedAt: 0,
      locked: false,
      correct: 0,
      timeouts: 0,
      defeated: 0,
      mistakes: [],
    };
    showScreen('battle');
    spawnEnemy();
  }

  function spawnEnemy() {
    const base = ENEMIES[state.enemyIndex];
    state.enemy = { ...base, maxHp: base.hp };
    el.stage.textContent = base.boss ? 'ボスせん！' : `ステージ ${state.enemyIndex + 1}`;
    el.enemyName.textContent = base.name;
    el.enemySprite.textContent = base.sprite;
    el.enemySprite.className = 'enemy';
    setFeedback(`${base.name} があらわれた！`);
    renderHp();
    setTimeout(nextQuestion, 900);
  }

  function nextQuestion() {
    state.question = state.nextQuestion();
    state.locked = false;
    const subj = SUBJECTS[state.question.subject];
    el.subjectTag.textContent = `${subj.icon} ${subj.name}`;
    el.question.textContent = state.question.q;
    el.input.value = '';
    el.input.disabled = false;
    el.input.focus();
    setFeedback('');
    state.startedAt = performance.now();
    clearInterval(timerId);
    timerId = setInterval(tick, 50);
    tick();
  }

  function remainingRatio() {
    const elapsed = (performance.now() - state.startedAt) / 1000;
    return Math.max(0, 1 - elapsed / state.timeLimit);
  }

  function tick() {
    const r = remainingRatio();
    el.timerFill.style.width = r * 100 + '%';
    el.timerFill.className = 'timer-fill' + (r < 0.25 ? ' danger' : r < 0.5 ? ' warn' : '');
    if (r <= 0) onTimeout();
  }

  function answerText(q) {
    return q.type === 'number' ? String(q.value) : q.answers[0];
  }

  function onSubmit(ev) {
    ev.preventDefault();
    if (!state || state.locked || composing) return;
    const input = el.input.value;
    if (!input.trim()) return;

    const { result } = judge(input, state.question);
    if (result === 'correct') {
      onCorrect();
    } else {
      sound.wrong();
      showMark(false);
      state.combo = 0;
      renderHp();
      setFeedback(result === 'close' ? 'おしい！もういちど！' : 'ざんねん…もういちど！', result === 'close' ? 'close' : 'bad');
      el.input.select();
    }
  }

  function onCorrect() {
    state.locked = true;
    clearInterval(timerId);
    const ratio = remainingRatio();
    state.combo += 1;
    const comboBonus = Math.min(state.combo - 1, 5) * 2;
    const damage = Math.round(BASE_DAMAGE + SPEED_BONUS * ratio) + comboBonus;
    const fast = ratio >= 0.7;

    state.correct += 1;
    state.score += damage * 10;
    state.enemy.hp = Math.max(0, state.enemy.hp - damage);

    sound.correct();
    showMark(true);
    replay(el.enemySprite, 'hit');
    popDamage((fast ? 'はやい！ ' : '') + damage + ' ダメージ！');
    setFeedback(fast ? 'すごい！はやい！' : 'せいかい！', 'good');
    renderHp();

    if (state.enemy.hp <= 0) setTimeout(onEnemyDefeated, 700);
    else setTimeout(nextQuestion, 1000);
  }

  function onTimeout() {
    if (state.locked) return;
    state.locked = true;
    clearInterval(timerId);
    el.input.disabled = true;
    state.timeouts += 1;
    state.combo = 0;
    state.hp = Math.max(0, state.hp - state.enemy.attack);
    state.mistakes.push({ q: state.question.q, a: answerText(state.question) });

    sound.damage();
    replay(el.enemySprite, 'attack');
    replay(document.body, 'shake');
    setFeedback(`じかんぎれ！ ${state.enemy.attack} ダメージをうけた… こたえは「${answerText(state.question)}」`, 'bad');
    renderHp();

    if (state.hp <= 0) setTimeout(() => endGame(false), 1800);
    else setTimeout(nextQuestion, 2200);
  }

  function onEnemyDefeated() {
    state.defeated += 1;
    sound.win();
    el.enemySprite.classList.add('defeated');
    setFeedback(`${state.enemy.name} をたおした！`, 'good');
    state.enemyIndex += 1;
    if (state.enemyIndex >= ENEMIES.length) {
      setTimeout(() => endGame(true), 1200);
    } else {
      // ちょっとだけ回復
      state.hp = Math.min(PLAYER_MAX_HP, state.hp + 10);
      setTimeout(spawnEnemy, 1300);
    }
  }

  function endGame(win) {
    clearInterval(timerId);
    state.locked = true;
    $('result-title').textContent = win ? '🎉 ゲームクリア！ 🎉' : '😢 ゲームオーバー';
    $('result-score').textContent = state.score;
    $('result-correct').textContent = state.correct;
    $('result-timeout').textContent = state.timeouts;
    $('result-defeated').textContent = state.defeated;
    const list = $('review-list');
    list.innerHTML = '';
    for (const m of state.mistakes) {
      const li = document.createElement('li');
      li.textContent = `${m.q} → ${m.a}`;
      list.appendChild(li);
    }
    $('review-panel').hidden = state.mistakes.length === 0;
    showScreen('result');
  }

  // ---------- 音声入力（ブラウザーの機能なので無料。Chrome / Edge / Safari） ----------
  function setupMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    el.mic.hidden = false;
    let rec = null;
    el.mic.addEventListener('click', () => {
      if (rec) { rec.stop(); return; }
      rec = new SR();
      rec.lang = 'ja-JP';
      rec.interimResults = false;
      rec.onresult = (e) => {
        el.input.value = e.results[0][0].transcript;
        el.form.requestSubmit();
      };
      rec.onend = () => { rec = null; el.mic.classList.remove('listening'); };
      rec.onerror = () => { rec = null; el.mic.classList.remove('listening'); };
      el.mic.classList.add('listening');
      rec.start();
    });
  }

  // ---------- 初期化 ----------
  renderSubjects();
  setupMic();
  el.start.addEventListener('click', startGame);
  el.retry.addEventListener('click', () => showScreen('title'));
  el.form.addEventListener('submit', onSubmit);
  // 日本語入力（IME）の変換を確定するための Enter では送信しない
  el.input.addEventListener('compositionstart', () => { composing = true; });
  el.input.addEventListener('compositionend', () => { setTimeout(() => { composing = false; }, 0); });
})();

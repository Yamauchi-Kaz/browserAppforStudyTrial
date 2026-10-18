// ゲーム本体
(function () {
  'use strict';

  const { SUBJECTS, createQuestionDeck, parseRuby } = window.Questions;
  const { judge } = window.Judge;
  const Sound = window.Sound;

  const LEVELS = {
    easy: { time: 30 },
    normal: { time: 20 },
    hard: { time: 12 },
  };

  // RPG によく出てくるモンスターを参考にした、オリジナルのモンスター（絵は js/stage.js で描いている）
  const ENEMIES = [
    { key: 'slime', name: 'ぷるぷるスライム', hp: 60, attack: 10 },
    { key: 'bat', name: 'バットン', hp: 80, attack: 12 },
    { key: 'mage', name: 'ダークまどうし', hp: 100, attack: 15 },
    { key: 'golem', name: 'ストーンゴーレム', hp: 130, attack: 18 },
    { key: 'dragon', name: 'マグマドラゴン', hp: 220, attack: 25, boss: true },
  ];


  const PLAYER_MAX_HP = 100;
  const BASE_DAMAGE = 10;
  const SPEED_BONUS = 30; // 時間がたくさん残っているほど、最大これだけ追加ダメージ
  const HEAL_ON_DEFEAT = 15;

  const $ = (id) => document.getElementById(id);
  const el = {
    subjectList: $('subject-list'),
    start: $('btn-start'),
    retry: $('btn-retry'),
    sound: $('btn-sound'),
    stageLabel: $('stage-label'),
    score: $('score'),
    enemyName: $('enemy-name'),
    enemyHpFill: $('enemy-hp-fill'),
    enemyHpText: $('enemy-hp-text'),
    banner: $('banner'),
    subjectTag: $('subject-tag'),
    question: $('question-text'),
    timerFill: $('timer-fill'),
    form: $('answer-form'),
    input: $('answer-input'),
    mic: $('btn-mic'),
    heard: $('heard'),
    modeVoice: $('mode-voice'),
    voiceNote: $('voice-note'),
    feedback: $('feedback'),
    playerHpFill: $('player-hp-fill'),
    playerHpText: $('player-hp-text'),
    combo: $('combo'),
    mark: $('mark'),
    hurt: $('hurt-flash'),
  };

  const battleStage = new window.Stage($('stage'));
  const titleStage = new window.Stage($('title-stage'));

  let state = null;
  let timerId = null;
  let composing = false;
  let listener = null; // 音声認識（使えないブラウザーでは null）

  // ゲームをやり直したあとに、前のゲームの予約が動かないようにする
  function later(fn, ms) {
    const s = state;
    setTimeout(() => { if (state === s) fn(); }, ms);
  }

  // ---------- 画面 ----------
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    $('screen-' + name).classList.add('active');
    if (name === 'battle') { battleStage.start(); titleStage.stop(); } else battleStage.stop();
    if (name === 'title') titleStage.start();
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
    el.playerHpFill.classList.toggle('low', state.hp <= 30);
    el.score.textContent = state.score;
    if (state.combo >= 2) {
      el.combo.textContent = `🔥 ${state.combo} コンボ！`;
      replay(el.combo, 'pop');
    } else {
      el.combo.textContent = '';
    }
  }

  // 「{大|おお}きい」のような書き方を、ふりがな付きの文字にして node に入れる
  function renderRuby(node, str) {
    node.textContent = '';
    for (const part of parseRuby(str)) {
      if (!part.ruby) { node.appendChild(document.createTextNode(part.text)); continue; }
      const ruby = document.createElement('ruby');
      ruby.appendChild(document.createTextNode(part.text));
      const rt = document.createElement('rt');
      rt.textContent = part.ruby;
      ruby.appendChild(rt);
      node.appendChild(ruby);
    }
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

  function showBanner(text, boss) {
    el.banner.textContent = text;
    el.banner.className = 'banner' + (boss ? ' boss' : '');
    replay(el.banner, 'show');
  }

  // ---------- タイトル画面のキャラクター紹介 ----------
  let titleIndex = 0;
  function cycleTitleMonster() {
    titleStage.setMonster(ENEMIES[titleIndex % ENEMIES.length].key);
    $('title-monster-name').textContent = ENEMIES[titleIndex % ENEMIES.length].name;
    titleIndex++;
  }

  // ---------- ゲームの流れ ----------
  function startGame() {
    Sound.unlock();
    const subjects = [...el.subjectList.querySelectorAll('input:checked')].map((i) => i.value);
    if (subjects.length === 0) {
      Sound.play('wrong');
      el.start.textContent = 'きょうかを 1つ いじょう えらんでね';
      setTimeout(() => { el.start.textContent = 'スタート！'; }, 1500);
      return;
    }
    Sound.play('start');
    const level = document.querySelector('input[name="level"]:checked').value;
    const voiceMode = !!listener && el.modeVoice.checked;
    state = {
      level,
      voiceMode,
      timeLimit: LEVELS[level].time,
      nextQuestion: createQuestionDeck(subjects, level),
      hp: PLAYER_MAX_HP,
      score: 0,
      combo: 0,
      enemyIndex: 0,
      enemy: null,
      question: null,
      startedAt: 0,
      lastTickSecond: null,
      locked: true,
      correct: 0,
      timeouts: 0,
      defeated: 0,
      mistakes: [],
    };
    Sound.setDuck(voiceMode);
    showScreen('battle');
    el.heard.textContent = '';
    el.question.textContent = '';
    el.subjectTag.textContent = '';
    el.timerFill.style.width = '100%';
    if (voiceMode) {
      // スタートボタンを押したタイミングでマイクの許可をもらっておく
      requestMicPermission().then((ok) => {
        if (!ok) disableVoiceMode('マイクが つかえないので、キーボードで こたえてね');
        spawnEnemy();
      });
    } else {
      spawnEnemy();
    }
  }

  async function requestMicPermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch (e) {
      return false;
    }
  }

  function disableVoiceMode(message) {
    if (state) state.voiceMode = false;
    if (listener) listener.stop();
    Sound.setDuck(false);
    el.heard.textContent = message;
  }

  function spawnEnemy() {
    const base = ENEMIES[state.enemyIndex];
    state.enemy = { ...base, maxHp: base.hp };
    state.locked = true;
    el.stageLabel.textContent = base.boss ? '⚠️ ボスせん！' : `ステージ ${state.enemyIndex + 1} / ${ENEMIES.length}`;
    el.enemyName.textContent = base.name;
    el.question.textContent = '';
    el.subjectTag.textContent = '';
    setFeedback('');
    battleStage.setMonster(base.key);
    showBanner(`${base.name} があらわれた！`, base.boss);
    Sound.play(base.boss ? 'bossAppear' : 'appear');
    Sound.bgm(base.boss ? 'boss' : 'battle');
    renderHp();
    later(nextQuestion, base.boss ? 2000 : 1500);
  }

  function nextQuestion() {
    state.question = state.nextQuestion();
    state.locked = false;
    state.lastTickSecond = null;
    battleStage.setDanger(false);
    const subj = SUBJECTS[state.question.subject];
    el.subjectTag.textContent = `${subj.icon} ${subj.name}`;
    renderRuby(el.question, state.question.q);
    replay(el.question, 'appear');
    el.input.value = '';
    el.input.disabled = false;
    if (!state.voiceMode) el.input.focus();
    setFeedback('');
    if (state.voiceMode) {
      el.heard.textContent = '🎤 きいてるよ… こたえを いってね';
      listener.start();
    }
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
    battleStage.setDanger(r < 0.3);
    // のこり5びょうから カチカチ鳴らす
    const sec = Math.ceil(r * state.timeLimit);
    if (sec <= 5 && sec > 0 && sec !== state.lastTickSecond) {
      state.lastTickSecond = sec;
      Sound.play('tick');
    }
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
    submitAnswer([input]);
  }

  // candidates: 答えの候補（音声認識では聞き取りの候補が複数来る）
  function submitAnswer(candidates) {
    if (!state || state.locked) return;
    const results = candidates.map((c) => judge(c, state.question).result);
    const result = results.includes('correct') ? 'correct' : results.includes('close') ? 'close' : 'wrong';
    if (result === 'correct') {
      onCorrect();
    } else {
      Sound.play(result === 'close' ? 'close' : 'wrong');
      later(() => Sound.play('laugh'), 350);
      battleStage.taunt();
      showMark(false);
      state.combo = 0;
      renderHp();
      setFeedback(result === 'close' ? 'おしい！もういちど！' : 'ざんねん…もういちど！', result === 'close' ? 'close' : 'bad');
      if (!state.voiceMode) el.input.select();
    }
  }

  function onCorrect() {
    state.locked = true;
    if (listener) listener.stop();
    clearInterval(timerId);
    battleStage.setDanger(false);
    const ratio = remainingRatio();
    state.combo += 1;
    const comboBonus = Math.min(state.combo - 1, 5) * 2;
    const damage = Math.round(BASE_DAMAGE + SPEED_BONUS * ratio) + comboBonus;
    const critical = ratio >= 0.7;

    state.correct += 1;
    state.score += damage * 10;

    showMark(true);
    setFeedback(critical ? 'すごい！はやい！' : 'せいかい！', 'good');
    Sound.play('shoot');
    const s = state;
    battleStage.playerAttack({ damage, critical, count: Math.min(1 + Math.floor(state.combo / 2), 3) }).then(() => {
      if (state !== s) return;
      Sound.play(critical ? 'critical' : 'hit');
      state.enemy.hp = Math.max(0, state.enemy.hp - damage);
      renderHp();
      if (state.enemy.hp <= 0) later(onEnemyDefeated, 400);
      else later(nextQuestion, 900);
    });
  }

  function onTimeout() {
    if (state.locked) return;
    state.locked = true;
    clearInterval(timerId);
    if (listener) listener.stop();
    el.input.disabled = true;
    state.timeouts += 1;
    state.combo = 0;
    state.mistakes.push({ q: state.question.q, a: answerText(state.question) });
    setFeedback(`じかんぎれ！ こたえは「${answerText(state.question)}」`, 'bad');

    Sound.play('enemyAttack');
    const s = state;
    battleStage.enemyAttack().then(() => {
      if (state !== s) return;
      battleStage.setDanger(false);
      state.hp = Math.max(0, state.hp - state.enemy.attack);
      replay(document.body, 'shake');
      replay(el.hurt, 'show');
      setFeedback(`${state.enemy.attack} ダメージをうけた！ こたえは「${answerText(state.question)}」`, 'bad');
      renderHp();
      if (state.hp <= 0) later(() => endGame(false), 1500);
      else later(nextQuestion, 2200);
    });
  }

  function onEnemyDefeated() {
    state.defeated += 1;
    Sound.play('defeat');
    showBanner(`${state.enemy.name} をたおした！`);
    setFeedback('');
    battleStage.defeat().then(() => {
      if (state.enemyIndex + 1 >= ENEMIES.length) {
        later(() => endGame(true), 600);
        return;
      }
      state.enemyIndex += 1;
      state.hp = Math.min(PLAYER_MAX_HP, state.hp + HEAL_ON_DEFEAT);
      Sound.play('heal');
      setFeedback(`HP が ${HEAL_ON_DEFEAT} かいふくした！`, 'good');
      renderHp();
      later(spawnEnemy, 1300);
    });
  }

  function endGame(win) {
    clearInterval(timerId);
    if (listener) listener.stop();
    state.locked = true;
    Sound.setDuck(false);
    Sound.bgm(win ? 'victory' : 'gameover');
    $('result-title').textContent = win ? '🎉 ゲームクリア！ 🎉' : '😢 ゲームオーバー';
    $('result-score').textContent = state.score;
    $('result-correct').textContent = state.correct;
    $('result-timeout').textContent = state.timeouts;
    $('result-defeated').textContent = state.defeated;
    const list = $('review-list');
    list.innerHTML = '';
    for (const m of state.mistakes) {
      const li = document.createElement('li');
      renderRuby(li, `${m.q} → ${m.a}`);
      list.appendChild(li);
    }
    $('review-panel').hidden = state.mistakes.length === 0;
    showScreen('result');
  }

  // ---------- 音声入力（ブラウザーの機能なので無料。Chrome / Edge / Safari） ----------
  // start() すると、止めるまで聞き取りを続ける（1回聞きおわるたびに自動でまた聞きはじめる）
  function createListener(handlers) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    let rec = null;
    let wanted = false;

    function begin() {
      if (rec || !wanted) return;
      rec = new SR();
      rec.lang = 'ja-JP';
      rec.interimResults = true;
      rec.maxAlternatives = 5;
      rec.onresult = (e) => {
        const res = e.results[e.results.length - 1];
        if (res.isFinal) handlers.onFinal(Array.from(res, (alt) => alt.transcript));
        else handlers.onInterim(res[0].transcript);
      };
      rec.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          wanted = false;
          handlers.onFatal();
        }
      };
      rec.onend = () => {
        rec = null;
        handlers.onState(wanted);
        if (wanted) setTimeout(begin, 150);
      };
      try {
        rec.start();
        handlers.onState(true);
      } catch (e) {
        rec = null;
      }
    }

    return {
      start() { wanted = true; begin(); },
      stop() {
        wanted = false;
        if (rec) rec.abort();
        handlers.onState(false);
      },
      get active() { return wanted; },
    };
  }

  function setupVoice() {
    listener = createListener({
      onInterim(text) {
        el.heard.textContent = `🎤 「${text}」…`;
      },
      onFinal(candidates) {
        const shown = (state && state.question && candidates.find((c) => judge(c, state.question).result === 'correct')) || candidates[0];
        el.heard.textContent = `🎤 「${shown}」ってきこえたよ`;
        el.input.value = shown;
        // キーボードモードでボタンから話したときは1回でおわり
        if (!state || !state.voiceMode) listener.stop();
        submitAnswer(candidates);
      },
      onFatal() {
        disableVoiceMode('マイクが つかえないので、キーボードで こたえてね');
      },
      onState(on) {
        el.mic.classList.toggle('listening', on);
      },
    });

    if (!listener) {
      el.modeVoice.disabled = true;
      el.voiceNote.hidden = false;
      return;
    }
    el.mic.hidden = false;
    el.mic.addEventListener('click', () => {
      if (!state || state.locked) return;
      if (listener.active) {
        listener.stop();
        if (state.voiceMode) el.heard.textContent = '🎤 おやすみちゅう（ボタンで また きくよ）';
      } else {
        el.heard.textContent = '🎤 きいてるよ…';
        listener.start();
      }
    });
  }

  // ---------- 音のボタン ----------
  function renderSoundButton() {
    el.sound.textContent = Sound.muted ? '🔇' : '🔊';
    el.sound.setAttribute('aria-label', Sound.muted ? '音を出す' : '音を消す');
  }

  // ---------- 初期化 ----------
  renderSubjects();
  setupVoice();
  renderSoundButton();
  cycleTitleMonster();
  setInterval(() => { if ($('screen-title').classList.contains('active')) cycleTitleMonster(); }, 3500);
  showScreen('title');
  // スマホは画面をさわるまで音が出せないので、さいしょのタッチでタイトルBGMを流す
  document.addEventListener('pointerdown', () => {
    Sound.unlock();
    if ($('screen-title').classList.contains('active')) Sound.bgm('title');
  }, { once: true });
  el.sound.addEventListener('click', () => {
    Sound.toggleMute();
    renderSoundButton();
  });
  el.start.addEventListener('click', startGame);
  el.retry.addEventListener('click', () => {
    Sound.play('click');
    Sound.bgm('title');
    showScreen('title');
  });
  el.form.addEventListener('submit', onSubmit);
  // 日本語入力（IME）の変換を確定するための Enter では送信しない
  el.input.addEventListener('compositionstart', () => { composing = true; });
  el.input.addEventListener('compositionend', () => { setTimeout(() => { composing = false; }, 0); });
})();

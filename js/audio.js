// BGM と効果音（Web Audio API でその場で合成する。音声ファイルは使わない）
(function (root) {
  'use strict';

  const BGM_VOL = 0.55;
  const DUCK_VOL = 0.2; // 声でこたえるときは BGM を小さくして聞きとりやすくする

  let ctx = null, master, bgmGain, sfxGain, noiseBuf;
  let muted = false;
  let ducked = false;
  try { muted = localStorage.getItem('kotaete-muted') === '1'; } catch (e) { /* 保存できなくても動く */ }

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
      bgmGain = ctx.createGain();
      bgmGain.gain.value = BGM_VOL;
      bgmGain.connect(master);
      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.9;
      sfxGain.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone({ freq, type = 'square', start, dur, vol = 0.1, to = null, dest = sfxGain, attack = 0.005, release = 0.04 }) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    if (to) o.frequency.exponentialRampToValueAtTime(to, start + dur);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + attack);
    g.gain.setValueAtTime(vol, start + Math.max(attack, dur - release));
    g.gain.linearRampToValueAtTime(0, start + dur);
    o.connect(g).connect(dest);
    o.start(start);
    o.stop(start + dur + 0.02);
  }

  function noise({ start, dur, vol = 0.2, hp = 1000, lp = 0, dest = sfxGain }) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    let node = src;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp;
    node.connect(f);
    node = f;
    if (lp) {
      const f2 = ctx.createBiquadFilter();
      f2.type = 'lowpass';
      f2.frequency.value = lp;
      node.connect(f2);
      node = f2;
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    node.connect(g).connect(dest);
    src.start(start);
    src.stop(start + dur + 0.02);
  }

  const midi = (name) => {
    const m = /^([A-G])(#?)(\d)$/.exec(name);
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
    return 12 * (Number(m[3]) + 1) + base + (m[2] ? 1 : 0);
  };
  const hz = (name) => 440 * Math.pow(2, (midi(name) - 69) / 12);
  const seq = (notes, step, fn) => {
    const now = ctx.currentTime;
    notes.forEach((n, i) => n && fn(now + i * step, n));
  };

  // ---------- 効果音 ----------
  const SFX = {
    click() { tone({ freq: 880, start: ctx.currentTime, dur: 0.06, vol: 0.08 }); },
    start() { seq(['C5', 'E5', 'G5', 'C6'], 0.07, (s, n) => tone({ freq: hz(n), start: s, dur: 0.1, vol: 0.09 })); },
    shoot() { tone({ freq: 400, to: 1600, type: 'square', start: ctx.currentTime, dur: 0.18, vol: 0.07 }); },
    hit() {
      const s = ctx.currentTime;
      noise({ start: s, dur: 0.18, vol: 0.35, hp: 400 });
      tone({ freq: 180, to: 60, type: 'sine', start: s, dur: 0.18, vol: 0.4 });
    },
    critical() {
      SFX.hit();
      seq(['E6', 'G6', 'C7', 'E7'], 0.05, (s, n) => tone({ freq: hz(n), start: s, dur: 0.08, vol: 0.06, type: 'triangle' }));
    },
    wrong() {
      const s = ctx.currentTime;
      tone({ freq: 220, start: s, dur: 0.15, vol: 0.1, type: 'sawtooth' });
      tone({ freq: 160, start: s + 0.16, dur: 0.25, vol: 0.1, type: 'sawtooth' });
    },
    close() { seq(['E5', 'C5'], 0.12, (s, n) => tone({ freq: hz(n), start: s, dur: 0.12, vol: 0.08, type: 'triangle' })); },
    laugh() { seq(['A4', 'C5', 'A4', 'C5'], 0.08, (s, n) => tone({ freq: hz(n), start: s, dur: 0.07, vol: 0.06, type: 'square' })); },
    tick() { tone({ freq: 1500, start: ctx.currentTime, dur: 0.04, vol: 0.07, type: 'square' }); },
    enemyAttack() {
      const s = ctx.currentTime;
      tone({ freq: 600, to: 80, type: 'sawtooth', start: s, dur: 0.35, vol: 0.12 });
      noise({ start: s + 0.25, dur: 0.35, vol: 0.4, hp: 200 });
      tone({ freq: 120, to: 40, type: 'sine', start: s + 0.25, dur: 0.3, vol: 0.5 });
    },
    appear() {
      const s = ctx.currentTime;
      tone({ freq: 200, to: 900, type: 'triangle', start: s, dur: 0.4, vol: 0.08 });
      noise({ start: s + 0.6, dur: 0.15, vol: 0.25, hp: 300 });
    },
    bossAppear() {
      const s = ctx.currentTime;
      tone({ freq: 55, type: 'sawtooth', start: s, dur: 1.2, vol: 0.18, attack: 0.3, release: 0.4 });
      tone({ freq: 58, type: 'sawtooth', start: s, dur: 1.2, vol: 0.18, attack: 0.3, release: 0.4 });
      noise({ start: s + 0.8, dur: 0.5, vol: 0.4, hp: 100, lp: 800 });
    },
    defeat() {
      const s = ctx.currentTime;
      noise({ start: s, dur: 0.6, vol: 0.4, hp: 150 });
      seq(['C5', 'G5', 'C6', 'E6', 'G6', 'C7'], 0.06, (st, n) => tone({ freq: hz(n), start: st, dur: 0.09, vol: 0.07 }));
    },
    heal() { seq(['G5', 'C6', 'E6', 'G6'], 0.09, (s, n) => tone({ freq: hz(n), start: s, dur: 0.12, vol: 0.06, type: 'triangle' })); },
  };

  // ---------- BGM（ミニ作曲データ） ----------
  // 1文字ずつが16分音符。音名=鳴らす、- =のばす、. =休み。ドラムは k=バスドラ s=スネア h=ハイハット
  const SONGS = {
    title: {
      bpm: 112, loop: true,
      lead: 'C5 - E5 - G5 - - - A5 - G5 - E5 - - - F5 - E5 - D5 - E5 - C5 - - - . . . . ' +
            'C5 - E5 - G5 - - - C6 - B5 - A5 - G5 - F5 - D5 - B4 - D5 - C5 - - - - - . .',
      bass: 'C3 - G3 - C3 - G3 - A2 - E3 - A2 - E3 - F2 - C3 - F2 - C3 - G2 - D3 - G2 - D3 - ' +
            'C3 - G3 - C3 - G3 - A2 - E3 - A2 - E3 - F2 - C3 - G2 - D3 - C3 - G3 - C3 - . .',
      drums: 'k . h . s . h . k . h . s . h . '.repeat(4),
    },
    battle: {
      bpm: 152, loop: true,
      lead: 'A4 . A4 C5 E5 . A5 . G5 . E5 . C5 . E5 . F5 . F5 E5 D5 . C5 . D5 - - - E5 - - - ' +
            'A4 . A4 C5 E5 . A5 . B5 . C6 . B5 . G5 . A5 - - - G5 - E5 - F5 - D5 - E5 - - -',
      bass: 'A2 A2 A3 A2 A2 A2 A3 A2 A2 A2 A3 A2 A2 A2 A3 A2 F2 F2 F3 F2 F2 F2 F3 F2 G2 G2 G3 G2 G2 G2 G3 G2 ' +
            'A2 A2 A3 A2 A2 A2 A3 A2 A2 A2 A3 A2 A2 A2 A3 A2 F2 F2 F3 F2 G2 G2 G3 G2 E2 E2 E3 E2 E2 E2 E3 E2',
      drums: 'k . h k s . h . k . h k s . h h '.repeat(4),
    },
    boss: {
      bpm: 168, loop: true,
      lead: 'D5 . D5 . F5 . D5 . G#5 . G5 . F5 . D5 . C5 . C5 . D5 . C5 . A4 - - - C#5 - - - ' +
            'D5 . D5 . F5 . A5 . A#5 . A5 . F5 . D5 . E5 - F5 - G5 - A5 - A#5 - A5 - G5 - C#5 -',
      bass: 'D2 D2 D3 D2 D2 D2 D3 D2 D2 D2 D3 D2 D#2 D#2 D#3 D#2 C2 C2 C3 C2 C2 C2 C3 C2 A1 A1 A2 A1 A1 A1 A2 A1 ' +
            'D2 D2 D3 D2 D2 D2 D3 D2 D2 D2 D3 D2 D#2 D#2 D#3 D#2 A#1 A#1 A#2 A#1 A#1 A#1 A#2 A#1 A1 A1 A2 A1 A1 A1 A2 A1',
      drums: 'k h s h k k s h k h s h k k s s '.repeat(4),
    },
    victory: {
      bpm: 140, loop: false,
      lead: 'G4 C5 E5 G5 C6 - - - A5 - B5 - C6 - - - - - - - . . . .',
      bass: 'C3 - - - - - - - F2 - G2 - C3 - - - - - - - . . . .',
      drums: 'k . . . s . . . k . k . s . . . . . . . . . . .',
    },
    gameover: {
      bpm: 84, loop: false,
      lead: 'E5 - D5 - C5 - B4 - A4 - - - G#4 - - - A4 - - - - - - - . . . .',
      bass: 'A2 - - - G2 - - - F2 - - - E2 - - - A1 - - - - - - - . . . .',
      drums: '',
    },
  };

  function parseTrack(str) {
    const tokens = str.trim().split(/\s+/).filter(Boolean);
    const events = [];
    tokens.forEach((tok, i) => {
      if (tok === '-' || tok === '.') return;
      let len = 1;
      while (tokens[i + len] === '-') len++;
      events[i] = { note: tok, len };
    });
    return { events, length: tokens.length };
  }

  let song = null, songStep = 0, nextTime = 0, timer = null;

  function playStep(i, time, stepDur) {
    const lead = song.lead.events[i];
    if (lead) tone({ freq: hz(lead.note), type: 'square', start: time, dur: lead.len * stepDur * 0.92, vol: 0.06, dest: bgmGain });
    const bass = song.bass.events[i];
    if (bass) tone({ freq: hz(bass.note), type: 'triangle', start: time, dur: bass.len * stepDur * 0.85, vol: 0.2, dest: bgmGain });
    const d = song.drums.events[i];
    if (d) {
      if (d.note === 'k') tone({ freq: 150, to: 45, type: 'sine', start: time, dur: 0.14, vol: 0.45, dest: bgmGain });
      if (d.note === 's') noise({ start: time, dur: 0.12, vol: 0.16, hp: 1500, dest: bgmGain });
      if (d.note === 'h') noise({ start: time, dur: 0.03, vol: 0.07, hp: 7000, dest: bgmGain });
    }
  }

  function scheduler() {
    const stepDur = 60 / song.bpm / 4;
    while (nextTime < ctx.currentTime + 0.12) {
      if (songStep >= song.length) {
        if (!song.loop) { stopBgm(); return; }
        songStep = 0;
      }
      playStep(songStep, nextTime, stepDur);
      songStep++;
      nextTime += stepDur;
    }
  }

  function stopBgm() {
    clearInterval(timer);
    timer = null;
    song = null;
  }

  const api = {
    // 最初にボタンを押したときに呼ぶ（スマホは操作のあとでないと音が出ない）
    unlock() { ensure(); },
    play(name) {
      if (!ensure() || !SFX[name]) return;
      try { SFX[name](); } catch (e) { console.warn('sound', name, e); } // 音が出なくてもゲームは続ける
    },
    bgm(name) {
      if (!ensure()) return;
      if (song && song.name === name) return;
      stopBgm();
      const s = SONGS[name];
      const lead = parseTrack(s.lead), bass = parseTrack(s.bass), drums = parseTrack(s.drums);
      song = { name, bpm: s.bpm, loop: s.loop, lead, bass, drums, length: Math.max(lead.length, bass.length, drums.length) };
      songStep = 0;
      nextTime = ctx.currentTime + 0.05;
      timer = setInterval(scheduler, 25);
      scheduler();
    },
    stopBgm,
    setDuck(on) {
      ducked = on;
      if (ctx) bgmGain.gain.setTargetAtTime(on ? DUCK_VOL : BGM_VOL, ctx.currentTime, 0.1);
    },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('kotaete-muted', muted ? '1' : '0'); } catch (e) { /* 保存できなくても動く */ }
      if (ensure()) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05);
      return muted;
    },
    get muted() { return muted; },
    get ducked() { return ducked; },
  };

  root.Sound = api;
})(window);

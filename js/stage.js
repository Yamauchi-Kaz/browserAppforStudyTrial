// バトル画面の描画（Canvas）
// 妖怪キャラクターと背景をプログラムで描いて動かす。画像ファイルは使わない。
(function (root) {
  'use strict';

  const TAU = Math.PI * 2;
  const OUT = '#2a1b2e'; // 線の色

  // ---------- 描画の小道具 ----------
  function ellipse(ctx, x, y, rx, ry, fill, stroke, lw = 5, rot = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(rx, 0.1), Math.max(ry, 0.1), rot, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }

  function line(ctx, x1, y1, x2, y2, color, lw) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // 太い線をふちどり付きで描く（うで・首など）
  function limb(ctx, x1, y1, x2, y2, color, lw, cx, cy) {
    for (const [c, w] of [[OUT, lw + 8], [color, lw]]) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      if (cx !== undefined) ctx.quadraticCurveTo(cx, cy, x2, y2);
      else ctx.lineTo(x2, y2);
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  function eye(ctx, x, y, r, o = {}) {
    if (o.blink) {
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.quadraticCurveTo(x, y + r * 0.5, x + r, y);
      ctx.strokeStyle = OUT;
      ctx.lineWidth = r * 0.35;
      ctx.lineCap = 'round';
      ctx.stroke();
      return;
    }
    ellipse(ctx, x, y, r, r * 1.1, o.white || '#fff', OUT, 4);
    ellipse(ctx, x + (o.lookX || 0) * r * 0.3, y + r * 0.15, r * 0.52, r * 0.6, o.pupil || '#1a1a1a');
    ellipse(ctx, x + (o.lookX || 0) * r * 0.3 - r * 0.15, y - r * 0.1, r * 0.18, r * 0.18, '#fff');
  }

  function brow(ctx, x, y, w, angle, color = OUT, lw = 8) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    line(ctx, -w / 2, 0, w / 2, 0, color, lw);
    ctx.restore();
  }

  function star(ctx, x, y, r, rot = 0) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.45;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  const isBlink = (t, period = 3.3, offset = 0) => (t + offset) % period < 0.13;

  // ---------- モンスターたち（足もとが y=0、上に向かって y がマイナス） ----------
  // RPG によく出てくるモンスターを参考にした、このゲームオリジナルのデザイン
  function roundRect(ctx, x, y, w, h, r, fill, stroke = OUT, lw = 5) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }

  function glow(ctx, color, blur, fn) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    fn();
    ctx.restore();
  }

  const MONSTERS = {
    // ぷるぷるスライム: ぷるぷるゆれて、ときどきはねる
    slime: {
      theme: 'field',
      height: 175,
      pose(t) {
        const j = Math.sin(t * 6) * 0.06;
        const hop = Math.pow(Math.max(0, Math.sin(t * 2.4)), 4);
        return { sx: 1 + j - hop * 0.08, sy: 1 - j + hop * 0.1, y: -hop * 28, shadow: 1 - hop * 0.4 };
      },
      draw(ctx, t) {
        // 体
        ctx.beginPath();
        ctx.moveTo(-88, -4);
        ctx.bezierCurveTo(-100, -70, -62, -150, 0, -150);
        ctx.bezierCurveTo(62, -150, 100, -70, 88, -4);
        ctx.quadraticCurveTo(0, 8, -88, -4);
        ctx.closePath();
        const g = ctx.createRadialGradient(-20, -100, 10, 0, -70, 120);
        g.addColorStop(0, '#b6f5a0');
        g.addColorStop(1, '#34b05a');
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = OUT;
        ctx.lineWidth = 5;
        ctx.stroke();
        // つや
        ellipse(ctx, -40, -112, 20, 10, 'rgba(255,255,255,0.75)', null, 0, -0.6);
        ellipse(ctx, -60, -88, 6, 6, 'rgba(255,255,255,0.6)');
        // あたまの葉っぱ
        const sway = Math.sin(t * 3) * 0.25;
        ctx.save();
        ctx.translate(0, -148);
        ctx.rotate(sway);
        line(ctx, 0, 0, 0, -26, '#5d4037', 5);
        ellipse(ctx, -16, -28, 18, 8, '#7ed957', OUT, 3, 0.4);
        ellipse(ctx, 16, -30, 18, 8, '#7ed957', OUT, 3, -0.4);
        ctx.restore();
        // 顔
        eye(ctx, -30, -82, 17, { blink: isBlink(t, 3) });
        eye(ctx, 30, -82, 17, { blink: isBlink(t, 3) });
        ellipse(ctx, -52, -58, 10, 6, 'rgba(255,110,130,0.55)');
        ellipse(ctx, 52, -58, 10, 6, 'rgba(255,110,130,0.55)');
        ctx.beginPath();
        ctx.moveTo(-14, -56);
        ctx.quadraticCurveTo(-7, -46, 0, -56);
        ctx.quadraticCurveTo(7, -46, 14, -56);
        ctx.strokeStyle = OUT;
        ctx.lineWidth = 4;
        ctx.stroke();
        // したたり
        ellipse(ctx, 62, -10 + Math.sin(t * 2) * 3, 7, 10, '#34b05a', OUT, 3);
      },
    },

    // バットン: 大きなつばさで飛びまわるコウモリ
    bat: {
      theme: 'cave',
      height: 170,
      size: 1.3,
      attackFx: 'swoop',
      pose(t) {
        return { y: -70 + Math.sin(t * 3) * 14, x: Math.sin(t * 1.4) * 40, rot: Math.sin(t * 1.4) * 0.12, shadow: 0.45 };
      },
      draw(ctx, t) {
        const flap = 0.35 + 0.65 * Math.abs(Math.sin(t * 9));
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.translate(side * 34, -100);
          ctx.scale(side, flap);
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.quadraticCurveTo(60, -70, 140, -40);
          ctx.quadraticCurveTo(122, -18, 128, 6);
          ctx.quadraticCurveTo(102, -6, 90, 18);
          ctx.quadraticCurveTo(66, 2, 52, 28);
          ctx.quadraticCurveTo(30, 8, 0, 22);
          ctx.closePath();
          ctx.fillStyle = '#5b3a8c';
          ctx.fill();
          ctx.strokeStyle = OUT;
          ctx.lineWidth = 5;
          ctx.stroke();
          for (const [x, y] of [[128, 6], [90, 18], [52, 28]]) line(ctx, 4, 0, x, y - 6, 'rgba(30,10,50,0.5)', 3);
          ctx.restore();
        }
        // 耳
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(s * 18, -138); ctx.lineTo(s * 44, -134); ctx.lineTo(s * 38, -176); ctx.closePath();
          ctx.fillStyle = '#7e57c2'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(s * 26, -140); ctx.lineTo(s * 38, -138); ctx.lineTo(s * 36, -160); ctx.closePath();
          ctx.fillStyle = '#f48fb1'; ctx.fill();
        }
        // 足
        line(ctx, -12, -58, -14, -44, OUT, 5);
        line(ctx, 12, -58, 14, -44, OUT, 5);
        // 体
        ellipse(ctx, 0, -100, 50, 48, '#7e57c2', OUT);
        ellipse(ctx, 0, -84, 30, 22, '#b39ddb');
        // 顔
        eye(ctx, -19, -110, 16, { blink: isBlink(t, 2.6), white: '#fff59d' });
        eye(ctx, 19, -110, 16, { blink: isBlink(t, 2.6), white: '#fff59d' });
        ctx.beginPath();
        ctx.arc(0, -86, 14, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.stroke();
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(s * 9, -76); ctx.lineTo(s * 3, -76); ctx.lineTo(s * 6, -66); ctx.closePath();
          ctx.fillStyle = '#fff'; ctx.fill();
        }
      },
    },

    // ダークまどうし: フードの中で目が光る、まほうつかい
    mage: {
      theme: 'cave',
      height: 250,
      attackFx: 'magic',
      pose(t) {
        return { y: -26 + Math.sin(t * 2) * 9, shadow: 0.6 };
      },
      draw(ctx, t) {
        // マント
        ctx.beginPath();
        ctx.moveTo(-30, -200);
        ctx.quadraticCurveTo(-70, -120, -80, -16);
        const n = 6;
        for (let i = 0; i < n; i++) {
          const x0 = -80 + (160 / n) * i;
          const x1 = x0 + 160 / n;
          ctx.lineTo((x0 + x1) / 2, -16 + (i % 2 ? 6 : 22) + Math.sin(t * 4 + i) * 4);
          ctx.lineTo(x1, -16);
        }
        ctx.quadraticCurveTo(70, -120, 30, -200);
        ctx.closePath();
        ctx.fillStyle = '#2f3478';
        ctx.fill();
        ctx.strokeStyle = OUT;
        ctx.lineWidth = 5;
        ctx.stroke();
        line(ctx, 0, -150, 0, -24, 'rgba(10,10,40,0.5)', 4);
        // 金のベルト
        roundRect(ctx, -52, -96, 104, 14, 6, '#ffc93c', OUT, 3);
        ellipse(ctx, 0, -89, 9, 9, '#e53935', OUT, 3);
        // フード
        ellipse(ctx, 0, -196, 58, 56, '#3a3f91', OUT);
        ctx.beginPath();
        ctx.moveTo(-10, -248); ctx.quadraticCurveTo(30, -280, 50, -262); ctx.quadraticCurveTo(30, -250, 20, -240); ctx.closePath();
        ctx.fillStyle = '#3a3f91'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.stroke();
        ellipse(ctx, 0, -188, 40, 36, '#0b0b1e');
        // 光る目
        const blink = isBlink(t, 3.8);
        glow(ctx, '#ffeb3b', 18, () => {
          for (const s of [-1, 1]) ellipse(ctx, s * 15, -192, 9, blink ? 1.5 : 6, '#ffeb3b', null, 0, s * 0.25);
        });
        // 左手
        ellipse(ctx, -58, -112, 13, 13, '#9e9e9e', OUT, 4);
        // つえ
        const sx = 72, sy = -126;
        line(ctx, sx + 6, -26, sx + 14, -232, OUT, 14);
        line(ctx, sx + 6, -26, sx + 14, -232, '#8d5a2b', 8);
        ellipse(ctx, sx, sy, 13, 13, '#9e9e9e', OUT, 4);
        const pulse = 1 + Math.sin(t * 5) * 0.15;
        glow(ctx, '#d500f9', 30, () => ellipse(ctx, sx + 14, -246, 17 * pulse, 17 * pulse, '#e040fb', OUT, 4));
        ellipse(ctx, sx + 9, -251, 5, 5, '#fff');
        // まわる光のつぶ
        for (let i = 0; i < 3; i++) {
          const a = t * 3 + (i * TAU) / 3;
          glow(ctx, '#ea80fc', 12, () => ellipse(ctx, sx + 14 + Math.cos(a) * 34, -246 + Math.sin(a) * 14, 5, 5, '#fce4ff'));
        }
      },
    },

    // ストーンゴーレム: 石の大男。むねのルーンが光る
    golem: {
      theme: 'ruins',
      height: 265,
      attackFx: 'quake',
      pose(t) {
        return { sy: 1 + Math.sin(t * 1.8) * 0.02, x: Math.sin(t * 0.9) * 8, rot: Math.sin(t * 0.9) * 0.025 };
      },
      draw(ctx, t) {
        const stone = '#9aa1ab', dark = '#6f7680';
        // 足
        roundRect(ctx, -62, -66, 46, 66, 10, dark);
        roundRect(ctx, 16, -66, 46, 66, 10, dark);
        // うで
        const swing = Math.sin(t * 1.8) * 5;
        roundRect(ctx, -128, -192 + swing, 46, 100, 14, stone);
        roundRect(ctx, -134, -98 + swing, 58, 48, 16, dark);
        roundRect(ctx, 82, -192 - swing, 46, 100, 14, stone);
        roundRect(ctx, 76, -98 - swing, 58, 48, 16, dark);
        // 体
        roundRect(ctx, -86, -206, 172, 150, 26, stone);
        line(ctx, -50, -180, -30, -150, 'rgba(40,40,50,0.45)', 3);
        line(ctx, -30, -150, -42, -120, 'rgba(40,40,50,0.45)', 3);
        line(ctx, 52, -110, 66, -80, 'rgba(40,40,50,0.45)', 3);
        // こけ
        ellipse(ctx, -70, -204, 26, 10, '#7cb342', OUT, 3);
        ellipse(ctx, 74, -200, 20, 8, '#7cb342', OUT, 3);
        // ルーン
        const pulse = 0.6 + 0.4 * Math.sin(t * 3);
        glow(ctx, '#18ffff', 25 * pulse, () => {
          ctx.beginPath();
          ctx.arc(0, -135, 26, 0, TAU);
          ctx.strokeStyle = `rgba(24,255,255,${0.5 + pulse * 0.5})`;
          ctx.lineWidth = 6;
          ctx.stroke();
          line(ctx, 0, -155, 0, -115, `rgba(24,255,255,${0.5 + pulse * 0.5})`, 6);
          line(ctx, -14, -142, 14, -128, `rgba(24,255,255,${0.5 + pulse * 0.5})`, 6);
        });
        // 頭
        roundRect(ctx, -42, -262, 84, 62, 14, stone);
        roundRect(ctx, -30, -244, 60, 16, 6, '#263238', OUT, 3);
        const blink = isBlink(t, 4.2);
        glow(ctx, '#18ffff', 14, () => {
          for (const s of [-1, 1]) ellipse(ctx, s * 13, -236, 7, blink ? 1 : 4, '#84ffff');
        });
      },
    },

    // マグマドラゴン（ボス）: つばさを広げて火をはく
    dragon: {
      theme: 'volcano',
      height: 300,
      attackFx: 'fire',
      pose(t) {
        return { y: Math.sin(t * 1.6) * 5, sy: 1 + Math.sin(t * 1.6) * 0.015 };
      },
      draw(ctx, t) {
        const red = '#d84315', dark = '#8c2a0e';
        // つばさ
        const flap = 0.85 + Math.sin(t * 2.4) * 0.15;
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.translate(side * 50, -170);
          ctx.scale(side, flap);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(70, -90);
          ctx.lineTo(160, -110);
          ctx.quadraticCurveTo(150, -60, 165, -10);
          ctx.quadraticCurveTo(130, -20, 120, 20);
          ctx.quadraticCurveTo(90, 0, 70, 40);
          ctx.quadraticCurveTo(40, 20, 10, 50);
          ctx.closePath();
          ctx.fillStyle = '#b23a12';
          ctx.fill();
          ctx.strokeStyle = OUT;
          ctx.lineWidth = 5;
          ctx.stroke();
          for (const [x, y] of [[165, -10], [120, 20], [70, 40]]) line(ctx, 70, -90, x, y, dark, 4);
          ctx.restore();
        }
        // しっぽ
        const tw = Math.sin(t * 2) * 12;
        limb(ctx, 60, -40, 140 + tw, -10, red, 26, 120, -70);
        ctx.beginPath();
        ctx.moveTo(140 + tw, -26); ctx.lineTo(176 + tw, -12); ctx.lineTo(142 + tw, 6); ctx.closePath();
        ctx.fillStyle = '#ffca28'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.stroke();
        // 足
        for (const s of [-1, 1]) {
          ellipse(ctx, s * 52, -36, 32, 38, red, OUT);
          for (let i = -1; i <= 1; i++) ellipse(ctx, s * 52 + i * 14, -2, 6, 6, '#fff3e0', OUT, 3);
        }
        // 体
        ellipse(ctx, 0, -112, 86, 84, red, OUT);
        ellipse(ctx, 0, -100, 52, 64, '#ffca28', OUT, 4);
        for (let i = 0; i < 5; i++) line(ctx, -40 + Math.abs(i - 2) * 4, -140 + i * 20, 40 - Math.abs(i - 2) * 4, -140 + i * 20, 'rgba(160,90,0,0.5)', 3);
        // うで
        limb(ctx, -70, -140, -92, -100, red, 20);
        limb(ctx, 70, -140, 92, -100, red, 20);
        // せなかのトゲ
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 26 - 12, -188); ctx.lineTo(i * 26, -214 + Math.abs(i) * 6); ctx.lineTo(i * 26 + 12, -188); ctx.closePath();
          ctx.fillStyle = '#ffca28'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.stroke();
        }
        // 頭
        ellipse(ctx, 0, -236, 62, 50, red, OUT);
        // つの
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(s * 30, -270);
          ctx.quadraticCurveTo(s * 50, -300, s * 70, -306);
          ctx.quadraticCurveTo(s * 56, -286, s * 48, -262);
          ctx.closePath();
          ctx.fillStyle = '#fff3c4'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.stroke();
        }
        // 目
        const blink = isBlink(t, 4.5);
        for (const s of [-1, 1]) {
          if (blink) { line(ctx, s * 24 - 12, -250, s * 24 + 12, -250, OUT, 5); continue; }
          ellipse(ctx, s * 24, -250, 14, 11, '#ffeb3b', OUT, 4);
          ellipse(ctx, s * 24, -250, 3, 9, '#1a1a1a');
          brow(ctx, s * 24, -264, 30, s * 0.4, OUT, 7);
        }
        // 口・はな
        ellipse(ctx, 0, -210, 46, 28, '#e65a2a', OUT, 4);
        ellipse(ctx, -14, -220, 5, 4, OUT);
        ellipse(ctx, 14, -220, 5, 4, OUT);
        line(ctx, -32, -200, 32, -200, OUT, 4);
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(s * 24, -200); ctx.lineTo(s * 16, -200); ctx.lineTo(s * 20, -190); ctx.closePath();
          ctx.fillStyle = '#fff'; ctx.fill();
        }
        // はなから けむり
        const puff = (t * 0.8) % 1;
        if (puff < 0.6) {
          ctx.save();
          ctx.globalAlpha = 0.5 * (1 - puff / 0.6);
          for (const s of [-1, 1]) ellipse(ctx, s * (14 + puff * 20), -228 - puff * 40, 6 + puff * 14, 6 + puff * 14, '#bdbdbd');
          ctx.restore();
        }
      },
    },
  };

  // コロルン: キャラクター設定画のポーズを切りぬいた絵で動く（js/stage.js の POSE_RIGS）
  MONSTERS.kororun = {
    theme: 'field',
    height: 200,
    defeatStyle: 'fall', // くるくる回らず、たおれた絵のまま消える
    pose(t) {
      const b = Math.abs(Math.sin(t * 2.6));
      return { y: -b * 6, sy: 1 + Math.sin(t * 5.2) * 0.012, shadow: 1 - b * 0.1 };
    },
    draw(ctx, t) { MONSTERS.slime.draw(ctx, t); }, // 絵の読みこみ前だけ使う
  };

  // ジュレキング: ぷるぷるの王さま。重たそうに体をゆらし、のしかかって攻撃する
  MONSTERS.jureking = {
    theme: 'castle',
    height: 215,
    defeatStyle: 'fall',
    attackFx: 'quake',
    pose(t) {
      const j = Math.sin(t * 3) * 0.035;
      return { sx: 1 + j, sy: 1 - j };
    },
    draw(ctx, t) { MONSTERS.slime.draw(ctx, t); },
  };

  // テンリュウガ（ボス）: 空の果てから現れる伝説の守護竜。天雷ブレスでかみなりを落とす
  MONSTERS.tenryuga = {
    theme: 'sky',
    height: 290,
    defeatStyle: 'fall',
    attackFx: 'thunder',
    pose(t) {
      return { y: Math.sin(t * 1.4) * 3, sy: 1 + Math.sin(t * 1.4) * 0.012 };
    },
    draw(ctx, t) { MONSTERS.dragon.draw(ctx, t); },
  };

  // 怪鳥ブリザード: 氷雪の峰にすむ賢い魔鳥。空にうかび、氷嵐ブレスで戦場をこおらせる
  MONSTERS.blizzard = {
    theme: 'snow',
    height: 210,
    defeatStyle: 'fall',
    attackFx: 'freeze',
    pose(t) {
      return { y: -34 + Math.sin(t * 2) * 10, rot: Math.sin(t * 1.3) * 0.03, shadow: 0.55 };
    },
    draw(ctx, t) { MONSTERS.mage.draw(ctx, t); },
  };

  // ---------- 背景 ----------
  const THEMES = {
    snow: { sky: ['#5d7fb8', '#e8f1fb'], far: '#9fb6d8', near: '#c9d9ef', ground: '#ffffff', particle: 'snow', pcolor: '#ffffff' },
    sky: { sky: ['#16245e', '#ffe2a8'], far: '#7b8fd6', near: '#b9b3e0', ground: '#d2c7ad', particle: 'firefly', pcolor: '#fff3c9' },
    field: { sky: ['#8fd3ff', '#e8f8ff'], far: '#9ccc65', near: '#5aa95f', ground: '#7cb342', particle: 'leaf', pcolor: '#4caf50' },
    cave: { sky: ['#140f26', '#3a2d52'], far: '#2a2140', near: '#1d1630', ground: '#2d243f', particle: 'firefly', pcolor: '#b388ff' },
    castle: { sky: ['#232552', '#6a5acd'], far: '#3c3a6b', near: '#26244a', ground: '#38345e', particle: 'firefly', pcolor: '#fff59d', moon: '#fff6d5' },
    ruins: { sky: ['#d9c9a8', '#f3ead6'], far: '#b0967c', near: '#8a6d55', ground: '#9c7f63', particle: 'dust', pcolor: '#fff8e1' },
    volcano: { sky: ['#2a0606', '#b71c1c'], far: '#4e1010', near: '#250606', ground: '#3b0d0d', particle: 'ember', pcolor: '#ff9100', lightning: true, moon: '#ffab91' },
  };

  // ---------- 画像（js/art.js に書いたもの。読みこめたものだけ使う） ----------
  const IMAGES = { monsters: {}, backgrounds: {} };
  const ART = root.ART || {};
  for (const kind of ['monsters', 'backgrounds']) {
    for (const [key, src] of Object.entries(ART[kind] || {})) {
      const img = new Image();
      img.onload = () => { IMAGES[kind][key] = img; };
      img.src = src;
    }
  }

  // ---------- イラスト（art/ の SVG）。体・パーツ・表情を重ねて動かす ----------
  // SVG は 512x512（パーツは自分の大きさ）。読みこんだら一度だけ高解像度の画像にしておく。
  const ART_DIR = 'art/';
  const EXPRESSIONS = ['normal', 'blink', 'angry', 'hurt', 'laugh', 'ko'];
  const SPRITES = {};
  // scale: どれだけ細かく画像にするか（スマホのメモリを使いすぎないように、モンスター 1.25倍・背景 1倍）
  function loadSprite(path, scale = 1.25) {
    if (SPRITES[path] !== undefined) return;
    SPRITES[path] = null;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const k = scale;
      c.width = img.width * k;
      c.height = img.height * k;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.w = img.width;
      c.h = img.height;
      SPRITES[path] = c;
    };
    img.src = ART_DIR + path;
  }
  const sprite = (name) => SPRITES['monsters/' + name + '.svg'];

  const wave = (t, speed, amp, phase = 0) => Math.sin(t * speed + phase) * amp;

  // box: SVG の中で絵がある上はしと下はし（下はし = 足もと）
  // parts: at = 体のどこにつけるか、pivot = パーツのどこを中心に回すか、z < 0 は体のうしろ
  const RIGS = {
    slime: { box: [80, 505] },
    bat: {
      box: [70, 470],
      parts: [
        { img: 'bat-wing', at: [192, 262], pivot: [20, 140], scale: 0.85, flip: true, z: -1,
          anim: (t, st) => ({ rot: wave(t, st.mode === 'attack' ? 22 : 11, 0.5) - 0.1 }) },
        { img: 'bat-wing', at: [320, 262], pivot: [20, 140], scale: 0.85, z: -1,
          anim: (t, st) => ({ rot: wave(t, st.mode === 'attack' ? 22 : 11, 0.5) - 0.1 }) },
      ],
    },
    mage: {
      box: [30, 495],
      mouth: [378, 104], // まほうが出るところ（つえの玉）
      parts: [
        { img: 'mage-staff', at: [378, 294], pivot: [82, 252], z: 1,
          // こうげきのときは つえを高くかかげる
          anim: (t, st) => ({ rot: st.mode === 'attack' ? -0.5 * Math.sin(Math.min(st.p / 0.75, 1) * Math.PI) : wave(t, 1.6, 0.06) }),
          glow: { at: [82, 62], r: 70, color: '224,92,255' } },
      ],
    },
    golem: {
      box: [86, 498],
      glow: { at: [262, 300], r: 90, color: '63,242,255' },
      parts: [
        { img: 'golem-arm', at: [124, 210], pivot: [96, 56], flip: true, z: -1,
          anim: (t, st) => ({ rot: st.mode === 'attack' ? -1.1 * Math.sin(Math.min(st.p / 0.75, 1) * Math.PI) : wave(t, 1.8, 0.06) }) },
        { img: 'golem-arm', at: [388, 210], pivot: [96, 56], z: -1,
          anim: (t, st) => ({ rot: st.mode === 'attack' ? -1.1 * Math.sin(Math.min(st.p / 0.75, 1) * Math.PI) : wave(t, 1.8, 0.06, Math.PI) }) },
      ],
    },
    dragon: {
      box: [36, 500],
      mouth: [256, 212], // 火をはく口
      glow: { at: [300, 214], r: 60, color: '255,150,0' },
      parts: [
        { img: 'dragon-tail', at: [326, 440], pivot: [20, 190], z: -1, anim: (t) => ({ rot: wave(t, 2, 0.12) }) },
        { img: 'dragon-wing', at: [228, 262], pivot: [24, 220], flip: true, z: -1,
          anim: (t, st) => ({ rot: st.mode === 'attack' ? -0.3 : wave(t, 2.4, 0.12) }) },
        { img: 'dragon-wing', at: [284, 262], pivot: [24, 220], z: -1,
          anim: (t, st) => ({ rot: st.mode === 'attack' ? -0.3 : wave(t, 2.4, 0.12) }) },
      ],
    },
  };
  for (const [key, rig] of Object.entries(RIGS)) {
    loadSprite(`monsters/${key}.svg`);
    for (const e of EXPRESSIONS) loadSprite(`monsters/${key}-face-${e}.svg`);
    for (const p of rig.parts || []) loadSprite(`monsters/${p.img}.svg`);
  }
  for (const name of ['field', 'cave', 'castle', 'ruins', 'volcano', 'sky', 'snow']) loadSprite(`bg/${name}.svg`, 1);

  // 1枚絵のポーズを場面で切りかえるキャラクター。cx = 絵の中のキャラのまん中（横の位置、0〜1）
  const POSE_RIGS = {
    kororun: {
      dir: 'monsters/kororun/',
      base: 'idle',
      poses: { idle: 0.43, happy: 0.52, angry: 0.48, attack: 0.75, hurt: 0.45, dizzy: 0.5, down: 0.55 },
    },
    jureking: {
      dir: 'monsters/jureking/',
      base: 'idle',
      poses: { idle: 0.45, happy: 0.46, angry: 0.5, attack: 0.6, hurt: 0.5, dizzy: 0.5, down: 0.48 },
    },
    tenryuga: {
      dir: 'monsters/tenryuga/',
      base: 'idle',
      poses: { idle: 0.55, happy: 0.5, angry: 0.55, attack: 0.35, hurt: 0.55, dizzy: 0.5, down: 0.5 },
    },
    blizzard: {
      dir: 'monsters/blizzard/',
      base: 'idle',
      poses: { idle: 0.46, happy: 0.45, angry: 0.55, attack: 0.38, hurt: 0.42, dizzy: 0.45, down: 0.6 },
    },
  };
  for (const [key, r] of Object.entries(POSE_RIGS)) {
    for (const name of Object.keys(r.poses)) loadSprite(`${r.dir}${name}.webp`, 1);
  }
  const poseSprite = (key, name) => SPRITES[`${POSE_RIGS[key].dir}${name}.webp`];
  function posesReady(key) {
    const r = POSE_RIGS[key];
    return !!r && Object.keys(r.poses).every((n) => poseSprite(key, n));
  }

  // 足もとが (0,0)、ふつうのポーズの高さが height になるように描く
  function drawPose(o, key, name, height) {
    const r = POSE_RIGS[key];
    const img = poseSprite(key, name);
    const u = height / poseSprite(key, r.base).h;
    o.drawImage(img, -r.poses[name] * img.w * u, -img.h * u, img.w * u, img.h * u);
  }

  function rigReady(key) {
    const rig = RIGS[key];
    if (!rig || !sprite(key)) return false;
    return (rig.parts || []).every((p) => sprite(p.img)) && EXPRESSIONS.every((e) => sprite(`${key}-face-${e}`));
  }

  function drawGlow(o, x, y, r, color, a) {
    const g = o.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${color},${0.55 * a})`);
    g.addColorStop(1, `rgba(${color},0)`);
    o.save();
    o.globalCompositeOperation = 'lighter';
    o.fillStyle = g;
    o.fillRect(x - r, y - r, r * 2, r * 2);
    o.restore();
  }

  // 足もとが (0,0)、高さ height になるように描く
  function drawRig(o, key, height, t, expr, st) {
    const rig = RIGS[key];
    const [top, bottom] = rig.box;
    const u = height / (bottom - top);
    const pulse = 0.75 + 0.25 * Math.sin(t * 3);
    o.save();
    o.scale(u, u);
    o.translate(-256, -bottom);
    const drawPart = (p) => {
      const img = sprite(p.img);
      const a = p.anim ? p.anim(t, st) : {};
      const sc = p.scale || 1;
      o.save();
      o.translate(p.at[0], p.at[1]);
      if (p.flip) o.scale(-1, 1);
      o.rotate(a.rot || 0);
      o.scale(sc, sc);
      o.drawImage(img, -p.pivot[0], -p.pivot[1], img.w, img.h);
      if (p.glow) drawGlow(o, p.glow.at[0] - p.pivot[0], p.glow.at[1] - p.pivot[1], p.glow.r, p.glow.color, pulse);
      o.restore();
    };
    for (const p of rig.parts || []) if (p.z < 0) drawPart(p);
    o.drawImage(sprite(key), 0, 0, 512, 512);
    if (rig.glow && expr !== 'ko') drawGlow(o, rig.glow.at[0], rig.glow.at[1], rig.glow.r, rig.glow.color, pulse);
    o.drawImage(sprite(`${key}-face-${expr}`), 0, 0, 512, 512);
    for (const p of rig.parts || []) if (!(p.z < 0)) drawPart(p);
    o.restore();
  }

  function hills(ctx, w, h, baseY, amp, freq, phase, color) {
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w + 8; x += 8) {
      const y = baseY + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.7 + phase * 1.7) * amp * 0.35;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  const easeOutBack =(p) => 1 + 2.4 * Math.pow(p - 1, 3) + 1.4 * Math.pow(p - 1, 2);
  const easeOutBounce = (p) => {
    const n = 7.5625, d = 2.75;
    if (p < 1 / d) return n * p * p;
    if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75;
    if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375;
    return n * (p -= 2.625 / d) * p + 0.984375;
  };

  // ---------- ステージ ----------
  class Stage {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.off = document.createElement('canvas');
      this.offCtx = this.off.getContext('2d');
      this.monsterKey = null;
      this.theme = THEMES.field;
      this.mode = 'none';
      this.modeStart = 0;
      this.flash = 0;
      this.knock = 0;
      this.danger = false;
      this.lightning = 0;
      this.slash = 0;
      this.particles = [];
      this.projectiles = [];
      this.texts = [];
      this.ambient = [];
      this.running = false;
      this.last = 0;
      this.reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.frame = this.frame.bind(this);
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame(this.frame);
    }

    stop() { this.running = false; }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      if (!w || !h) return false;
      if (this.w !== w || this.h !== h || this.dpr !== dpr) {
        this.w = w; this.h = h; this.dpr = dpr;
        this.canvas.width = this.off.width = Math.round(w * dpr);
        this.canvas.height = this.off.height = Math.round(h * dpr);
        this.ambient = [];
      }
      return true;
    }

    get scale() { return (this.h * 0.68) / 310; }
    get groundY() { return this.h * 0.92; }
    get center() {
      const m = MONSTERS[this.monsterKey];
      return { x: this.w / 2, y: this.groundY - (m ? m.height * 0.55 * (m.size || 1) : 120) * this.scale };
    }

    setMode(mode) { this.mode = mode; this.modeStart = performance.now(); }

    // ポーズで動くキャラクターの、いまのポーズ
    poseName(now, p) {
      if (this.mode === 'defeat') return 'down';
      if (now < (this.hurtUntil || 0)) return this.hurtBig ? 'dizzy' : 'hurt';
      if (this.mode === 'attack') return p < 0.2 ? 'angry' : 'attack';
      if (this.danger && this.mode === 'idle') return 'angry';
      if (this.mode === 'taunt') return 'happy';
      return 'idle';
    }

    // いまの表情（場面に合わせて かえる）
    expression(now) {
      if (this.mode === 'defeat') return 'ko';
      if (now < (this.hurtUntil || 0)) return 'hurt';
      if (this.mode === 'attack' || (this.danger && this.mode === 'idle')) return 'angry';
      if (this.mode === 'taunt') return 'laugh';
      return isBlink(now / 1000, 3.3) ? 'blink' : 'normal';
    }

    setMonster(key) {
      this.monsterKey = key;
      this.themeKey = MONSTERS[key].theme;
      this.theme = THEMES[this.themeKey];
      this.ambient = [];
      this.danger = false;
      this.flash = 0;
      this.setMode('enter');
    }

    setDanger(on) { this.danger = on; }

    taunt() { if (this.mode === 'idle') this.setMode('taunt'); }

    // 自分のこうげき。最初の1発が当たったときに resolve する
    playerAttack({ damage, critical = false, count = 1 }) {
      return new Promise((resolve) => {
        const c = this.center;
        for (let i = 0; i < count; i++) {
          const spread = (i - (count - 1) / 2) * 60;
          this.projectiles.push({
            x0: this.w / 2 + spread, y0: this.h + 20,
            x1: c.x + spread * 0.3, y1: c.y,
            t0: performance.now() + i * 90,
            dur: 300,
            size: critical ? 22 : 15,
            color: critical ? '#ffdd33' : '#7ff3ff',
            onHit: i === 0 ? () => {
              this.hurt(damage, critical);
              resolve();
            } : () => this.burst(c.x, c.y, 8, critical ? '#ffdd33' : '#7ff3ff'),
          });
        }
      });
    }

    hurt(damage, critical) {
      const c = this.center;
      this.flash = 1;
      this.knock = 1;
      this.hurtUntil = performance.now() + (critical ? 900 : 650);
      this.hurtBig = critical;
      this.freezeUntil = performance.now() + (critical ? 140 : 80);
      this.shake = critical ? 12 : 6;
      if (this.mode === 'idle' || this.mode === 'taunt') this.setMode('idle');
      this.burst(c.x, c.y, critical ? 30 : 16, critical ? '#ffdd33' : '#ffffff');
      if (critical) this.slash = 1;
      this.texts.push({
        x: c.x + (Math.random() - 0.5) * 40, y: c.y + 10, vy: -40,
        text: String(damage), life: 1.1, max: 1.1,
        size: critical ? 54 : 40, color: critical ? '#ffdd33' : '#ffffff',
      });
      if (critical) {
        this.texts.push({ x: c.x, y: c.y + 60, vy: -20, text: 'クリティカル！', life: 1.1, max: 1.1, size: 26, color: '#ff7b54' });
      }
    }

    // 敵のこうげき。こうげきが当たったときに resolve する
    enemyAttack() {
      this.setMode('attack');
      setTimeout(() => { this.shake = 16; }, 330);
      const fx = MONSTERS[this.monsterKey].attackFx;
      const c = this.center;
      const colors = fx === 'fire' ? ['#ff6d00', '#ffd600', '#ff3d00'] : fx === 'magic' ? ['#e040fb', '#ea80fc', '#7c4dff'] : null;
      if (colors) {
        // 0.6びょうのあいだ、口（つえ）から ほのお・まほうを出しつづける
        let ex = c.x, ey = c.y - (fx === 'fire' ? 70 * this.scale : 0);
        const rig = RIGS[this.monsterKey];
        if (rig && rig.mouth && rigReady(this.monsterKey)) {
          // イラストの口・つえの位置から出す
          const m = MONSTERS[this.monsterKey];
          const u = (m.height / (rig.box[1] - rig.box[0])) * this.scale * (m.size || 1);
          ex = this.w / 2 + (rig.mouth[0] - 256) * u;
          ey = this.groundY - (rig.box[1] - rig.mouth[1]) * u;
        }
        this.emitter = { until: performance.now() + 600, colors, star: fx === 'magic', x: ex, y: ey };
      }
      if (fx === 'quake') this.burst(this.w / 2, this.groundY, 30, '#bcaaa4');
      if (fx === 'thunder') setTimeout(() => { this.lightning = 1; }, 300); // かみなりで画面が光る
      if (fx === 'freeze') {
        // 氷嵐: 画面が白く光り、こおりのつぶが ふきつける
        setTimeout(() => { this.lightning = 0.6; }, 300);
        this.emitter = { until: performance.now() + 500, colors: ['#ffffff', '#d6f3ff', '#8fdcf2'], star: true, x: c.x, y: c.y };
      }
      return new Promise((resolve) => setTimeout(resolve, 330));
    }

    defeat() {
      const c = this.center;
      this.setMode('defeat');
      this.burst(c.x, c.y, 50, '#ffdd33');
      this.burst(c.x, c.y, 30, '#ffffff');
      for (let i = 0; i < 14; i++) {
        this.particles.push({
          x: c.x, y: c.y, vx: (Math.random() - 0.5) * 420, vy: -Math.random() * 380 - 120,
          g: 600, life: 1.6, max: 1.6, size: 10 + Math.random() * 8, color: '#ffd54f', shape: 'star', rot: Math.random() * 6,
        });
      }
      return new Promise((resolve) => setTimeout(resolve, 950));
    }

    burst(x, y, n, color) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU;
        const sp = 120 + Math.random() * 320;
        this.particles.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 300,
          life: 0.5 + Math.random() * 0.4, max: 0.9, size: 3 + Math.random() * 5, color, shape: 'circle',
        });
      }
    }

    // ---------- 毎フレームの描画 ----------
    frame(now) {
      if (!this.running) return;
      requestAnimationFrame(this.frame);
      const dt = Math.min((now - this.last) / 1000, 0.05);
      this.last = now;
      if (!this.resize()) return;
      const t = now / 1000;
      const ctx = this.ctx;
      // 画面のゆれ
      const sx = this.shake ? (Math.random() - 0.5) * this.shake : 0;
      const sy = this.shake ? (Math.random() - 0.5) * this.shake : 0;
      this.shake = Math.max(0, (this.shake || 0) - dt * 60);
      ctx.setTransform(this.dpr, 0, 0, this.dpr, sx * this.dpr, sy * this.dpr);
      ctx.clearRect(-20, -20, this.w + 40, this.h + 40);

      this.drawBackground(ctx, t, dt);
      this.drawMonster(t, now);
      if (this.emitter) {
        const em = this.emitter;
        for (let i = 0; i < 5; i++) {
          this.particles.push({
            x: em.x + (Math.random() - 0.5) * 20, y: em.y,
            vx: (Math.random() - 0.5) * 260, vy: 220 + Math.random() * 260, g: 120,
            life: 0.7 + Math.random() * 0.5, max: 1.2, size: 7 + Math.random() * 13,
            color: em.colors[i % em.colors.length], shape: em.star && i === 0 ? 'star' : 'circle', rot: 0,
          });
        }
        if (now > em.until) this.emitter = null;
      }
      this.updateProjectiles(ctx, now);
      this.updateParticles(ctx, dt);
      this.updateTexts(ctx, dt);

      if (this.slash > 0) {
        ctx.save();
        ctx.globalAlpha = this.slash;
        for (let i = 0; i < 3; i++) {
          const off = (i - 1) * 26;
          line(ctx, this.w * 0.3 + off, this.h * 0.15, this.w * 0.7 + off, this.h * 0.75, '#fff', 6 * this.slash);
        }
        ctx.restore();
        this.slash = Math.max(0, this.slash - dt * 3);
      }
      if (this.lightning > 0) {
        ctx.fillStyle = `rgba(255,240,255,${this.lightning * 0.55})`;
        ctx.fillRect(0, 0, this.w, this.h);
        this.lightning = Math.max(0, this.lightning - dt * 4);
      }
      this.flash = Math.max(0, this.flash - dt * 4);
      this.knock = Math.max(0, this.knock - dt * 3.5);
    }

    drawBackground(ctx, t, dt) {
      const th = this.theme;
      const w = this.w, h = this.h;
      const drift = this.reduceMotion ? 0 : t;
      const bg = IMAGES.backgrounds[this.themeKey] || SPRITES[`bg/${this.themeKey}.svg`];
      if (bg) {
        // 画面をうめるように少し大きめに描き、ゆっくり左右に動かして奥行きを出す
        const zoom = 1.08;
        const iw = bg.w || bg.width, ih = bg.h || bg.height;
        const s = Math.max(w / iw, h / ih) * zoom;
        const bw = iw * s, bh = ih * s;
        const x = (w - bw) / 2 + Math.sin(drift * 0.12) * (bw - w) * 0.4;
        const y = h - bh + (bh - h) * 0.15;
        ctx.drawImage(bg, x, y, bw, bh);
        // モンスターが目立つように、まわりを少し暗くする
        const vg = ctx.createRadialGradient(w / 2, h * 0.6, h * 0.3, w / 2, h * 0.6, h);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, w, h);
      } else {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, th.sky[0]);
        g.addColorStop(1, th.sky[1]);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        if (th.moon) ellipse(ctx, w * 0.82, h * 0.24, 22, 22, th.moon);
        hills(ctx, w, h, h * 0.6, 18, 0.012, drift * 0.05, th.far);
        hills(ctx, w, h, h * 0.75, 12, 0.02, 1.5 + drift * 0.12, th.near);
        ctx.fillStyle = th.ground;
        ctx.fillRect(0, h * 0.86, w, h * 0.14);
      }
      if (th.lightning && !this.reduceMotion && Math.random() < dt * 0.25) this.lightning = 1;

      // ただよう粒（ほたる・あわ・葉っぱ・火の粉）
      if (this.ambient.length < 18) {
        this.ambient.push({ x: Math.random() * w, y: Math.random() * h, p: Math.random() * TAU, s: 0.5 + Math.random() });
      }
      for (const a of this.ambient) {
        if (!this.reduceMotion) {
          if (th.particle === 'leaf' || th.particle === 'snow') { a.y += dt * 30 * a.s; a.x += Math.sin(t + a.p) * dt * 30; }
          else if (th.particle === 'firefly') { a.x += Math.sin(t * 0.7 + a.p) * dt * 15; a.y += Math.cos(t * 0.9 + a.p) * dt * 10; }
          else { a.y -= dt * 25 * a.s; a.x += Math.sin(t + a.p) * dt * 10; }
          if (a.y > h + 10) a.y = -10;
          if (a.y < -10) a.y = h + 10;
        }
        ctx.save();
        if (th.particle === 'firefly') {
          ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + a.p));
          ellipse(ctx, a.x, a.y, 3, 3, th.pcolor);
        } else if (th.particle === 'bubble') {
          ellipse(ctx, a.x, a.y, 4 * a.s, 4 * a.s, null, 'rgba(255,255,255,0.7)', 2);
        } else if (th.particle === 'snow') {
          ellipse(ctx, a.x, a.y, 2.5 * a.s, 2.5 * a.s, th.pcolor);
        } else if (th.particle === 'leaf') {
          ellipse(ctx, a.x, a.y, 7, 3, th.pcolor, null, 0, t * 2 + a.p);
        } else {
          ctx.globalAlpha = 0.7;
          ellipse(ctx, a.x, a.y, 2.5 * a.s, 2.5 * a.s, th.pcolor);
        }
        ctx.restore();
      }
    }

    drawMonster(t, now) {
      const m = MONSTERS[this.monsterKey];
      if (!m || this.mode === 'none') return;
      const p = (now - this.modeStart) / 1000;
      const k = this.scale * (m.size || 1);
      // ヒットストップ: 当たった瞬間は 動きを少しだけ止めて、手ごたえを出す
      if (now < this.freezeUntil) t = this.frozenT;
      else this.frozenT = t;
      const mt = t;
      const pose = Object.assign({ x: 0, y: 0, sx: 1, sy: 1, rot: 0, shadow: 1 }, this.reduceMotion ? {} : m.pose(t));
      let ox = pose.x * k, oy = pose.y * k, sc = 1, rot = pose.rot, alpha = 1;

      if (this.mode === 'enter') {
        const q = Math.min(p / 0.8, 1);
        oy -= (1 - easeOutBounce(q)) * this.h;
        if (q >= 1) this.setMode('idle');
      } else if (this.mode === 'attack') {
        // 0〜0.25: うしろにためる → 0.25〜0.55: とびかかる → もどる
        const q = Math.min(p / 0.75, 1);
        if (q < 0.25) {
          const a = q / 0.25;
          sc = 1 - 0.1 * a;
          oy -= 20 * k * a;
          rot -= 0.08 * a;
        } else {
          const s = Math.sin(((q - 0.25) / 0.75) * Math.PI);
          sc = 0.9 + s * 0.6;
          oy += s * 60 * k - 20 * k * (1 - s);
        }
        if (q >= 1) this.setMode('idle');
      } else if (this.mode === 'taunt') {
        const q = Math.min(p / 1.2, 1);
        ox += Math.sin(q * Math.PI * 4) * 14 * k;
        rot += Math.sin(q * Math.PI * 4) * 0.08;
        if (q >= 1) this.setMode('idle');
      } else if (this.mode === 'defeat') {
        const q = Math.min(p / 0.9, 1);
        if (m.defeatStyle === 'fall') {
          // たおれた絵のまま、少しはねてから消える（空をとぶモンスターも地面におちる）
          oy = -Math.sin(Math.min(q / 0.35, 1) * Math.PI) * 16 * k;
          alpha = q < 0.55 ? 1 : 1 - (q - 0.55) / 0.45;
        } else {
          rot += q * Math.PI * 3;
          sc = 1 - easeOutBack(q) * 0.9;
          alpha = 1 - q;
        }
        if (q >= 1) { this.mode = 'none'; return; }
      }
      if (this.knock > 0) {
        ox += Math.sin(now * 0.09) * this.knock * 14;
        oy -= this.knock * 10 * k;
      }
      if (this.danger && this.mode === 'idle') ox += Math.sin(now * 0.12) * 2.5;

      // かげ
      ellipse(this.ctx, this.w / 2 + ox, this.groundY + 4, 95 * k * pose.shadow * sc, 13 * k * pose.shadow, 'rgba(0,0,0,0.28)');

      // ピンチのときの赤いオーラ
      if (this.danger && this.mode !== 'defeat') {
        const c = this.center;
        const pulse = 0.5 + 0.5 * Math.sin(now * 0.012);
        const rg = this.ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, 170 * k + pulse * 30);
        rg.addColorStop(0, 'rgba(255,40,40,0.45)');
        rg.addColorStop(1, 'rgba(255,40,40,0)');
        this.ctx.fillStyle = rg;
        this.ctx.fillRect(0, 0, this.w, this.h);
      }

      // 一度べつのキャンバスに描いて、白く光らせたり半とうめいにしたりする
      const o = this.offCtx;
      o.setTransform(1, 0, 0, 1, 0, 0);
      o.clearRect(0, 0, this.off.width, this.off.height);
      o.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      o.save();
      const pivot = m.height * 0.5 * k; // 体のまん中を中心に回す
      o.translate(this.w / 2 + ox, this.groundY + oy - pivot);
      o.rotate(rot);
      o.translate(0, pivot);
      o.scale(k * sc * pose.sx, k * sc * pose.sy);
      o.lineJoin = 'round';
      const img = IMAGES.monsters[this.monsterKey];
      if (img) {
        // 画像は足もとを (0,0) にあわせ、高さ m.height で描く。呼吸するように少しふくらませる
        const breathe = this.reduceMotion ? 0 : Math.sin(mt * 2.2) * 0.025;
        const dh = m.height * (m.imageScale || 1.15);
        const dw = dh * (img.width / img.height);
        o.scale(1 - breathe * 0.5, 1 + breathe);
        o.drawImage(img, -dw / 2, -dh, dw, dh);
      } else if (posesReady(this.monsterKey)) {
        // 場面に合うポーズをえらぶ。切りかわった瞬間は ぽんっと少し大きくする
        const name = this.poseName(now, p);
        if (name !== this.lastPose) { this.lastPose = name; this.poseAt = now; }
        const pop = 1 + 0.08 * Math.max(0, 1 - (now - this.poseAt) / 160);
        const breathe = this.reduceMotion ? 0 : Math.sin(mt * 2.2) * 0.015;
        o.scale(pop * (1 - breathe * 0.5), pop * (1 + breathe));
        drawPose(o, this.monsterKey, name, m.height);
      } else if (rigReady(this.monsterKey)) {
        const breathe = this.reduceMotion ? 0 : Math.sin(mt * 2.2) * 0.02;
        o.scale(1 - breathe * 0.5, 1 + breathe);
        drawRig(o, this.monsterKey, m.height, this.reduceMotion ? 0 : mt, this.expression(now), { mode: this.mode, p });
      } else {
        m.draw(o, mt);
      }
      o.restore();
      if (this.flash > 0 || (this.danger && this.mode === 'idle')) {
        o.setTransform(1, 0, 0, 1, 0, 0);
        o.globalCompositeOperation = 'source-atop';
        o.fillStyle = this.flash > 0 ? `rgba(255,255,255,${this.flash * 0.9})` : `rgba(255,0,0,${0.12 + 0.1 * Math.sin(now * 0.012)})`;
        o.fillRect(0, 0, this.off.width, this.off.height);
        o.globalCompositeOperation = 'source-over';
      }
      const ctx = this.ctx;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = alpha;
      ctx.drawImage(this.off, 0, 0);
      ctx.restore();
    }

    updateProjectiles(ctx, now) {
      this.projectiles = this.projectiles.filter((pr) => {
        const q = (now - pr.t0) / pr.dur;
        if (q < 0) return true;
        if (q >= 1) { pr.onHit(); return false; }
        const e = q * q;
        const x = pr.x0 + (pr.x1 - pr.x0) * e;
        const y = pr.y0 + (pr.y1 - pr.y0) * e - Math.sin(q * Math.PI) * 40;
        this.particles.push({ x, y, vx: 0, vy: 0, g: 0, life: 0.25, max: 0.25, size: pr.size * 0.5, color: pr.color, shape: 'circle' });
        ctx.save();
        ctx.shadowColor = pr.color;
        ctx.shadowBlur = 20;
        star(ctx, x, y, pr.size, now * 0.02);
        ctx.fillStyle = pr.color;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.restore();
        return true;
      });
    }

    updateParticles(ctx, dt) {
      this.particles = this.particles.filter((pa) => {
        pa.life -= dt;
        if (pa.life <= 0) return false;
        pa.vy += pa.g * dt;
        pa.x += pa.vx * dt;
        pa.y += pa.vy * dt;
        ctx.save();
        ctx.globalAlpha = Math.max(0, pa.life / pa.max);
        if (pa.shape === 'star') {
          pa.rot += dt * 6;
          star(ctx, pa.x, pa.y, pa.size, pa.rot);
          ctx.fillStyle = pa.color;
          ctx.fill();
        } else {
          ellipse(ctx, pa.x, pa.y, pa.size, pa.size, pa.color);
        }
        ctx.restore();
        return true;
      });
    }

    updateTexts(ctx, dt) {
      this.texts = this.texts.filter((tx) => {
        tx.life -= dt;
        if (tx.life <= 0) return false;
        tx.y += tx.vy * dt;
        const age = tx.max - tx.life;
        const pop = age < 0.15 ? 0.6 + (age / 0.15) * 0.6 : 1.2 - Math.min(age - 0.15, 0.2);
        ctx.save();
        ctx.globalAlpha = Math.min(1, tx.life / 0.3);
        ctx.font = `900 ${Math.round(tx.size * pop)}px "M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", sans-serif`;
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 8;
        ctx.strokeStyle = OUT;
        ctx.strokeText(tx.text, tx.x, tx.y);
        ctx.fillStyle = tx.color;
        ctx.fillText(tx.text, tx.x, tx.y);
        ctx.restore();
        return true;
      });
    }
  }

  root.Stage = Stage;
  root.MONSTER_KEYS = Object.keys(MONSTERS);
})(window);

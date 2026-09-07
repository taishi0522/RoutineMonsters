import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Flame, Coins, Check, Lock, Sparkles, Home, Gift, BookOpen, BarChart3 } from 'lucide-react';

/* ============================== DATA ============================== */

const RARITY_META = {
  N:  { label: 'ノーマル',     prob: 0.58, monsterChance: 0.18, fragRange: [2, 3], color: '#8A9A8E' },
  R:  { label: 'レア',         prob: 0.28, monsterChance: 0.10, fragRange: [1, 2], color: '#3E7CB1' },
  SR: { label: 'スーパーレア', prob: 0.11, monsterChance: 0.05, fragRange: [1, 2], color: '#8A4FBF' },
  UR: { label: 'ウルトラレア', prob: 0.03, monsterChance: 0.02, fragRange: [1, 1], color: '#C9962E' },
};
const RARITY_ORDER = ['N', 'R', 'SR', 'UR'];

const MONSTERS = [
  { id: 'shizukun', name: 'しずくん', rarity: 'N', needed: 5, color: '#4F8FBF', accessory: 'droplet',
    theme: '水を飲む', desc: '毎朝コップ一杯の水から生まれた、ぷるぷるモンスター。水分をたっぷり含むと機嫌がいい。' },
  { id: 'hokorin', name: 'ほこりん', rarity: 'N', needed: 5, color: '#B79A6B', accessory: 'sparkle',
    theme: '掃除', desc: '掃除のあとに舞い上がるホコリが集まってできた、きれい好きな相棒。' },
  { id: 'nobinyan', name: 'のびにゃん', rarity: 'N', needed: 5, color: '#7FB88A', accessory: 'spiral',
    theme: 'ストレッチ', desc: 'ストレッチのたびに体がどこまでも伸びる、しなやかな猫型モンスター。' },
  { id: 'asahidori', name: 'あさひどり', rarity: 'R', needed: 10, color: '#E0A63E', accessory: 'sun',
    theme: '早起き', desc: '早起きした朝にだけ姿を見せる、朝日を運ぶ鳥。夜更かしすると会えない。' },
  { id: 'tekumogu', name: 'てくもぐ', rarity: 'R', needed: 10, color: '#8A6A4F', accessory: 'footprint',
    theme: '散歩', desc: '歩いた歩数だけ土の中でパワーを蓄える、几帳面なモグラ。' },
  { id: 'notefuku', name: 'ノートふくろう', rarity: 'R', needed: 10, color: '#6E5AA6', accessory: 'book',
    theme: '勉強', desc: '勉強した時間だけ賢くなる、静かな夜のふくろう。' },
  { id: 'rhythmwolf', name: 'リズムオオカミ', rarity: 'SR', needed: 15, color: '#C15C4A', accessory: 'bolt',
    theme: '連続達成', desc: '連続達成の鼓動から生まれた、リズムを操るオオカミ。' },
  { id: 'kiraboshiguma', name: 'きらぼしグマ', rarity: 'SR', needed: 15, color: '#3E5C9A', accessory: 'star',
    theme: '週間達成', desc: '一週間やり切った夜空にだけ現れる、星屑をまとったクマ。' },
  { id: 'tokoshieryu', name: 'とこしえりゅう', rarity: 'UR', needed: 20, color: '#2F7A5A', accessory: 'flame',
    theme: '継続の証', desc: '長く続けた習慣だけが呼び覚ませる、永遠を司る竜。' },
  { id: 'hajimarinoseirei', name: 'はじまりのせいれい', rarity: 'UR', needed: 25, color: '#B9A23E', accessory: 'sparkleburst',
    theme: '挑戦の証', desc: 'なにかを始めようとした、その一歩の勇気から生まれる精霊。' },
];

const WEIGHT_LABEL = { 1: 'かるい', 2: 'ふつう', 3: 'しっかり' };
const WEIGHT_POINT = { 1: 10, 2: 20, 3: 30 };

/* ============================ DATE HELPERS ============================ */

const pad = (n) => (n < 10 ? '0' : '') + n;
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => toDateStr(new Date());
const addDays = (dateStr, delta) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return toDateStr(d);
};
const dayHasCompletion = (completions, dateStr) => {
  const day = completions[dateStr];
  if (!day) return false;
  return Object.keys(day).some((k) => k !== '_bonus');
};
const computeStreak = (completions) => {
  let cursor = todayStr();
  if (!dayHasCompletion(completions, cursor)) cursor = addDays(cursor, -1);
  let count = 0;
  while (dayHasCompletion(completions, cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
};
const getWeekStart = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toDateStr(d);
};
const getWeekKey = (dateStr) => 'W-' + getWeekStart(dateStr);
const getMonthStart = (dateStr) => dateStr.slice(0, 8) + '01';
const rangeProgress = (routinesLen, completions, startStr, daysElapsed) => {
  let done = 0;
  for (let i = 0; i < daysElapsed; i++) {
    const d = addDays(startStr, i);
    const day = completions[d];
    if (day) done += Object.keys(day).filter((k) => k !== '_bonus').length;
  }
  const total = routinesLen * daysElapsed;
  return { done, total, rate: total > 0 ? done / total : 0 };
};
const weekProgress = (routines, completions) => {
  const today = todayStr();
  const ws = getWeekStart(today);
  const daysElapsed = Math.floor((new Date(today + 'T00:00:00') - new Date(ws + 'T00:00:00')) / 86400000) + 1;
  return { ...rangeProgress(routines.length, completions, ws, daysElapsed), daysElapsed };
};
const monthProgress = (routines, completions) => {
  const today = todayStr();
  const ms = getMonthStart(today);
  const dayOfMonth = parseInt(today.slice(8, 10), 10);
  return { ...rangeProgress(routines.length, completions, ms, dayOfMonth), daysElapsed: dayOfMonth };
};
const fmtDate = (ts) => {
  if (!ts) return '―';
  const d = new Date(ts);
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
};

/* ============================ DEFAULT STATE ============================ */

const defaultProgress = () => ({
  routines: [
    { id: 'r1', name: '水を飲む', weight: 1, createdAt: Date.now() },
    { id: 'r2', name: '10分掃除', weight: 2, createdAt: Date.now() },
    { id: 'r3', name: 'ストレッチ', weight: 1, createdAt: Date.now() },
    { id: 'r4', name: '早起き', weight: 2, createdAt: Date.now() },
  ],
  completions: {},
  profile: { points: 0, history: [], claimedWeeks: [] },
});
const defaultCollection = () => ({ owned: {}, pulls: [] });

/* ============================ MONSTER ICON ============================ */

function Accessory({ type, color }) {
  switch (type) {
    case 'droplet':
      return <path d="M12 2 C12 2 18 10 18 15 A6 6 0 0 1 6 15 C6 10 12 2 12 2 Z" fill={color} />;
    case 'sparkle':
      return (
        <g fill={color}>
          <circle cx="12" cy="12" r="2" />
          <circle cx="6" cy="7" r="1.3" />
          <circle cx="18" cy="8" r="1" />
        </g>
      );
    case 'spiral':
      return <path d="M12 3 a7 7 0 1 0 0.1 0" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" />;
    case 'sun':
      return (
        <g stroke={color} strokeWidth="1.6" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" fill={color} stroke="none" />
          <line x1="12" y1="1" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="23" />
          <line x1="1" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="23" y2="12" />
          <line x1="4.2" y1="4.2" x2="6.3" y2="6.3" />
          <line x1="17.7" y1="17.7" x2="19.8" y2="19.8" />
          <line x1="4.2" y1="19.8" x2="6.3" y2="17.7" />
          <line x1="17.7" y1="6.3" x2="19.8" y2="4.2" />
        </g>
      );
    case 'footprint':
      return (
        <g fill={color}>
          <ellipse cx="10" cy="16" rx="4" ry="6" />
          <circle cx="7" cy="7" r="1.6" />
          <circle cx="10" cy="5.5" r="1.6" />
          <circle cx="13" cy="6" r="1.6" />
          <circle cx="15.5" cy="8" r="1.4" />
        </g>
      );
    case 'book':
      return (
        <g>
          <rect x="4" y="5" width="16" height="14" rx="1.5" fill={color} />
          <line x1="12" y1="5" x2="12" y2="19" stroke="#F7F2E4" strokeWidth="1" />
        </g>
      );
    case 'bolt':
      return <path d="M13 2 L5 14 H11 L9 22 L19 9 H13 L13 2 Z" fill={color} />;
    case 'star':
      return <path d="M12 2 L14.7 9 L22 9.6 L16.5 14.6 L18.2 22 L12 18 L5.8 22 L7.5 14.6 L2 9.6 L9.3 9 Z" fill={color} />;
    case 'flame':
      return <path d="M12 2 C12 2 6 9 6 14 a6 6 0 0 0 12 0 C18 9 12 2 12 2 Z" fill={color} />;
    case 'sparkleburst':
      return <path d="M12 2 L13.5 9 L21 10.5 L13.5 12 L12 19 L10.5 12 L3 10.5 L10.5 9 Z" fill={color} />;
    default:
      return null;
  }
}

function MonsterBody({ rarity, color }) {
  const eyes = (
    <g fill="#22261F">
      <circle cx="9.2" cy="12.5" r="1.3" />
      <circle cx="14.8" cy="12.5" r="1.3" />
    </g>
  );
  let body;
  if (rarity === 'N') body = <circle cx="12" cy="13" r="8" fill={color} />;
  else if (rarity === 'R') body = <ellipse cx="12" cy="13" rx="8.6" ry="8" fill={color} />;
  else if (rarity === 'SR')
    body = (
      <g>
        <path d="M4 10 L1 5.5 L6.5 8 Z" fill={color} />
        <path d="M20 10 L23 5.5 L17.5 8 Z" fill={color} />
        <ellipse cx="12" cy="13" rx="8.6" ry="8" fill={color} />
      </g>
    );
  else
    body = (
      <g>
        <path d="M3 12 C-1 9 -0.5 17 3.5 16.5 Z" fill={color} />
        <path d="M21 12 C25 9 24.5 17 20.5 16.5 Z" fill={color} />
        <ellipse cx="12" cy="13" rx="9" ry="8.5" fill={color} />
      </g>
    );
  return (
    <g>
      {body}
      {eyes}
    </g>
  );
}

function MonsterIcon({ species, discovered, owned, size = 56 }) {
  if (!discovered) {
    return (
      <div className="m-icon" style={{ width: size, height: size }}>
        <svg viewBox="0 0 24 24" width={size} height={size}>
          <circle cx="12" cy="13" r="8" fill="#C9C2AC" />
        </svg>
        <span className="m-icon-q">?</span>
      </div>
    );
  }
  return (
    <div className={`m-icon ${owned ? 'is-owned rarity-glow-' + species.rarity : 'is-shard'}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size} style={{ opacity: owned ? 1 : 0.5 }}>
        <MonsterBody rarity={species.rarity} color={species.color} />
      </svg>
      <svg viewBox="0 0 24 24" width={size * 0.4} height={size * 0.4} className="m-icon-accessory">
        <Accessory type={species.accessory} color={species.color} />
      </svg>
    </div>
  );
}

/* ================================ CSS ================================ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..900&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; }

.rm-root {
  --bg: #EFEADA;
  --panel: #F8F4E8;
  --panel-alt: #E7E0C8;
  --ink: #26332B;
  --ink-soft: #6B7268;
  --line: rgba(38,51,43,0.14);
  --amber: #DA9C34;
  --amber-deep: #B37F22;
  --moss: #4F7965;
  --clay: #C15C4A;
  --violet: #6E5AA6;
  font-family: 'IBM Plex Sans', sans-serif;
  color: var(--ink);
  background: var(--bg);
  min-height: 100vh;
  display: flex;
  justify-content: center;
}
.rm-shell {
  width: 100%;
  max-width: 460px;
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  position: relative;
  border-left: 1px solid var(--line);
  border-right: 1px solid var(--line);
}
.rm-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; width:100%; gap:14px; }
.rm-loading-dot { width:22px; height:22px; border-radius:50%; background:var(--amber); animation: pulseDot 1s ease-in-out infinite; }
@keyframes pulseDot { 0%,100%{ transform:scale(0.7); opacity:0.6; } 50%{ transform:scale(1.15); opacity:1; } }

.rm-header {
  display:flex; align-items:center; justify-content:space-between;
  padding: 16px 18px 12px 18px;
  border-bottom: 1px solid var(--line);
}
.rm-brand { display:flex; align-items:center; gap:10px; }
.rm-brand-mark {
  font-family: 'Fraunces', serif; font-weight:900; font-size:15px;
  background: var(--ink); color: var(--bg);
  width:34px; height:34px; border-radius:10px;
  display:flex; align-items:center; justify-content:center;
}
.rm-brand h1 { font-family:'Fraunces', serif; font-weight:700; font-size:19px; margin:0; letter-spacing:0.2px; }
.rm-coin { display:flex; align-items:center; gap:6px; background:var(--panel-alt); border:1px solid var(--line); padding:6px 12px; border-radius:999px; font-weight:600; font-size:14px; color:var(--amber-deep); }

.rm-main { flex:1; overflow-y:auto; padding: 18px 18px 90px 18px; }

.rm-tabbar {
  position: sticky; bottom:0; left:0; right:0;
  display:flex; background:var(--panel); border-top:1px solid var(--line);
  padding: 6px 6px calc(6px + env(safe-area-inset-bottom,0px)) 6px;
}
.rm-tab-btn { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:8px 0 6px 0; background:none; border:none; color:var(--ink-soft); font-family:'IBM Plex Sans',sans-serif; font-size:11px; cursor:pointer; border-radius:10px; }
.rm-tab-btn.active { color: var(--ink); background: var(--panel-alt); }

section.rm-section { display:flex; flex-direction:column; gap:16px; }
.rm-h2 { font-family:'Fraunces', serif; font-weight:700; font-size:20px; margin:0 0 2px 0; }
.rm-sub { color: var(--ink-soft); font-size:13px; margin:0; }

.rm-card { background: var(--panel); border:1px solid var(--line); border-radius:16px; padding:16px; }

.rm-streak-row { display:flex; align-items:center; gap:14px; }
.rm-streak-flame { width:44px; height:44px; border-radius:12px; background: linear-gradient(160deg,#F0C97A,var(--amber)); display:flex; align-items:center; justify-content:center; color:#fff; flex-shrink:0; }
.rm-streak-num { font-family:'Fraunces',serif; font-weight:800; font-size:26px; line-height:1; }
.rm-streak-label { font-size:12px; color:var(--ink-soft); }
.rm-today-bar { margin-top:12px; }
.rm-bar-track { height:8px; border-radius:99px; background: var(--panel-alt); overflow:hidden; }
.rm-bar-fill { height:100%; background: var(--moss); border-radius:99px; transition: width 0.4s ease; }

.rm-weekly-banner { display:flex; align-items:center; justify-content:space-between; gap:10px; background: #F3E6C4; border:1px solid #E1C888; border-radius:14px; padding:12px 14px; }
.rm-weekly-banner p { margin:0; font-size:13px; }
.rm-btn { font-family:'IBM Plex Sans',sans-serif; font-weight:600; font-size:13px; border-radius:10px; padding:9px 14px; border:none; cursor:pointer; }
.rm-btn-amber { background: var(--amber); color:#fff; }
.rm-btn-ghost { background:transparent; color:var(--ink); border:1px solid var(--line); }
.rm-btn:disabled { opacity:0.45; cursor:default; }

.rm-routine-row { display:flex; align-items:center; gap:12px; padding:12px; background:var(--panel); border:1px solid var(--line); border-radius:14px; }
.rm-check { width:26px; height:26px; border-radius:8px; border:2px solid var(--moss); display:flex; align-items:center; justify-content:center; background:transparent; cursor:pointer; flex-shrink:0; color:var(--moss); }
.rm-check.done { background:var(--moss); color:#fff; }
.rm-routine-name { font-weight:600; font-size:14.5px; flex:1; }
.rm-routine-name.done-text { text-decoration: line-through; color: var(--ink-soft); }
.rm-weight-badge { font-size:11px; padding:3px 8px; border-radius:999px; background:var(--panel-alt); color:var(--ink-soft); white-space:nowrap; }
.rm-icon-btn { background:none; border:none; color:var(--ink-soft); cursor:pointer; padding:4px; display:flex; }

.rm-add-form { display:flex; flex-direction:column; gap:10px; background:var(--panel-alt); border-radius:14px; padding:14px; }
.rm-input { font-family:'IBM Plex Sans',sans-serif; font-size:14px; padding:10px 12px; border-radius:10px; border:1px solid var(--line); background:#fff; color:var(--ink); }
.rm-weight-toggle { display:flex; gap:8px; }
.rm-weight-opt { flex:1; text-align:center; padding:8px 4px; border-radius:10px; border:1px solid var(--line); font-size:12px; cursor:pointer; background:#fff; }
.rm-weight-opt.sel { background: var(--moss); color:#fff; border-color:var(--moss); }
.rm-form-actions { display:flex; gap:8px; justify-content:flex-end; }
.rm-add-trigger { display:flex; align-items:center; justify-content:center; gap:6px; padding:12px; border-radius:14px; border:1.5px dashed var(--line); color:var(--ink-soft); background:none; cursor:pointer; font-size:13.5px; width:100%; }

.rm-gacha-stage { display:flex; flex-direction:column; align-items:center; gap:18px; padding: 24px 0 6px 0; }
.rm-egg { width:140px; height:170px; cursor:pointer; border:none; background:none; padding:0; }
.rm-egg.rolling svg { animation: eggShake 0.35s ease-in-out infinite; }
@keyframes eggShake { 0%,100%{ transform:rotate(0deg);} 20%{ transform:rotate(-9deg);} 40%{ transform:rotate(8deg);} 60%{ transform:rotate(-6deg);} 80%{ transform:rotate(6deg);} }
.rm-gacha-cost { font-size:13px; color:var(--ink-soft); }
.rm-gacha-hint { font-size:12px; color:var(--ink-soft); text-align:center; max-width:280px; }

.rm-rarity-legend { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }
.rm-rarity-chip { font-size:11px; padding:4px 10px; border-radius:999px; border:1px solid var(--line); display:flex; align-items:center; gap:5px; }
.rm-rarity-dot { width:8px; height:8px; border-radius:50%; }

.rm-history-list { display:flex; flex-direction:column; gap:8px; }
.rm-pull-item { display:flex; align-items:center; gap:10px; padding:8px 10px; background:var(--panel); border:1px solid var(--line); border-radius:12px; }
.rm-pull-text { font-size:12.5px; flex:1; }
.rm-pull-time { font-size:11px; color:var(--ink-soft); }

.rm-modal-backdrop { position:fixed; inset:0; background:rgba(38,51,43,0.55); display:flex; align-items:center; justify-content:center; z-index:50; padding:20px; }
.rm-modal { background:var(--panel); border-radius:20px; padding:26px 22px; max-width:340px; width:100%; text-align:center; animation: popIn 0.35s ease; }
@keyframes popIn { 0%{ transform:scale(0.4); opacity:0;} 70%{ transform:scale(1.06); opacity:1;} 100%{ transform:scale(1);} }
.rm-modal-title { font-family:'Fraunces',serif; font-weight:800; font-size:20px; margin: 10px 0 4px 0; }
.rm-modal-sub { font-size:13px; color:var(--ink-soft); margin:0 0 16px 0; }
.rm-modal-desc { font-size:13px; line-height:1.6; color:var(--ink); background:var(--panel-alt); border-radius:12px; padding:12px; text-align:left; margin-bottom:14px; }

.rm-collection-summary { display:flex; align-items:center; justify-content:space-between; }
.rm-collection-pct { font-family:'Fraunces',serif; font-weight:800; font-size:26px; }
.rm-monster-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; }
.rm-monster-cell { background:var(--panel); border:1px solid var(--line); border-radius:14px; padding:12px 8px; display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer; }
.rm-monster-cell-name { font-size:11.5px; font-weight:600; text-align:center; line-height:1.3; }
.rm-monster-cell-frag { font-size:10.5px; color:var(--ink-soft); }

.m-icon { position:relative; display:flex; align-items:center; justify-content:center; }
.m-icon-q { position:absolute; font-family:'Fraunces',serif; font-weight:800; font-size:20px; color:#8f8a76; }
.m-icon-accessory { position:absolute; top:-4px; right:-4px; }
.rarity-glow-SR { filter: drop-shadow(0 0 6px rgba(138,79,191,0.55)); }
.rarity-glow-UR { animation: glowUR 1.8s ease-in-out infinite; }
@keyframes glowUR { 0%,100%{ filter: drop-shadow(0 0 4px rgba(201,150,46,0.4)); } 50%{ filter: drop-shadow(0 0 12px rgba(201,150,46,0.85)); } }

.rm-detail-frag-bar { margin: 10px 0 14px 0; }
.rm-detail-frag-label { display:flex; justify-content:space-between; font-size:11.5px; color:var(--ink-soft); margin-bottom:4px; }

.rm-log-grid-row { display:flex; justify-content:space-between; gap:10px; }
.rm-stat-box { flex:1; background:var(--panel); border:1px solid var(--line); border-radius:14px; padding:12px; text-align:center; }
.rm-stat-num { font-family:'Fraunces',serif; font-weight:800; font-size:22px; }
.rm-stat-label { font-size:11px; color:var(--ink-soft); margin-top:2px; }

.rm-heatmap { display:grid; grid-template-columns: repeat(7, 1fr); gap:5px; }
.rm-heatmap-cell { aspect-ratio:1; border-radius:5px; background: var(--panel-alt); }

.rm-floater-layer { position:fixed; top:70px; left:0; right:0; display:flex; flex-direction:column; align-items:center; pointer-events:none; z-index:60; gap:6px; }
.rm-floater { background: var(--ink); color:var(--bg); font-weight:700; font-size:13px; padding:6px 14px; border-radius:999px; animation: floatUp 1.1s ease forwards; }
@keyframes floatUp { 0%{ transform:translateY(0); opacity:0; } 15%{ opacity:1; } 100%{ transform:translateY(-30px); opacity:0; } }

.rm-empty { text-align:center; color:var(--ink-soft); font-size:13px; padding: 20px 10px; }
`;

/* =============================== APP =============================== */

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(defaultProgress());
  const [collection, setCollection] = useState(defaultCollection());
  const [activeTab, setActiveTab] = useState('home');

  const [addingRoutine, setAddingRoutine] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editWeight, setEditWeight] = useState(1);

  const [gachaState, setGachaState] = useState('idle');
  const [gachaResult, setGachaResult] = useState(null);
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [synthesizingId, setSynthesizingId] = useState(null);
  const [synthResult, setSynthResult] = useState(null);
  const [floaters, setFloaters] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let p = defaultProgress();
      let c = defaultCollection();
      try {
        const r = await window.storage.get('rm_progress_v1');
        if (r && r.value) p = JSON.parse(r.value);
      } catch (e) { /* use default */ }
      try {
        const r = await window.storage.get('rm_collection_v1');
        if (r && r.value) c = JSON.parse(r.value);
      } catch (e) { /* use default */ }
      if (!cancelled) {
        setProgress(p);
        setCollection(c);
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try { await window.storage.set('rm_progress_v1', JSON.stringify(progress)); } catch (e) { /* noop */ }
    })();
  }, [progress, loaded]);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try { await window.storage.set('rm_collection_v1', JSON.stringify(collection)); } catch (e) { /* noop */ }
    })();
  }, [collection, loaded]);

  function spawnFloater(text) {
    const id = Date.now() + '_' + Math.random();
    setFloaters((f) => [...f, { id, text }]);
    setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 1100);
  }

  function toggleRoutine(routineId) {
    const date = todayStr();
    const routine = progress.routines.find((r) => r.id === routineId);
    if (!routine) return;
    const completions = { ...progress.completions };
    const day = { ...(completions[date] || {}) };
    let pointsDelta = 0;
    const historyEntries = [];
    let floaterText = null;

    if (day[routineId] != null) {
      pointsDelta -= day[routineId];
      historyEntries.push({ delta: -day[routineId], reason: `${routine.name}を取り消し` });
      delete day[routineId];
      const hasOthers = Object.keys(day).some((k) => k !== '_bonus');
      if (!hasOthers) {
        if (day._bonus) {
          pointsDelta -= day._bonus;
          historyEntries.push({ delta: -day._bonus, reason: '連続ボーナス取り消し' });
        }
        delete completions[date];
      } else {
        completions[date] = day;
      }
    } else {
      const base = WEIGHT_POINT[routine.weight] || routine.weight * 10;
      const wasEmpty = !Object.keys(progress.completions[date] || {}).some((k) => k !== '_bonus');
      day[routineId] = base;
      pointsDelta += base;
      historyEntries.push({ delta: base, reason: `${routine.name}達成` });
      floaterText = `+${base}pt`;
      if (wasEmpty) {
        const streak = computeStreak({ ...completions, [date]: day });
        const bonus = Math.min(streak, 10);
        if (bonus > 0) {
          day._bonus = bonus;
          pointsDelta += bonus;
          historyEntries.push({ delta: bonus, reason: `${streak}日連続ボーナス` });
          floaterText = `+${base}pt（連続+${bonus}）`;
        }
      }
      completions[date] = day;
    }

    const ts = Date.now();
    setProgress((prev) => ({
      ...prev,
      completions,
      profile: {
        ...prev.profile,
        points: prev.profile.points + pointsDelta,
        history: [...historyEntries.map((h) => ({ ...h, ts })), ...prev.profile.history].slice(0, 50),
      },
    }));
    if (floaterText) spawnFloater(floaterText);
  }

  function addRoutine() {
    const name = newName.trim();
    if (!name) return;
    setProgress((prev) => ({
      ...prev,
      routines: [...prev.routines, { id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), name, weight: newWeight, createdAt: Date.now() }],
    }));
    setNewName('');
    setNewWeight(1);
    setAddingRoutine(false);
  }
  function startEdit(r) {
    setEditingId(r.id);
    setEditName(r.name);
    setEditWeight(r.weight);
  }
  function saveEdit() {
    setProgress((prev) => ({
      ...prev,
      routines: prev.routines.map((r) => (r.id === editingId ? { ...r, name: editName.trim() || r.name, weight: editWeight } : r)),
    }));
    setEditingId(null);
  }
  function deleteRoutine(id) {
    setProgress((prev) => ({ ...prev, routines: prev.routines.filter((r) => r.id !== id) }));
  }

  function rollGacha() {
    const r = Math.random();
    let acc = 0;
    let rarity = 'N';
    for (const key of RARITY_ORDER) {
      acc += RARITY_META[key].prob;
      rarity = key;
      if (r <= acc) break;
    }
    const pool = MONSTERS.filter((m) => m.rarity === rarity);
    const species = pool[Math.floor(Math.random() * pool.length)];
    const meta = RARITY_META[rarity];
    const alreadyOwned = !!(collection.owned[species.id] && collection.owned[species.id].owned);
    const rollMonster = Math.random() < meta.monsterChance;
    if (rollMonster && !alreadyOwned) {
      return { type: 'monster', species, label: `${species.name}が仲間になった！` };
    }
    const [lo, hi] = meta.fragRange;
    const amount = lo + Math.floor(Math.random() * (hi - lo + 1));
    const label = rollMonster && alreadyOwned ? `${species.name}のかけら +${amount}（ダブり）` : `${species.name}のかけら +${amount}`;
    return { type: 'fragment', species, amount, label };
  }

  function pullGacha() {
    if (progress.profile.points < 10 || gachaState === 'rolling') return;
    setGachaState('rolling');
    setTimeout(() => {
      const result = rollGacha();
      setProgress((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          points: prev.profile.points - 10,
          history: [{ ts: Date.now(), delta: -10, reason: `ガチャ：${result.label}` }, ...prev.profile.history].slice(0, 50),
        },
      }));
      setCollection((prev) => {
        const owned = { ...prev.owned };
        const cur = owned[result.species.id] || { fragments: 0, owned: false, obtainedAt: null, timesObtained: 0 };
        let next;
        if (result.type === 'monster') {
          next = { ...cur, owned: true, fragments: Math.max(cur.fragments, result.species.needed), obtainedAt: cur.obtainedAt || Date.now(), timesObtained: cur.timesObtained + 1 };
        } else {
          next = { ...cur, fragments: cur.fragments + result.amount };
        }
        owned[result.species.id] = next;
        const pulls = [{ id: 'p_' + Date.now(), ts: Date.now(), speciesId: result.species.id, type: result.type, amount: result.amount || 0 }, ...prev.pulls].slice(0, 30);
        return { ...prev, owned, pulls };
      });
      setGachaResult(result);
      setGachaState('result');
    }, 1300);
  }
  function closeGachaResult() {
    setGachaState('idle');
    setGachaResult(null);
  }

  function synthesize(speciesId) {
    const species = MONSTERS.find((m) => m.id === speciesId);
    const cur = collection.owned[speciesId];
    if (!species || !cur || cur.owned || cur.fragments < species.needed) return;
    setSynthesizingId(speciesId);
    setTimeout(() => {
      setCollection((prev) => {
        const c = prev.owned[speciesId];
        if (!c || c.owned) return prev;
        const owned = { ...prev.owned, [speciesId]: { ...c, owned: true, fragments: c.fragments - species.needed, obtainedAt: Date.now(), timesObtained: c.timesObtained + 1 } };
        return { ...prev, owned };
      });
      setProgress((prev) => ({
        ...prev,
        profile: { ...prev.profile, history: [{ ts: Date.now(), delta: 0, reason: `${species.name}が誕生した！` }, ...prev.profile.history].slice(0, 50) },
      }));
      setSynthesizingId(null);
      setSynthResult(species);
      setSelectedSpecies(null);
    }, 1100);
  }

  function claimWeekly(wk) {
    if (progress.profile.claimedWeeks.includes(wk)) return;
    setProgress((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        points: prev.profile.points + 50,
        claimedWeeks: [...prev.profile.claimedWeeks, wk],
        history: [{ ts: Date.now(), delta: 50, reason: '週間ボーナス達成！' }, ...prev.profile.history].slice(0, 50),
      },
    }));
  }

  if (!loaded) {
    return (
      <div className="rm-root">
        <style>{CSS}</style>
        <div className="rm-loading">
          <div className="rm-loading-dot" />
          <p>よみこみちゅう…</p>
        </div>
      </div>
    );
  }

  const today = todayStr();
  const todayEntries = progress.completions[today] || {};
  const doneToday = Object.keys(todayEntries).filter((k) => k !== '_bonus').length;
  const totalToday = progress.routines.length;
  const streak = computeStreak(progress.completions);
  const wp = weekProgress(progress.routines, progress.completions);
  const currentWeekKey = getWeekKey(today);
  const weeklyClaimed = progress.profile.claimedWeeks.includes(currentWeekKey);
  const weeklyEligible = wp.rate >= 0.8 && wp.daysElapsed >= 3 && !weeklyClaimed && progress.routines.length > 0;
  const ownedCount = MONSTERS.filter((m) => collection.owned[m.id] && collection.owned[m.id].owned).length;
  const completionPct = Math.round((ownedCount / MONSTERS.length) * 100);
  const mp = monthProgress(progress.routines, progress.completions);
  const heatmapDays = Array.from({ length: 28 }, (_, i) => {
    const d = addDays(today, -(27 - i));
    const day = progress.completions[d];
    const count = day ? Object.keys(day).filter((k) => k !== '_bonus').length : 0;
    return { date: d, count };
  });

  const tabs = [
    { key: 'home', label: 'ホーム', icon: Home },
    { key: 'gacha', label: 'ガチャ', icon: Gift },
    { key: 'collection', label: '図鑑', icon: BookOpen },
    { key: 'log', label: 'ログ', icon: BarChart3 },
  ];

  return (
    <div className="rm-root">
      <style>{CSS}</style>
      <div className="rm-shell">
        <header className="rm-header">
          <div className="rm-brand">
            <span className="rm-brand-mark">RM</span>
            <h1>Routine Monsters</h1>
          </div>
          <div className="rm-coin"><Coins size={15} /><span>{progress.profile.points}</span></div>
        </header>

        <main className="rm-main">
          {activeTab === 'home' && (
            <section className="rm-section">
              <div>
                <h2 className="rm-h2">今日のルーティン</h2>
                <p className="rm-sub">{today} ・ {doneToday}/{totalToday} 達成</p>
              </div>

              <div className="rm-card">
                <div className="rm-streak-row">
                  <div className="rm-streak-flame"><Flame size={22} /></div>
                  <div>
                    <div className="rm-streak-num">{streak}<span style={{ fontSize: 13, fontWeight: 500 }}> 日連続</span></div>
                    <div className="rm-streak-label">続けるほどボーナスptが増える</div>
                  </div>
                </div>
                <div className="rm-today-bar">
                  <div className="rm-bar-track"><div className="rm-bar-fill" style={{ width: `${totalToday ? (doneToday / totalToday) * 100 : 0}%` }} /></div>
                </div>
              </div>

              {weeklyEligible && (
                <div className="rm-weekly-banner">
                  <p>今週の達成率 {Math.round(wp.rate * 100)}%！ウィークリーボーナス+50pt</p>
                  <button className="rm-btn rm-btn-amber" onClick={() => claimWeekly(currentWeekKey)}>受け取る</button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {progress.routines.map((r) => {
                  const done = todayEntries[r.id] != null;
                  const isEditing = editingId === r.id;
                  if (isEditing) {
                    return (
                      <div key={r.id} className="rm-add-form">
                        <input className="rm-input" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={20} />
                        <div className="rm-weight-toggle">
                          {[1, 2, 3].map((w) => (
                            <div key={w} className={`rm-weight-opt ${editWeight === w ? 'sel' : ''}`} onClick={() => setEditWeight(w)}>
                              {WEIGHT_LABEL[w]}<br />{WEIGHT_POINT[w]}pt
                            </div>
                          ))}
                        </div>
                        <div className="rm-form-actions">
                          <button className="rm-btn rm-btn-ghost" onClick={() => setEditingId(null)}>キャンセル</button>
                          <button className="rm-btn rm-btn-amber" onClick={saveEdit}>保存</button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={r.id} className="rm-routine-row">
                      <button className={`rm-check ${done ? 'done' : ''}`} onClick={() => toggleRoutine(r.id)}>
                        {done && <Check size={16} />}
                      </button>
                      <span className={`rm-routine-name ${done ? 'done-text' : ''}`}>{r.name}</span>
                      <span className="rm-weight-badge">{WEIGHT_LABEL[r.weight]}・{WEIGHT_POINT[r.weight]}pt</span>
                      <button className="rm-icon-btn" onClick={() => startEdit(r)}><Pencil size={15} /></button>
                      <button className="rm-icon-btn" onClick={() => deleteRoutine(r.id)}><Trash2 size={15} /></button>
                    </div>
                  );
                })}
                {progress.routines.length === 0 && <p className="rm-empty">ルーティンがまだありません。下から追加しましょう。</p>}
              </div>

              {addingRoutine ? (
                <div className="rm-add-form">
                  <input className="rm-input" placeholder="ルーティン名（例：読書10分）" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={20} autoFocus />
                  <div className="rm-weight-toggle">
                    {[1, 2, 3].map((w) => (
                      <div key={w} className={`rm-weight-opt ${newWeight === w ? 'sel' : ''}`} onClick={() => setNewWeight(w)}>
                        {WEIGHT_LABEL[w]}<br />{WEIGHT_POINT[w]}pt
                      </div>
                    ))}
                  </div>
                  <div className="rm-form-actions">
                    <button className="rm-btn rm-btn-ghost" onClick={() => setAddingRoutine(false)}>キャンセル</button>
                    <button className="rm-btn rm-btn-amber" onClick={addRoutine}>追加する</button>
                  </div>
                </div>
              ) : (
                <button className="rm-add-trigger" onClick={() => setAddingRoutine(true)}><Plus size={16} />ルーティンを追加</button>
              )}
            </section>
          )}

          {activeTab === 'gacha' && (
            <section className="rm-section">
              <div>
                <h2 className="rm-h2">モンスターガチャ</h2>
                <p className="rm-sub">ポイントを使ってモンスターと出会おう</p>
              </div>

              <div className="rm-gacha-stage">
                <button className={`rm-egg ${gachaState === 'rolling' ? 'rolling' : ''}`} onClick={pullGacha} disabled={progress.profile.points < 10 || gachaState === 'rolling'}>
                  <svg viewBox="0 0 140 170" width="140" height="170">
                    <ellipse cx="70" cy="95" rx="58" ry="68" fill="#F3E6C4" stroke="#DA9C34" strokeWidth="4" />
                    <path d="M20 80 Q70 40 120 80" fill="none" stroke="#DA9C34" strokeWidth="4" />
                    <circle cx="50" cy="70" r="6" fill="#DA9C34" opacity="0.5" />
                    <circle cx="90" cy="110" r="4" fill="#DA9C34" opacity="0.5" />
                  </svg>
                </button>
                <p className="rm-gacha-cost">1回 10pt（所持: {progress.profile.points}pt）</p>
                <p className="rm-gacha-hint">タップしてガチャを回す。モンスター本体かモンスターのかけらが出るよ。</p>
              </div>

              <div className="rm-rarity-legend">
                {RARITY_ORDER.map((key) => (
                  <div key={key} className="rm-rarity-chip">
                    <span className="rm-rarity-dot" style={{ background: RARITY_META[key].color }} />
                    {RARITY_META[key].label}
                  </div>
                ))}
              </div>

              <div>
                <h2 className="rm-h2" style={{ fontSize: 16 }}>最近のガチャ結果</h2>
                <div className="rm-history-list" style={{ marginTop: 8 }}>
                  {collection.pulls.length === 0 && <p className="rm-empty">まだガチャを回していません。</p>}
                  {collection.pulls.slice(0, 8).map((p) => {
                    const species = MONSTERS.find((m) => m.id === p.speciesId);
                    return (
                      <div key={p.id} className="rm-pull-item">
                        <MonsterIcon species={species} discovered={true} owned={p.type === 'monster'} size={34} />
                        <span className="rm-pull-text">{species.name} {p.type === 'monster' ? '本体を獲得！' : `のかけら +${p.amount}`}</span>
                        <span className="rm-pull-time">{fmtDate(p.ts)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'collection' && (
            <section className="rm-section">
              <div className="rm-collection-summary">
                <div>
                  <h2 className="rm-h2">モンスター図鑑</h2>
                  <p className="rm-sub">{ownedCount} / {MONSTERS.length} 体を発見</p>
                </div>
                <div className="rm-collection-pct">{completionPct}%</div>
              </div>

              <div className="rm-monster-grid">
                {MONSTERS.map((m) => {
                  const entry = collection.owned[m.id];
                  const fragments = entry ? entry.fragments : 0;
                  const owned = !!(entry && entry.owned);
                  const discovered = fragments > 0 || owned;
                  return (
                    <div key={m.id} className="rm-monster-cell" onClick={() => setSelectedSpecies(m.id)}>
                      <MonsterIcon species={m} discovered={discovered} owned={owned} size={52} />
                      <span className="rm-monster-cell-name">{discovered ? m.name : '？？？'}</span>
                      <span className="rm-monster-cell-frag">{owned ? RARITY_META[m.rarity].label : discovered ? `かけら ${fragments}/${m.needed}` : RARITY_META[m.rarity].label}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === 'log' && (
            <section className="rm-section">
              <div>
                <h2 className="rm-h2">達成ログ</h2>
                <p className="rm-sub">生活改善の記録</p>
              </div>

              <div className="rm-log-grid-row">
                <div className="rm-stat-box">
                  <div className="rm-stat-num">{streak}</div>
                  <div className="rm-stat-label">連続達成日数</div>
                </div>
                <div className="rm-stat-box">
                  <div className="rm-stat-num">{Math.round(wp.rate * 100)}%</div>
                  <div className="rm-stat-label">週間達成率</div>
                </div>
                <div className="rm-stat-box">
                  <div className="rm-stat-num">{Math.round(mp.rate * 100)}%</div>
                  <div className="rm-stat-label">月間達成率</div>
                </div>
              </div>

              <div className="rm-card">
                <p className="rm-sub" style={{ marginBottom: 8 }}>過去28日間</p>
                <div className="rm-heatmap">
                  {heatmapDays.map((d) => {
                    const total = progress.routines.length || 1;
                    const ratio = Math.min(d.count / total, 1);
                    const bg = ratio === 0 ? 'var(--panel-alt)' : ratio < 0.5 ? '#CBE0D2' : ratio < 1 ? '#8FBFA0' : 'var(--moss)';
                    return <div key={d.date} className="rm-heatmap-cell" style={{ background: bg }} title={d.date} />;
                  })}
                </div>
              </div>

              <div>
                <h2 className="rm-h2" style={{ fontSize: 16 }}>ポイント履歴</h2>
                <div className="rm-history-list" style={{ marginTop: 8 }}>
                  {progress.profile.history.length === 0 && <p className="rm-empty">まだ記録がありません。</p>}
                  {progress.profile.history.slice(0, 20).map((h, i) => (
                    <div key={i} className="rm-pull-item">
                      <span className="rm-pull-text">{h.reason}</span>
                      {h.delta !== 0 && (
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: h.delta > 0 ? 'var(--moss)' : 'var(--clay)' }}>{h.delta > 0 ? '+' : ''}{h.delta}pt</span>
                      )}
                      <span className="rm-pull-time">{fmtDate(h.ts)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>

        <nav className="rm-tabbar">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.key} className={`rm-tab-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                <Icon size={19} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="rm-floater-layer">
          {floaters.map((f) => <div key={f.id} className="rm-floater">{f.text}</div>)}
        </div>

        {gachaState === 'result' && gachaResult && (
          <div className="rm-modal-backdrop" onClick={closeGachaResult}>
            <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
              <MonsterIcon species={gachaResult.species} discovered={true} owned={gachaResult.type === 'monster'} size={84} />
              <div className="rm-modal-title">{gachaResult.type === 'monster' ? `${gachaResult.species.name} 登場！` : `${gachaResult.species.name}のかけら +${gachaResult.amount}`}</div>
              <div className="rm-modal-sub">{RARITY_META[gachaResult.species.rarity].label}</div>
              <button className="rm-btn rm-btn-amber" style={{ width: '100%' }} onClick={closeGachaResult}>とじる</button>
            </div>
          </div>
        )}

        {synthResult && (
          <div className="rm-modal-backdrop" onClick={() => setSynthResult(null)}>
            <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
              <Sparkles size={28} color="var(--amber)" />
              <MonsterIcon species={synthResult} discovered={true} owned={true} size={84} />
              <div className="rm-modal-title">{synthResult.name}が誕生した！</div>
              <div className="rm-modal-sub">{RARITY_META[synthResult.rarity].label}</div>
              <button className="rm-btn rm-btn-amber" style={{ width: '100%' }} onClick={() => setSynthResult(null)}>とじる</button>
            </div>
          </div>
        )}

        {selectedSpecies && (() => {
          const m = MONSTERS.find((x) => x.id === selectedSpecies);
          const entry = collection.owned[m.id];
          const fragments = entry ? entry.fragments : 0;
          const owned = !!(entry && entry.owned);
          const discovered = fragments > 0 || owned;
          const canSynth = discovered && !owned && fragments >= m.needed;
          const synthing = synthesizingId === m.id;
          return (
            <div className="rm-modal-backdrop" onClick={() => setSelectedSpecies(null)}>
              <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
                <button className="rm-icon-btn" style={{ float: 'right' }} onClick={() => setSelectedSpecies(null)}><X size={18} /></button>
                <MonsterIcon species={m} discovered={discovered} owned={owned} size={90} />
                <div className="rm-modal-title">{discovered ? m.name : '？？？'}</div>
                <div className="rm-modal-sub">{RARITY_META[m.rarity].label}{discovered ? ` ・ ${m.theme}` : ''}</div>
                {discovered ? (
                  <>
                    <div className="rm-modal-desc">{m.desc}</div>
                    <div className="rm-detail-frag-bar">
                      <div className="rm-detail-frag-label"><span>かけら</span><span>{Math.min(fragments, m.needed)}/{m.needed}</span></div>
                      <div className="rm-bar-track"><div className="rm-bar-fill" style={{ width: `${Math.min((fragments / m.needed) * 100, 100)}%`, background: owned ? 'var(--amber)' : 'var(--moss)' }} /></div>
                    </div>
                    <p className="rm-sub" style={{ marginBottom: 14 }}>{owned ? `入手日：${fmtDate(entry.obtainedAt)}` : '合成に必要なかけらを集めよう'}</p>
                    {canSynth && (
                      <button className="rm-btn rm-btn-amber" style={{ width: '100%' }} onClick={() => synthesize(m.id)} disabled={synthing}>
                        {synthing ? '合成中…' : 'かけらを合成する'}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="rm-modal-desc" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Lock size={15} />まだ出会っていないモンスター。ガチャを回して見つけよう。
                    </div>
                    <p className="rm-sub">かけら必要数：{m.needed}</p>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// src/lib/sounds.js
//
// W/NA PTCG × Hugo Collections — 全站音效系統（唯一入口）
// ─────────────────────────────────────────────────────────────
// 設計原則：
//   1. 全部由 Web Audio API 程式生成，零外部音效檔。
//   2. 全站只透過 playSound(key) 播放，禁止各頁面自行實作音效邏輯。
//   3. 開關狀態存 localStorage('wna_sound_enabled')，預設開啟，關閉時 playSound 為 no-op。
//   4. SoundToggle 元件提供設定 UI（放在 ProfilePage 設定彈窗）。
//
// 使用方式：
//   import { playSound, SoundToggle } from '../lib/sounds';
//   playSound('order_success');
//   <SoundToggle />
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';

// ===== 設定常數 =====
const STORAGE_KEY = 'wna_sound_enabled';

// 主音量（總輸出，避免過大聲）
const MASTER_GAIN = 0.18;

// ===== localStorage 開關狀態 =====
export function isSoundEnabled() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    // 預設開啟：只有明確存成 'false' 才算關閉
    return v !== 'false';
  } catch (e) {
    return true;
  }
}

export function setSoundEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    // localStorage 不可用時靜默忽略
  }
  // 廣播給同頁面其他訂閱者（例如多個 SoundToggle）
  try {
    window.dispatchEvent(
      new CustomEvent('wna_sound_changed', { detail: { enabled } })
    );
  } catch (e) {}
}

// ===== AudioContext（延遲建立，避免未互動前被瀏覽器封鎖） =====
let _ctx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!_ctx) {
    try {
      _ctx = new AC();
    } catch (e) {
      return null;
    }
  }
  // 行動裝置 / 自動播放政策可能讓 ctx 進入 suspended，需在使用者互動時 resume
  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
}

// ===== 低階音色合成工具 =====

// 播放單一音符
// opts: { freq, start, dur, type, gain, attack, release, sweepTo }
function tone(ctx, master, opts) {
  const {
    freq,
    start = 0,
    dur = 0.15,
    type = 'sine',
    gain = 1,
    attack = 0.005,
    release = 0.06,
    sweepTo = null,
  } = opts;

  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo != null) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, sweepTo),
      t0 + dur
    );
  }

  // ADSR（簡化為 AR）
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.setValueAtTime(gain, t0 + Math.max(attack, dur - release));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(g);
  g.connect(master);

  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// 播放白噪音（用於擊敗、系統錯誤等）
// opts: { start, dur, gain, filterType, filterFreq }
function noise(ctx, master, opts) {
  const {
    start = 0,
    dur = 0.2,
    gain = 0.5,
    filterType = 'lowpass',
    filterFreq = 1200,
  } = opts;

  const t0 = ctx.currentTime + start;
  const bufferSize = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFreq, t0);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  src.connect(filter);
  filter.connect(g);
  g.connect(master);

  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

// 建立掛在 ctx 上的主增益節點
function makeMaster(ctx) {
  const master = ctx.createGain();
  master.gain.setValueAtTime(MASTER_GAIN, ctx.currentTime);
  master.connect(ctx.destination);
  return master;
}

// 常用音名 → 頻率
const N = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0,
  A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
  A5: 880.0, B5: 987.77,
  C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98,
};

// ===== 音效定義表 =====
// 每個 key 對應一個函式 (ctx, master) => void
const SOUNDS = {
  // ── 核心交易 ──

  // 下單成功：上行三連音 + 收尾亮音（爽快確認感）
  order_success(ctx, m) {
    tone(ctx, m, { freq: N.C5, start: 0.0, dur: 0.1, type: 'triangle', gain: 0.9 });
    tone(ctx, m, { freq: N.E5, start: 0.08, dur: 0.1, type: 'triangle', gain: 0.9 });
    tone(ctx, m, { freq: N.G5, start: 0.16, dur: 0.16, type: 'triangle', gain: 1.0 });
    tone(ctx, m, { freq: N.C6, start: 0.26, dur: 0.22, type: 'sine', gain: 0.8 });
  },

  // 兌換成功：明亮琶音收尾上挑
  shop_redeem_success(ctx, m) {
    tone(ctx, m, { freq: N.G4, start: 0.0, dur: 0.09, type: 'square', gain: 0.5 });
    tone(ctx, m, { freq: N.C5, start: 0.07, dur: 0.09, type: 'square', gain: 0.55 });
    tone(ctx, m, { freq: N.E5, start: 0.14, dur: 0.09, type: 'square', gain: 0.6 });
    tone(ctx, m, { freq: N.G5, start: 0.21, dur: 0.2, type: 'triangle', gain: 0.85, sweepTo: N.C6 });
  },

  // 簽到成功：清脆雙音「叮咚」
  checkin_success(ctx, m) {
    tone(ctx, m, { freq: N.E5, start: 0.0, dur: 0.12, type: 'sine', gain: 0.9 });
    tone(ctx, m, { freq: N.A5, start: 0.1, dur: 0.22, type: 'sine', gain: 0.95 });
  },

  // 獲得點數：輕快短促上揚（可連續播放，例如連加）
  points_earned(ctx, m) {
    tone(ctx, m, { freq: N.A5, start: 0.0, dur: 0.07, type: 'triangle', gain: 0.7, sweepTo: N.E6 });
  },

  // ── Boss 相關 ──

  // 擊敗 Boss：低頻轟擊 + 噪音爆破 + 勝利上行號角
  boss_defeated(ctx, m) {
    // 重低音衝擊
    tone(ctx, m, { freq: 90, start: 0.0, dur: 0.4, type: 'sawtooth', gain: 1.0, sweepTo: 40 });
    // 爆破噪音
    noise(ctx, m, { start: 0.0, dur: 0.35, gain: 0.7, filterType: 'lowpass', filterFreq: 900 });
    // 勝利號角（上行）
    tone(ctx, m, { freq: N.C5, start: 0.3, dur: 0.14, type: 'sawtooth', gain: 0.7 });
    tone(ctx, m, { freq: N.E5, start: 0.42, dur: 0.14, type: 'sawtooth', gain: 0.75 });
    tone(ctx, m, { freq: N.G5, start: 0.54, dur: 0.14, type: 'sawtooth', gain: 0.8 });
    tone(ctx, m, { freq: N.C6, start: 0.66, dur: 0.32, type: 'triangle', gain: 0.9 });
  },

  // 稀有獎勵：閃亮琶音 + 顫音（驚喜感）
  rare_reward(ctx, m) {
    tone(ctx, m, { freq: N.C5, start: 0.0, dur: 0.08, type: 'triangle', gain: 0.7 });
    tone(ctx, m, { freq: N.E5, start: 0.07, dur: 0.08, type: 'triangle', gain: 0.75 });
    tone(ctx, m, { freq: N.G5, start: 0.14, dur: 0.08, type: 'triangle', gain: 0.8 });
    tone(ctx, m, { freq: N.C6, start: 0.21, dur: 0.08, type: 'triangle', gain: 0.85 });
    tone(ctx, m, { freq: N.E6, start: 0.28, dur: 0.1, type: 'triangle', gain: 0.9 });
    // 閃爍高音顫音
    tone(ctx, m, { freq: N.G6, start: 0.4, dur: 0.12, type: 'sine', gain: 0.7 });
    tone(ctx, m, { freq: N.E6, start: 0.5, dur: 0.12, type: 'sine', gain: 0.65 });
    tone(ctx, m, { freq: N.G6, start: 0.6, dur: 0.2, type: 'sine', gain: 0.7 });
  },

  // 里程碑解鎖：莊重雙音上行 + 收尾共鳴
  milestone(ctx, m) {
    tone(ctx, m, { freq: N.G4, start: 0.0, dur: 0.16, type: 'triangle', gain: 0.8 });
    tone(ctx, m, { freq: N.C5, start: 0.12, dur: 0.16, type: 'triangle', gain: 0.85 });
    tone(ctx, m, { freq: N.E5, start: 0.24, dur: 0.3, type: 'sine', gain: 0.9, sweepTo: N.G5 });
  },

  // ── 錯誤類 ──

  // 點數不足：低沉雙音下行（溫和提醒）
  error_points(ctx, m) {
    tone(ctx, m, { freq: N.E4, start: 0.0, dur: 0.12, type: 'square', gain: 0.5 });
    tone(ctx, m, { freq: N.C4, start: 0.1, dur: 0.2, type: 'square', gain: 0.5 });
  },

  // 庫存不足：短促雙擊（提示而非責備）
  error_stock(ctx, m) {
    tone(ctx, m, { freq: N.D4, start: 0.0, dur: 0.08, type: 'square', gain: 0.45 });
    tone(ctx, m, { freq: N.D4, start: 0.12, dur: 0.12, type: 'square', gain: 0.45 });
  },

  // 權限不足：沉悶下滑（拒絕感）
  error_permission(ctx, m) {
    tone(ctx, m, { freq: N.A4, start: 0.0, dur: 0.28, type: 'sawtooth', gain: 0.5, sweepTo: 110 });
  },

  // 系統錯誤：刺耳噪音 + 低音（明顯的異常感）
  error_system(ctx, m) {
    noise(ctx, m, { start: 0.0, dur: 0.2, gain: 0.4, filterType: 'bandpass', filterFreq: 800 });
    tone(ctx, m, { freq: 140, start: 0.0, dur: 0.25, type: 'sawtooth', gain: 0.5, sweepTo: 80 });
  },

  // 通用錯誤：單一低音「噗」（fallback）
  error_general(ctx, m) {
    tone(ctx, m, { freq: 180, start: 0.0, dur: 0.18, type: 'square', gain: 0.45, sweepTo: 120 });
  },

  // ── UI 互動 ──

  // Tab 切換：極短輕點
  tab_switch(ctx, m) {
    tone(ctx, m, { freq: N.A5, start: 0.0, dur: 0.04, type: 'sine', gain: 0.4 });
  },

  // Modal 開啟：輕柔上揚
  modal_open(ctx, m) {
    tone(ctx, m, { freq: N.E5, start: 0.0, dur: 0.08, type: 'sine', gain: 0.45, sweepTo: N.A5 });
  },

  // Modal 關閉：輕柔下降
  modal_close(ctx, m) {
    tone(ctx, m, { freq: N.A5, start: 0.0, dur: 0.08, type: 'sine', gain: 0.4, sweepTo: N.E5 });
  },

  // 按鈕點擊：乾淨短促
  button_tap(ctx, m) {
    tone(ctx, m, { freq: N.C5, start: 0.0, dur: 0.035, type: 'triangle', gain: 0.4 });
  },
};

// ===== 對外播放入口 =====
export function playSound(key) {
  if (!isSoundEnabled()) return;
  const fn = SOUNDS[key];
  if (!fn) {
    // 未知 key 不報錯，靜默忽略（避免拼錯導致整頁壞掉）
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[sounds] unknown sound key:', key);
    }
    return;
  }
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const master = makeMaster(ctx);
    fn(ctx, master);
  } catch (e) {
    // 任何音訊例外都不影響主流程
  }
}

// 可用音效 key 清單（供除錯或設定頁列出）
export const SOUND_KEYS = Object.keys(SOUNDS);

// ===== SoundToggle 元件 =====
export function SoundToggle({ style }) {
  const [enabled, setEnabled] = useState(isSoundEnabled());

  // 同步其他來源（其他 SoundToggle 或 setSoundEnabled）的變更
  useEffect(() => {
    const handler = (e) => {
      if (e && e.detail && typeof e.detail.enabled === 'boolean') {
        setEnabled(e.detail.enabled);
      } else {
        setEnabled(isSoundEnabled());
      }
    };
    window.addEventListener('wna_sound_changed', handler);
    return () => window.removeEventListener('wna_sound_changed', handler);
  }, []);

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    // 開啟時播一聲回饋（此時剛好是使用者互動，可解鎖 AudioContext）
    if (next) {
      playSound('checkin_success');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        background: '#FFFBF2',
        borderRadius: 12,
        border: '1px solid #F0E2C8',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: enabled ? '#FFF1D6' : '#F1F1F1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: enabled ? '#BA7517' : '#A0A0A0',
            fontSize: 16,
            transition: 'all 0.2s',
          }}
        >
          <i
            className={
              enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark'
            }
          />
        </span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#3A2A12' }}>
            音效
          </span>
          <span style={{ fontSize: 12, color: '#A08A66' }}>
            {enabled ? '已開啟' : '已關閉'}
          </span>
        </div>
      </div>

      <button
        onClick={handleToggle}
        aria-label="切換音效"
        style={{
          position: 'relative',
          width: 52,
          height: 30,
          borderRadius: 999,
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          background: enabled ? '#E07B00' : '#D8D2C6',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: enabled ? 25 : 3,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            transition: 'left 0.2s',
          }}
        />
      </button>
    </div>
  );
}

export default { playSound, isSoundEnabled, setSoundEnabled, SoundToggle, SOUND_KEYS };

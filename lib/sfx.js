/**
 * 音效系统（SFX）—— 纯 Web Audio API 合成，零资源文件
 * 音效：点击、暴击、翻牌、成就解锁、SSR 抽到、升级、错误提示
 */
const SFX = (() => {
  let ctx = null;
  let enabled = true;

  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch(e){ enabled = false; }
    }
    return ctx;
  }

  // 通用：播放一个带包络的音符
  function tone(freq, dur=0.15, type='sine', vol=0.15, delay=0) {
    if (!enabled) return;
    const c = ac(); if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  // 上行琶音（升级/成就）
  function arpeggio(notes, type='triangle', step=0.08, vol=0.15) {
    notes.forEach((f,i)=>tone(f, 0.18, type, vol, i*step));
  }

  const SOUNDS = {
    click(){ tone(660, 0.08, 'square', 0.08); },
    // 对话文字音：柔和短促 blip（模拟 galgame 角色说话提示音）
    voice(){ tone(420 + Math.random()*120, 0.045, 'sine', 0.05); },
    select(){ tone(523, 0.1, 'triangle', 0.12); setTimeout(()=>tone(784,0.12,'triangle',0.12),60); },
    whoosh(){ /* 低频扫频 */
      if(!enabled) return; const c=ac(); if(!c) return;
      const o=c.createOscillator(),g=c.createGain();
      o.type='sawtooth'; o.frequency.setValueAtTime(200,c.currentTime);
      o.frequency.exponentialRampToValueAtTime(60,c.currentTime+0.4);
      g.gain.setValueAtTime(0.12,c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.4);
      o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+0.42);
    },
    crit(){ // 暴击
      arpeggio([523,659,784,1047,1319],'square',0.05,0.12);
    },
    flip(){ tone(880,0.06,'triangle',0.1); setTimeout(()=>tone(1100,0.08,'triangle',0.1),50); },
    reveal(){ arpeggio([523,659,784,1047],'triangle',0.1,0.13); },
    achievement(){ arpeggio([659,784,988,1319,1568],'triangle',0.09,0.14); },
    ssr(){
      arpeggio([523,659,784,1047,1319,1568,2093],'square',0.08,0.13);
      setTimeout(()=>arpeggio([1047,1319,1568,2093],'triangle',0.07,0.1),500);
    },
    levelup(){ arpeggio([392,494,587,784,988,1175],'triangle',0.1,0.15); },
    error(){ tone(220,0.2,'sawtooth',0.12); setTimeout(()=>tone(180,0.2,'sawtooth',0.12),120); },
    coin(){ tone(988,0.06,'square',0.1); setTimeout(()=>tone(1319,0.1,'square',0.1),60); },
  };

  function play(name){ if (SOUNDS[name]) SOUNDS[name](); }
  function toggle(){ enabled = !enabled; return enabled; }
  function isEnabled(){ return enabled; }
  // 首次用户交互后解锁音频
  function unlock(){ const c=ac(); if(c && c.state==='suspended') c.resume(); }

  return { play, toggle, isEnabled, unlock };
})();
window.SFX = SFX;

// ============================================================================
//  拦截 'play sound' 和 'play music'
//  - play sound xxx → 合成 SFX（避免 assets/sounds/xxx 404 卡剧本）
//  - play music xxx → 单例 BGM 播放器（避免多首 BGM 重叠）
// ============================================================================
(function registerSfxAction () {
  function setup () {
    if (!window.Monogatari || !window.monogatari) { setTimeout(setup, 200); return; }
    try {
      // 覆盖引擎内置的 'play' 语句：匹配 'play sound/music <name>'
      class GKSound extends Monogatari.Action {
        static id = 'GKSound';
        static matchString (args) {
          if (!Array.isArray(args)) return false;
          return args[0] === 'play' && (args[1] === 'sound' || args[1] === 'music');
        }
        constructor (statement) { super(); this._statement = statement; }
        apply () { return Promise.resolve(); }
        willApply () { return Promise.resolve(); }
        didApply () {
          try {
            const s = Array.isArray(this._statement) ? this._statement.join(' ') : String(this._statement);
            if (/^play\s+sound\b/.test(s)) {
              const m = s.match(/sound\s+(\S+)/);
              const name = m ? m[1] : null;
              if (!name) return Promise.resolve({ advance: true });
              if (name.startsWith('env-')) {
                // 环境音：查 assets('sounds') 映射，用 <audio loop> 播真实文件
                let fileName = name + '.mp3';
                try {
                  const soundAssets = monogatari.assets ? monogatari.assets('sounds') : null;
                  if (soundAssets && soundAssets[name]) fileName = soundAssets[name];
                } catch (e) {}
                const ap = (monogatari.setting && monogatari.setting('AssetsPath')) || { root:'assets', sounds:'sounds' };
                try {
                  if (window.__envPlayer) { window.__envPlayer.pause(); }
                  window.__envPlayer = new Audio(ap.root + '/' + ap.sounds + '/' + fileName);
                  window.__envPlayer.loop = true;
                  window.__envPlayer.volume = 0.4;
                  window.__envPlayer.play().catch(() => {});
                } catch (e) {}
              } else if (SFX) {
                SFX.play(name);
              }
            } else if (/^play\s+music\b/.test(s)) {
              // 单例 BGM：停旧播新，避免重叠
              const m = s.match(/music\s+(\S+)/);
              const trackName = m ? m[1] : null;
              if (trackName && window.__playBgm) {
                // 解析资源名 → 实际文件：查引擎 assets('music') 映射
                let fileName = trackName + '.mp3';
                try {
                  const musicAssets = monogatari.assets ? monogatari.assets('music') : null;
                  if (musicAssets && musicAssets[trackName]) fileName = musicAssets[trackName];
                } catch (e) {}
                const ap = (monogatari.setting && monogatari.setting('AssetsPath')) || { root:'assets', music:'music' };
                window.__playBgm(ap.root + '/' + ap.music + '/' + fileName);
              }
            }
          } catch (e) {}
          return Promise.resolve({ advance: true });
        }
        revert () { return Promise.resolve(); }
        didRevert () { return Promise.resolve({ advance: true, step: true }); }
      }
      try { GKSound.id = Monogatari.Actions.PlaySound?.id || 'PlaySound'; } catch (e) {}
      monogatari.registerAction(GKSound);
    } catch (e) { /* 引擎结构变化时静默 */ }
  }
  if (document.readyState === 'complete') setup();
  else window.addEventListener('load', setup);
})();

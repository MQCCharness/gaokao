import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
const RAW = 'https://cdn.jsdelivr.net/gh/usakan2077/houkago_stella@master/assets';
function dl(url, dest) {
  return new Promise((res, rej) => {
    const f = fs.createWriteStream(dest);
    https.get(url, { timeout: 60000 }, r => {
      if (r.statusCode !== 200) { f.close(); try { fs.unlinkSync(dest); } catch (e) {} return rej(new Error(r.statusCode)); }
      r.pipe(f); f.on('finish', () => { f.close(); res(dest); });
    }).on('timeout', function () { this.destroy(); f.close(); try { fs.unlinkSync(dest); } catch (e) {} rej('timeout'); }).on('error', e => { f.close(); try { fs.unlinkSync(dest); } catch (_) {} rej(e); });
  });
}
const BGS = [
  ['gymnasium_evening.webp', 'assets/scenes/scene-gym.webp'],
  ['rooftop_night.webp', 'assets/scenes/scene-stargaze.webp'],
  ['riverbank_evening.webp', 'assets/scenes/scene-river.webp'],
];
const SES = [
  ['gym_whistle.mp3', 'assets/sounds/env-gym.mp3'],
  ['crowd_distant.mp3', 'assets/sounds/env-crowd.mp3'],
  ['night_insect.mp3', 'assets/sounds/env-insect.mp3'],
  ['river_flow.mp3', 'assets/sounds/env-river.mp3'],
  ['wind_leaves.mp3', 'assets/sounds/env-leaves.mp3'],
  ['wind_rooftop.mp3', 'assets/sounds/env-rooftop.mp3'],
  ['semi.mp3', 'assets/sounds/env-semi.mp3'],
];
console.log('=== BG ===');
for (const [s, d] of BGS) {
  fs.mkdirSync(path.dirname(d), { recursive: true });
  if (fs.existsSync(d) && fs.statSync(d).size > 1000) { console.log('  skip ' + path.basename(d)); continue; }
  try { await dl(RAW + '/images/bg/' + s, d); console.log('  ok ' + path.basename(d)); } catch (e) { console.log('  FAIL ' + s + ' ' + e.message); }
}
console.log('=== SE ===');
for (const [s, d] of SES) {
  fs.mkdirSync(path.dirname(d), { recursive: true });
  if (fs.existsSync(d) && fs.statSync(d).size > 1000) { console.log('  skip ' + path.basename(d)); continue; }
  try { await dl(RAW + '/audio/se/' + s, d); console.log('  ok ' + path.basename(d)); } catch (e) { console.log('  FAIL ' + s + ' ' + e.message); }
}
console.log('done');

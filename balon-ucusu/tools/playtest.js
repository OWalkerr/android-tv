#!/usr/bin/env node
/*
 Balon Uçuşu otomatik oyun testi.
 Kullanım: node balon-ucusu/tools/playtest.js [bölümler...] [--shots klasör] [--dpr 1|2]
   örnek:  node balon-ucusu/tools/playtest.js 1 5 13 --shots /tmp/shots
 Oyunun geçici bir kopyasına test kancası ekler (asıl dosyaya dokunmaz), her bölümü
 kapıları seçen ve finalde ritimle pompalayan bir botla oynatır; sonuç, FPS ve
 sayfa hatalarını yazdırır. Hata varsa çıkış kodu 1 olur.
*/
const fs = require('fs'), path = require('path'), os = require('os');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const shots = opt('--shots', null), dpr = +opt('--dpr', 1);
const levels = args.length ? args.map(Number) : [1, 3, 5, 8, 13, 17, 22];

const src = path.join(__dirname, '..', 'index.html');
const HOOK = "window.__bal={get G(){return G},get save(){return save}};window.__start=(L,d)=>startLevel(L,d);";
const html = fs.readFileSync(src, 'utf8').replace('/* ================= KAYIT ================= */', HOOK);
if (!html.includes('__start')) { console.error('Test kancası eklenemedi: KAYIT işaretçisi bulunamadı'); process.exit(2); }
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'balon-')), 'test.html');
fs.writeFileSync(tmp, html);
if (shots) fs.mkdirSync(shots, { recursive: true });

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 420, height: 800 }, deviceScaleFactor: dpr });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + tmp); await p.waitForTimeout(800);
  if (shots) await p.screenshot({ path: path.join(shots, 'menu.png') });
  const fps = () => p.evaluate(() => new Promise(r => { let n = 0, t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 1500) requestAnimationFrame(f); else r(Math.round(n / 1.5)); })(); }));
  for (const L of levels) {
    await p.evaluate(L => window.__start(L), L);
    await p.evaluate(() => {
      const G = window.__bal.G;
      window.__bot = setInterval(() => {
        if (G.phase === 'play') {
          const row = G.rows.find(r => !r.used && r.y > G.y + 70);
          if (row) {
            const n = G.n, val = g => g.op === '+' ? n + g.v : g.op === '×' ? n * g.v : g.op === '-' ? n - g.v : g.op === '÷' ? n / g.v : n + 1;
            let bi = 0; row.gates.forEach((g, i) => { if (val(g) > val(row.gates[bi])) bi = i; });
            const bs = row.gates.length === 3 ? [[0, 145], [145, 255], [255, 400]] : [[0, 200], [200, 400]];
            G.tx = (bs[bi][0] + bs[bi][1]) / 2;
          }
          if (G.n < 12 && G.bags > 0) window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
        }
        if (G.phase === 'final') { const ph = (G.t % .5) / .5; if (ph < .12 || ph > .9) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' })); }
        for (const k of [' ', 'ArrowUp']) window.dispatchEvent(new KeyboardEvent('keyup', { key: k }));
      }, 40);
    });
    const t0 = Date.now(); let st, f1 = null, f2 = null, shot = 0;
    while (Date.now() - t0 < 120000) {
      await p.waitForTimeout(500);
      st = await p.evaluate(() => { const G = window.__bal.G; return { ph: G.phase, n: G.n, y: Math.round(G.y), fin: G.finishY, z: G.zone, c: G.collected, done: !document.getElementById('result').hidden }; });
      if (f1 === null && st.y > 1200 && st.ph === 'play') { f1 = await fps(); if (shots) await p.screenshot({ path: path.join(shots, `L${L}-oyun.png`) }); }
      if (f2 === null && st.ph === 'final' && st.z >= 2) { f2 = await fps(); if (shots) await p.screenshot({ path: path.join(shots, `L${L}-final.png`) }); }
      if (st.done) break;
    }
    await p.waitForTimeout(1100);
    const r = await p.evaluate(() => [document.getElementById('rtitle').textContent, document.getElementById('rx').textContent, document.getElementById('rtot').textContent]);
    if (shots) await p.screenshot({ path: path.join(shots, `L${L}-sonuc.png`) });
    await p.evaluate(() => clearInterval(window.__bot));
    console.log(`Bölüm ${L}: ${r[0]} ${r[1]} | kazanç ${r[2]} | altın ${st.c} | FPS oyun ${f1 ?? '-'} final ${f2 ?? '-'}`);
  }
  console.log(errs.length ? 'HATALAR:\n' + errs.join('\n') : 'Sayfa hatası yok');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();

// Renderiza index.html quadro a quadro com Playwright.
// Idioma: VLANG=en (padrão pt).
// Uso: node render.js <pasta_frames> [fps=25] [workers=4] [só_estes_tempos_em_s,separados,por,vírgula]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [out, fps = '25', workers = '4', only] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const url = 'file://' + path.resolve(__dirname, 'index.html') + '?render=1&lang=' + (process.env.VLANG || 'pt');
  const browser = await chromium.launch();
  const open = async () => {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => Promise.all([...document.fonts].map(f => f.load())));
    if (errs.length) throw new Error(errs.join('\n'));
    return page;
  };
  const first = await open();
  const dur = await first.evaluate(() => window.DURATION);
  fs.writeFileSync(path.join(out, 'sfx_events.json'), JSON.stringify(await first.evaluate(() => window.getSFX())));
  const times = only ? only.split(',').map(Number) : [...Array(Math.ceil(dur * +fps)).keys()].map(i => i / +fps);
  const pages = [first, ...(await Promise.all([...Array(+workers - 1)].map(open)))];
  let done = 0; const t0 = Date.now();
  await Promise.all(pages.map(async (page, w) => {
    for (let i = w; i < times.length; i += pages.length) {
      await page.evaluate(t => window.renderAt(t), times[i]);
      const name = only ? `t_${times[i].toFixed(2)}.jpg` : `f_${String(i).padStart(5, '0')}.jpg`;
      await page.screenshot({ path: path.join(out, name), type: 'jpeg', quality: 92 });
      if (++done % 100 === 0) console.log(`${done}/${times.length} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
  }));
  console.log(`ok ${times.length} quadros, duração ${dur}s`);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });

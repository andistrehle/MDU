const { chromium } = require('playwright');
const OUT = process.argv[2];
(async () => {
  const b = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '<-loopback>,localhost,127.0.0.1' } : undefined });
  const mk = async (vp, dsf) => { const c = await b.newContext({ viewport: vp, deviceScaleFactor: dsf, ignoreHTTPSErrors: true }); await c.addInitScript(() => { try { localStorage.setItem('mdu-theme', 'light'); localStorage.setItem('mdu.tour.v1.done','1'); localStorage.setItem('mdu.tour.v1.member.done','1'); } catch {} }); return c; };
  const clean = p => p.evaluate(() => document.querySelectorAll('nextjs-portal').forEach(e => e.remove()));
  for (const [dev, vp, dsf] of [['handy', { width: 390, height: 844 }, 3], ['desktop', { width: 1280, height: 800 }, 1.5]]) {
    const ctx = await mk(vp, dsf); const p = await ctx.newPage();
    for (const s of (process.argv[3] ? [] : ['kalender', 'tabelle', 'einzel'])) { await p.goto('http://localhost:3340/zz-demo?s=' + s); await p.waitForTimeout(3500); await clean(p); await p.screenshot({ path: `${OUT}/${dev}-${s}.png` }); }
    // echte Seiten: Startseite (Nächste Spiele) und Spielplan
    await p.goto('http://localhost:3340/'); await p.waitForTimeout(6000); await clean(p);
    await p.evaluate(() => { document.querySelectorAll('button,a').forEach(e => { if (/Demo Tour/.test(e.textContent)) (e.closest('div[style*="fixed"]') || e).style.display = 'none'; }); const h = [...document.querySelectorAll('h2')].find(x => /Nächste Spiele/i.test(x.textContent)); if (h) window.scrollTo(0, h.getBoundingClientRect().top + window.scrollY - 120); }); await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}/${dev}-start.png` });
    if (!process.argv[3]) { await p.goto('http://localhost:3340/spielplan'); await p.waitForTimeout(6000); await clean(p); await p.evaluate(() => window.scrollTo(0, 620)); await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}/${dev}-spielplan.png` }); }
    await ctx.close();
  }
  for (const [n, vp, s] of (process.argv[3] ? [] : [['monitor', { width: 1600, height: 900 }, 'live'], ['tablet', { width: 820, height: 1180 }, 'live-edit']])) {
    const ctx = await mk(vp, 1.5); const p = await ctx.newPage();
    await p.goto('http://localhost:3340/zz-demo?s=' + s); await p.waitForTimeout(4000); await clean(p);
    await p.screenshot({ path: `${OUT}/live-${n}.png` });
    if (n === 'tablet') { await p.locator('button', { hasText: '●' }).first().click(); await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}/live-tablet-ergebnis.png` }); }
    await ctx.close();
  }
  await b.close();
})();

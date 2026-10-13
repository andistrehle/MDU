const { chromium } = require('playwright');
const OUT = process.argv[2];
(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY, bypass: '<-loopback>,localhost,127.0.0.1' } });
  const mk = async (vp, dsf) => { const c = await b.newContext({ viewport: vp, deviceScaleFactor: dsf, ignoreHTTPSErrors: true }); await c.addInitScript(() => { try { localStorage.setItem('mdu-theme', 'light'); localStorage.setItem('mdu.tour.v1.done','1'); localStorage.setItem('mdu.tour.v1.member.done','1'); } catch {} }); return c; };
  const url = 'http://localhost:3340/spielstaetten/venue-08c4104796';
  for (const [dev, vp, dsf, y] of [['desktop', { width: 1280, height: 800 }, 1.5, 330], ['handy', { width: 390, height: 844 }, 3, 470]]) {
    const ctx = await mk(vp, dsf); const p = await ctx.newPage();
    await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500); await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(4000);
    await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(600);
    await p.screenshot({ path: `${OUT}/${dev}-spielort.png` });
    if (dev === 'desktop') {
      await p.evaluate(() => { window.print = () => {}; });
      const [pop] = await Promise.all([p.waitForEvent('popup'), p.click('text=Plan drucken')]);
      await pop.evaluate(() => { window.print = () => {}; }).catch(() => {});
      await pop.waitForLoadState(); await pop.setViewportSize({ width: 900, height: 1150 }); await pop.waitForTimeout(2000);
      await pop.evaluate(() => document.querySelector('.toolbar')?.remove());
      await pop.screenshot({ path: `${OUT}/druck-spielort.png` });
    }
    await ctx.close();
  }
  await b.close();
})();

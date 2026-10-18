// Screenshots für das Promo-Video (Demo-Seite app/zz-demo, siehe README).
// Aufruf: node screenshots.js <ausgabeordner> [nur=name1,name2]
const { chromium } = require('playwright');
const OUT = process.argv[2];
const NUR = (process.argv[3] || '').replace(/^nur=/, '').split(',').filter(Boolean);
const BASIS = process.env.BASIS || 'http://localhost:3360';
const USER = { id: 'demo-u0', email: 'kapitaen@demo.invalid', displayName: 'Max Mustermann', role: 'team_captain', playerId: 'p0', teamId: 'freibad-bazis', createdAt: '2026-09-01T10:00:00Z', updatedAt: '2026-09-01T10:00:00Z' };
const GERAETE = {
  web: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5, locale: 'de-DE', timezoneId: 'Europe/Berlin' },
  handy: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'de-DE', timezoneId: 'Europe/Berlin' },
};
// name, url-Parameter, optional: Aktion vor dem Bild (p, geraet)
const SHOTS = require('./shots-liste.js');

(async () => {
  const b = await chromium.launch({ args: ['--lang=de-DE'], env: { ...process.env, LANG: 'de_DE.UTF-8', LANGUAGE: 'de', LC_ALL: 'de_DE.UTF-8' } });
  for (const [geraet, opt] of Object.entries(GERAETE)) {
    const ctx = await b.newContext(opt);
    await ctx.addInitScript(u => { try {
      localStorage.setItem('mdu-theme', 'light'); localStorage.setItem('mdu.tour.v1.done', '1'); localStorage.setItem('mdu.tour.v1.member.done', '1');
      sessionStorage.setItem('mdu-auth-session', u);
    } catch {} }, JSON.stringify(USER));
    const p = await ctx.newPage();
    for (const [name, params, aktion] of SHOTS) {
      if (NUR.length && !NUR.includes(name)) continue;
      await p.mouse.move(1, 1);
      await p.goto(`${BASIS}/zz-demo?${params}`); await p.waitForTimeout(2200);
      await p.evaluate(() => document.querySelectorAll('nextjs-portal').forEach(e => e.remove()));
      if (aktion) await aktion(p, geraet);
      await p.waitForTimeout(500);
      await p.screenshot({ path: `${OUT}/${geraet}-${name}.jpg`, type: 'jpeg', quality: 88 });
    }
    await ctx.close();
  }
  await b.close();
})();

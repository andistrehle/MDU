// Standbild jedes Schritts (ohne Ton) zum Prüfen: node standbilder.js <ordner> [hoch]
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const hoch = process.argv[3] === 'hoch';
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: hoch ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 } });
  await p.goto('file://' + path.join(__dirname, 'erklaer.html') + (hoch ? '#hoch' : '')); await p.waitForTimeout(1500);
  const n = await p.evaluate(() => SZENEN.map(s => s.schritte.length));
  for (let i = 0; i < n.length; i++) for (let j = 0; j < n[i]; j++) {
    await p.evaluate(([i, j]) => {
      document.querySelectorAll('.szene').forEach(x => x.classList.remove('an'));
      const el = document.getElementById('sz' + i); el.classList.add('an');
      for (let q = 0; q <= j; q++) { const sch = SZENEN[i].schritte[q]; zeige(el, sch); document.getElementById('unter').textContent = ohneRegie(sch.u ?? '');
        if (sch.collage) el.querySelectorAll('[data-c]').forEach(c => c.classList.add('an')); }
    }, [i, j]);
    await p.waitForTimeout(1100);
    await p.screenshot({ path: `${process.argv[2]}/${hoch ? 'h' : 'q'}-${String(i + 1).padStart(2, '0')}-${j}.png` });
  }
  await b.close();
})();

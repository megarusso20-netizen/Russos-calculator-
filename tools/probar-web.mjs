// Opens the live Play Korsou site in a real browser, walks through the home page selector and both games,
// and writes screenshots plus a text report into ./capturas.
import { chromium } from 'playwright';
import fs from 'node:fs';
fs.mkdirSync('capturas', { recursive: true });
const BASE = 'https://playkorsou.web.app';
const report = [];
const log = (...a) => { const l = a.join(' '); console.log(l); report.push(l); };
fs.writeFileSync('capturas/ala-azul.html', await (await fetch(BASE + '/ala-azul')).text());
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [dev, opts] of [['pc', { viewport: { width: 1280, height: 760 } }], ['movil', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 220)); });
  page.on('pageerror', e => errors.push('JS: ' + e.message.slice(0, 220)));
  const shot = async n => { await page.screenshot({ path: `capturas/${dev}-${n}.png` }); };
  log(`===== ${dev} =====`);
  const r0 = await page.goto(BASE + '/', { waitUntil: 'load' });
  log('portada', r0.status(), await page.title(), '| cache-control:', r0.headers()['cache-control']);
  log('botones:', JSON.stringify(await page.$$eval('a', as => as.map(a => [a.textContent.replace(/\s+/g, ' ').trim().slice(0, 40), a.getAttribute('href')]))));
  await page.waitForTimeout(800); await shot('1-portada');
  // Ala Azul
  if (await page.$('#go-ala')) {
    await page.click('#go-ala'); await page.waitForLoadState('load'); await page.waitForTimeout(2500);
    log('ala azul ->', page.url(), '|', await page.title());
    log('  botones visibles:', JSON.stringify(await page.$$eval('button', bs => bs.filter(b => b.offsetParent).map(b => b.textContent.replace(/\s+/g, ' ').trim().slice(0, 30)))));
    await shot('2-ala-azul');
    const start = await page.$('.overlay button');
    if (start) { await start.click().catch(e => log('  no se pudo pulsar empezar:', e.message.slice(0, 80))); await page.waitForTimeout(2500); await shot('3-ala-azul-jugando'); log('  después de pulsar:', page.url()); }
    log('  errores:', errors.length ? errors.join(' || ') : 'ninguno'); errors.length = 0;
    await page.goto(BASE + '/', { waitUntil: 'load' });
  } else log('NO hay botón de Ala Azul en la portada');
  // Tormenta
  if (await page.$('#go-tormenta')) {
    await page.click('#go-tormenta'); await page.waitForLoadState('load'); await page.waitForTimeout(4000);
    log('tormenta ->', page.url(), '|', await page.title(), '| volver visible:', await page.isVisible('#hubback'));
    await shot('4-tormenta-menu');
    await page.evaluate(() => { const q = document.getElementById('qual-baja'); if (q) q.click(); const p = document.getElementById('play'); if (p) p.click(); });
    await page.waitForTimeout(5000);
    log('  estado:', await page.evaluate(() => window.__tormenta ? window.__tormenta.state : 'sin juego'));
    await shot('5-tormenta-jugando');
    log('  errores:', errors.length ? errors.join(' || ') : 'ninguno'); errors.length = 0;
  } else log('NO hay botón de Tormenta en la portada');
  await ctx.close();
}
await browser.close();
fs.writeFileSync('capturas/informe.txt', report.join('\n') + '\n');

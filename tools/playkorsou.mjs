// Inspect or update the playkorsou Firebase Hosting site through the Hosting REST API.
// Mode "inspeccionar" only reads. Mode "publicar" clones the live version, adds the game and the
// two-button home page, keeps Ala Azul (its old index.html is kept as /ala-azul.html) and releases it.
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import fs from 'node:fs';

const SITE = process.env.SITE || 'playkorsou';
const MODE = process.env.MODE || 'inspeccionar';
const API = 'https://firebasehosting.googleapis.com/v1beta1';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
if (!sa.client_email) { console.error('Falta el secreto FIREBASE_SERVICE_ACCOUNT_PLAYKORSOU'); process.exit(1); }

async function token() {
  const now = Math.floor(Date.now() / 1000);
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase.hosting', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3000 });
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: unsigned + '.' + sig }) });
  const j = await r.json(); if (!j.access_token) throw new Error('No se pudo autenticar: ' + JSON.stringify(j)); return j.access_token;
}
const TOKEN = await token();
async function call(method, url, body) {
  const r = await fetch(url.startsWith('http') ? url : API + url, { method, headers: { authorization: 'Bearer ' + TOKEN, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  if (!r.ok) throw new Error(`${method} ${url} -> ${r.status} ${t.slice(0, 500)}`);
  return j;
}

const rel = await call('GET', `/sites/${SITE}/releases?pageSize=1`);
const live = rel.releases && rel.releases[0];
if (!live) { console.log('El sitio no tiene ninguna versión publicada.'); process.exit(0); }
const verName = live.version.name;
console.log('Versión en línea:', verName, 'publicada', live.releaseTime);
console.log('Configuración:', JSON.stringify(live.version.config || {}, null, 1));
let files = [], pageToken = '';
do { const f = await call('GET', `/${verName}/files?pageSize=1000${pageToken ? '&pageToken=' + pageToken : ''}`); files = files.concat(f.files || []); pageToken = f.nextPageToken || ''; } while (pageToken);
console.log(`Archivos (${files.length}):`); for (const f of files.slice(0, 200)) console.log('  ', f.path);

// look at the current home page so we know what kind of app Ala Azul is
try {
  const html = await (await fetch(`https://${SITE}.web.app/`)).text();
  console.log('--- index.html actual (primeros 3000 caracteres) ---\n' + html.slice(0, 3000) + '\n--- fin ---');
} catch (e) { console.log('No se pudo leer la portada:', e.message); }

if (MODE !== 'publicar') { console.log('Modo inspeccionar: no se ha cambiado nada.'); process.exit(0); }

const index = files.find(f => f.path === '/index.html');
if (!index) throw new Error('No hay /index.html en el sitio; no lo toco.');
const add = { '/index.html': 'playkorsou/index.html', '/tormenta/index.html': 'playkorsou/tormenta/index.html' };
const hashes = { '/ala-azul.html': index.hash }, blobs = {};
for (const [p, local] of Object.entries(add)) {
  const gz = zlib.gzipSync(fs.readFileSync(local), { level: 9 });
  const h = crypto.createHash('sha256').update(gz).digest('hex');
  hashes[p] = h; blobs[h] = gz;
}
// clone the live version (keeps every Ala Azul file), then add/replace our files
let op = await call('POST', `/sites/${SITE}/versions:clone`, { sourceVersion: verName, finalize: false });
while (!op.done) { await new Promise(r => setTimeout(r, 2000)); op = await call('GET', `https://firebasehosting.googleapis.com/v1beta1/${op.name}`); }
if (op.error) throw new Error('Error al clonar: ' + JSON.stringify(op.error));
const newVer = op.response.name;
console.log('Versión nueva:', newVer);
const pop = await call('POST', `/${newVer}:populateFiles`, { files: hashes });
for (const h of pop.uploadRequiredHashes || []) {
  const r = await fetch(`${pop.uploadUrl}/${h}`, { method: 'POST', headers: { authorization: 'Bearer ' + TOKEN, 'content-type': 'application/octet-stream' }, body: blobs[h] });
  if (!r.ok) throw new Error('Error subiendo ' + h + ': ' + r.status + ' ' + (await r.text()).slice(0, 300));
}
// single-page-app rewrites that pointed at /index.html now point at Ala Azul's page
const cfg = JSON.parse(JSON.stringify(live.version.config || {}));
let changed = false;
for (const rw of cfg.rewrites || []) if (rw.path === '/index.html') { rw.path = '/ala-azul.html'; changed = true; }
if (changed) { await call('PATCH', `/${newVer}?update_mask=config`, { config: cfg }); console.log('Reglas de reescritura ajustadas a /ala-azul.html'); }
await call('PATCH', `/${newVer}?update_mask=status`, { status: 'FINALIZED' });
const done = await call('POST', `/sites/${SITE}/releases?versionName=${encodeURIComponent(newVer)}`, { message: 'Ala Azul + Tormenta del Desierto' });
console.log('Publicado:', done.name, '-> https://' + SITE + '.web.app/');
console.log('Para deshacerlo: en la consola de Firebase > Hosting > historial, vuelve a publicar la versión', verName);

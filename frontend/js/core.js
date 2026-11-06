/* Núcleo compartido: idioma, sesión (Supabase o demo) y carga de datos. */
(function(){
const CFG = window.SNRGY_CONFIG || {};
const DEMO = !CFG.SUPABASE_URL;
const $ = (s, r) => (r || document).querySelector(s);

/* ---------------- idioma ---------------- */
let LANG = 'es', EN = {};
try { const s = localStorage.getItem('viv-lang'); if (s === 'en' || s === 'es') LANG = s; } catch (e) {}
const t = (k, v) => {
  let s = (LANG === 'en' && EN[k] !== undefined) ? EN[k] : k;
  if (LANG === 'en' && EN[k] === undefined) (window.__missing = window.__missing || new Set()).add(k);
  if (v) s = s.replace(/\{(\w+)\}/g, (m, n) => v[n] !== undefined ? v[n] : m);
  return s;
};
const addEN = d => Object.assign(EN, d);
const norm = s => s.replace(/\s+/g, ' ').trim();
const TXT = new WeakMap(), ATT = new WeakMap();
function applyStatic(skip) {
  skip = skip || 'script,style,[data-noi18n]';
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), nodes = []; let n;
  while ((n = w.nextNode())) nodes.push(n);
  nodes.forEach(n => {
    const p = n.parentElement; if (!p || p.closest(skip)) return;
    let o = TXT.get(n);
    if (!o) { const raw = n.nodeValue, tr = raw.trim(); if (!tr) return;
      o = { lead: raw.match(/^\s*/)[0], trail: raw.match(/\s*$/)[0], key: norm(tr) }; TXT.set(n, o); }
    n.nodeValue = o.lead + t(o.key) + o.trail;
  });
  document.querySelectorAll('[title],[aria-label],[placeholder],[alt]').forEach(el => {
    if (el.closest(skip)) return;
    let o = ATT.get(el);
    if (!o) { o = {}; ['title', 'aria-label', 'placeholder', 'alt'].forEach(a => { if (el.hasAttribute(a)) o[a] = norm(el.getAttribute(a)); }); ATT.set(el, o); }
    Object.keys(o).forEach(a => el.setAttribute(a, t(o[a])));
  });
}
function setLang(l, after) {
  LANG = l; try { localStorage.setItem('viv-lang', l); } catch (e) {}
  document.documentElement.lang = l;
  document.querySelectorAll('[data-lang] button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.l === l)));
  applyStatic(); if (after) after();
}
function bindLang(after) {
  document.querySelectorAll('[data-lang]').forEach(g => g.addEventListener('click', e => {
    const b = e.target.closest('button'); if (b && b.dataset.l !== LANG) setLang(b.dataset.l, after);
  }));
  setLang(LANG, after);
}

/* ---------------- sesión ---------------- */
const DEMO_USERS = {
  'admin':   { pw: 'admin123', rol: 'admin',     vivienda: null },
  'casa004': { pw: 'demo123',  rol: 'habitante', vivienda: 'Vivienda-004' },
  'casa009': { pw: 'demo123',  rol: 'habitante', vivienda: 'Vivienda-009' },
  'casa002': { pw: 'demo123',  rol: 'habitante', vivienda: 'Vivienda-002' }
};
let sb = null;
if (!DEMO) sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true } });
const emailOf = u => { u = u.trim().toLowerCase(); return u.includes('@') ? u : u + '@' + CFG.USER_DOMAIN; };
const homeFor = p => p && p.rol === 'admin' ? 'admin.html' : 'mi-vivienda.html';

async function perfil() {
  if (DEMO) { try { return JSON.parse(sessionStorage.getItem('demo-perfil') || 'null'); } catch (e) { return null; } }
  const { data: { session } } = await sb.auth.getSession(); if (!session) return null;
  const { data, error } = await sb.from('perfiles').select('usuario,rol,vivienda').eq('user_id', session.user.id).maybeSingle();
  if (error || !data) return null; return data;
}
async function login(usuario, pass) {
  if (DEMO) {
    const u = DEMO_USERS[usuario.trim().toLowerCase()];
    if (!u || u.pw !== pass) throw new Error('bad');
    const p = { usuario: usuario.trim().toLowerCase(), rol: u.rol, vivienda: u.vivienda };
    sessionStorage.setItem('demo-perfil', JSON.stringify(p)); return p;
  }
  const { error } = await sb.auth.signInWithPassword({ email: emailOf(usuario), password: pass });
  if (error) {
    const m = (error.message || '').toLowerCase();
    if (m.includes('not confirmed')) throw new Error('unconfirmed');
    if (m.includes('invalid login') || error.status === 400) throw new Error('bad');
    const e = new Error('net'); e.detail = error.message || String(error.status || ''); throw e;
  }
  const p = await perfil();
  if (!p) { await sb.auth.signOut(); throw new Error('noperfil'); }
  return p;
}
async function logout() {
  if (DEMO) sessionStorage.removeItem('demo-perfil'); else await sb.auth.signOut();
}
/* Guardia de página: devuelve el perfil o redirige. */
async function require(rol) {
  const p = await perfil();
  if (!p) { location.replace('index.html#login'); return null; }
  if (rol && p.rol !== rol) { location.replace(homeFor(p)); return null; }
  return p;
}

/* ---------------- datos ---------------- */
async function loadMeta() {
  if (DEMO) { const d = window.DEMO_DATA; return { inicio: d.inicio, horas: d.horas, dias: d.dias, datos_desde: d.datos_desde, datos_hasta: d.datos_hasta, caidas_sistema: d.caidas_sistema }; }
  const { data, error } = await sb.from('meta').select('datos').eq('id', 1).single();
  if (error) throw error; return data.datos;
}
async function loadHouse(codigo) {
  if (DEMO) { const d = window.DEMO_DATA, h = d.viviendas.find(x => x.codigo === codigo); if (!h) throw new Error('nohouse');
    return Object.assign({}, h, { sensores_det: d.sensores.filter(s => s.vivienda === codigo) }); }
  const { data, error } = await sb.from('vivienda_datos').select('datos').eq('codigo', codigo).single();
  if (error) throw error; return data.datos;
}
async function loadAll() {
  if (DEMO) return JSON.parse(JSON.stringify(window.DEMO_DATA));
  const [meta, r] = await Promise.all([loadMeta(), sb.from('vivienda_datos').select('datos').order('codigo')]);
  if (r.error) throw r.error;
  const out = Object.assign({}, meta, { viviendas: [], sensores: [] });
  r.data.forEach(row => { const h = Object.assign({}, row.datos); out.sensores.push(...(h.sensores_det || [])); delete h.sensores_det; out.viviendas.push(h); });
  return out;
}

window.SNRGY = { DEMO, $, t, addEN, applyStatic, setLang, bindLang, lang: () => LANG,
  perfil, login, logout, require, homeFor, loadMeta, loadHouse, loadAll, DEMO_USERS };
})();

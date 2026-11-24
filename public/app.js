const $ = s => document.querySelector(s);
const ICONS = {
  burger: '<svg viewBox="0 0 100 100"><path d="M12 50c0-24 16-36 38-36s38 12 38 36z" fill="#e8a33a"/><g fill="#fff3d0"><ellipse cx="38" cy="32" rx="3.5" ry="2"/><ellipse cx="52" cy="26" rx="3.5" ry="2"/><ellipse cx="64" cy="34" rx="3.5" ry="2"/></g><path d="M10 54c5-6 10-6 14 0s10 6 14 0 10-6 14 0 10 6 14 0 10-6 14 0v5H10z" fill="#4cad3f"/><rect x="12" y="59" width="76" height="9" rx="4.5" fill="#5a2c17"/><path d="M12 68l12 9 12-9 12 9 12-9 12 9 12-9v-4H12z" fill="#ffd34d"/><path d="M12 76c0 9 11 12 38 12s38-3 38-12z" fill="#e8a33a"/></svg>',
  fries: '<svg viewBox="0 0 100 100"><g fill="#ffc22e" stroke="#d99a12" stroke-width="1.5"><rect x="26" y="14" width="9" height="46" rx="3" transform="rotate(-10 30 40)"/><rect x="38" y="8" width="9" height="52" rx="3"/><rect x="50" y="12" width="9" height="48" rx="3" transform="rotate(6 54 40)"/><rect x="62" y="16" width="9" height="44" rx="3" transform="rotate(14 66 40)"/></g><path d="M20 52h60l-7 40H27z" fill="#e2371f"/><path d="M28 62h44" stroke="#fff3d0" stroke-width="4" stroke-linecap="round"/></svg>',
  rings: '<svg viewBox="0 0 100 100"><g fill="none" stroke="#e8a33a" stroke-width="12"><circle cx="38" cy="40" r="18"/><circle cx="64" cy="58" r="18"/></g><g fill="none" stroke="#c9821f" stroke-width="2"><circle cx="38" cy="40" r="24"/><circle cx="64" cy="58" r="24"/></g></svg>',
  nuggets: '<svg viewBox="0 0 100 100"><g fill="#e8a33a" stroke="#c9821f" stroke-width="2"><path d="M18 46c-4-14 10-24 22-18 10 4 14 16 6 24-8 8-24 8-28-6z"/><path d="M50 62c-2-12 10-20 20-14 10 6 10 20 0 26-10 4-18-2-20-12z"/><path d="M42 74c6-4 16 0 14 10-2 8-14 8-18 2-2-4 0-10 4-12z"/></g></svg>',
  bowl: '<svg viewBox="0 0 100 100"><path d="M14 50h72c0 22-14 34-36 34S14 72 14 50z" fill="#f4efe6" stroke="#cdbfa9" stroke-width="2"/><g fill="#9fd36a"><circle cx="34" cy="44" r="9"/><circle cx="50" cy="38" r="10"/><circle cx="66" cy="44" r="9"/></g><g fill="#ffb347"><circle cx="42" cy="40" r="4"/><circle cx="58" cy="42" r="4"/></g></svg>',
  drink: '<svg viewBox="0 0 100 100"><path d="M30 28h40l-6 62H36z" fill="#e2371f"/><path d="M33 44h34l-1.5 14h-31z" fill="#fff3d0"/><rect x="26" y="20" width="48" height="9" rx="4" fill="#17110e"/><path d="M52 20l8-14" stroke="#17110e" stroke-width="5" stroke-linecap="round"/></svg>',
  shake: '<svg viewBox="0 0 100 100"><circle cx="50" cy="22" r="14" fill="#fff"/><circle cx="50" cy="10" r="5" fill="#e2371f"/><path d="M28 28h44l-7 62H35z" fill="#f7d6e0" opacity=".95"/><path d="M28 28h44l-2 14H30z" fill="#fff"/><path d="M50 4l10-2" stroke="#17110e" stroke-width="3" stroke-linecap="round"/></svg>',
  dessert: '<svg viewBox="0 0 100 100"><rect x="16" y="52" width="68" height="32" rx="6" fill="#5a2c17"/><path d="M16 60c10 5 14-3 24 2s16-4 26 1 12-2 18 0v-11H16z" fill="#3a1a0b"/><circle cx="50" cy="40" r="16" fill="#fff3d0"/><circle cx="50" cy="24" r="5" fill="#e2371f"/></svg>',
  cookie: '<svg viewBox="0 0 100 100"><circle cx="50" cy="54" r="34" fill="#d9a05b"/><g fill="#4a2410"><ellipse cx="38" cy="44" rx="6" ry="4.5"/><ellipse cx="60" cy="40" rx="6" ry="4.5"/><ellipse cx="52" cy="62" rx="6" ry="4.5"/><ellipse cx="34" cy="64" rx="5" ry="4"/><ellipse cx="68" cy="60" rx="5" ry="4"/></g></svg>'
};
const TINTS = { burger: '#ffe0a3', fries: '#ffd9cf', rings: '#fff0c4', nuggets: '#ffe9c4', bowl: '#e7f3d6', drink: '#ffd6d0', shake: '#fde1ea', dessert: '#efe0d4', cookie: '#f6e5c8' };

const fmt = n => (Math.round(n * 100) / 100).toLocaleString('ar-EG') + ' ج';
let menu = [], cart = JSON.parse(localStorage.getItem('sufra-cart') || '{}');
const byId = {};
function fly(from) {
  const a = from.getBoundingClientRect(), b = $('#openCart').getBoundingClientRect();
  const d = document.createElement('div'); d.className = 'fly';
  d.style.left = a.left + a.width / 2 + 'px'; d.style.top = a.top + 'px'; document.body.appendChild(d);
  requestAnimationFrame(() => { d.style.transform = `translate(${b.left + b.width / 2 - a.left - a.width / 2}px, ${b.top - a.top}px) scale(.3)`; d.style.opacity = '.4'; });
  setTimeout(() => { d.remove(); const c = $('#cnt'); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }, 700);
}
let io;
function observe() {
  if (!('IntersectionObserver' in window)) { document.querySelectorAll('.rv').forEach(e => e.classList.add('in')); return; }
  io = io || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  document.querySelectorAll('.rv:not(.in)').forEach(e => io.observe(e));
}
function tilt() {
  document.addEventListener('mousemove', e => {
    const c = e.target.closest && e.target.closest('.item'); if (!c) return;
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    c.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
  });
  document.addEventListener('mouseout', e => { const c = e.target.closest && e.target.closest('.item'); if (c && !c.contains(e.relatedTarget)) c.style.transform = ''; });
}
function countUp() {
  document.querySelectorAll('[data-n]').forEach(el => {
    const n = Number(el.dataset.n); let v = 0; const step = () => { v += Math.max(1, Math.ceil(n / 25)); if (v >= n) v = n; el.textContent = v.toLocaleString('ar-EG'); if (v < n) setTimeout(step, 45); }; setTimeout(step, 600);
  });
}
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); setTimeout(() => e.classList.remove('show'), 1600); }
function save() { localStorage.setItem('sufra-cart', JSON.stringify(cart)); renderCart(); }
async function load() {
  const r = await fetch('/api/menu'); menu = await r.json();
  menu.forEach(c => c.items.forEach(i => byId[i.id] = i));
    $('#tabs').innerHTML = '<button class="tab on" data-c="all">الكل</button>' + menu.map(c => `<button class="tab" data-c="${c.id}">${c.name}</button>`).join('');
  renderMenu('all'); renderCart(); observe();
}
function renderMenu(c) {
  $('#menuBody').innerHTML = menu.filter(x => c === 'all' || String(x.id) === c).map(cat => {
    const items = cat.items.filter(i => i.available);
    if (!items.length) return '';
    return `<div class="catname">${cat.name}</div><div class="grid">` + items.map(i => `
      <div class="item rv"><div class="pic" style="--tint:${TINTS[i.emoji] || '#ffe0a3'}">${ICONS[i.emoji] || ICONS.burger}</div><h3>${i.name}</h3><p>${i.description || ''}</p>
      <div class="row"><span class="price">${fmt(i.price)}</span><button class="add" data-add="${i.id}">أضف +</button></div></div>`).join('') + '</div>';
  }).join('');
}
function renderCart() {
  const ids = Object.keys(cart).filter(id => byId[id] && byId[id].available);
  let total = 0, n = 0;
  $('#cartLines').innerHTML = ids.length ? ids.map(id => {
    const i = byId[id], q = cart[id]; total += i.price * q; n += q;
    return `<div class="line"><div>${i.name}<br><small>${fmt(i.price)}</small></div>
      <div class="qty"><button data-d="-1" data-id="${id}">−</button><b>${q.toLocaleString('ar-EG')}</b><button data-d="1" data-id="${id}">+</button></div></div>`;
  }).join('') : '<p class="sub">السلة فاضية، ضيف أصناف من القائمة.</p>';
  $('#cartTotal').textContent = fmt(total); $('#cnt').textContent = n.toLocaleString('ar-EG');
  $('#form').style.display = ids.length ? 'block' : 'none';
}
document.addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.c) { document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t)); renderMenu(t.dataset.c); }
  if (t.dataset.add) { cart[t.dataset.add] = Math.min(20, (cart[t.dataset.add] || 0) + 1); save(); toast('اتضاف للسلة'); fly(t); }
  if (t.dataset.d) { const id = t.dataset.id; cart[id] = (cart[id] || 0) + Number(t.dataset.d); if (cart[id] <= 0) delete cart[id]; save(); }
  if (t.id === 'openCart') $('#drawer').classList.add('open');
  if (t.id === 'closeCart' || t.id === 'drawer') $('#drawer').classList.remove('open');
});
$('#send').onclick = async () => {
  const items = Object.entries(cart).map(([id, qty]) => ({ id: Number(id), qty }));
  const body = { customer: $('#fName').value, phone: $('#fPhone').value, address: $('#fAddr').value, notes: $('#fNotes').value, items };
  const m = $('#fMsg'); m.className = ''; m.textContent = '';
  const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) { m.className = 'msg err'; m.textContent = j.error; return; }
  cart = {}; save();
  const d = $('#done'); d.className = 'msg ok'; d.innerHTML = `تم استلام طلبك. رقم الطلب: <b dir="ltr">${j.code}</b>، الإجمالي ${fmt(j.total)}. تقدر تتابعه من قسم "تتبع طلبك".`;
  $('#trackCode').value = j.code;
};
async function track() {
  const code = $('#trackCode').value.trim(); const out = $('#trackOut');
  if (!code) return;
  const r = await fetch('/api/orders/' + encodeURIComponent(code)); const j = await r.json();
  if (!r.ok) { out.innerHTML = `<p class="msg err">${j.error}</p>`; return; }
  const labels = { new: 'تم الاستلام', preparing: 'بيتحضر', out: 'في الطريق', delivered: 'اتسلم' };
  const keys = Object.keys(labels), at = keys.indexOf(j.status);
  const steps = j.status === 'cancelled' ? '<p class="msg err">الطلب اتلغى</p>' :
    '<div class="steps">' + keys.map((k, i) => `<div class="step ${i <= at ? 'on' : ''} ${i === at && at < 3 ? 'now' : ''}"><i></i>${labels[k]}</div>`).join('') + '</div>';
  out.innerHTML = `<h3>طلب ${j.code}</h3>${steps}` + j.items.map(i => `<div class="line"><span>${i.name} × ${i.qty.toLocaleString('ar-EG')}</span><span>${fmt(i.price * i.qty)}</span></div>`).join('') + `<div class="total" style="margin-top:8px"><span>الإجمالي</span><span>${fmt(j.total)}</span></div>`;
}
$('#trackBtn').onclick = track; $('#trackCode').addEventListener('keydown', e => e.key === 'Enter' && track());
tilt(); countUp(); observe();
load();

const $ = s => document.querySelector(s);
const fmt = n => (Math.round(n * 100) / 100).toLocaleString('ar-EG') + ' ج';
let menu = [], cart = JSON.parse(localStorage.getItem('sufra-cart') || '{}');
const byId = {};
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); setTimeout(() => e.classList.remove('show'), 1600); }
function save() { localStorage.setItem('sufra-cart', JSON.stringify(cart)); renderCart(); }
async function load() {
  const r = await fetch('/api/menu'); menu = await r.json();
  menu.forEach(c => c.items.forEach(i => byId[i.id] = i));
  $('#sCats').textContent = menu.length.toLocaleString('ar-EG');
  $('#sItems').textContent = menu.reduce((s, c) => s + c.items.filter(i => i.available).length, 0).toLocaleString('ar-EG');
  $('#tabs').innerHTML = '<button class="tab on" data-c="all">الكل</button>' + menu.map(c => `<button class="tab" data-c="${c.id}">${c.name}</button>`).join('');
  renderMenu('all'); renderCart();
}
function renderMenu(c) {
  $('#menuBody').innerHTML = menu.filter(x => c === 'all' || String(x.id) === c).map(cat => {
    const items = cat.items.filter(i => i.available);
    if (!items.length) return '';
    return `<div class="catname">${cat.name}</div><div class="grid">` + items.map(i => `
      <div class="item"><div class="em">${i.emoji || '🍽️'}</div><h3>${i.name}</h3><p>${i.description || ''}</p>
      <div class="row"><span class="price">${fmt(i.price)}</span><button class="add" data-add="${i.id}">أضف +</button></div></div>`).join('') + '</div>';
  }).join('');
}
function renderCart() {
  const ids = Object.keys(cart).filter(id => byId[id] && byId[id].available);
  let total = 0, n = 0;
  $('#cartLines').innerHTML = ids.length ? ids.map(id => {
    const i = byId[id], q = cart[id]; total += i.price * q; n += q;
    return `<div class="line"><div>${i.emoji || ''} ${i.name}<br><small>${fmt(i.price)}</small></div>
      <div class="qty"><button data-d="-1" data-id="${id}">−</button><b>${q.toLocaleString('ar-EG')}</b><button data-d="1" data-id="${id}">+</button></div></div>`;
  }).join('') : '<p class="sub">السلة فاضية، ضيف أصناف من القائمة.</p>';
  $('#cartTotal').textContent = fmt(total); $('#cnt').textContent = n.toLocaleString('ar-EG');
  $('#form').style.display = ids.length ? 'block' : 'none';
}
document.addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.c) { document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t)); renderMenu(t.dataset.c); }
  if (t.dataset.add) { cart[t.dataset.add] = Math.min(20, (cart[t.dataset.add] || 0) + 1); save(); toast('اتضاف للسلة'); }
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
  m.className = 'msg ok'; m.textContent = `تم استلام طلبك. رقم الطلب: ${j.code}، الإجمالي ${fmt(j.total)}.`;
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
    '<div class="steps">' + keys.map((k, i) => `<div class="step ${i <= at ? 'on' : ''}"><i></i>${labels[k]}</div>`).join('') + '</div>';
  out.innerHTML = `<h3>طلب ${j.code}</h3>${steps}` + j.items.map(i => `<div class="line"><span>${i.name} × ${i.qty.toLocaleString('ar-EG')}</span><span>${fmt(i.price * i.qty)}</span></div>`).join('') + `<div class="total" style="margin-top:8px"><span>الإجمالي</span><span>${fmt(j.total)}</span></div>`;
}
$('#trackBtn').onclick = track; $('#trackCode').addEventListener('keydown', e => e.key === 'Enter' && track());
load();

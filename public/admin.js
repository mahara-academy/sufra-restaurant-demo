const $ = s => document.querySelector(s);
const fmt = n => (Math.round(n * 100) / 100).toLocaleString('ar-EG') + ' ج';
const labels = { new: 'جديد', preparing: 'بيتحضر', out: 'في الطريق', delivered: 'اتسلم', cancelled: 'ملغي' };
let token = sessionStorage.getItem('sufra-admin') || '';
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); setTimeout(() => e.classList.remove('show'), 1500); }
async function api(path, opt = {}) {
  const r = await fetch(path, { ...opt, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token } });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401) { token = ''; sessionStorage.removeItem('sufra-admin'); show(); throw new Error('auth'); }
  return { ok: r.ok, j };
}
function show() { $('#login').style.display = token ? 'none' : 'block'; $('#app').style.display = token ? 'block' : 'none'; if (token) refresh(); }
$('#go').onclick = async () => {
  const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('#pw').value }) });
  const j = await r.json();
  if (!r.ok) { $('#lmsg').className = 'msg err'; $('#lmsg').textContent = j.error; return; }
  token = j.token; sessionStorage.setItem('sufra-admin', token); show();
};
async function refresh() {
  const [st, od, mn] = await Promise.all([api('/api/admin/stats'), api('/api/admin/orders'), fetch('/api/menu').then(r => r.json())]);
  $('#stO').textContent = st.j.orders.toLocaleString('ar-EG'); $('#stP').textContent = st.j.pending.toLocaleString('ar-EG'); $('#stS').textContent = fmt(st.j.sales);
  $('#orders').innerHTML = od.j.map(o => `<tr><td dir="ltr">${o.code}</td><td>${esc(o.customer)}<br><small dir="ltr">${esc(o.phone)}</small><br><small>${esc(o.address)}</small></td>
    <td>${o.items.map(i => esc(i.name) + ' × ' + i.qty).join('<br>')}${o.notes ? '<br><small>ملاحظة: ' + esc(o.notes) + '</small>' : ''}</td><td>${fmt(o.total)}</td>
    <td><span class="pill ${o.status}">${labels[o.status]}</span><br><select data-code="${o.code}">${Object.keys(labels).map(k => `<option value="${k}" ${k === o.status ? 'selected' : ''}>${labels[k]}</option>`).join('')}</select></td></tr>`).join('');
  $('#items').innerHTML = mn.flatMap(c => c.items).map(i => `<tr><td>${i.emoji || ''} ${esc(i.name)}</td><td><input type="number" value="${i.price}" data-price="${i.id}" style="width:90px;margin:0" dir="ltr"></td>
    <td><input type="checkbox" data-av="${i.id}" ${i.available ? 'checked' : ''} style="width:auto;margin:0"></td></tr>`).join('');
  $('#nCat').innerHTML = mn.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.dataset.code) { await api('/api/admin/orders/' + t.dataset.code, { method: 'PATCH', body: JSON.stringify({ status: t.value }) }); toast('اتحدثت الحالة'); refresh(); }
  if (t.dataset.price) { const r = await api('/api/admin/items/' + t.dataset.price, { method: 'PATCH', body: JSON.stringify({ price: t.value }) }); toast(r.ok ? 'اتحدث السعر' : r.j.error); }
  if (t.dataset.av) { await api('/api/admin/items/' + t.dataset.av, { method: 'PATCH', body: JSON.stringify({ available: t.checked }) }); toast('اتحدث'); }
});
$('#addItem').onclick = async () => {
  const r = await api('/api/admin/items', { method: 'POST', body: JSON.stringify({ category_id: Number($('#nCat').value), name: $('#nName').value, price: $('#nPrice').value, description: $('#nDesc').value, emoji: $('#nEm').value }) });
  $('#amsg').className = 'msg ' + (r.ok ? 'ok' : 'err'); $('#amsg').textContent = r.ok ? 'اتضاف الصنف' : r.j.error;
  if (r.ok) { ['nName', 'nPrice', 'nDesc', 'nEm'].forEach(i => $('#' + i).value = ''); refresh(); }
};
show();

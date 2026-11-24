const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const path = require('path');

const db = new DatabaseSync(process.env.DB_PATH || path.join(__dirname, 'sufra.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
db.exec(`
CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY, name TEXT NOT NULL, sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY, category_id INTEGER NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL, description TEXT, price REAL NOT NULL, emoji TEXT, available INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY, code TEXT UNIQUE NOT NULL, customer TEXT NOT NULL, phone TEXT NOT NULL,
  address TEXT NOT NULL, notes TEXT, total REAL NOT NULL, status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id),
  item_id INTEGER, name TEXT NOT NULL, price REAL NOT NULL, qty INTEGER NOT NULL);
`);

function seed() {
  if (db.prepare('SELECT COUNT(*) c FROM categories').get().c) return;
  const cats = ['برجر', 'سايدز', 'مشروبات', 'حلويات'];
  const ic = db.prepare('INSERT INTO categories (name, sort) VALUES (?, ?)');
  cats.forEach((c, i) => ic.run(c, i));
  const items = [
    [1, 'كلاسيك بيف', 'قطعة بيف مشوية، خس، طماطم، مخلل وصوص البيت', 95, 'b1'],
    [1, 'تشيز برجر', 'بيف، جبنة شيدر ذايبة وبصل مكرمل', 110, 'b3'],
    [1, 'دبل ستاك', 'قطعتين بيف وجبنة مضاعفة وصوص خاص', 150, 'hero'],
    [1, 'سموكي باربيكيو', 'بيف، بيكون بقري، حلقة بصل وصوص باربيكيو', 135, 'b2'],
    [1, 'كرسبي تشيكن', 'دجاج مقرمش، خس ومايونيز', 100, 'b4'],
    [1, 'هالبينو حار', 'بيف، هالبينو، جبنة وصوص حار', 120, 'b5'],
    [2, 'بطاطس مقرمشة', 'بطاطس ذهبية بالملح', 35, 'fries'],
    [2, 'حلقات بصل', 'حلقات بصل مقرمشة مع صوص', 40, 'rings'],
    [2, 'ناجتس دجاج', 'ست قطع مع صوص الغموس', 55, 'nuggets'],
    [2, 'كرسبي ناجتس', 'ثلاث قطع دجاج مقرمشة', 45, 'tenders'],
    [3, 'كولا', 'كوباية كبيرة بالتلج والليمون', 25, 'cola'],
    [3, 'ميلك شيك فانيليا', 'آيس كريم فانيليا وحليب', 55, 'shake2'],
    [3, 'ميلك شيك شوكولاتة', 'شوكولاتة غنية وكريمة', 60, 'shake1'],
    [4, 'براوني بالآيس كريم', 'براوني دافي وسكوب فانيليا', 65, 'brownie'],
    [4, 'كوكيز ساخنة', 'كوكيز برقائق الشوكولاتة', 35, 'cookie']
  ];
  const ii = db.prepare('INSERT INTO items (category_id,name,description,price,emoji) VALUES (?,?,?,?,?)');
  items.forEach(i => ii.run(...i));
  const io = db.prepare('INSERT INTO orders (code,customer,phone,address,notes,total,status) VALUES (?,?,?,?,?,?,?)');
  const oi = db.prepare('INSERT INTO order_items (order_id,item_id,name,price,qty) VALUES (?,?,?,?,?)');
  const demo = [
    ['BS-1001', 'أحمد سمير', '01000000001', 'شارع الجمهورية، المنصورة', '', [[2, 1], [7, 1], [11, 2]], 'delivered'],
    ['BS-1002', 'منى حسن', '01000000002', 'حي الجامعة، المنصورة', 'من غير مخلل', [[4, 2], [13, 1]], 'preparing'],
    ['BS-1003', 'يوسف علي', '01000000003', 'طلخا، الدقهلية', '', [[3, 1], [9, 1], [14, 1]], 'new']
  ];
  const get = db.prepare('SELECT id,name,price FROM items WHERE id=?');
  demo.forEach(d => {
    const lines = d[5].map(([id, q]) => ({ ...get.get(id), qty: q }));
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const r = io.run(d[0], d[1], d[2], d[3], d[4], total, d[6]);
    lines.forEach(l => oi.run(Number(r.lastInsertRowid), l.id, l.name, l.price, l.qty));
  });
}
seed();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const tokens = new Set();
const STATUSES = ['new', 'preparing', 'out', 'delivered', 'cancelled'];

const app = express();
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/menu', (req, res) => {
  const cats = db.prepare('SELECT * FROM categories ORDER BY sort').all();
  const items = db.prepare('SELECT * FROM items ORDER BY id').all();
  res.json(cats.map(c => ({ ...c, items: items.filter(i => i.category_id === c.id) })));
});

app.post('/api/orders', (req, res) => {
  const { customer, phone, address, notes, items } = req.body || {};
  const clean = s => String(s || '').trim();
  if (!clean(customer) || !clean(phone) || !clean(address)) return res.status(400).json({ error: 'الاسم ورقم الموبايل والعنوان مطلوبين' });
  if (!/^[0-9+\s-]{8,15}$/.test(clean(phone))) return res.status(400).json({ error: 'رقم الموبايل غير صحيح' });
  if (!Array.isArray(items) || !items.length || items.length > 40) return res.status(400).json({ error: 'السلة فاضية' });
  const get = db.prepare('SELECT * FROM items WHERE id=? AND available=1');
  const lines = [];
  for (const it of items) {
    const row = get.get(Number(it.id));
    const qty = Math.floor(Number(it.qty));
    if (!row || !(qty >= 1 && qty <= 20)) return res.status(400).json({ error: 'في صنف غير متاح في الطلب' });
    lines.push({ ...row, qty });
  }
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const code = 'BS-' + (1000 + db.prepare('SELECT COUNT(*) c FROM orders').get().c + 1) + crypto.randomInt(10, 99);
  db.exec('BEGIN');
  try {
    const r = db.prepare('INSERT INTO orders (code,customer,phone,address,notes,total) VALUES (?,?,?,?,?,?)')
      .run(code, clean(customer).slice(0, 80), clean(phone), clean(address).slice(0, 200), clean(notes).slice(0, 200), total);
    const ins = db.prepare('INSERT INTO order_items (order_id,item_id,name,price,qty) VALUES (?,?,?,?,?)');
    lines.forEach(l => ins.run(Number(r.lastInsertRowid), l.id, l.name, l.price, l.qty));
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); return res.status(500).json({ error: 'حصل خطأ، حاول تاني' }); }
  res.status(201).json({ code, total });
});

function orderView(o) {
  const items = db.prepare('SELECT name,price,qty FROM order_items WHERE order_id=?').all(o.id);
  return { code: o.code, customer: o.customer, phone: o.phone, address: o.address, notes: o.notes, total: o.total, status: o.status, created_at: o.created_at, items };
}

app.get('/api/orders/:code', (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE code=?').get(String(req.params.code).toUpperCase());
  if (!o) return res.status(404).json({ error: 'مفيش طلب بالرقم ده' });
  const v = orderView(o); delete v.phone; delete v.address; delete v.customer;
  res.json(v);
});

app.post('/api/admin/login', (req, res) => {
  if (!req.body || req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'كلمة السر غلط' });
  const t = crypto.randomBytes(24).toString('hex'); tokens.add(t); res.json({ token: t });
});
function auth(req, res, next) {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  if (!tokens.has(t)) return res.status(401).json({ error: 'لازم تسجل دخول' });
  next();
}
app.get('/api/admin/orders', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 100').all().map(orderView));
});
app.patch('/api/admin/orders/:code', auth, (req, res) => {
  const s = req.body && req.body.status;
  if (!STATUSES.includes(s)) return res.status(400).json({ error: 'حالة غير صحيحة' });
  const r = db.prepare('UPDATE orders SET status=? WHERE code=?').run(s, req.params.code);
  if (!r.changes) return res.status(404).json({ error: 'الطلب مش موجود' });
  res.json({ ok: true });
});
app.get('/api/admin/stats', auth, (req, res) => {
  const o = db.prepare("SELECT COUNT(*) n, COALESCE(SUM(CASE WHEN status!='cancelled' THEN total END),0) sales FROM orders").get();
  const pending = db.prepare("SELECT COUNT(*) n FROM orders WHERE status IN ('new','preparing','out')").get().n;
  res.json({ orders: o.n, sales: o.sales, pending });
});
app.patch('/api/admin/items/:id', auth, (req, res) => {
  const { price, available } = req.body || {};
  const row = db.prepare('SELECT * FROM items WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'الصنف مش موجود' });
  const p = price === undefined ? row.price : Number(price);
  if (!(p > 0 && p < 10000)) return res.status(400).json({ error: 'سعر غير صحيح' });
  db.prepare('UPDATE items SET price=?, available=? WHERE id=?').run(p, available === undefined ? row.available : (available ? 1 : 0), row.id);
  res.json({ ok: true });
});
app.post('/api/admin/items', auth, (req, res) => {
  const { category_id, name, description, price, emoji } = req.body || {};
  if (!String(name || '').trim() || !(Number(price) > 0) || !db.prepare('SELECT 1 FROM categories WHERE id=?').get(category_id)) return res.status(400).json({ error: 'بيانات الصنف ناقصة' });
  const icon = { 1: 'b1', 2: 'fries', 3: 'cola', 4: 'cookie' }[Number(category_id)] || 'b1';
  const r = db.prepare('INSERT INTO items (category_id,name,description,price,emoji) VALUES (?,?,?,?,?)')
    .run(category_id, String(name).trim().slice(0, 80), String(description || '').slice(0, 200), Number(price), icon);
  res.status(201).json({ id: Number(r.lastInsertRowid) });
});
app.delete('/api/admin/items/:id', auth, (req, res) => {
  db.prepare('UPDATE items SET available=0 WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Burger Station demo on ' + port));

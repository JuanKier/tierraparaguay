import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function localDateString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

await db.batch([
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT, nombre_completo TEXT, username TEXT UNIQUE,
    password TEXT, vehiculo_id INTEGER, chapa TEXT,
    telefono TEXT, role TEXT DEFAULT 'user', active INTEGER DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS empresas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT, direccion TEXT, ruc TEXT, telefono TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS vehiculos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT, marca TEXT, modelo TEXT, color TEXT, chapa TEXT, conductor_id INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS mercaderias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT UNIQUE
  )`,
  `CREATE TABLE IF NOT EXISTS boletas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT, fecha TEXT, conductor_id INTEGER, conductor_nombre TEXT,
    chapa TEXT, vehiculo_label TEXT, empresa_id INTEGER, empresa_nombre TEXT,
    direccion_entrega TEXT, telefono_empresa TEXT, factura_numero TEXT,
    observacion TEXT, total_m3 REAL DEFAULT 0, resumen_total TEXT,
    servicios TEXT DEFAULT '[]', created_at TEXT, updated_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY, value TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, username TEXT, action TEXT, entity_type TEXT,
    entity_id INTEGER, details TEXT, created_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS ubicaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conductor_id INTEGER, conductor_nombre TEXT, lat REAL, lng REAL,
    updated_at TEXT
  )`,
]);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const sseClients = [];

function broadcast(event, data = {}) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(c => c.write(msg));
}

// ---- ACTIVITY LOG HELPER ----
async function logActivity(username, action, entity_type, entity_id = null, details = {}) {
  try {
    const now = new Date().toISOString();
    await db.run(
      'INSERT INTO activity_logs (user_id, username, action, entity_type, entity_id, details, created_at) VALUES (?,?,?,?,?,?,?)',
      [null, username || '', action, entity_type, entity_id || null, JSON.stringify(details), now]
    );
  } catch (e) {
    console.error('[ACTIVITY] Log failed:', e.message);
  }
}

function getUsername(req) {
  return req.headers['x-username'] || req.body?._username || '';
}

// ---- USERS ----
app.get('/api/users', async (req, res) => {
  const users = await db.all('SELECT * FROM users');
  res.json(users.map(u => ({ ...u, active: !!u.active })));
});

app.get('/api/users/:username', async (req, res) => {
  const user = await db.get('SELECT * FROM users WHERE username = ?', [req.params.username]);
  user ? res.json({ ...user, active: !!user.active }) : res.status(404).json(null);
});

app.post('/api/users', async (req, res) => {
  const r = await db.run('INSERT INTO users (nombre, nombre_completo, username, password, vehiculo_id, chapa, telefono, role, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.body.nombre, req.body.nombre_completo, req.body.username, req.body.password, req.body.vehiculo_id || null, req.body.chapa || '', req.body.telefono || '', req.body.role || 'user', req.body.active !== false ? 1 : 0]);
  if (req.body.vehiculo_id) {
    await db.run('UPDATE vehiculos SET conductor_id=? WHERE id=?', [r.lastInsertRowid, req.body.vehiculo_id]);
  }
  broadcast('data_changed', { store: 'users' });
  broadcast('data_changed', { store: 'vehiculos' });
  await logActivity(getUsername(req), 'create', 'user', r.lastInsertRowid, { nombre: req.body.nombre, username: req.body.username });
  res.json({ ...req.body, id: r.lastInsertRowid });
});

app.put('/api/users/:id', async (req, res) => {
  const oldUser = await db.get('SELECT * FROM users WHERE id=?', [req.params.id]);
  if (oldUser && oldUser.vehiculo_id && Number(oldUser.vehiculo_id) !== Number(req.body.vehiculo_id)) {
    await db.run('UPDATE vehiculos SET conductor_id=NULL WHERE id=?', [oldUser.vehiculo_id]);
  }
  await db.run('UPDATE users SET nombre=?, nombre_completo=?, username=?, password=?, vehiculo_id=?, chapa=?, telefono=?, role=?, active=? WHERE id=?', [req.body.nombre, req.body.nombre_completo, req.body.username, req.body.password, req.body.vehiculo_id || null, req.body.chapa || '', req.body.telefono || '', req.body.role || 'user', req.body.active !== false ? 1 : 0, req.params.id]);
  if (req.body.vehiculo_id) {
    await db.run('UPDATE vehiculos SET conductor_id=? WHERE id=?', [req.params.id, req.body.vehiculo_id]);
  }
  broadcast('data_changed', { store: 'users' });
  broadcast('data_changed', { store: 'vehiculos' });
  await logActivity(getUsername(req), 'update', 'user', req.params.id, { nombre: req.body.nombre, username: req.body.username });
  res.json({ success: true });
});

app.delete('/api/users/:id', async (req, res) => {
  const oldUser = await db.get('SELECT * FROM users WHERE id=?', [req.params.id]);
  await db.run('DELETE FROM users WHERE id=?', [req.params.id]);
  if (oldUser && oldUser.vehiculo_id) {
    await db.run('UPDATE vehiculos SET conductor_id=NULL WHERE id=?', [oldUser.vehiculo_id]);
  }
  broadcast('data_changed', { store: 'users' });
  broadcast('data_changed', { store: 'vehiculos' });
  await logActivity(getUsername(req), 'delete', 'user', req.params.id, { nombre: oldUser?.nombre, username: oldUser?.username });
  res.json({ success: true });
});

// ---- EMPRESAS ----
app.get('/api/empresas', async (req, res) => res.json(await db.all('SELECT * FROM empresas')));

app.get('/api/empresas/:id', async (req, res) => {
  const e = await db.get('SELECT * FROM empresas WHERE id=?', [req.params.id]);
  e ? res.json(e) : res.status(404).json(null);
});

app.post('/api/empresas', async (req, res) => {
  const r = await db.run('INSERT INTO empresas (nombre, direccion, ruc, telefono) VALUES (?,?,?,?)', [req.body.nombre, req.body.direccion, req.body.ruc || '', req.body.telefono || '']);
  broadcast('data_changed', { store: 'empresas' });
  await logActivity(getUsername(req), 'create', 'empresa', r.lastInsertRowid, { nombre: req.body.nombre });
  res.json({ ...req.body, id: r.lastInsertRowid });
});

app.put('/api/empresas/:id', async (req, res) => {
  await db.run('UPDATE empresas SET nombre=?, direccion=?, ruc=?, telefono=? WHERE id=?', [req.body.nombre, req.body.direccion, req.body.ruc || '', req.body.telefono || '', req.params.id]);
  broadcast('data_changed', { store: 'empresas' });
  await logActivity(getUsername(req), 'update', 'empresa', req.params.id, { nombre: req.body.nombre });
  res.json({ success: true });
});

app.delete('/api/empresas/:id', async (req, res) => {
  await db.run('DELETE FROM empresas WHERE id=?', [req.params.id]);
  broadcast('data_changed', { store: 'empresas' });
  await logActivity(getUsername(req), 'delete', 'empresa', req.params.id);
  res.json({ success: true });
});

// ---- VEHICULOS ----
app.get('/api/vehiculos', async (req, res) => res.json(await db.all('SELECT * FROM vehiculos')));

app.get('/api/vehiculos/:id', async (req, res) => {
  const v = await db.get('SELECT * FROM vehiculos WHERE id=?', [req.params.id]);
  v ? res.json(v) : res.status(404).json(null);
});

app.post('/api/vehiculos', async (req, res) => {
  const r = await db.run('INSERT INTO vehiculos (tipo, marca, modelo, color, chapa, conductor_id) VALUES (?,?,?,?,?,?)', [req.body.tipo, req.body.marca, req.body.modelo, req.body.color, req.body.chapa, req.body.conductor_id || null]);
  if (req.body.conductor_id) {
    await db.run('UPDATE users SET vehiculo_id=? WHERE id=?', [r.lastInsertRowid, req.body.conductor_id]);
  }
  broadcast('data_changed', { store: 'vehiculos' });
  broadcast('data_changed', { store: 'users' });
  await logActivity(getUsername(req), 'create', 'vehiculo', r.lastInsertRowid, { chapa: req.body.chapa, tipo: req.body.tipo });
  res.json({ ...req.body, id: r.lastInsertRowid });
});

app.put('/api/vehiculos/:id', async (req, res) => {
  const oldVeh = await db.get('SELECT * FROM vehiculos WHERE id=?', [req.params.id]);
  if (oldVeh && oldVeh.conductor_id && Number(oldVeh.conductor_id) !== Number(req.body.conductor_id)) {
    await db.run('UPDATE users SET vehiculo_id=NULL WHERE id=?', [oldVeh.conductor_id]);
  }
  await db.run('UPDATE vehiculos SET tipo=?, marca=?, modelo=?, color=?, chapa=?, conductor_id=? WHERE id=?', [req.body.tipo, req.body.marca, req.body.modelo, req.body.color, req.body.chapa, req.body.conductor_id || null, req.params.id]);
  if (req.body.conductor_id) {
    await db.run('UPDATE users SET vehiculo_id=? WHERE id=?', [req.params.id, req.body.conductor_id]);
  }
  broadcast('data_changed', { store: 'vehiculos' });
  broadcast('data_changed', { store: 'users' });
  await logActivity(getUsername(req), 'update', 'vehiculo', req.params.id, { chapa: req.body.chapa, tipo: req.body.tipo });
  res.json({ success: true });
});

app.delete('/api/vehiculos/:id', async (req, res) => {
  const oldVeh = await db.get('SELECT * FROM vehiculos WHERE id=?', [req.params.id]);
  await db.run('DELETE FROM vehiculos WHERE id=?', [req.params.id]);
  if (oldVeh && oldVeh.conductor_id) {
    await db.run('UPDATE users SET vehiculo_id=NULL WHERE id=?', [oldVeh.conductor_id]);
  }
  broadcast('data_changed', { store: 'vehiculos' });
  broadcast('data_changed', { store: 'users' });
  await logActivity(getUsername(req), 'delete', 'vehiculo', req.params.id, { chapa: oldVeh?.chapa, tipo: oldVeh?.tipo });
  res.json({ success: true });
});

// ---- MERCADERIAS ----
app.get('/api/mercaderias', async (req, res) => res.json(await db.all('SELECT * FROM mercaderias')));

app.post('/api/mercaderias', async (req, res) => {
  const r = await db.run('INSERT OR IGNORE INTO mercaderias (nombre) VALUES (?)', [req.body.nombre]);
  broadcast('data_changed', { store: 'mercaderias' });
  await logActivity(getUsername(req), 'create', 'mercaderia', r.lastInsertRowid, { nombre: req.body.nombre });
  res.json({ ...req.body, id: r.lastInsertRowid });
});

app.put('/api/mercaderias/:id', async (req, res) => {
  await db.run('UPDATE mercaderias SET nombre=? WHERE id=?', [req.body.nombre, req.params.id]);
  broadcast('data_changed', { store: 'mercaderias' });
  await logActivity(getUsername(req), 'update', 'mercaderia', req.params.id, { nombre: req.body.nombre });
  res.json({ success: true });
});

app.delete('/api/mercaderias/:id', async (req, res) => {
  await db.run('DELETE FROM mercaderias WHERE id=?', [req.params.id]);
  broadcast('data_changed', { store: 'mercaderias' });
  await logActivity(getUsername(req), 'delete', 'mercaderia', req.params.id);
  res.json({ success: true });
});

// ---- BOLETAS ----
app.get('/api/boletas', async (req, res) => {
  const boletas = await db.all('SELECT * FROM boletas ORDER BY created_at DESC');
  res.json(boletas.map(b => ({ ...b, servicios: JSON.parse(b.servicios || '[]'), total_m3: Number(b.total_m3) })));
});

app.get('/api/boletas/:id', async (req, res) => {
  const b = await db.get('SELECT * FROM boletas WHERE id=?', [req.params.id]);
  if (!b) return res.status(404).json(null);
  res.json({ ...b, servicios: JSON.parse(b.servicios || '[]'), total_m3: Number(b.total_m3) });
});

app.post('/api/boletas', async (req, res) => {
  const now = new Date().toISOString();
  const fecha = req.body.fecha || localDateString();
  const counter = await db.get("SELECT value FROM config WHERE key='boleta_counter'", []);
  const num = (parseInt(counter?.value || '0') + 1);
  await db.run("INSERT INTO config (key, value) VALUES ('boleta_counter', ?) ON CONFLICT(key) DO UPDATE SET value=?", [String(num), String(num)]);
  const r = await db.run(`INSERT INTO boletas (numero, fecha, conductor_id, conductor_nombre, chapa, vehiculo_label, empresa_id, empresa_nombre, direccion_entrega, telefono_empresa, factura_numero, observacion, total_m3, resumen_total, servicios, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [String(num).padStart(3, '0'), fecha, req.body.conductor_id, req.body.conductor_nombre, req.body.chapa || '', req.body.vehiculo_label || '', req.body.empresa_id, req.body.empresa_nombre, req.body.direccion_entrega, req.body.telefono_empresa || '', req.body.factura_numero || '', req.body.observacion || '', req.body.total_m3 || 0, req.body.resumen_total || '', JSON.stringify(req.body.servicios || []), now, now]);
  broadcast('data_changed', { store: 'boletas' });
  await logActivity(getUsername(req), 'create', 'boleta', r.lastInsertRowid, { numero: String(num).padStart(3, '0'), empresa: req.body.empresa_nombre, conductor: req.body.conductor_nombre });
  res.json({ ...req.body, id: r.lastInsertRowid, numero: String(num).padStart(3, '0'), created_at: now, updated_at: now, servicios: req.body.servicios || [] });
});

app.put('/api/boletas/:id', async (req, res) => {
  const now = new Date().toISOString();
  await db.run('UPDATE boletas SET fecha=?, conductor_id=?, conductor_nombre=?, chapa=?, vehiculo_label=?, empresa_id=?, empresa_nombre=?, direccion_entrega=?, telefono_empresa=?, factura_numero=?, observacion=?, total_m3=?, resumen_total=?, servicios=?, updated_at=? WHERE id=?', [req.body.fecha, req.body.conductor_id, req.body.conductor_nombre, req.body.chapa || '', req.body.vehiculo_label || '', req.body.empresa_id, req.body.empresa_nombre, req.body.direccion_entrega, req.body.telefono_empresa || '', req.body.factura_numero || '', req.body.observacion || '', req.body.total_m3 || 0, req.body.resumen_total || '', JSON.stringify(req.body.servicios || []), now, req.params.id]);
  broadcast('data_changed', { store: 'boletas' });
  await logActivity(getUsername(req), 'update', 'boleta', req.params.id, { empresa: req.body.empresa_nombre, conductor: req.body.conductor_nombre });
  res.json({ success: true });
});

app.delete('/api/boletas/:id', async (req, res) => {
  const old = await db.get('SELECT numero, empresa_nombre FROM boletas WHERE id=?', [req.params.id]);
  await db.run('DELETE FROM boletas WHERE id=?', [req.params.id]);
  broadcast('data_changed', { store: 'boletas' });
  await logActivity(getUsername(req), 'delete', 'boleta', req.params.id, { numero: old?.numero, empresa: old?.empresa_nombre });
  res.json({ success: true });
});

// ---- CONFIG ----
app.get('/api/config', async (req, res) => {
  const rows = await db.all('SELECT * FROM config');
  const obj = {};
  rows.forEach(r => obj[r.key] = r.value);
  res.json(obj);
});

app.post('/api/config', async (req, res) => {
  for (const [k, v] of Object.entries(req.body)) {
    if (k === '_username') continue;
    await db.run("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)", [k, String(v)]);
  }
  broadcast('data_changed', { store: 'config' });
  await logActivity(getUsername(req), 'update', 'config', null, { keys: Object.keys(req.body).filter(k => k !== '_username') });
  res.json({ success: true });
});

// ---- ACTIVITY LOGS ----
app.post('/api/activity', async (req, res) => {
  const now = new Date().toISOString();
  await db.run('INSERT INTO activity_logs (user_id, username, action, entity_type, entity_id, details, created_at) VALUES (?,?,?,?,?,?,?)', [req.body.user_id || null, req.body.username || '', req.body.action, req.body.entity_type, req.body.entity_id || null, JSON.stringify(req.body.details || {}), now]);
  broadcast('data_changed', { store: 'activity' });
  res.json({ success: true });
});

app.get('/api/activity', async (req, res) => {
  const logs = await db.all('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 200');
  res.json(logs.map(l => ({ ...l, details: JSON.parse(l.details || '{}') })));
});

app.post('/api/import', async (req, res) => {
  const data = req.body;
  await db.batch(['DELETE FROM boletas', 'DELETE FROM empresas', 'DELETE FROM vehiculos', 'DELETE FROM mercaderias', 'DELETE FROM users', 'DELETE FROM config']);
  if (data.users) { for (const u of data.users) await db.run('INSERT INTO users (id,nombre,nombre_completo,username,password,vehiculo_id,chapa,telefono,role,active) VALUES (?,?,?,?,?,?,?,?,?,?)', [u.id, u.nombre, u.nombre_completo, u.username, u.password, u.vehiculo_id, u.chapa || '', u.telefono || '', u.role || 'user', u.active !== false ? 1 : 0]); }
  if (data.empresas) { for (const e of data.empresas) await db.run('INSERT INTO empresas (id,nombre,direccion,ruc,telefono) VALUES (?,?,?,?,?)', [e.id, e.nombre, e.direccion, e.ruc || '', e.telefono || '']); }
  if (data.vehiculos) { for (const v of data.vehiculos) await db.run('INSERT INTO vehiculos (id,tipo,marca,modelo,color,chapa,conductor_id) VALUES (?,?,?,?,?,?,?)', [v.id, v.tipo, v.marca, v.modelo, v.color, v.chapa, v.conductor_id]); }
  if (data.mercaderias) { for (const m of data.mercaderias) await db.run('INSERT INTO mercaderias (id,nombre) VALUES (?,?)', [m.id, m.nombre]); }
  if (data.boletas) { for (const b of data.boletas) await db.run('INSERT INTO boletas (id,numero,fecha,conductor_id,conductor_nombre,chapa,vehiculo_label,empresa_id,empresa_nombre,direccion_entrega,telefono_empresa,factura_numero,observacion,total_m3,resumen_total,servicios,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [b.id, b.numero, b.fecha, b.conductor_id, b.conductor_nombre, b.chapa || '', b.vehiculo_label || '', b.empresa_id, b.empresa_nombre, b.direccion_entrega, b.telefono_empresa || '', b.factura_numero || '', b.observacion || '', b.total_m3 || 0, b.resumen_total || '', JSON.stringify(b.servicios || []), b.created_at, b.updated_at]); }
  if (data.config) { for (const [k, v] of Object.entries(data.config)) await db.run('INSERT OR REPLACE INTO config (key,value) VALUES (?,?)', [k, String(v)]); }
  broadcast('data_changed', { store: 'all' });
  await logActivity(getUsername(req), 'import', 'all', null, { boletas: data.boletas?.length || 0, users: data.users?.length || 0 });
  res.json({ success: true });
});

// ---- EXPORT ----
app.get('/api/export', async (req, res) => {
  const rows = await db.all('SELECT * FROM config');
  res.json({
    users: (await db.all('SELECT * FROM users')).map(u => ({ ...u, active: !!u.active })),
    empresas: await db.all('SELECT * FROM empresas'),
    vehiculos: await db.all('SELECT * FROM vehiculos'),
    mercaderias: await db.all('SELECT * FROM mercaderias'),
    boletas: (await db.all('SELECT * FROM boletas')).map(b => ({ ...b, servicios: JSON.parse(b.servicios || '[]'), total_m3: Number(b.total_m3) })),
    config: rows.reduce((o, r) => { o[r.key] = r.value; return o; }, {})
  });
});

// ---- AUDITORIA DE FECHAS (diaria a las 00:00 Paraguay) ----
async function auditFechas() {
  const today = localDateString();
  const boletas = await db.all('SELECT id, numero, fecha, servicios, created_at FROM boletas');
  let fixes = [];
  let issues = [];

  for (const b of boletas) {
    const createdPY = localDateString(new Date(b.created_at));
    
    if (b.fecha !== createdPY) {
      const diff = (new Date(b.fecha) - new Date(createdPY)) / 86400000;
      if (diff === 1) {
        await db.run('UPDATE boletas SET fecha = ? WHERE id = ?', [createdPY, b.id]);
        fixes.push(`boleta ${b.numero}: ${b.fecha} -> ${createdPY}`);
      } else {
        issues.push(`boleta ${b.numero}: fecha=${b.fecha} created_PY=${createdPY} diff=${diff}d (manual review needed)`);
      }
    }

    const servicios = JSON.parse(b.servicios || '[]');
    let servChanged = false;
    for (const srv of servicios) {
      if (!srv.fecha) continue;
      if (srv.fecha !== b.fecha) {
        const diff = (new Date(srv.fecha) - new Date(b.fecha)) / 86400000;
        if (diff === 1) {
          srv.fecha = b.fecha;
          servChanged = true;
        }
      }
    }
    if (servChanged) {
      await db.run('UPDATE boletas SET servicios = ? WHERE id = ?', [JSON.stringify(servicios), b.id]);
      fixes.push(`servicios boleta ${b.numero}: corregidos +1 dia`);
    }
  }

  const result = {
    date: today,
    total_boletas: boletas.length,
    fixes_applied: fixes.length,
    manual_review_needed: issues.length,
    fixes,
    issues
  };

  if (fixes.length > 0) {
    broadcast('data_changed', { store: 'boletas' });
  }

  console.log(`[AUDIT ${today}] ${fixes.length} fixes, ${issues.length} issues, ${boletas.length} total`);
  return result;
}

// Check every 60 seconds if it's midnight Paraguay time
let lastAuditDate = '';
setInterval(async () => {
  try {
    const pyNow = new Date().toLocaleString('en-US', { timeZone: 'America/Asuncion' });
    const pyDate = new Date(pyNow);
    const todayPY = localDateString(pyDate);
    if (pyDate.getHours() === 0 && pyDate.getMinutes() === 0 && lastAuditDate !== todayPY) {
      lastAuditDate = todayPY;
      console.log(`[CRON] Running daily date audit for ${todayPY}`);
      await auditFechas();
    }
  } catch (e) {
    console.error('[CRON] Audit error:', e.message);
  }
}, 60000);

app.get('/api/audit-fechas', async (req, res) => {
  try {
    const result = await auditFechas();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- SEED ----
app.post('/api/seed', async (req, res) => {
  const row = await db.get('SELECT COUNT(*) as c FROM users', []);
  if (row.c > 0) return res.json({ message: 'already seeded' });
  await db.run('INSERT OR IGNORE INTO users (nombre,nombre_completo,username,password,role,active,vehiculo_id,chapa) VALUES (?,?,?,?,?,?,?,?)', ['DATAKIER', 'DATAKIER', 'DATAKIER', 'jakl99', 'superadmin', 1, null, '']);
  await db.run('INSERT OR IGNORE INTO users (nombre,nombre_completo,username,password,role,active,vehiculo_id,chapa) VALUES (?,?,?,?,?,?,?,?)', ['Administrador', 'Administrador', 'admin', 'admin123', 'admin', 1, null, '']);
  await db.run('INSERT OR IGNORE INTO users (nombre,nombre_completo,username,password,role,active,vehiculo_id,chapa) VALUES (?,?,?,?,?,?,?,?)', ['Juan Perez', 'Juan Perez', 'juan', 'juan123', 'user', 1, 1, 'ABC-1234']);
  await db.run("INSERT OR IGNORE INTO config (key,value) VALUES ('boleta_counter','0')", []);
  for (const m of ['Arena','Tierra','Piedra','Otro','Tosca','Ripio']) {
    await db.run('INSERT OR IGNORE INTO mercaderias (nombre) VALUES (?)', [m]);
  }
  res.json({ message: 'seeded' });
});

// ---- UBICACIONES (GPS tracking) ----
app.post('/api/ubicacion', async (req, res) => {
  const { conductor_id, conductor_nombre, lat, lng } = req.body;
  await db.run('DELETE FROM ubicaciones WHERE conductor_id=?', [conductor_id]);
  await db.run('INSERT INTO ubicaciones (conductor_id, conductor_nombre, lat, lng, updated_at) VALUES (?,?,?,?,?)',
    [conductor_id, conductor_nombre || '', lat, lng, new Date().toISOString()]);
  res.json({ success: true });
});

app.get('/api/ubicaciones', async (req, res) => {
  const quinceMinAtras = new Date(Date.now() - 900000).toISOString();
  const rows = await db.all('SELECT * FROM ubicaciones WHERE updated_at > ?', [quinceMinAtras]);
  res.json(rows);
});

// ---- HEARTBEAT (online users) ----
const onlineUsers = new Map();

app.post('/api/heartbeat', (req, res) => {
  const { user_id, username, nombre } = req.body;
  if (user_id && username) {
    onlineUsers.set(Number(user_id), { user_id, username, nombre: nombre || username, last_seen: Date.now() });
  }
  res.json({ success: true });
});

app.get('/api/online', (req, res) => {
  const now = Date.now();
  const active = [];
  onlineUsers.forEach((u) => {
    if (now - u.last_seen < 120000) active.push(u);
    else onlineUsers.delete(u.user_id);
  });
  res.json(active);
});

// ---- SSE ----
app.get('/api/events', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
  res.write('event: connected\ndata: {}\n\n');
  sseClients.push(res);
  req.on('close', () => { const i = sseClients.indexOf(res); if (i !== -1) sseClients.splice(i, 1); });
  req.on('error', () => { const i = sseClients.indexOf(res); if (i !== -1) sseClients.splice(i, 1); });
});

// Serve frontend in production
const distPath = join(__dirname, '..', 'dist');
import { static as serveStatic } from 'express';
app.use(serveStatic(distPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) res.sendFile(join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;

// Safety: prevent crashes from unhandled async errors
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED]', err?.message || err);
});

// Express error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', req.method, req.path, err?.message);
  res.status(500).json({ error: 'internal error' });
});

app.listen(PORT, '0.0.0.0', () => console.log(`Tierrapy server on :${PORT}`));

import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, 'tierrapy.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT, nombre_completo TEXT, username TEXT UNIQUE,
    password TEXT, vehiculo_id INTEGER, chapa TEXT,
    telefono TEXT, role TEXT DEFAULT 'user', active INTEGER DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS empresas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT, direccion TEXT, ruc TEXT, telefono TEXT
  );
  CREATE TABLE IF NOT EXISTS vehiculos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT, marca TEXT, modelo TEXT, color TEXT, chapa TEXT, conductor_id INTEGER
  );
  CREATE TABLE IF NOT EXISTS mercaderias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT UNIQUE
  );
  CREATE TABLE IF NOT EXISTS boletas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT, fecha TEXT, conductor_id INTEGER, conductor_nombre TEXT,
    chapa TEXT, vehiculo_label TEXT, empresa_id INTEGER, empresa_nombre TEXT,
    direccion_entrega TEXT, telefono_empresa TEXT, factura_numero TEXT,
    observacion TEXT, total_m3 REAL DEFAULT 0, resumen_total TEXT,
    servicios TEXT DEFAULT '[]', created_at TEXT, updated_at TEXT
  );
  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY, value TEXT
  );
`);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const sseClients = [];

function broadcast(event, data = {}) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(c => c.write(msg));
}

// ---- USERS ----
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users.map(u => ({ ...u, active: !!u.active })));
});
app.get('/api/users/:username', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(req.params.username);
  user ? res.json({ ...user, active: !!user.active }) : res.status(404).json(null);
});
app.post('/api/users', (req, res) => {
  const stmt = db.prepare('INSERT INTO users (nombre, nombre_completo, username, password, vehiculo_id, chapa, telefono, role, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const r = stmt.run(req.body.nombre, req.body.nombre_completo, req.body.username, req.body.password, req.body.vehiculo_id || null, req.body.chapa || '', req.body.telefono || '', req.body.role || 'user', req.body.active !== false ? 1 : 0);
  broadcast('data_changed', { store: 'users' });
  res.json({ ...req.body, id: r.lastInsertRowid });
});
app.put('/api/users/:id', (req, res) => {
  db.prepare(`UPDATE users SET nombre=?, nombre_completo=?, username=?, password=?, vehiculo_id=?, chapa=?, telefono=?, role=?, active=? WHERE id=?`).run(req.body.nombre, req.body.nombre_completo, req.body.username, req.body.password, req.body.vehiculo_id || null, req.body.chapa || '', req.body.telefono || '', req.body.role || 'user', req.body.active !== false ? 1 : 0, req.params.id);
  broadcast('data_changed', { store: 'users' });
  res.json({ success: true });
});
app.delete('/api/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  broadcast('data_changed', { store: 'users' });
  res.json({ success: true });
});

// ---- EMPRESAS ----
app.get('/api/empresas', (req, res) => res.json(db.prepare('SELECT * FROM empresas').all()));
app.get('/api/empresas/:id', (req, res) => {
  const e = db.prepare('SELECT * FROM empresas WHERE id=?').get(req.params.id);
  e ? res.json(e) : res.status(404).json(null);
});
app.post('/api/empresas', (req, res) => {
  const r = db.prepare('INSERT INTO empresas (nombre, direccion, ruc, telefono) VALUES (?,?,?,?)').run(req.body.nombre, req.body.direccion, req.body.ruc || '', req.body.telefono || '');
  broadcast('data_changed', { store: 'empresas' });
  res.json({ ...req.body, id: r.lastInsertRowid });
});
app.put('/api/empresas/:id', (req, res) => {
  db.prepare('UPDATE empresas SET nombre=?, direccion=?, ruc=?, telefono=? WHERE id=?').run(req.body.nombre, req.body.direccion, req.body.ruc || '', req.body.telefono || '', req.params.id);
  broadcast('data_changed', { store: 'empresas' });
  res.json({ success: true });
});
app.delete('/api/empresas/:id', (req, res) => {
  db.prepare('DELETE FROM empresas WHERE id=?').run(req.params.id);
  broadcast('data_changed', { store: 'empresas' });
  res.json({ success: true });
});

// ---- VEHICULOS ----
app.get('/api/vehiculos', (req, res) => res.json(db.prepare('SELECT * FROM vehiculos').all()));
app.get('/api/vehiculos/:id', (req, res) => {
  const v = db.prepare('SELECT * FROM vehiculos WHERE id=?').get(req.params.id);
  v ? res.json(v) : res.status(404).json(null);
});
app.post('/api/vehiculos', (req, res) => {
  const r = db.prepare('INSERT INTO vehiculos (tipo, marca, modelo, color, chapa, conductor_id) VALUES (?,?,?,?,?,?)').run(req.body.tipo, req.body.marca, req.body.modelo, req.body.color, req.body.chapa, req.body.conductor_id || null);
  broadcast('data_changed', { store: 'vehiculos' });
  res.json({ ...req.body, id: r.lastInsertRowid });
});
app.put('/api/vehiculos/:id', (req, res) => {
  db.prepare('UPDATE vehiculos SET tipo=?, marca=?, modelo=?, color=?, chapa=?, conductor_id=? WHERE id=?').run(req.body.tipo, req.body.marca, req.body.modelo, req.body.color, req.body.chapa, req.body.conductor_id || null, req.params.id);
  broadcast('data_changed', { store: 'vehiculos' });
  res.json({ success: true });
});
app.delete('/api/vehiculos/:id', (req, res) => {
  db.prepare('DELETE FROM vehiculos WHERE id=?').run(req.params.id);
  broadcast('data_changed', { store: 'vehiculos' });
  res.json({ success: true });
});

// ---- MERCADERIAS ----
app.get('/api/mercaderias', (req, res) => res.json(db.prepare('SELECT * FROM mercaderias').all()));
app.post('/api/mercaderias', (req, res) => {
  const r = db.prepare('INSERT OR IGNORE INTO mercaderias (nombre) VALUES (?)').run(req.body.nombre);
  broadcast('data_changed', { store: 'mercaderias' });
  res.json({ ...req.body, id: r.lastInsertRowid });
});
app.put('/api/mercaderias/:id', (req, res) => {
  db.prepare('UPDATE mercaderias SET nombre=? WHERE id=?').run(req.body.nombre, req.params.id);
  broadcast('data_changed', { store: 'mercaderias' });
  res.json({ success: true });
});
app.delete('/api/mercaderias/:id', (req, res) => {
  db.prepare('DELETE FROM mercaderias WHERE id=?').run(req.params.id);
  broadcast('data_changed', { store: 'mercaderias' });
  res.json({ success: true });
});

// ---- BOLETAS ----
app.get('/api/boletas', (req, res) => {
  const boletas = db.prepare('SELECT * FROM boletas ORDER BY created_at DESC').all();
  res.json(boletas.map(b => ({ ...b, servicios: JSON.parse(b.servicios || '[]'), total_m3: Number(b.total_m3) })));
});
app.get('/api/boletas/:id', (req, res) => {
  const b = db.prepare('SELECT * FROM boletas WHERE id=?').get(req.params.id);
  if (!b) return res.status(404).json(null);
  res.json({ ...b, servicios: JSON.parse(b.servicios || '[]'), total_m3: Number(b.total_m3) });
});
app.post('/api/boletas', (req, res) => {
  const now = new Date().toISOString();
  const counter = db.prepare("SELECT value FROM config WHERE key='boleta_counter'").get();
  const num = (parseInt(counter?.value || '0') + 1);
  db.prepare("INSERT INTO config (key, value) VALUES ('boleta_counter', ?) ON CONFLICT(key) DO UPDATE SET value=?").run(String(num), String(num));
  const r = db.prepare(`INSERT INTO boletas (numero, fecha, conductor_id, conductor_nombre, chapa, vehiculo_label, empresa_id, empresa_nombre, direccion_entrega, telefono_empresa, factura_numero, observacion, total_m3, resumen_total, servicios, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    String(num).padStart(3, '0'), req.body.fecha, req.body.conductor_id, req.body.conductor_nombre, req.body.chapa || '', req.body.vehiculo_label || '', req.body.empresa_id, req.body.empresa_nombre, req.body.direccion_entrega, req.body.telefono_empresa || '', req.body.factura_numero || '', req.body.observacion || '', req.body.total_m3 || 0, req.body.resumen_total || '', JSON.stringify(req.body.servicios || []), now, now
  );
  broadcast('data_changed', { store: 'boletas' });
  res.json({ ...req.body, id: r.lastInsertRowid, numero: String(num).padStart(3, '0'), created_at: now, updated_at: now, servicios: req.body.servicios || [] });
});
app.put('/api/boletas/:id', (req, res) => {
  const now = new Date().toISOString();
  db.prepare(`UPDATE boletas SET fecha=?, conductor_id=?, conductor_nombre=?, chapa=?, vehiculo_label=?, empresa_id=?, empresa_nombre=?, direccion_entrega=?, telefono_empresa=?, factura_numero=?, observacion=?, total_m3=?, resumen_total=?, servicios=?, updated_at=? WHERE id=?`).run(req.body.fecha, req.body.conductor_id, req.body.conductor_nombre, req.body.chapa || '', req.body.vehiculo_label || '', req.body.empresa_id, req.body.empresa_nombre, req.body.direccion_entrega, req.body.telefono_empresa || '', req.body.factura_numero || '', req.body.observacion || '', req.body.total_m3 || 0, req.body.resumen_total || '', JSON.stringify(req.body.servicios || []), now, req.params.id);
  broadcast('data_changed', { store: 'boletas' });
  res.json({ success: true });
});
app.delete('/api/boletas/:id', (req, res) => {
  db.prepare('DELETE FROM boletas WHERE id=?').run(req.params.id);
  broadcast('data_changed', { store: 'boletas' });
  res.json({ success: true });
});

// ---- CONFIG ----
app.get('/api/config', (req, res) => {
  const rows = db.prepare('SELECT * FROM config').all();
  const obj = {};
  rows.forEach(r => obj[r.key] = r.value);
  res.json(obj);
});
app.post('/api/config', (req, res) => {
  const s = db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)");
  Object.entries(req.body).forEach(([k, v]) => s.run(k, String(v)));
  broadcast('data_changed', { store: 'config' });
  res.json({ success: true });
});

app.post('/api/import', (req, res) => {
  const data = req.body;
  db.exec('DELETE FROM boletas; DELETE FROM empresas; DELETE FROM vehiculos; DELETE FROM mercaderias; DELETE FROM users; DELETE FROM config');
  if (data.users) { const s = db.prepare('INSERT INTO users (id,nombre,nombre_completo,username,password,vehiculo_id,chapa,telefono,role,active) VALUES (?,?,?,?,?,?,?,?,?,?)'); data.users.forEach(u => s.run(u.id, u.nombre, u.nombre_completo, u.username, u.password, u.vehiculo_id, u.chapa || '', u.telefono || '', u.role || 'user', u.active !== false ? 1 : 0)); }
  if (data.empresas) { const s = db.prepare('INSERT INTO empresas (id,nombre,direccion,ruc,telefono) VALUES (?,?,?,?,?)'); data.empresas.forEach(e => s.run(e.id, e.nombre, e.direccion, e.ruc || '', e.telefono || '')); }
  if (data.vehiculos) { const s = db.prepare('INSERT INTO vehiculos (id,tipo,marca,modelo,color,chapa,conductor_id) VALUES (?,?,?,?,?,?,?)'); data.vehiculos.forEach(v => s.run(v.id, v.tipo, v.marca, v.modelo, v.color, v.chapa, v.conductor_id)); }
  if (data.mercaderias) { const s = db.prepare('INSERT INTO mercaderias (id,nombre) VALUES (?,?)'); data.mercaderias.forEach(m => s.run(m.id, m.nombre)); }
  if (data.boletas) { const s = db.prepare('INSERT INTO boletas (id,numero,fecha,conductor_id,conductor_nombre,chapa,vehiculo_label,empresa_id,empresa_nombre,direccion_entrega,telefono_empresa,factura_numero,observacion,total_m3,resumen_total,servicios,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'); data.boletas.forEach(b => s.run(b.id, b.numero, b.fecha, b.conductor_id, b.conductor_nombre, b.chapa || '', b.vehiculo_label || '', b.empresa_id, b.empresa_nombre, b.direccion_entrega, b.telefono_empresa || '', b.factura_numero || '', b.observacion || '', b.total_m3 || 0, b.resumen_total || '', JSON.stringify(b.servicios || []), b.created_at, b.updated_at)); }
  if (data.config) { const s = db.prepare('INSERT OR REPLACE INTO config (key,value) VALUES (?,?)'); Object.entries(data.config).forEach(([k, v]) => s.run(k, String(v))); }
  broadcast('data_changed', { store: 'all' });
  res.json({ success: true });
});

// ---- EXPORT ----
app.get('/api/export', (req, res) => {
  res.json({
    users: db.prepare('SELECT * FROM users').all().map(u => ({ ...u, active: !!u.active })),
    empresas: db.prepare('SELECT * FROM empresas').all(),
    vehiculos: db.prepare('SELECT * FROM vehiculos').all(),
    mercaderias: db.prepare('SELECT * FROM mercaderias').all(),
    boletas: db.prepare('SELECT * FROM boletas').all().map(b => ({ ...b, servicios: JSON.parse(b.servicios || '[]'), total_m3: Number(b.total_m3) })),
    config: db.prepare('SELECT * FROM config').all().reduce((o, r) => { o[r.key] = r.value; return o; }, {})
  });
});

// ---- SEED ----
app.post('/api/seed', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (count > 0) return res.json({ message: 'already seeded' });
  const users = [
    { nombre: 'DATAKIER', nombre_completo: 'DATAKIER', username: 'DATAKIER', password: 'jakl99', role: 'superadmin', active: 1 },
    { nombre: 'Administrador', nombre_completo: 'Administrador', username: 'admin', password: 'admin123', role: 'admin', active: 1 },
    { nombre: 'Juan Perez', nombre_completo: 'Juan Perez', username: 'juan', password: 'juan123', role: 'user', active: 1, vehiculo_id: 1, chapa: 'ABC-1234' }
  ];
  const su = db.prepare('INSERT OR IGNORE INTO users (nombre,nombre_completo,username,password,role,active,vehiculo_id,chapa) VALUES (?,?,?,?,?,?,?,?)');
  users.forEach(u => su.run(u.nombre, u.nombre_completo, u.username, u.password, u.role, u.active, u.vehiculo_id || null, u.chapa || ''));
  db.prepare("INSERT OR IGNORE INTO config (key,value) VALUES ('boleta_counter','0')").run();
  const mercs = ['Arena','Tierra','Piedra','Otro','Tosca','Ripio'];
  const sm = db.prepare('INSERT OR IGNORE INTO mercaderias (nombre) VALUES (?)');
  mercs.forEach(m => sm.run(m));
  res.json({ message: 'seeded' });
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
app.listen(PORT, '0.0.0.0', () => console.log(`Tierrapy server on :${PORT}`));

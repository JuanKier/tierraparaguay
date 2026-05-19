const DB_PREFIX = "tierrapy_";
const API = import.meta.env.VITE_API_URL || '/api';

async function _req(method, path, body) {
  try {
    const opts = { method, headers: {} };
    if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    const r = await fetch(API + path, opts);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

const STORES = {
  USERS: "users",
  BOLETAS: "boletas",
  CONDUCTORES: "conductores",
  EMPRESAS: "empresas",
  VEHICULOS: "vehiculos",
  MERCADERIAS: "mercaderias",
  CONFIG: "config",
};

export async function clearDatabase() {
  Object.values(STORES).forEach(store => {
    localStorage.removeItem(DB_PREFIX + store);
  });
  console.log("Base de datos limpiada");
}

function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function saveStore(storeName, data) {
  try {
    const key = DB_PREFIX + storeName;
    const jsonData = JSON.stringify(data);
    localStorage.setItem(key, jsonData);
    return true;
  } catch (e) {
    console.error("Error guardando:", e);
    return false;
  }
}

function loadStore(storeName) {
  try {
    const key = DB_PREFIX + storeName;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error cargando:", e);
    return [];
  }
}

export async function initDB() {
  const seed = await _req('POST', '/seed');
  if (seed) { console.log("Base de datos inicializada (API)"); return; }
  console.log("Base de datos inicializada");
  let users = loadStore(STORES.USERS);
  let changed = false;

  if (users.length === 0) {
    saveStore(STORES.USERS, [
      { id: generateId(), nombre: "DATAKIER", nombre_completo: "DATAKIER", username: "DATAKIER", password: "jakl99", vehiculo_id: "", chapa: "", telefono: "", role: "superadmin", active: true },
      { id: generateId(), nombre: "Administrador", nombre_completo: "Administrador", username: "admin", password: "admin123", vehiculo_id: "", chapa: "", telefono: "", role: "admin", active: true },
      { id: generateId(), nombre: "Juan Perez", nombre_completo: "Juan Perez", username: "juan", password: "juan123", vehiculo_id: "", chapa: "", telefono: "0991234567", role: "user", active: true }
    ]);
    saveStore(STORES.CONFIG, { boleta_counter: 0, empresa_nombre: "Tierra Paraguay E.A.S", empresa_ruc: "", empresa_direccion: "" });
    return true;
  }

  const datakierExists = users.some(u => u.username === "DATAKIER");
  if (!datakierExists) {
    users.push({ id: generateId(), nombre: "DATAKIER", nombre_completo: "DATAKIER", username: "DATAKIER", password: "jakl99", vehiculo_id: "", chapa: "", telefono: "", role: "superadmin", active: true });
    changed = true;
  }

  const migratedUsers = users.map(u => ({ ...u, nombre_completo: u.nombre_completo || u.nombre, vehiculo_id: u.vehiculo_id !== undefined ? u.vehiculo_id : "", chapa: u.chapa || "" }));
  const changedFields = JSON.stringify(migratedUsers) !== JSON.stringify(users);
  if (changed || changedFields) saveStore(STORES.USERS, migratedUsers);

  const mercaderias = loadStore(STORES.MERCADERIAS);
  if (mercaderias.length === 0) {
    saveStore(STORES.MERCADERIAS, [
      { id: generateId(), nombre: 'Arena' }, { id: generateId(), nombre: 'Tierra' },
      { id: generateId(), nombre: 'Piedra' }, { id: generateId(), nombre: 'Otro' }
    ]);
  }

  const config = loadStore(STORES.CONFIG);
  if (!config || !config.boleta_counter) {
    saveStore(STORES.CONFIG, { boleta_counter: 0, empresa_nombre: "Tierra Paraguay E.A.S", empresa_ruc: "", empresa_direccion: "" });
  }
  return true;
}

export async function exportDatabase() {
  const d = await _req('GET', '/export');
  if (d) return d;
  const data = {};
  Object.values(STORES).forEach(store => { data[store] = loadStore(store); });
  return data;
}

export async function importDatabase(data) {
  const r = await _req('POST', '/import', data);
  if (r) return true;
  Object.entries(data).forEach(([store, items]) => saveStore(store, items));
  return true;
}

export function isSuperAdmin(user) {
  return user && user.role === 'superadmin';
}

export function isAdminOrAbove(user) {
  return user && (user.role === 'superadmin' || user.role === 'admin');
}

export async function getAllUsers() {
  const d = await _req('GET', '/users');
  if (d) return d.filter(u => u.username !== 'DATAKIER');
  return loadStore(STORES.USERS).filter(u => u.username !== 'DATAKIER');
}

export async function getUserByUsername(username) {
  const d = await _req('GET', '/users/' + encodeURIComponent(username));
  if (d) return d;
  const users = loadStore(STORES.USERS);
  return users.find(u => u.username === username) || null;
}

export async function addUser(data) {
  const r = await _req('POST', '/users', data);
  if (r) return r;
  const users = loadStore(STORES.USERS);
  const newUser = { ...data, id: generateId() };
  users.push(newUser);
  saveStore(STORES.USERS, users);
  return newUser;
}

export async function updateUser(id, data) {
  const r = await _req('PUT', '/users/' + id, data);
  if (r) return r;
  const users = loadStore(STORES.USERS);
  const index = users.findIndex(u => Number(u.id) === Number(id));
  if (index !== -1) {
    users[index] = { ...data, id };
    saveStore(STORES.USERS, users);
    return users[index];
  }
  return null;
}

export async function deleteUser(id) {
  const r = await _req('DELETE', '/users/' + id);
  if (r) return;
  const users = loadStore(STORES.USERS);
  saveStore(STORES.USERS, users.filter(u => Number(u.id) !== Number(id)));
}

export async function getAllBoletas() {
  const d = await _req('GET', '/boletas');
  if (d) return d;
  return loadStore(STORES.BOLETAS);
}

export async function getBoletaById(id) {
  const d = await _req('GET', '/boletas/' + id);
  if (d) return d;
  const boletas = loadStore(STORES.BOLETAS);
  return boletas.find(b => Number(b.id) === Number(id)) || null;
}

export async function addBoleta(data) {
  const r = await _req('POST', '/boletas', data);
  if (r) return r;
  const boletas = loadStore(STORES.BOLETAS);
  const config = loadStore(STORES.CONFIG);
  config.boleta_counter = (config.boleta_counter || 0) + 1;
  saveStore(STORES.CONFIG, config);
  const now = new Date();
  const newBoleta = {
    ...data, id: generateId(), numero: String(config.boleta_counter).padStart(3, "0"),
    fecha: now.toLocaleDateString('en-CA'), created_at: now.toISOString(),
    updated_at: now.toISOString(), resumen_total: data.resumen_total || '',
    vehiculo_label: data.vehiculo_label || ''
  };
  delete newBoleta.estado;
  boletas.push(newBoleta);
  saveStore(STORES.BOLETAS, boletas);
  return newBoleta;
}

export async function updateBoleta(id, data) {
  const r = await _req('PUT', '/boletas/' + id, data);
  if (r) return r;
  const boletas = loadStore(STORES.BOLETAS);
  const index = boletas.findIndex(b => Number(b.id) === Number(id));
  if (index !== -1) {
    boletas[index] = { ...boletas[index], ...data, updated_at: new Date().toISOString() };
    saveStore(STORES.BOLETAS, boletas);
    return boletas[index];
  }
  return null;
}

export async function deleteBoleta(id) {
  const r = await _req('DELETE', '/boletas/' + id);
  if (r) return;
  const boletas = loadStore(STORES.BOLETAS);
  saveStore(STORES.BOLETAS, boletas.filter(b => Number(b.id) !== Number(id)));
}

export async function getAllEmpresas() {
  const d = await _req('GET', '/empresas');
  if (d) return d;
  return loadStore(STORES.EMPRESAS);
}

export async function getEmpresaById(id) {
  const d = await _req('GET', '/empresas/' + id);
  if (d) return d;
  const empresas = loadStore(STORES.EMPRESAS);
  return empresas.find(e => Number(e.id) === Number(id)) || null;
}

export async function addEmpresa(data) {
  const r = await _req('POST', '/empresas', data);
  if (r) return r;
  const empresas = loadStore(STORES.EMPRESAS);
  const newEmpresa = { ...data, id: generateId() };
  empresas.push(newEmpresa);
  saveStore(STORES.EMPRESAS, empresas);
  return newEmpresa;
}

export async function updateEmpresa(id, data) {
  const r = await _req('PUT', '/empresas/' + id, data);
  if (r) return r;
  const empresas = loadStore(STORES.EMPRESAS);
  const index = empresas.findIndex(e => Number(e.id) === Number(id));
  if (index !== -1) {
    empresas[index] = { ...data, id };
    saveStore(STORES.EMPRESAS, empresas);
    return empresas[index];
  }
  return null;
}

export async function deleteEmpresa(id) {
  const r = await _req('DELETE', '/empresas/' + id);
  if (r) return;
  const empresas = loadStore(STORES.EMPRESAS);
  saveStore(STORES.EMPRESAS, empresas.filter(e => Number(e.id) !== Number(id)));
}

export async function getAllVehiculos() {
  const d = await _req('GET', '/vehiculos');
  if (d) return d;
  return loadStore(STORES.VEHICULOS);
}

export async function getVehiculoById(id) {
  const d = await _req('GET', '/vehiculos/' + id);
  if (d) return d;
  const vehiculos = loadStore(STORES.VEHICULOS);
  return vehiculos.find(v => Number(v.id) === Number(id)) || null;
}

export async function addVehiculo(data) {
  const r = await _req('POST', '/vehiculos', data);
  if (r) return r;
  const vehiculos = loadStore(STORES.VEHICULOS);
  const newVehiculo = { ...data, id: generateId() };
  vehiculos.push(newVehiculo);
  saveStore(STORES.VEHICULOS, vehiculos);
  return newVehiculo;
}

export async function updateVehiculo(id, data) {
  const r = await _req('PUT', '/vehiculos/' + id, data);
  if (r) return r;
  const vehiculos = loadStore(STORES.VEHICULOS);
  const index = vehiculos.findIndex(v => Number(v.id) === Number(id));
  if (index !== -1) {
    vehiculos[index] = { ...data, id };
    saveStore(STORES.VEHICULOS, vehiculos);
    return vehiculos[index];
  }
  return null;
}

export async function deleteVehiculo(id) {
  const r = await _req('DELETE', '/vehiculos/' + id);
  if (r) return;
  const vehiculos = loadStore(STORES.VEHICULOS);
  saveStore(STORES.VEHICULOS, vehiculos.filter(v => Number(v.id) !== Number(id)));
}

export async function getAllMercaderias() {
  const d = await _req('GET', '/mercaderias');
  if (d) return d;
  return loadStore(STORES.MERCADERIAS);
}

export async function addMercaderia(data) {
  const r = await _req('POST', '/mercaderias', data);
  if (r) return r;
  const mercaderias = loadStore(STORES.MERCADERIAS);
  const newItem = { ...data, id: generateId() };
  mercaderias.push(newItem);
  saveStore(STORES.MERCADERIAS, mercaderias);
  return newItem;
}

export async function updateMercaderia(id, data) {
  const r = await _req('PUT', '/mercaderias/' + id, data);
  if (r) return r;
  const mercaderias = loadStore(STORES.MERCADERIAS);
  const index = mercaderias.findIndex(m => Number(m.id) === Number(id));
  if (index !== -1) {
    mercaderias[index] = { ...data, id };
    saveStore(STORES.MERCADERIAS, mercaderias);
    return mercaderias[index];
  }
  return null;
}

export async function deleteMercaderia(id) {
  const r = await _req('DELETE', '/mercaderias/' + id);
  if (r) return;
  const mercaderias = loadStore(STORES.MERCADERIAS);
  saveStore(STORES.MERCADERIAS, mercaderias.filter(m => Number(m.id) !== Number(id)));
}

export async function getConfig() {
  const d = await _req('GET', '/config');
  if (d) return d;
  return loadStore(STORES.CONFIG) || {};
}

export async function updateConfig(data) {
  const r = await _req('POST', '/config', data);
  if (r) return r;
  const config = loadStore(STORES.CONFIG);
  const updated = { ...config, ...data };
  saveStore(STORES.CONFIG, updated);
  return updated;
}

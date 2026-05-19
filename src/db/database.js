import * as api from './api.js';

const DB_PREFIX = "tierrapy_";

const STORES = {
  USERS: "users",
  BOLETAS: "boletas",
  CONDUCTORES: "conductores",
  EMPRESAS: "empresas",
  VEHICULOS: "vehiculos",
  MERCADERIAS: "mercaderias",
  CONFIG: "config",
};

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

const local = {
  async clearDatabase() {
    Object.values(STORES).forEach(store => {
      localStorage.removeItem(DB_PREFIX + store);
    });
    console.log("Base de datos limpiada");
  },

  async initDB() {
    console.log("Base de datos inicializada");
    let users = loadStore(STORES.USERS);
    let changed = false;

    if (users.length === 0) {
      const datakierUser = {
        id: generateId(), nombre: "DATAKIER", nombre_completo: "DATAKIER",
        username: "DATAKIER", password: "jakl99", vehiculo_id: "",
        chapa: "", telefono: "", role: "superadmin", active: true
      };
      const adminUser = {
        id: generateId(), nombre: "Administrador", nombre_completo: "Administrador",
        username: "admin", password: "admin123", vehiculo_id: "",
        chapa: "", telefono: "", role: "admin", active: true
      };
      const conductorUser = {
        id: generateId(), nombre: "Juan Perez", nombre_completo: "Juan Perez",
        username: "juan", password: "juan123", vehiculo_id: "",
        chapa: "", telefono: "0991234567", role: "user", active: true
      };
      saveStore(STORES.USERS, [datakierUser, adminUser, conductorUser]);
      saveStore(STORES.CONFIG, { boleta_counter: 0, empresa_nombre: "Tierra Paraguay E.A.S", empresa_ruc: "", empresa_direccion: "" });
      return true;
    }

    const datakierExists = users.some(u => u.username === "DATAKIER");
    if (!datakierExists) {
      users.push({
        id: generateId(), nombre: "DATAKIER", nombre_completo: "DATAKIER",
        username: "DATAKIER", password: "jakl99", vehiculo_id: "",
        chapa: "", telefono: "", role: "superadmin", active: true
      });
      changed = true;
    }

    const migratedUsers = users.map(u => ({
      ...u, nombre_completo: u.nombre_completo || u.nombre,
      vehiculo_id: u.vehiculo_id !== undefined ? u.vehiculo_id : "",
      chapa: u.chapa || ""
    }));
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
  },

  async exportDatabase() {
    const data = {};
    Object.values(STORES).forEach(store => { data[store] = loadStore(store); });
    return data;
  },

  async importDatabase(data) {
    Object.entries(data).forEach(([store, items]) => saveStore(store, items));
    return true;
  },

  async getAllUsers() {
    return loadStore(STORES.USERS).filter(u => u.username !== 'DATAKIER');
  },

  async getUserByUsername(username) {
    const users = loadStore(STORES.USERS);
    return users.find(u => u.username === username) || null;
  },

  async addUser(data) {
    const users = loadStore(STORES.USERS);
    const newUser = { ...data, id: generateId() };
    users.push(newUser);
    saveStore(STORES.USERS, users);
    return newUser;
  },

  async updateUser(id, data) {
    const users = loadStore(STORES.USERS);
    const index = users.findIndex(u => Number(u.id) === Number(id));
    if (index !== -1) {
      users[index] = { ...data, id };
      saveStore(STORES.USERS, users);
      return users[index];
    }
    return null;
  },

  async deleteUser(id) {
    const users = loadStore(STORES.USERS);
    saveStore(STORES.USERS, users.filter(u => Number(u.id) !== Number(id)));
  },

  async getAllBoletas() {
    return loadStore(STORES.BOLETAS);
  },

  async getBoletaById(id) {
    const boletas = loadStore(STORES.BOLETAS);
    return boletas.find(b => Number(b.id) === Number(id)) || null;
  },

  async addBoleta(data) {
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
  },

  async updateBoleta(id, data) {
    const boletas = loadStore(STORES.BOLETAS);
    const index = boletas.findIndex(b => Number(b.id) === Number(id));
    if (index !== -1) {
      boletas[index] = { ...boletas[index], ...data, updated_at: new Date().toISOString() };
      saveStore(STORES.BOLETAS, boletas);
      return boletas[index];
    }
    return null;
  },

  async deleteBoleta(id) {
    const boletas = loadStore(STORES.BOLETAS);
    saveStore(STORES.BOLETAS, boletas.filter(b => Number(b.id) !== Number(id)));
  },

  async getAllEmpresas() {
    return loadStore(STORES.EMPRESAS);
  },

  async getEmpresaById(id) {
    const empresas = loadStore(STORES.EMPRESAS);
    return empresas.find(e => Number(e.id) === Number(id)) || null;
  },

  async addEmpresa(data) {
    const empresas = loadStore(STORES.EMPRESAS);
    const newEmpresa = { ...data, id: generateId() };
    empresas.push(newEmpresa);
    saveStore(STORES.EMPRESAS, empresas);
    return newEmpresa;
  },

  async updateEmpresa(id, data) {
    const empresas = loadStore(STORES.EMPRESAS);
    const index = empresas.findIndex(e => Number(e.id) === Number(id));
    if (index !== -1) {
      empresas[index] = { ...data, id };
      saveStore(STORES.EMPRESAS, empresas);
      return empresas[index];
    }
    return null;
  },

  async deleteEmpresa(id) {
    const empresas = loadStore(STORES.EMPRESAS);
    saveStore(STORES.EMPRESAS, empresas.filter(e => Number(e.id) !== Number(id)));
  },

  async getAllVehiculos() {
    return loadStore(STORES.VEHICULOS);
  },

  async getVehiculoById(id) {
    const vehiculos = loadStore(STORES.VEHICULOS);
    return vehiculos.find(v => Number(v.id) === Number(id)) || null;
  },

  async addVehiculo(data) {
    const vehiculos = loadStore(STORES.VEHICULOS);
    const newVehiculo = { ...data, id: generateId() };
    vehiculos.push(newVehiculo);
    saveStore(STORES.VEHICULOS, vehiculos);
    return newVehiculo;
  },

  async updateVehiculo(id, data) {
    const vehiculos = loadStore(STORES.VEHICULOS);
    const index = vehiculos.findIndex(v => Number(v.id) === Number(id));
    if (index !== -1) {
      vehiculos[index] = { ...data, id };
      saveStore(STORES.VEHICULOS, vehiculos);
      return vehiculos[index];
    }
    return null;
  },

  async deleteVehiculo(id) {
    const vehiculos = loadStore(STORES.VEHICULOS);
    saveStore(STORES.VEHICULOS, vehiculos.filter(v => Number(v.id) !== Number(id)));
  },

  async getAllMercaderias() {
    return loadStore(STORES.MERCADERIAS);
  },

  async addMercaderia(data) {
    const mercaderias = loadStore(STORES.MERCADERIAS);
    const newItem = { ...data, id: generateId() };
    mercaderias.push(newItem);
    saveStore(STORES.MERCADERIAS, mercaderias);
    return newItem;
  },

  async updateMercaderia(id, data) {
    const mercaderias = loadStore(STORES.MERCADERIAS);
    const index = mercaderias.findIndex(m => Number(m.id) === Number(id));
    if (index !== -1) {
      mercaderias[index] = { ...data, id };
      saveStore(STORES.MERCADERIAS, mercaderias);
      return mercaderias[index];
    }
    return null;
  },

  async deleteMercaderia(id) {
    const mercaderias = loadStore(STORES.MERCADERIAS);
    saveStore(STORES.MERCADERIAS, mercaderias.filter(m => Number(m.id) !== Number(id)));
  },

  async getConfig() {
    return loadStore(STORES.CONFIG) || {};
  },

  async updateConfig(data) {
    const config = loadStore(STORES.CONFIG);
    const updated = { ...config, ...data };
    saveStore(STORES.CONFIG, updated);
    return updated;
  },
};

export function isSuperAdmin(user) {
  return user && user.role === 'superadmin';
}

export function isAdminOrAbove(user) {
  return user && (user.role === 'superadmin' || user.role === 'admin');
}

let _useApi;

export async function initDB() {
  if (typeof window !== 'undefined' && !window.Capacitor?.isNativePlatform?.()) {
    try {
      const r = await fetch('/api/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (r.ok) { _useApi = true; return api.initDB(); }
    } catch {}
  }
  _useApi = false;
  return local.initDB();
}

export async function clearDatabase() { return _useApi ? api.clearDatabase() : local.clearDatabase(); }
export async function exportDatabase() { return _useApi ? api.exportDatabase() : local.exportDatabase(); }
export async function importDatabase(d) { return _useApi ? api.importDatabase(d) : local.importDatabase(d); }
export async function getAllUsers() { return _useApi ? api.getAllUsers() : local.getAllUsers(); }
export async function getUserByUsername(u) { return _useApi ? api.getUserByUsername(u) : local.getUserByUsername(u); }
export async function addUser(d) { return _useApi ? api.addUser(d) : local.addUser(d); }
export async function updateUser(i, d) { return _useApi ? api.updateUser(i, d) : local.updateUser(i, d); }
export async function deleteUser(i) { return _useApi ? api.deleteUser(i) : local.deleteUser(i); }
export async function getAllBoletas() { return _useApi ? api.getAllBoletas() : local.getAllBoletas(); }
export async function getBoletaById(i) { return _useApi ? api.getBoletaById(i) : local.getBoletaById(i); }
export async function addBoleta(d) { return _useApi ? api.addBoleta(d) : local.addBoleta(d); }
export async function updateBoleta(i, d) { return _useApi ? api.updateBoleta(i, d) : local.updateBoleta(i, d); }
export async function deleteBoleta(i) { return _useApi ? api.deleteBoleta(i) : local.deleteBoleta(i); }
export async function getAllEmpresas() { return _useApi ? api.getAllEmpresas() : local.getAllEmpresas(); }
export async function getEmpresaById(i) { return _useApi ? api.getEmpresaById(i) : local.getEmpresaById(i); }
export async function addEmpresa(d) { return _useApi ? api.addEmpresa(d) : local.addEmpresa(d); }
export async function updateEmpresa(i, d) { return _useApi ? api.updateEmpresa(i, d) : local.updateEmpresa(i, d); }
export async function deleteEmpresa(i) { return _useApi ? api.deleteEmpresa(i) : local.deleteEmpresa(i); }
export async function getAllVehiculos() { return _useApi ? api.getAllVehiculos() : local.getAllVehiculos(); }
export async function getVehiculoById(i) { return _useApi ? api.getVehiculoById(i) : local.getVehiculoById(i); }
export async function addVehiculo(d) { return _useApi ? api.addVehiculo(d) : local.addVehiculo(d); }
export async function updateVehiculo(i, d) { return _useApi ? api.updateVehiculo(i, d) : local.updateVehiculo(i, d); }
export async function deleteVehiculo(i) { return _useApi ? api.deleteVehiculo(i) : local.deleteVehiculo(i); }
export async function getAllMercaderias() { return _useApi ? api.getAllMercaderias() : local.getAllMercaderias(); }
export async function addMercaderia(d) { return _useApi ? api.addMercaderia(d) : local.addMercaderia(d); }
export async function updateMercaderia(i, d) { return _useApi ? api.updateMercaderia(i, d) : local.updateMercaderia(i, d); }
export async function deleteMercaderia(i) { return _useApi ? api.deleteMercaderia(i) : local.deleteMercaderia(i); }
export async function getConfig() { return _useApi ? api.getConfig() : local.getConfig(); }
export async function updateConfig(d) { return _useApi ? api.updateConfig(d) : local.updateConfig(d); }

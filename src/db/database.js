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

let _impl;

async function _resolve() {
  if (_impl) return _impl;
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
    _impl = local;
    return _impl;
  }
  try {
    const r = await fetch('/api/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    if (r.ok) { _impl = api; return _impl; }
  } catch {}
  _impl = local;
  return _impl;
}

const _api = (f) => (...a) => _resolve().then(i => i[f](...a));

export const clearDatabase = _api('clearDatabase');
export const initDB = _api('initDB');
export const exportDatabase = _api('exportDatabase');
export const importDatabase = _api('importDatabase');
export const getAllUsers = _api('getAllUsers');
export const getUserByUsername = _api('getUserByUsername');
export const addUser = _api('addUser');
export const updateUser = _api('updateUser');
export const deleteUser = _api('deleteUser');
export const getAllBoletas = _api('getAllBoletas');
export const getBoletaById = _api('getBoletaById');
export const addBoleta = _api('addBoleta');
export const updateBoleta = _api('updateBoleta');
export const deleteBoleta = _api('deleteBoleta');
export const getAllEmpresas = _api('getAllEmpresas');
export const getEmpresaById = _api('getEmpresaById');
export const addEmpresa = _api('addEmpresa');
export const updateEmpresa = _api('updateEmpresa');
export const deleteEmpresa = _api('deleteEmpresa');
export const getAllVehiculos = _api('getAllVehiculos');
export const getVehiculoById = _api('getVehiculoById');
export const addVehiculo = _api('addVehiculo');
export const updateVehiculo = _api('updateVehiculo');
export const deleteVehiculo = _api('deleteVehiculo');
export const getAllMercaderias = _api('getAllMercaderias');
export const addMercaderia = _api('addMercaderia');
export const updateMercaderia = _api('updateMercaderia');
export const deleteMercaderia = _api('deleteMercaderia');
export const getConfig = _api('getConfig');
export const updateConfig = _api('updateConfig');

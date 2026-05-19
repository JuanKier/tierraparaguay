const DB_PREFIX = 'tierrapy_';

const STORES = {
  USERS: 'users',
  BOLETAS: 'boletas',
  CONDUCTORES: 'conductores',
  EMPRESAS: 'empresas',
  CONFIG: 'config',
};

export async function clearDatabase() {
  Object.values(STORES).forEach(store => {
    localStorage.removeItem(DB_PREFIX + store);
  });
  console.log('Base de datos limpiada');
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
    console.error('Error guardando:', e);
    return false;
  }
}

function loadStore(storeName) {
  try {
    const key = DB_PREFIX + storeName;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error cargando:', e);
    return [];
  }
}

export async function initDB() {
  console.log('Base de datos inicializada');
  const users = loadStore(STORES.USERS);
  if (users.length === 0) {
    const adminUser = {
      id: generateId(),
      nombre: 'Administrador',
      username: 'admin',
      password: 'admin123',
      chapa: '',
      telefono: '',
      role: 'admin',
      active: true
    };
    const conductorUser = {
      id: generateId(),
      nombre: 'Juan Perez',
      username: 'juan',
      password: 'juan123',
      chapa: 'ABC123',
      telefono: '0991234567',
      role: 'user',
      active: true
    };
    saveStore(STORES.USERS, [adminUser, conductorUser]);
    saveStore(STORES.CONFIG, {
      boleta_counter: 0,
      empresa_nombre: 'Tierrapy S.R.L.',
      empresa_ruc: '',
      empresa_direccion: ''
    });
  }
  return true;
}

export async function getAllUsers() {
  return loadStore(STORES.USERS);
}

export async function getUserByUsername(username) {
  const users = loadStore(STORES.USERS);
  return users.find(u => u.username === username) || null;
}

export async function addUser(data) {
  const users = loadStore(STORES.USERS);
  const newUser = { ...data, id: generateId() };
  users.push(newUser);
  saveStore(STORES.USERS, users);
  return newUser;
}

export async function updateUser(id, data) {
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
  const users = loadStore(STORES.USERS);
  const filtered = users.filter(u => Number(u.id) !== Number(id));
  saveStore(STORES.USERS, filtered);
}

export async function getAllBoletas() {
  return loadStore(STORES.BOLETAS);
}

export async function getBoletaById(id) {
  const boletas = loadStore(STORES.BOLETAS);
  return boletas.find(b => Number(b.id) === Number(id)) || null;
}

export async function addBoleta(data) {
  const boletas = loadStore(STORES.BOLETAS);
  const config = loadStore(STORES.CONFIG);
  config.boleta_counter = (config.boleta_counter || 0) + 1;
  saveStore(STORES.CONFIG, config);
  const newBoleta = {
    ...data,
    id: generateId(),
    numero: String(config.boleta_counter).padStart(3, '0'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  delete newBoleta.estado;
  boletas.push(newBoleta);
  saveStore(STORES.BOLETAS, boletas);
  return newBoleta;
}

export async function updateBoleta(id, data) {
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
  const boletas = loadStore(STORES.BOLETAS);
  const filtered = boletas.filter(b => Number(b.id) !== Number(id));
  saveStore(STORES.BOLETAS, filtered);
}

export async function getAllEmpresas() {
  return loadStore(STORES.EMPRESAS);
}

export async function addEmpresa(data) {
  const empresas = loadStore(STORES.EMPRESAS);
  const newEmpresa = { ...data, id: generateId() };
  empresas.push(newEmpresa);
  saveStore(STORES.EMPRESAS, empresas);
  return newEmpresa;
}

export async function updateEmpresa(id, data) {
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
  const empresas = loadStore(STORES.EMPRESAS);
  const filtered = empresas.filter(e => Number(e.id) !== Number(id));
  saveStore(STORES.EMPRESAS, filtered);
}

export async function getConfig() {
  return loadStore(STORES.CONFIG) || {};
}

export async function updateConfig(data) {
  const config = loadStore(STORES.CONFIG);
  const updated = { ...config, ...data };
  saveStore(STORES.CONFIG, updated);
  return updated;
}


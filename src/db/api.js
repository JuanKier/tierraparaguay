const API = '/api';

async function req(method, path, body) {
  const opts = { method, headers: {} };
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const r = await fetch(API + path, opts);
  if (!r.ok) throw new Error(`API ${method} ${path}: ${r.status}`);
  const data = await r.json();
  if (data === null || data === undefined) return null;
  return data;
}

export async function initDB() {
  try {
    const r = await req('POST', '/seed');
    if (r.message === 'already seeded') return;
    console.log('DB seeded');
  } catch { console.log('Server not available, using localStorage fallback'); }
}

export async function clearDatabase() {
  localStorage.clear();
}

// Users
export const getAllUsers = () => req('GET', '/users');
export const getUserByUsername = (username) => req('GET', '/users/' + encodeURIComponent(username));
export const addUser = (data) => req('POST', '/users', data);
export const updateUser = (id, data) => req('PUT', '/users/' + id, data);
export const deleteUser = (id) => req('DELETE', '/users/' + id);

// Empresas
export const getAllEmpresas = () => req('GET', '/empresas');
export const getEmpresaById = (id) => req('GET', '/empresas/' + id);
export const addEmpresa = (data) => req('POST', '/empresas', data);
export const updateEmpresa = (id, data) => req('PUT', '/empresas/' + id, data);
export const deleteEmpresa = (id) => req('DELETE', '/empresas/' + id);

// Vehiculos
export const getAllVehiculos = () => req('GET', '/vehiculos');
export const getVehiculoById = (id) => req('GET', '/vehiculos/' + id);
export const addVehiculo = (data) => req('POST', '/vehiculos', data);
export const updateVehiculo = (id, data) => req('PUT', '/vehiculos/' + id, data);
export const deleteVehiculo = (id) => req('DELETE', '/vehiculos/' + id);

// Mercaderias
export const getAllMercaderias = () => req('GET', '/mercaderias');
export const addMercaderia = (data) => req('POST', '/mercaderias', data);
export const updateMercaderia = (id, data) => req('PUT', '/mercaderias/' + id, data);
export const deleteMercaderia = (id) => req('DELETE', '/mercaderias/' + id);

// Boletas
export const getAllBoletas = () => req('GET', '/boletas');
export const getBoletaById = (id) => req('GET', '/boletas/' + id);
export const addBoleta = (data) => req('POST', '/boletas', data);
export const updateBoleta = (id, data) => req('PUT', '/boletas/' + id, data);
export const deleteBoleta = (id) => req('DELETE', '/boletas/' + id);

// Config
export const getConfig = () => req('GET', '/config');
export const updateConfig = (data) => req('POST', '/config', data);
export const exportDatabase = () => req('GET', '/export');
export const importDatabase = (data) => req('POST', '/import', data);

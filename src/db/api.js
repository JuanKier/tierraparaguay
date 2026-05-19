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

export async function getAllUsers() { return req('GET', '/users'); }
export async function getUserByUsername(username) { return req('GET', '/users/' + encodeURIComponent(username)); }
export async function addUser(data) { return req('POST', '/users', data); }
export async function updateUser(id, data) { return req('PUT', '/users/' + id, data); }
export async function deleteUser(id) { return req('DELETE', '/users/' + id); }

export async function getAllEmpresas() { return req('GET', '/empresas'); }
export async function getEmpresaById(id) { return req('GET', '/empresas/' + id); }
export async function addEmpresa(data) { return req('POST', '/empresas', data); }
export async function updateEmpresa(id, data) { return req('PUT', '/empresas/' + id, data); }
export async function deleteEmpresa(id) { return req('DELETE', '/empresas/' + id); }

export async function getAllVehiculos() { return req('GET', '/vehiculos'); }
export async function getVehiculoById(id) { return req('GET', '/vehiculos/' + id); }
export async function addVehiculo(data) { return req('POST', '/vehiculos', data); }
export async function updateVehiculo(id, data) { return req('PUT', '/vehiculos/' + id, data); }
export async function deleteVehiculo(id) { return req('DELETE', '/vehiculos/' + id); }

export async function getAllMercaderias() { return req('GET', '/mercaderias'); }
export async function addMercaderia(data) { return req('POST', '/mercaderias', data); }
export async function updateMercaderia(id, data) { return req('PUT', '/mercaderias/' + id, data); }
export async function deleteMercaderia(id) { return req('DELETE', '/mercaderias/' + id); }

export async function getAllBoletas() { return req('GET', '/boletas'); }
export async function getBoletaById(id) { return req('GET', '/boletas/' + id); }
export async function addBoleta(data) { return req('POST', '/boletas', data); }
export async function updateBoleta(id, data) { return req('PUT', '/boletas/' + id, data); }
export async function deleteBoleta(id) { return req('DELETE', '/boletas/' + id); }

export async function getConfig() { return req('GET', '/config'); }
export async function updateConfig(data) { return req('POST', '/config', data); }
export async function exportDatabase() { return req('GET', '/export'); }
export async function importDatabase(data) { return req('POST', '/import', data); }

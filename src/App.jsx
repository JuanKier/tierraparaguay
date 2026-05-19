import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BoletasList from './components/BoletasList';
import BoletaForm from './components/BoletaForm';
import BoletaDetail from './components/BoletaDetail';
import Conductores from './components/Conductores';
import Empresas from './components/Empresas';
import Remisiones from './components/Remisiones';
import Vehiculos from './components/Vehiculos';
import Mercaderias from './components/Mercaderias';
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import { initDB, getUserByUsername } from './db/database';
import { LOGO_BASE64 } from './logobase64';
import './index.css';

function BackButtonHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    let unregister;
    import('@capacitor/app').then(({ App }) => {
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });
    }).catch(() => {});
    return () => { unregister?.(); };
  }, []);
  return null;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initDB().then(() => {
      const savedUser = localStorage.getItem('tierrapy_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      const savedTheme = localStorage.getItem('tierrapy_theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
      setLoading(false);
    });
  }, []);

  const toggleDark = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('tierrapy_theme', isDark ? 'dark' : 'light');
  };

  const handleLogin = async (username, password) => {
    const foundUser = await getUserByUsername(username);
    if (foundUser && foundUser.password === password && foundUser.active) {
      setUser(foundUser);
      localStorage.setItem('tierrapy_user', JSON.stringify(foundUser));
      return { success: true };
    }
    return { success: false, message: 'Usuario o contrasena incorrectos' };
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('tierrapy_user');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-600">
        <div className="text-center">
           <img src={LOGO_BASE64} alt="Tierra Paraguay E.A.S" className="w-24 h-24 rounded-full object-cover mx-auto mb-4 shadow-lg" />
          <p className="text-white text-xl font-bold">Tierra Paraguay E.A.S</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <HashRouter>
        <BackButtonHandler />
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/nueva" element={
            user ? <BoletaForm user={user} /> : <Navigate to="/login" replace />
          } />
          <Route path="/editar/:id" element={
            user ? <BoletaForm user={user} /> : <Navigate to="/login" replace />
          } />
          <Route path="/" element={
            user ? <Dashboard user={user} onLogout={handleLogout} toggleDark={toggleDark} /> : <Navigate to="/login" replace />
          }>
            <Route index element={<BoletasList user={user} />} />
            <Route path="boleta/:id" element={<BoletaDetail user={user} />} />
            <Route path="conductores" element={<Conductores user={user} />} />
            <Route path="empresas" element={<Empresas user={user} />} />
            <Route path="remisiones" element={<Remisiones user={user} />} />
            <Route path="vehiculos" element={<Vehiculos user={user} />} />
            <Route path="mercaderias" element={<Mercaderias user={user} />} />
            <Route path="settings" element={<Settings user={user} />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;

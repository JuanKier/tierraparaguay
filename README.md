# Tierrapy - Boletas de Remisión

Aplicación web y móvil para la gestión de boletas de remisión de mercadería (tierra, arena, piedra, etc).

## Características

- **Gestión de Boletas**: Crear, editar y ver boletas de remisión
- **Múltiples Servicios**: Una boleta puede tener varios servicios (diferentes fechas/materiales)
- **PDF**: Generación de PDF de la boleta
- **WhatsApp**: Envío directo por WhatsApp
- **Gestión de Conductores**: Administrar conductores y sus vehículos
- **Gestión de Empresas**: Administrar empresas cliente
- **Autenticación**: Sistema de login para conductores y administradores
- **Base de Datos Local**: Usa localStorage, sin necesidad de internet
- **Android**: Compilable a APK con Capacitor

## Tecnologías

- React 19
- Vite 7
- Tailwind CSS 3
- Capacitor 8 (Android)
- LocalStorage (localforage)
- jsPDF + html2canvas (generación de PDF)

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Sincronizar con Android
npx cap sync android

# Abrir en Android Studio
npx cap open android
```

## Uso

1. **Login**: 
   - Usuario por defecto: `admin`
   - Contraseña: `admin123`

2. **Crear Boleta**:
   - Click en "Nueva Boleta"
   - Seleccionar conductor (se autocompleta con el usuario logueado)
   - Seleccionar o crear empresa
   - Agregar servicios (tipo de mercadería, cantidad, fecha)
   - Agregar número de factura (opcional)
   - Agregar observación (opcional)
   - Guardar boleta

3. **Ver/Compartir Boleta**:
   - Click en una boleta de la lista
   - Descargar PDF
   - Enviar por WhatsApp

## Estructura del Proyecto

```
Tierrapy/
├── src/
│   ├── components/     # Componentes React
│   ├── pages/          # Páginas (Login, Dashboard)
│   ├── db/             # Base de datos local
│   ├── services/       # Servicios (auth, etc)
│   └── utils/          # Utilidades
├── android/            # Proyecto Android (Capacitor)
└── dist/               # Build de producción
```

## Compilar APK

1. Build del proyecto:
   ```bash
   npm run build
   ```

2. Sincronizar con Capacitor:
   ```bash
   npx cap sync android
   ```

3. Abrir Android Studio:
   ```bash
   npx cap open android
   ```

4. En Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)

## Licencia

MIT

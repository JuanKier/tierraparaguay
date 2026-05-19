# Manual de Usuario — Tierrapy (Boletas de Remisión)

**Versión:** 20  
**Empresa:** Tierra Paraguay E.A.S  
**RUC:** 80158613-5

---

## Índice

1. [Introducción](#1-introducción)
2. [Inicio de Sesión](#2-inicio-de-sesión)
3. [Panel Principal (Dashboard)](#3-panel-principal-dashboard)
4. [Boletas de Remisión](#4-boletas-de-remisión)
5. [Remisiones (Búsqueda y Filtros)](#5-remisiones-búsqueda-y-filtros)
6. [Administración](#6-administración)
   - 6.1 [Conductores](#61-conductores)
   - 6.2 [Empresas](#62-empresas)
   - 6.3 [Vehículos](#63-vehículos)
   - 6.4 [Mercaderías / Servicios](#64-mercaderías--servicios)
7. [Configuración (Solo Super Admin)](#7-configuración-solo-super-admin)
8. [Roles y Permisos](#8-roles-y-permisos)

---

## 1. Introducción

**Tierrapy** es una aplicación móvil para la gestión y generación de **Boletas de Remisión**. Permite crear boletas, asociarlas a empresas y conductores, llevar un registro de servicios (mercaderías transportadas), y compartir las boletas en formato PDF, imagen o WhatsApp.

Toda la información se almacena de forma local en el dispositivo — no requiere conexión a internet para funcionar.

---

## 2. Inicio de Sesión

Al abrir la aplicación verás la pantalla de login:

<img src="screenshots/00-login.png" width="250" alt="Pantalla de inicio de sesión"/>

1. Ingresa tu **usuario** (nombre de usuario asignado por el administrador)
2. Ingresa tu **contraseña**
3. Presiona **Ingresar**

Si los datos son correctos accederás al panel principal. Si no, verás un mensaje de error en rojo.

> **Nota:** La aplicación recuerda tu sesión. Para salir, usa el botón **Salir** en la esquina superior derecha del panel principal.

---

## 3. Panel Principal (Dashboard)

El panel principal es el centro de navegación de la app. La vista varía según el rol del usuario.

<img src="screenshots/01-dashboard-admin.png" width="250" alt="Dashboard vista administrador"/>
<img src="screenshots/09-dashboard-user.png" width="250" alt="Dashboard vista usuario conductor"/>

> Izquierda: Dashboard de Administrador. Derecha: Dashboard de Usuario (conductor).

### Barra superior (Header)
- **Logo + nombre** de la empresa
- **Modo oscuro** 🌙 (alterna entre tema claro y oscuro)
- **Nombre del usuario + rol** (Super Admin / Admin / Usuario)
- **Salir** — cierra la sesión

### Menú lateral (Sidebar)
Al presionar el ícono de menú (tres líneas) en la esquina superior izquierda, se despliega el panel de navegación:

<img src="screenshots/01b-sidebar-admin.png" width="250" alt="Menú lateral desplegado"/>

Las opciones visibles dependen de tu rol:

| Opción | Descripción |
|--------|-------------|
| Boletas | Listado de todas las boletas |
| Nueva Boleta | Crear una boleta de remisión |
| Remisiones | Búsqueda avanzada con filtros |
| Vehículos | Gestión de vehículos (admin) |
| Conductores | Gestión de conductores/usuarios (admin) |
| Empresas | Gestión de empresas (admin) |
| Mercaderías | Catálogo de mercaderías/servicios (admin) |
| Configuración | Exportar/importar base de datos (solo Super Admin) |

### Accesos rápidos
Tarjetas de acceso directo a las funciones más usadas, visibles en la pantalla principal.

### Pie de página
"DATAKIER © 2026 - Todos los derechos reservados"

---

## 4. Boletas de Remisión

### 4.1 Listado de Boletas

En la pantalla principal (Boletas) se muestran todas las boletas ordenadas de la más reciente a la más antigua.

Cada tarjeta muestra:
- **Número** de boleta
- **Fecha**
- **Empresa** (nombre)
- **Chapa** (patente del vehículo)
- **Total m³** y **conductor**

Para ver el detalle de una boleta, **presiona sobre ella**.

**Admin / Super Admin:** verás un ícono de papelera 🗑️ para eliminar boletas.

### 4.2 Crear una Boleta

Desde el botón **Nueva Boleta** (menú lateral o acceso rápido) se abre el formulario de creación:

<img src="screenshots/02-nueva-boleta.png" width="250" alt="Formulario de nueva boleta"/>

1. **Fecha** — selecciona la fecha (por defecto hoy)
2. **Conductor** — selecciona de la lista (solo admin puede cambiarlo; los usuarios conductores ven su propio nombre fijo)
3. **Chapa** — patente del vehículo (se autocompleta si el conductor tiene vehículo asignado)
4. **Empresa** — selecciona la empresa destino (se autocompleta dirección y teléfono)
5. **Dirección de entrega** — se autocompleta, puedes editarlo
6. **N° Factura** — opcional
7. **Servicios** — agrega uno o más servicios:
   - Fecha del servicio
   - Tipo de mercadería (seleccionar del catálogo)
   - Cantidad
   - Unidad (m³ u Horas)
   - Descripción (opcional)
8. **Observación** — texto libre opcional
9. Presiona **Crear Boleta** para guardar

### 4.3 Editar una Boleta

Desde el detalle de la boleta, los **admin y super admin** ven un ícono de lápiz ✏️ que permite editar los datos. El formulario es el mismo que el de creación.

### 4.4 Detalle y Compartir

Al abrir una boleta ves la información completa y tres botones de acción:

<img src="screenshots/03-boleta-detalle.png" width="250" alt="Detalle de boleta"/>

| Botón | Función |
|-------|---------|
| **PDF** | Genera un archivo PDF y abre el panel de compartir para enviarlo por cualquier app |
| **VER** | Muestra la boleta en pantalla completa con formato similar al PDF. Desde ahí puedes compartir como **JPG** |
| **WhatsApp** | Abre WhatsApp con un mensaje de texto con los datos de la boleta |

---

## 5. Remisiones (Búsqueda y Filtros)

La sección **Remisiones** permite buscar boletas aplicando filtros:

<img src="screenshots/04-remisiones.png" width="250" alt="Pantalla de remisiones con filtros"/>

- **Empresa** — seleccionar una empresa específica o "Todas"
- **Fecha desde / Fecha hasta** — rango de fechas
- **Conductor** — seleccionar un conductor o "Todos"
- **Vehículo** — seleccionar un vehículo o "Todos"

Presiona **Limpiar filtros** para volver al listado completo.

Cada resultado tiene un botón **Ver** para ir al detalle de la boleta.

---

## 6. Administración

Las siguientes secciones están disponibles solo para usuarios con rol **Admin** o **Super Admin**.

### 6.1 Conductores

Gestión de usuarios del sistema.

<img src="screenshots/05-conductores.png" width="250" alt="Listado de conductores"/>

- **Lista**: muestra todos los conductores/usuarios (excepto el superusuario DATAKIER)
- **Crear**: presiona **+** y completa:
  - Nombre completo
  - Usuario (se autogenera, se puede editar manualmente)
  - Contraseña
  - Teléfono (opcional)
  - Vehículo asignado (opcional)
  - Rol: **Usuario** (conductor) o **Administrador**
  - Activo: desmarcar para deshabilitar el acceso
- **Editar**: presiona el lápiz ✏️ en la tarjeta del conductor
- **Eliminar**: presiona la papelera 🗑️ (requiere confirmación)

Cada tarjeta muestra: nombre, usuario, vehículo, teléfono, rol (Admin/Usuario) y estado (Activo/Inactivo).

### 6.2 Empresas

Clientes/empresas destino de las boletas.

<img src="screenshots/06-empresas.png" width="250" alt="Listado de empresas"/>

- **Crear**: presiona **+** y completa nombre, dirección, RUC y teléfono
- **Editar / Eliminar**: íconos en cada tarjeta

### 6.3 Vehículos

Registro de vehículos disponibles.

<img src="screenshots/07-vehiculos.png" width="250" alt="Listado de vehículos"/>

- **Crear**: completa tipo (Camión, Camioneta, etc.), marca, modelo, color, chapa y conductor asignado (opcional)
- **Editar / Eliminar**: íconos en cada tarjeta

### 6.4 Mercaderías / Servicios

Catálogo de tipos de mercadería que se cargan en las boletas.

<img src="screenshots/08-mercaderias.png" width="250" alt="Catálogo de mercaderías"/>

- Vienen precargados: Arena, Tierra, Piedra, Otro
- **Crear**: presiona **+** e ingresa el nombre
- **Editar**: cambia el nombre
- **Eliminar**: elimina un tipo (no afecta boletas existentes)

---

## 7. Configuración (Solo Super Admin)

Accesible únicamente para el usuario **Super Admin** (DATAKIER).

### Exportar Base de Datos
Genera un archivo `.json` con todos los datos (boletas, usuarios, empresas, vehículos, mercaderías). Sirve como respaldo.

### Importar Base de Datos
Permite restaurar una base de datos desde un archivo `.json` previamente exportado. **Reemplaza todos los datos actuales.** Después de importar, la aplicación se debe recargar.

---

## 8. Roles y Permisos

| Funcionalidad | Usuario (user) | Admin | Super Admin |
|---------------|:---:|:-----:|:-----------:|
| Iniciar sesión | ✅ | ✅ | ✅ |
| Ver listado de boletas | ✅ | ✅ | ✅ |
| Crear boleta | ✅ | ✅ | ✅ |
| Editar boleta | — | ✅ | ✅ |
| Eliminar boleta | — | ✅ | ✅ |
| Compartir PDF / JPG / WhatsApp | ✅ | ✅ | ✅ |
| Remisiones (búsqueda) | ✅ | ✅ | ✅ |
| Gestionar conductores | — | ✅ | ✅ |
| Gestionar empresas | — | ✅ | ✅ |
| Gestionar vehículos | — | ✅ | ✅ |
| Gestionar mercaderías | — | ✅ | ✅ |
| Configuración (exportar/importar DB) | — | — | ✅ |

### Usuarios predefinidos

| Usuario | Contraseña | Rol |
|---------|-----------|:---:|
| admin | admin123 | Admin |
| juan | juan123 | Usuario |

> El superusuario DATAKIER existe en el sistema pero no aparece en los listados. Solo se usa para tareas de configuración y respaldo.

---

*Documentación generada para Tierrapy v19*

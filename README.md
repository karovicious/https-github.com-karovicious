# 🔥 Karo Vicious69 - Club Swinger Exclusivo

<div align="center">
  <img src="public/karologo_400x400.jpg" alt="Karo Vicious Logo" width="200"/>
  
  <p><em>Experiencias exclusivas para adultos en Toluca, Estado de México</em></p>
  
  [![Live Demo](https://img.shields.io/badge/🌐_Demo_Live-FF1493?style=for-the-badge)](https://karo-vicous-reservations.vercel.app)
  [![Download APK](https://img.shields.io/badge/📱_Descargar_App-0078D7?style=for-the-badge&logo=android&logoColor=white)](https://github.com/karovicious/karovicious/releases/download/untagged-be3aa0c534287476797c/app-release.apk)
  
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
</div>

## 🎯 Objetivo Principal

**Karo Vicious69** es una plataforma web y móvil exclusiva diseñada para la gestión integral de un club swinger de alta gama en Toluca, Estado de México. El sistema facilita la administración de membresías, reservas de eventos, pagos y comunicación entre miembros de una comunidad selecta y discreta.

## 🌟 Características Principales

### 🔐 Sistema de Autenticación Avanzado
- Registro con confirmación de email personalizada
- Recuperación de contraseña segura
- Sesiones persistentes y seguras
- Templates de email con branding exclusivo

### 👥 Sistema de Roles Multi-nivel
- **👑 Admin**: Control total del sistema, gestión de usuarios y eventos
- **🎭 Organizer**: Creación y gestión de eventos, moderación
- **💎 User**: Acceso a eventos, reservas y funciones básicas
- Asignación automática de roles para nuevos usuarios

### 📅 Gestión de Eventos y Reservas
- Creación de eventos exclusivos con capacidad limitada
- Sistema de reservas con confirmación automática
- Horarios flexibles y gestión de disponibilidad
- Control de aforo y listas de espera

### 💳 Sistema de Pagos (En Desarrollo)
- Integración con pasarelas de pago seguras
- Membresías premium y eventos de pago
- Historial de transacciones
- Facturación automática

### 📱 Aplicación Móvil Nativa
- App Android con Capacitor
- Sincronización en tiempo real
- Notificaciones push
- Interfaz optimizada para móviles

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** - Biblioteca principal de UI
- **TypeScript** - Tipado estático y mejor DX
- **Tailwind CSS** - Framework de estilos utility-first
- **Vite** - Build tool y desarrollo rápido
- **Lucide React** - Iconografía moderna

### Backend & Base de Datos
- **Supabase** - Backend as a Service
- **PostgreSQL** - Base de datos relacional
- **Row Level Security (RLS)** - Seguridad a nivel de fila
- **Triggers & Functions** - Lógica de negocio en BD

### Autenticación & Seguridad
- **Supabase Auth** - Autenticación completa
- **JWT Tokens** - Tokens seguros
- **Email Templates** - Emails personalizados
- **SMTP Personalizado** - Envío de emails confiable

### Móvil
- **Capacitor** - Framework híbrido
- **Android Studio** - Desarrollo nativo
- **PWA Support** - Progressive Web App

### DevOps & Deployment
- **Vercel** - Hosting y deployment automático
- **GitHub Actions** - CI/CD pipeline
- **Git** - Control de versiones
- **ESLint & Prettier** - Calidad de código

## 📁 Estructura del Proyecto

```
karo-vicous-reservations/
├── 📱 android/                    # Aplicación Android con Capacitor
│   ├── app/
│   │   ├── src/
│   │   └── release/
│   └── gradle/
├── 📧 email-templates/            # Templates personalizados de email
│   ├── confirm-signup-body.html
│   └── confirm-signup-subject.txt
├── 🌐 public/                     # Archivos estáticos públicos
│   ├── app-release.apk
│   ├── favicon.ico
│   ├── karologo_400x400.jpg
│   └── placeholder.svg
├── 💻 src/                        # Código fuente principal
│   ├── components/
│   │   └── ui/                    # Componentes de interfaz
│   ├── hooks/                     # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── integrations/
│   │   └── supabase/              # Configuración Supabase
│   ├── lib/
│   │   └── utils.ts
│   ├── pages/                     # Páginas principales
│   │   ├── Admin.tsx
│   │   ├── AuthCallback.tsx
│   │   ├── Index.tsx
│   │   └── Login.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── 🗄️ supabase/                   # Configuración de base de datos
│   ├── migrations/                # Migraciones SQL
│   └── config.toml
├── ⚙️ Archivos de configuración
│   ├── capacitor.config.ts
│   ├── components.json
│   ├── eslint.config.js
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
└── 📄 README.md
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm o pnpm
- Android Studio (para app móvil)
- Cuenta de Supabase

### Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/karovicious/karovicious.git
cd karo-vicous-reservations

# Instalar dependencias
npm install

# Configurar variables de entorno
# (Configurar Supabase URL y keys)

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build
```

### Configuración de Supabase

1. **Crear proyecto en Supabase**
2. **Configurar autenticación:**
   - Site URL: `https://tu-dominio.vercel.app`
   - Redirect URLs: `https://tu-dominio.vercel.app/**`
3. **Aplicar migraciones SQL**
4. **Configurar templates de email**
5. **Configurar SMTP (opcional)**

### Deployment Móvil

```bash
# Build y sincronizar con Android
npm run build
npx cap copy android
npx cap sync android

# Abrir en Android Studio
npx cap open android
```

## 🎭 Sistema de Roles y Permisos

### 👑 Administrador (Admin)
- **Gestión completa de usuarios**: Crear, editar, eliminar cuentas
- **Control de roles**: Asignar y modificar roles de usuarios
- **Gestión de eventos**: Crear, editar y eliminar cualquier evento
- **Acceso a analytics**: Estadísticas y métricas del sistema
- **Configuración del sistema**: Ajustes globales y parámetros

### 🎭 Organizador (Organizer)
- **Gestión de eventos propios**: Crear y administrar eventos
- **Moderación de contenido**: Revisar y aprobar publicaciones
- **Gestión de reservas**: Confirmar y gestionar reservas de eventos
- **Comunicación con miembros**: Envío de notificaciones y mensajes

### 💎 Usuario (User)
- **Navegación del sitio**: Acceso a contenido público
- **Reserva de eventos**: Reservar lugares en eventos disponibles
- **Perfil personal**: Gestionar información personal
- **Comunicación básica**: Interacción con otros miembros

## 💳 Sistema de Pagos (Roadmap)

### Funcionalidades Planificadas
- **Membresías Premium**: Acceso exclusivo a eventos VIP
- **Eventos de Pago**: Reservas con costo adicional
- **Suscripciones**: Planes mensuales y anuales
- **Pasarelas de Pago**: Stripe, PayPal, transferencias bancarias

## 📱 Aplicación Móvil

### Características
- **Interfaz Nativa**: Experiencia optimizada para móviles
- **Sincronización Offline**: Funcionalidad básica sin conexión
- **Notificaciones Push**: Alertas de eventos y mensajes
- **Instalación PWA**: Instalable desde el navegador

### Instalación Android
1. Descargar APK desde el enlace superior
2. Habilitar "Orígenes desconocidos" en Ajustes > Seguridad
3. Instalar y disfrutar la experiencia móvil

## 🔒 Seguridad y Privacidad

- **Encriptación end-to-end** para datos sensibles
- **Row Level Security (RLS)** en base de datos
- **Autenticación JWT** con tokens seguros
- **Validación de entrada** en frontend y backend
- **Políticas de privacidad** estrictas para datos de usuarios

## 🌐 Demo y Enlaces

- **🌐 Sitio Web**: [https://karo-vicous-reservations.vercel.app](https://karo-vicous-reservations.vercel.app)
- **📱 Descargar APK**: [Aplicación Android](https://github.com/karovicious/karovicious/releases/download/untagged-be3aa0c534287476797c/app-release.apk)
- **📧 Contacto**: info@karovicious69.com

## 👨‍💻 Desarrollador

**Desarrollado por**: complicesconecta (wacko ing Juan Carlos M.N.) & Equipo de Desarrollo Karo Vicious69
**Ubicación**: Toluca, Estado de México, México  
**Especialización**: Desarrollo Full-Stack, Aplicaciones Web y Móviles  

### 🛠️ Stack de Desarrollo
- Frontend: React, TypeScript, Tailwind CSS
- Backend: Supabase, PostgreSQL
- Móvil: Capacitor, Android
- DevOps: Vercel, GitHub Actions

### 📞 Contacto del Desarrollador
- **📧 Email**: complicesconecta@gmail.com
- **🌐 Portfolio**: [En desarrollo]
- **💼 LinkedIn**: [En desarrollo]
- **🐙 GitHub**: [karovicious](https://github.com/karovicious)

## 🤝 Contribuciones

Este es un proyecto privado y exclusivo. Las contribuciones están limitadas al equipo de desarrollo autorizado.

## 📄 Licencia

Este proyecto está bajo **MIT License**. Ver el archivo [LICENSE](LICENSE) para más detalles.

## ⚠️ Aviso Legal

Este software está diseñado exclusivamente para la gestión de un club privado para adultos. El uso está restringido a mayores de edad y miembros autorizados. El acceso y uso del sistema implica la aceptación de términos y condiciones específicos.

---

<div align="center">
  <p><strong>🔥 Karo Vicious69 - Experiencias Exclusivas para Adultos 🔥</strong></p>
  <p><em>Toluca, Estado de México | © 2025</em></p>
</div>

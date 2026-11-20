# Control de Accesos — Tracking + Geocercas

Monorepo: **Svelte (web)** + **Node/Express (API)** + **MongoDB Atlas**.  
Mapa Leaflet, geocercas y movimiento de dispositivos en tiempo real.  
Cliente Flutter (sockets) pendiente; la API ya expone **REST + Socket.io**.

```
ControlAccesos/
├── apps/web   → Frontend (Vercel)
├── apps/api   → Backend REST (+ Socket.io en host Node)
├── vercel.json
└── package.json
```

## Arranque local

```bash
cp .env.example .env
# Edita MONGODB_URI y JWT_SECRET

npm install
npm run seed
npm run dev
```

- Web: http://localhost:5173  
- API: http://localhost:4000/api/health  
- Login seed: `admin@controlaccesos.mx` / `Admin123!`

## Publicar en Vercel (monorepo)

Vercel no mantiene WebSockets persistentes. Por eso el despliegue recomendado es:

| Proyecto Vercel | Root Directory | Qué hace |
|-----------------|----------------|----------|
| **web** | `apps/web` (o raíz con `vercel.json`) | SPA Svelte |
| **api** | `apps/api` | REST serverless (móviles vía HTTP) |

### 1) Proyecto API

1. En Vercel → *Add New Project* → este repo  
2. **Root Directory:** `apps/api`  
3. Variables de entorno:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=secreto_largo
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://tu-frontend.vercel.app
CORS_VERCEL_PREVIEWS=true
TZ=America/Mexico_City
NODE_ENV=production
```

4. Deploy → anota la URL, ej. `https://control-accesos-api.vercel.app`

### 2) Proyecto Web

1. Otro proyecto Vercel del mismo repo  
2. **Root Directory:** vacío (usa `vercel.json` de la raíz) **o** `apps/web`  
3. Variables de entorno **de build**:

```env
VITE_API_URL=https://control-accesos-api.vercel.app
```

4. Si más adelante tienes API con sockets (Railway/Render):

```env
VITE_SOCKET_URL=https://tu-api-node.ejemplo.com
```

### 3) CORS

En la API, `CORS_ORIGIN` debe incluir la URL del frontend.  
Los clientes **móviles** (sin header `Origin`) ya están permitidos.

## Móviles (Flutter) — API accesible

### Opción A — API en Vercel (REST)

```http
POST /api/auth/login
POST /api/tracking/ubicacion
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "identificador": "DEV-001",
  "lat": 19.4326,
  "lng": -99.1332,
  "accuracy": 10
}
```

### Opción B — API Node persistente (Socket.io)

Despliega `apps/api` con el `Dockerfile` en Railway / Render / Fly:

```bash
docker build -f apps/api/Dockerfile -t control-accesos-api apps/api
```

Variables: las mismas + `HOST=0.0.0.0` + `PORT` del proveedor.

Socket:

```
auth: { token }
query: { cliente: movil, deviceId: DEV-001 }
evento: ubicacion:actualizar → { identificador, lat, lng, ... }
```

## Endpoints principales

| Ruta | Uso |
|------|-----|
| `GET /api/health` | Salud |
| `POST /api/auth/login` | JWT |
| `/api/dispositivos` | CRUD móviles |
| `/api/geocercas` | CRUD geocercas |
| `/api/eventos` | Entradas / salidas |
| `POST /api/tracking/ubicacion` | Ubicación REST (móvil / Vercel) |

## Scripts

```bash
npm run dev        # API + Web
npm run build:web  # Build para Vercel
npm run seed       # Datos iniciales
npm run start:api  # Solo API (producción)
```

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

## Publicar en Vercel (Services — un proyecto)

Un solo proyecto Vercel con dos services definidos en `vercel.json`:

| Service | Root | Público | Path |
|---------|------|---------|------|
| `api` | `apps/api` | sí | `/api/*` |
| `web` | `apps/web` | sí | `/*` (catch-all) |

No hay **bindings** internos: el web es SPA (navegador) y habla por same-origin `/api/...`; Flutter también usa la URL pública `/api/...`.

### Deploy

1. Importa el repo en Vercel (root del monorepo).  
2. Variables de entorno del proyecto:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=secreto_largo
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
CORS_VERCEL_PREVIEWS=true
TZ=America/Mexico_City
NODE_ENV=production
```

3. No definas `VITE_API_URL` (el cliente usa `/api` relativo).  
4. Local con services: `vercel dev` (inyecta bindings si los hubiera).

**Nota:** Socket.io no corre en el service `api` serverless. Flutter → `POST /api/tracking/ubicacion`. Para sockets, despliega `apps/api` con el Dockerfile en un host Node persistente.

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

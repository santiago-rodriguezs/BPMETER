# 🚀 Guía de Deployment - BPMETER

## Frontend (Vercel) ✅ Ya configurado

Tu frontend ya está conectado a Vercel y se deploya automáticamente.

### Configurar variable de entorno en Vercel:

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega:
   ```
   Name: NEXT_PUBLIC_BACKEND_URL
   Value: https://tu-backend.onrender.com
   ```
4. Redeploy (Deploy → Redeploy)

---

## Backend (Render.com) 🐍

### Paso 1: Crear cuenta en Render
1. Ve a [render.com](https://render.com)
2. Sign up con GitHub (gratis, sin tarjeta)

### Paso 2: Crear Web Service
1. Click en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub
3. Configuración:
   - **Name**: `bpmeter-backend` (o el que quieras)
   - **Environment**: `Python 3`
   - **Region**: Elige el más cercano (US East es rápido)
   - **Branch**: `main` (o tu rama principal)
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 120 server:app`
   
   ⚠️ **IMPORTANTE**: Usa `--workers 1` (no 2 o más). El backend necesita mantener estado (historial de audio) 
   y múltiples workers causan que el historial se distribuya entre procesos separados.

4. **Environment Variables** (Advanced):
   ```
   FLASK_ENV=production
   PYTHON_VERSION=3.11.0
   ```

5. Click **"Create Web Service"**

### Paso 3: Esperar el deploy
- Primera vez tarda ~5-10 minutos (instala librosa, scipy, etc.)
- Te da una URL como: `https://bpmeter-backend.onrender.com`

### Paso 4: Verificar que funciona
```bash
curl https://tu-backend.onrender.com/api/health
```

Debería responder:
```json
{"status": "ok", "message": "BPM Detection API is running"}
```

---

## Configuración CORS importante ⚠️

En `backend/server.py`, actualiza la línea con tu dominio real de Vercel:

```python
CORS(app, origins=[
    'https://*.vercel.app',
    'https://tu-app-real.vercel.app',  # 👈 CAMBIA ESTO
])
```

---

## Alternativa: Railway.app 🚂

Si prefieres Railway en lugar de Render:

1. [railway.app](https://railway.app) → Sign up con GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Selecciona tu repo
4. Railway detecta Python automáticamente
5. Configura:
   - **Root Directory**: `backend`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 4 server:app`
6. Agrega domain público en Settings
7. Copia la URL y ponla en Vercel como `NEXT_PUBLIC_BACKEND_URL`

---

## Testing en producción 🧪

1. Abre tu app en Vercel: `https://tu-app.vercel.app`
2. Presiona **"Start Detection"**
3. Verifica en Network tab (DevTools) que las requests van a tu backend en Render
4. Debería funcionar igual que en local 🎉

---

## Troubleshooting 🔧

### Backend dice "Disconnected"
- Verifica que la URL del backend en Vercel sea correcta
- Chequea que el backend esté "running" en Render
- Revisa logs en Render: Dashboard → Logs

### CORS errors en console
- Actualiza los `origins` en `server.py` con tu dominio real de Vercel
- Redeploy el backend en Render

### BPM siempre es 0 en producción (pero funciona en local)
- **Causa**: Múltiples workers de Gunicorn distribuyen las requests
- **Solución**: Usar `--workers 1` en el Start Command
- El backend necesita acumular historial de audio (3+ segundos) en un solo proceso
- Con múltiples workers, cada uno tiene su propio historial separado y nunca acumula suficiente

### Backend muy lento
- Render tier gratis se "duerme" después de 15 min sin uso
- Primera request tarda ~30 seg (es normal)
- Considera Railway (no se duerme) o upgrade a Render paid

---

## Costos 💰

- **Vercel**: Gratis (plan Hobby)
- **Render**: Gratis (plan Free) - se duerme después de 15 min inactivo
- **Railway**: Gratis con $5/mes de crédito (500 horas/mes)

**Recomendación**: Empieza con Render gratis, funciona perfecto para este proyecto.

---

## ¿Necesitas ayuda?

Si algo no funciona, revisa:
1. Logs del backend en Render
2. Console del browser (F12) para ver errores CORS
3. Verifica que `NEXT_PUBLIC_BACKEND_URL` esté bien configurado


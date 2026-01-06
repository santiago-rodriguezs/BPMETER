# 🚀 PRUEBA AHORA - Paso a Paso

## OPCIÓN 1: Script Automático (Más Fácil)

```bash
./start-dev.sh
```

Este script se encarga de todo automáticamente.

---

## OPCIÓN 2: Manual (Si hay problemas)

### Paso 1: Backend

```bash
cd backend

# Si tienes Python 3.11 o anterior (RECOMENDADO):
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Si solo tienes Python 3.13, intenta:
python3.13 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install flask flask-cors
pip install --only-binary :all: numpy scipy librosa soundfile
```

### Paso 2: Iniciar Backend

```bash
python server.py
```

Debes ver:
```
🎵 BPMETER Backend Server
Starting on http://localhost:5000
```

### Paso 3: Frontend (Nueva Terminal)

```bash
cd frontend
npm install
npm run dev
```

Debes ver:
```
▲ Next.js
- Local: http://localhost:3000
✓ Ready
```

### Paso 4: Abrir Navegador

```
http://localhost:3000
```

✅ Debe mostrar "✅ Backend conectado"

### Paso 5: Probar

1. Click "Iniciar Detección"
2. Permite micrófono
3. Pon música
4. Espera 10 segundos
5. ¡Ve el BPM!

---

## Si Python 3.13 Da Problemas

Instala Python 3.11:

```bash
# Ubuntu/Debian:
sudo apt install python3.11 python3.11-venv

# Mac:
brew install python@3.11

# Luego usa python3.11 en vez de python3
```

---

## Verificar Instalación

```bash
# Backend:
curl http://localhost:5000/api/health

# Debe responder:
# {"status":"healthy","backend":"librosa","version":"2.0","ready":true}
```

---

## Frontend Sin Backend (Solo para probar UI)

```bash
cd frontend
npm run dev
```

Abre http://localhost:3000

Puedes probar:
- Tap Tempo (funciona sin backend)
- UI
- Settings

Pero **NO funcionará** "Iniciar Detección" sin backend.

---

**¿Problemas?** Lee `TESTING_GUIDE.md` para troubleshooting detallado.


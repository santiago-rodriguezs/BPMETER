# 🎵 EMPEZAR AQUÍ - BPMETER

## ✅ Proyecto Listo

Tu proyecto BPMETER está configurado y listo para probar con:
- ✅ **Backend Python + Librosa** (detección profesional ±0.5 BPM)
- ✅ **Frontend Next.js** (UI moderna + PWA)
- ✅ **Conexión HTTP** entre ambos
- ✅ **Scripts de inicio** automatizados

---

## 🚀 PRUEBA EN 3 PASOS

### Paso 1: Backend (Terminal 1)

```bash
cd backend

# Primera vez - Instalar dependencias:
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Iniciar servidor:
python server.py
```

✅ **Éxito:** Debes ver `Starting on http://localhost:5000`

### Paso 2: Frontend (Terminal 2)

```bash
cd frontend

# Primera vez - Instalar dependencias:
npm install

# Iniciar servidor:
npm run dev
```

✅ **Éxito:** Debes ver `Local: http://localhost:3000`

### Paso 3: Probar (Navegador)

1. Abre: **http://localhost:3000**
2. Verifica: "✅ Backend conectado"
3. Click: **"Iniciar Detección"**
4. Permite: Acceso al micrófono
5. Pon música cerca del dispositivo
6. Espera: 10 segundos
7. **¡Observa el BPM detectándose en tiempo real!** 🎉

---

## ⚡ Método Rápido (Automático)

```bash
./start-dev.sh
```

Este script inicia ambos servicios automáticamente.

---

## 🔍 Verificar que Funciona

### Test Backend
```bash
curl http://localhost:5000/api/health
```

Respuesta esperada:
```json
{"status":"healthy","backend":"librosa","version":"2.0","ready":true}
```

### Test Frontend
Abre: http://localhost:3000

Debe mostrar:
- ✅ "Backend conectado" en verde
- Botón "Iniciar Detección" habilitado
- UI completa de BPMETER

---

## 🐛 Si Algo Falla

### Python 3.13 da problemas?

Usa Python 3.11 (más estable con scipy/numpy):

```bash
# Instalar Python 3.11:
sudo apt install python3.11 python3.11-venv  # Ubuntu
brew install python@3.11                      # Mac

# Luego:
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python server.py
```

### Backend no instala dependencias?

```bash
cd backend
rm -rf venv
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools
pip install -r requirements.txt
```

### Frontend da errores?

```bash
cd frontend
rm -rf node_modules .next package-lock.json
npm install
npm run dev
```

---

## 📁 Estructura del Proyecto

```
BPMETER/
├── backend/              ← Python + Librosa
│   ├── server.py        ← Servidor Flask
│   └── requirements.txt
│
├── frontend/            ← Next.js + React
│   ├── app/            ← Pages
│   ├── components/     ← UI
│   └── lib/audio/      ← Audio engine
│
├── start-dev.sh        ← Script todo-en-uno
├── EMPEZAR_AQUI.md     ← Este archivo
└── README.md           ← Documentación completa
```

---

## 🎯 Qué Esperar

### En el Backend (Terminal)

```
🎵 BPMETER Backend Server
====================================================
Backend: Librosa (Python)
Accuracy: ±0.5 BPM
Starting on http://localhost:5000
====================================================
 * Running on http://0.0.0.0:5000
```

Cuando detecta BPM verás logs como:
```
INFO:__main__:BPM detected: 128.4 (confidence: 92%)
```

### En el Frontend (Navegador)

1. **Indicador de conexión:** Verde con "✅ Backend conectado"
2. **Botón principal:** "🎤 Iniciar Detección"
3. **Tras iniciar:**
   - Solicitud de permisos de micrófono
   - Medidor de nivel de audio (barra verde)
   - Estado: "🎵 Analizando..."
4. **Tras 10 segundos:**
   - BPM grande con 1 decimal (ej: 128.4)
   - Barra de confianza (0-100%)
   - Indicador verde cuando estable
5. **Consola del navegador (F12):**
   - `✅ Backend connected: {...}`
   - `🎵 BPM Methods: {...}`

---

## 💡 Tips para Mejores Resultados

✅ **DO:**
- Coloca el dispositivo cerca del altavoz
- Usa volumen moderado-alto
- Espera 10 segundos para estabilización
- Usa música con kick fuerte (House, Techno)

❌ **DON'T:**
- No uses en ambientes muy ruidosos
- No esperes resultados instantáneos
- No uses volumen muy bajo

---

## 🎮 Funciones para Probar

1. **Detección en tiempo real:**
   - Pon música variada
   - Cambia de canción
   - Observa cómo se adapta el BPM

2. **Tap Tempo:**
   - Click en "Tap Tempo"
   - Toca 8 veces al ritmo
   - Ve el BPM calculado

3. **Configuración:**
   - Click en ⚙️
   - Ajusta rango de BPM
   - Cambia nivel de suavizado
   - Prueba presets (Hip-Hop, House, D&B)

4. **Reset:**
   - Click en 🔄
   - Limpia estado y empieza de nuevo

---

## 📚 Más Información

- **Guía completa:** `README.md`
- **Pruebas detalladas:** `TESTING_GUIDE.md`
- **Prueba rápida:** `QUICK_TEST.md`
- **Troubleshooting:** `TESTING_GUIDE.md` (sección Troubleshooting)

---

## ✅ Checklist Final

- [ ] Backend inicia sin errores
- [ ] Frontend inicia sin errores
- [ ] http://localhost:3000 carga
- [ ] Indicador muestra "Backend conectado"
- [ ] Micrófono funciona
- [ ] BPM se detecta en tiempo real
- [ ] Confianza sube con el tiempo
- [ ] Tap Tempo funciona
- [ ] Settings abre y funciona

Si todos están ✅ **¡FELICIDADES!** 🎉

Tienes un detector de BPM profesional funcionando con precisión ±0.5 BPM.

---

**¿Problemas?** Lee `TESTING_GUIDE.md` o consulta `README.md`

**¡A detectar BPMs! 🎵🎧**


# ⚡ Prueba Rápida - 2 Minutos

## Terminal 1: Backend

```bash
cd backend
./setup.sh              # Primera vez (instala dependencias)
source venv/bin/activate
python server.py
```

Espera a ver: `Starting on http://localhost:5000`

## Terminal 2: Frontend

```bash
cd frontend
npm install             # Primera vez
npm run dev
```

Espera a ver: `Local: http://localhost:3000`

## Terminal 3: Verificar

```bash
# Backend funcionando?
curl http://localhost:5000/api/health

# Debe responder:
# {"status":"healthy","backend":"librosa","version":"2.0","ready":true}
```

## Navegador

1. Abre: http://localhost:3000
2. Verifica: "✅ Backend conectado"
3. Click: "Iniciar Detección"
4. Permite: Micrófono
5. Pon música cerca
6. Espera 10 segundos
7. ¡Ve el BPM! 🎵

---

## ¿No funciona?

**Backend no inicia:**
```bash
# Si Python 3.13 da problemas, usa 3.11:
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python server.py
```

**Frontend:**
```bash
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```

**Backend desconectado:**
- Verifica que puerto 5000 esté libre: `lsof -i:5000`
- Revisa logs del backend por errores

---

## Todo-en-Uno (Experimental)

```bash
./start-dev.sh
```

Esto inicia ambos servicios automáticamente.

---

**Listo!** Ahora tienes detección profesional de BPM con ±0.5 precisión 🎉


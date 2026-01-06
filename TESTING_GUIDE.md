# 🧪 Guía de Prueba - BPMETER

## Paso 1: Setup Backend (2-3 min)

```bash
cd backend

# Opción A: Script automático (RECOMENDADO)
./setup.sh

# Opción B: Manual con Python 3.11 (si 3.13 da problemas)
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Nota:** Si tienes Python 3.13, scipy puede dar problemas. Usa Python 3.11 o anterior.

## Paso 2: Iniciar Backend

```bash
cd backend
source venv/bin/activate
python server.py
```

Deberías ver:
```
====================================================
🎵 BPMETER Backend Server
====================================================
Backend: Librosa (Python)
Accuracy: ±0.5 BPM
Starting on http://localhost:5000
====================================================
 * Running on http://0.0.0.0:5000
```

✅ **Verifica que funcione:**
```bash
curl http://localhost:5000/api/health
```

Respuesta esperada:
```json
{"status":"healthy","backend":"librosa","version":"2.0","ready":true}
```

## Paso 3: Setup Frontend

En **otra terminal**:

```bash
cd frontend
npm install
npm run dev
```

Deberías ver:
```
▲ Next.js 14.2.35
- Local:        http://localhost:3000
✓ Ready in 3.6s
```

## Paso 4: Probar la Aplicación

1. **Abre el navegador:** http://localhost:3000

2. **Verifica el indicador:**
   - Debe mostrar: "✅ Backend conectado - Listo para detección"
   - Si dice "❌ Backend desconectado", revisa que el backend esté corriendo

3. **Click en "Iniciar Detección"**

4. **Permite acceso al micrófono** cuando el navegador lo solicite

5. **Pon música cerca del dispositivo**
   - Usa tu teléfono, laptop, o cualquier fuente de audio
   - Volumen moderado a alto

6. **Espera 5-10 segundos**
   - Verás "🎵 Analizando..."
   - Luego el BPM aparecerá

7. **Observa:**
   - BPM con 1 decimal (ej: 128.4)
   - Barra de confianza (0-100%)
   - Indicador verde cuando es estable
   - Medidor de audio mostrando señal

## Paso 5: Probar Tap Tempo

Si el micrófono no funciona:

1. **Click en "Tap Tempo"**
2. **Toca 4-8 veces** al ritmo de la música
3. **Ve el BPM calculado** debajo del display principal

## 🎯 Script Todo-en-Uno

Si quieres iniciar todo a la vez:

```bash
# En la raíz del proyecto
./start-dev.sh
```

Este script:
- ✅ Verifica dependencias
- ✅ Instala si faltan
- ✅ Inicia backend
- ✅ Inicia frontend
- ✅ Muestra logs

## 🐛 Troubleshooting

### Backend no inicia

**Error:** `ModuleNotFoundError: No module named 'librosa'`

**Solución:**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python server.py
```

### Backend muy lento al instalar

**Problema:** scipy/numpy compilando desde fuente

**Solución:** Usa Python 3.11 en vez de 3.13:
```bash
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### "Backend desconectado" en el navegador

**Verifica:**
1. Backend está corriendo: `curl http://localhost:5000/api/health`
2. No hay firewall bloqueando puerto 5000
3. Mira los logs del backend por errores

### "Permiso de micrófono denegado"

**Solución:**
1. Click en el candado/icono en la barra de direcciones
2. Permitir micrófono
3. Recargar página (F5)

### "No se detecta señal de audio"

**Solución:**
- Sube el volumen
- Acerca el dispositivo al altavoz
- Verifica que el micrófono correcto esté seleccionado en el sistema
- Usa Tap Tempo como alternativa

### Frontend no inicia

**Error:** `Cannot find module ...`

**Solución:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## 📊 Verificar que Todo Funcione Correctamente

### Test 1: Health Check Backend
```bash
curl http://localhost:5000/api/health
```
Debe responder con JSON.

### Test 2: Frontend Carga
Abre http://localhost:3000
Debe mostrar la UI de BPMETER.

### Test 3: Conexión Frontend-Backend
En la consola del navegador (F12), deberías ver:
```
✅ Backend connected: {status: "healthy", backend: "librosa", ...}
```

### Test 4: Detección de BPM
1. Pon música
2. Click "Iniciar Detección"
3. Espera 10 segundos
4. Debe mostrar un BPM entre 60-180

### Test 5: Tap Tempo
1. Click "Tap Tempo"
2. Toca 8 veces
3. Debe calcular BPM con ±2 BPM de precisión

## ✅ Checklist de Funcionalidad

- [ ] Backend inicia sin errores
- [ ] Frontend inicia sin errores
- [ ] Indicador muestra "Backend conectado"
- [ ] Botón "Iniciar Detección" está habilitado
- [ ] Micrófono solicita permiso
- [ ] Medidor de audio muestra señal
- [ ] BPM se actualiza en tiempo real
- [ ] Barra de confianza funciona
- [ ] Tap Tempo calcula BPM
- [ ] Settings panel abre y ajusta valores
- [ ] Botón Reset limpia estado

## 🎉 ¡Éxito!

Si todo funcionó:
- ✅ Backend detectando BPM con Librosa
- ✅ Frontend mostrando resultados en tiempo real
- ✅ Conexión funcionando correctamente
- ✅ PWA lista para instalar

**Próximos pasos:**
- Prueba con diferentes géneros musicales
- Ajusta configuración para tu caso de uso
- Deploy a producción (ver DEPLOYMENT.md)

## 📹 Video de Prueba Esperado

1. **0:00** - Abres http://localhost:3000
2. **0:02** - Ves "✅ Backend conectado"
3. **0:05** - Click "Iniciar Detección"
4. **0:07** - Permites micrófono
5. **0:10** - Pones música (House 128 BPM)
6. **0:15** - Ve "🎵 Analizando..."
7. **0:20** - BPM muestra ~128.0
8. **0:25** - Confianza sube a 90%+
9. **0:30** - Indicador verde (estable)
10. **✅ FUNCIONA!**

---

**¿Problemas?** Consulta README.md o abre un issue.


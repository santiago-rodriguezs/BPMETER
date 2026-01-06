#!/bin/bash
# Setup script for backend

echo "🎵 BPMETER Backend Setup"
echo "========================"

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no está instalado"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo "✅ Python $PYTHON_VERSION detectado"

# Create virtual environment
echo ""
echo "📦 Creando entorno virtual..."
python3 -m venv venv

# Activate virtual environment
echo "🔄 Activando entorno virtual..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Upgrade pip
echo "⬆️  Actualizando pip..."
pip install --upgrade pip

# Install dependencies
echo ""
echo "📚 Instalando dependencias (esto puede tardar 2-3 minutos)..."
pip install -r requirements.txt

# Test installation
echo ""
echo "🧪 Verificando instalación..."
python3 -c "import librosa; print('✅ Librosa instalado correctamente')"
python3 -c "import flask; print('✅ Flask instalado correctamente')"

echo ""
echo "✅ Setup completado!"
echo ""
echo "Para iniciar el servidor:"
echo "  source venv/bin/activate   # (Linux/Mac)"
echo "  venv\\Scripts\\activate      # (Windows)"
echo "  python server.py"
echo ""


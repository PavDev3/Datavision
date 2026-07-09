#!/usr/bin/env bash
# Para todo lo que levanta dev.sh: backend, frontend, Postgres, y cualquier
# subproceso de vision/main.py --publish que el backend haya lanzado y siga
# corriendo suelto.
#
# En Windows, uvicorn --reload y npm start/ng serve crean procesos hijo
# reales (uvicorn -> python.exe; node -> esbuild.exe) que un simple
# `kill $(cat pidfile)` no llega a matar (mismo problema que ya tuvimos con
# el subproceso de vision, ver app/services/vision_process.py). Por eso aqui
# se matan por ruta de proyecto en el CommandLine con `taskkill /F /T`, que
# mata el arbol completo sin depender de que el PID guardado siga siendo el
# correcto.
set -uo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
logs="$root/scripts/logs"

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || -n "${WINDIR:-}" ]]; then
  echo "==> Parando backend, frontend y cualquier proceso de vision/ (Windows)..."
  powershell.exe -NoProfile -Command "
    \$targetNames = 'python.exe','uvicorn.exe','node.exe','esbuild.exe'
    Get-CimInstance Win32_Process | Where-Object {
      (\$targetNames -contains \$_.Name) -and (
        \$_.CommandLine -like '*clases\datavision\backend*' -or
        \$_.CommandLine -like '*clases\datavision\frontend*' -or
        \$_.CommandLine -like '*clases\datavision\vision*'
      )
    } | ForEach-Object {
      Write-Host \"  matando PID \$(\$_.ProcessId): \$(\$_.Name)\"
      taskkill /F /T /PID \$_.ProcessId 2>\$null | Out-Null
    }
  "
else
  echo "==> Parando backend y frontend por pidfile..."
  for name in backend frontend; do
    pidfile="$logs/$name.pid"
    if [ -f "$pidfile" ]; then
      pid="$(cat "$pidfile")"
      kill "$pid" 2>/dev/null || true
    fi
  done
  echo "AVISO: en Linux/Mac esto no mata procesos hijo huerfanos; revisa 'ps aux' si algo sigue vivo." >&2
fi

rm -f "$logs/backend.pid" "$logs/frontend.pid"

echo "==> Parando Postgres (docker compose stop)..."
docker compose -f "$root/docker-compose.yml" stop db

echo ""
echo "Todo parado."

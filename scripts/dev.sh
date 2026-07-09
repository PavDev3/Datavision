#!/usr/bin/env bash
# Levanta el entorno de desarrollo completo de DataVision:
# Postgres (Docker), backend (FastAPI) y frontend (Angular), cada uno en segundo plano.
# El motor de vision NO se arranca aqui: requiere --source <video> y se lanza a mano (ver abajo).
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
logs="$root/scripts/logs"
mkdir -p "$logs"

echo "==> Levantando Postgres (docker compose)..."
docker compose -f "$root/docker-compose.yml" up -d db

echo "==> Esperando a que Postgres acepte conexiones..."
ready=false
for _ in $(seq 1 20); do
  if docker compose -f "$root/docker-compose.yml" exec -T db pg_isready -U datavision >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 1
done
if [ "$ready" != true ]; then
  echo "AVISO: Postgres no respondio a tiempo; revisa 'docker compose logs db'." >&2
fi

if [ ! -f "$root/.env" ]; then
  echo "==> No existe .env, copiando desde .env.example..."
  cp "$root/.env.example" "$root/.env"
fi

echo "==> Arrancando backend (FastAPI) en segundo plano..."
(cd "$root/backend" && nohup uv run uvicorn app.main:app --reload > "$logs/backend.log" 2>&1 &
 echo $! > "$logs/backend.pid")

echo "==> Arrancando frontend (Angular) en segundo plano..."
(cd "$root/frontend" && nohup npm start > "$logs/frontend.log" 2>&1 &
 echo $! > "$logs/frontend.pid")

sleep 1
echo ""
echo "Backend:  http://localhost:8000/health   (log: scripts/logs/backend.log, pid: $(cat "$logs/backend.pid"))"
echo "Frontend: http://localhost:4200          (log: scripts/logs/frontend.log, pid: $(cat "$logs/frontend.pid"))"
echo ""
echo "El motor de vision no se arranca automaticamente (necesita un video de entrada). Para probarlo:"
echo "  cd vision && uv run python main.py --source <ruta-a-tu-video>"
echo ""
echo "Para parar backend/frontend:"
echo "  kill \$(cat scripts/logs/backend.pid) \$(cat scripts/logs/frontend.pid)"
echo "Para parar Postgres:"
echo "  docker compose down"

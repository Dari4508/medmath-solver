#!/usr/bin/env bash
set -euo pipefail

# Smoke test: docker compose up, hit health/cases/calculate, tear down.
cd "$(dirname "$0")/.."

cleanup() {
  docker compose down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "==> docker compose up -d --build"
docker compose up -d --build

echo "==> waiting for api health"
ok=0
for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 1
done
if [ "$ok" != "1" ]; then
  echo "FAIL: api never became healthy"
  docker compose logs api || true
  exit 1
fi

echo "==> /api/health"
health=$(curl -fsS http://127.0.0.1:8000/api/health)
echo "$health"
echo "$health" | grep -q '"schema_ok":true'

echo "==> /api/cases"
cases=$(curl -fsS http://127.0.0.1:8000/api/cases)
echo "$cases" | grep -q 'D10W'
count=$(echo "$cases" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
test "$count" -ge 5

echo "==> POST /api/calculate/custom"
calc=$(curl -fsS -X POST http://127.0.0.1:8000/api/calculate/custom \
  -H 'Content-Type: application/json' \
  -d '{"matrix":[[2,1],[1,-1]],"vector":[3,0]}')
echo "$calc" | grep -q '"success":true'

echo "==> frontend via nginx :3000"
curl -fsS http://127.0.0.1:3000/ >/dev/null
curl -fsS http://127.0.0.1:3000/api/health | grep -q '"schema_ok":true'

echo "SMOKE OK"

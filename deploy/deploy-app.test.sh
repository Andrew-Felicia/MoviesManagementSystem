#!/usr/bin/env bash

set -euo pipefail

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
test_root="$(mktemp -d)"
trap 'rm -rf "$test_root"' EXIT

mkdir -p "$test_root/bin" "$test_root/movie-library"

cat > "$test_root/bin/docker" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' "$*" >> "$FAKE_LOG"

if [[ "$1" == "compose" ]]; then
  shift
  cmd="$1 ${2:-}"
  if [[ "$cmd" == "config --quiet" ]]; then exit 0; fi
  if [[ "$cmd" == "config --services" ]]; then printf 'app\ndb\n'; exit 0; fi
  if [[ "$1" == "config" ]]; then
    cat <<EOF
services:
  app:
    image: $EXPECTED_COMPOSE_IMAGE
  db:
    image: postgres:17-alpine
EOF
    exit 0
  fi
  if [[ "$cmd" == "ps -q" ]]; then printf 'old-container\n'; exit 0; fi
  if [[ "$1" == "ps" || "$1" == "logs" || "$1" == "up" ]]; then exit 0; fi
  if [[ "$cmd" == "port app" ]]; then printf '127.0.0.1:8080\n'; exit 0; fi
fi

if [[ "$1" == "inspect" ]]; then printf 'sha256:old\n'; exit 0; fi
if [[ "$1" == "pull" ]]; then
  if [[ "${FAIL_PULL:-0}" == "1" ]]; then exit 1; fi
  exit 0
fi
if [[ "$1" == "tag" ]]; then
  if [[ "$2" == "sha256:old" ]]; then
    printf 'old\n' > "$FAKE_STATE"
  else
    printf 'new\n' > "$FAKE_STATE"
  fi
  exit 0
fi

exit 99
MOCK

cat > "$test_root/bin/curl" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail

if [[ "${FAIL_NEW:-0}" == "1" && "$(cat "$FAKE_STATE")" == "new" ]]; then
  exit 22
fi

exit 0
MOCK

cat > "$test_root/bin/sleep" <<'MOCK'
#!/usr/bin/env bash
exit 0
MOCK

chmod +x "$test_root/bin/docker" "$test_root/bin/curl" "$test_root/bin/sleep"

export PATH="$test_root/bin:$PATH"
export EXPECTED_COMPOSE_IMAGE="ghcr.io/andrew-felicia/moviesmanagementsystem:latest"
export FAKE_LOG="$test_root/docker.log"
export FAKE_STATE="$test_root/state"

deploy_digest="ghcr.io/andrew-felicia/moviesmanagementsystem@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

if (
  cd "$test_root"
  bash "$script_directory/deploy-app.sh" \
    "$EXPECTED_COMPOSE_IMAGE" "$EXPECTED_COMPOSE_IMAGE" movie-library
) > "$test_root/mutable-image-output.log" 2>&1; then
  echo "Expected a mutable deployment image to be rejected." >&2
  exit 1
fi
grep -Fq "must use an immutable sha256 digest" \
  "$test_root/mutable-image-output.log"

printf 'old\n' > "$FAKE_STATE"
(
  cd "$test_root"
  bash "$script_directory/deploy-app.sh" \
    "$deploy_digest" "$EXPECTED_COMPOSE_IMAGE" movie-library
)
[[ "$(cat "$FAKE_STATE")" == "new" ]]

: > "$FAKE_LOG"
printf 'old\n' > "$FAKE_STATE"
if (
  cd "$test_root"
  FAIL_PULL=1 bash "$script_directory/deploy-app.sh" \
    "$deploy_digest" "$EXPECTED_COMPOSE_IMAGE" movie-library
) > "$test_root/pull-failure-output.log" 2>&1; then
  echo "Expected a failed image pull to fail the deployment." >&2
  exit 1
fi

[[ "$(cat "$FAKE_STATE")" == "old" ]]
if grep -Fq "compose up" "$FAKE_LOG"; then
  echo "A failed image pull must not recreate the running app." >&2
  exit 1
fi

: > "$FAKE_LOG"
printf 'old\n' > "$FAKE_STATE"
if (
  cd "$test_root"
  FAIL_NEW=1 bash "$script_directory/deploy-app.sh" \
    "$deploy_digest" "$EXPECTED_COMPOSE_IMAGE" movie-library
) > "$test_root/failure-output.log" 2>&1; then
  echo "Expected the failed readiness check to fail the deployment." >&2
  exit 1
fi

[[ "$(cat "$FAKE_STATE")" == "old" ]]
grep -Fq "tag sha256:old $EXPECTED_COMPOSE_IMAGE" "$FAKE_LOG"
grep -Fq "Rollback completed and the previous app is responding." \
  "$test_root/failure-output.log"

echo "Deployment success and rollback simulations passed."

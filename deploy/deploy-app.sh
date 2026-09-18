#!/usr/bin/env bash

set -Eeuo pipefail

deploy_image="${1:?Usage: deploy-app.sh DEPLOY_IMAGE COMPOSE_IMAGE [COMPOSE_DIRECTORY]}"
compose_image="${2:?Usage: deploy-app.sh DEPLOY_IMAGE COMPOSE_IMAGE [COMPOSE_DIRECTORY]}"
compose_directory="${3:-movie-library}"

fail() {
  echo "ERROR: $*" >&2
  return 1
}

wait_for_app() {
  local attempt

  for attempt in $(seq 1 30); do
    if curl --fail --silent --max-time 5 \
      http://127.0.0.1:8080/api/auth/csrf \
      > /dev/null 2>&1; then
      return 0
    fi

    sleep 2
  done

  return 1
}

cd "$compose_directory"

[[ "$deploy_image" =~ @sha256:[[:xdigit:]]{64}$ ]] \
  || fail "The deployment image must use an immutable sha256 digest."

docker compose config --quiet
services="$(docker compose config --services)"
grep -Fxq app <<< "$services" \
  || fail "The Compose project does not define an app service."

configured_image="$(docker compose config | awk '
  /^  app:$/ { in_app = 1; next }
  in_app && /^    image:/ {
    sub(/^    image:[[:space:]]*/, "", $0)
    print
    exit
  }
  in_app && /^  [^[:space:]]/ { in_app = 0 }
')"
[[ -n "$configured_image" ]] \
  || fail "Unable to determine the app service image from the Compose project."
[[ "$configured_image" == "$compose_image" ]] \
  || fail "The app service image is '$configured_image'; expected '$compose_image'."

previous_container="$(docker compose ps -q app || true)"
previous_image_id=""
if [[ -n "$previous_container" ]]; then
  previous_image_id="$(docker inspect --format '{{.Image}}' "$previous_container")"
fi

deployment_started=false

rollback() {
  local deployment_status=$?
  trap - ERR

  echo "Deployment failed." >&2
  if [[ "$deployment_started" == "true" ]]; then
    echo "Collecting app status and logs." >&2
    docker compose ps app >&2 || true
    docker compose logs --no-color --tail=200 app >&2 || true
  fi

  if [[ -n "$previous_image_id" ]]; then
    echo "Restoring the previous image tag to $previous_image_id." >&2
    docker tag "$previous_image_id" "$compose_image"

    if [[ "$deployment_started" == "true" ]]; then
      docker compose up -d --no-deps --force-recreate --pull never app

      if wait_for_app; then
        echo "Rollback completed and the previous app is responding." >&2
      else
        echo "Rollback completed, but the previous app did not become ready." >&2
        docker compose logs --no-color --tail=200 app >&2 || true
      fi
    else
      echo "The existing app container was left running." >&2
    fi
  elif [[ "$deployment_started" == "true" ]]; then
    echo "No previously running app image was available; stopping the failed app." >&2
    docker compose stop app || true
  else
    echo "The existing app container was not changed." >&2
  fi

  exit "$deployment_status"
}

echo "Pulling immutable image $deploy_image."
docker pull "$deploy_image"

trap rollback ERR
docker tag "$deploy_image" "$compose_image"
deployment_started=true
docker compose up -d --no-deps --force-recreate --pull never app

published_address="$(docker compose port app 8080)"
[[ "$published_address" == "127.0.0.1:8080" ]] \
  || fail "The app published '$published_address'; expected '127.0.0.1:8080'."

wait_for_app \
  || fail "The app did not become ready at http://127.0.0.1:8080/api/auth/csrf."

trap - ERR

docker compose ps app
echo "Successfully deployed $deploy_image."

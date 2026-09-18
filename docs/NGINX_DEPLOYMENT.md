# BT Nginx deployment

Nginx managed through BT is the chosen public reverse proxy. This document
describes the target configuration; it does not confirm that the remote VPS
has been migrated. The production Compose file lives on the VPS and is not
included in this repository.

## Movie application

Add the following to the existing `app` service in the VPS Compose file:

```yaml
ports:
  - "127.0.0.1:8080:8080"
```

Keep the existing image, environment, database connection, network, and volume
definitions. Do not publish PostgreSQL publicly. From the Compose directory,
validate the file and recreate only the app:

```bash
docker compose config --quiet
docker compose up -d --no-deps app
curl -I http://127.0.0.1:8080/
```

## BT site

Configure a reverse-proxy site for `taoyongli.me`:

| Setting | Value |
| --- | --- |
| Public ports | 80 and 443 |
| Proxy path | `/` |
| Target | `http://127.0.0.1:8080` |
| Send Host | `$host` |
| Proxy cache | Disabled |
| HTTPS | Certificate managed by BT, with automatic renewal |

Preserve the original host and scheme in proxy headers (`Host`,
`X-Forwarded-Proto`, and `X-Forwarded-For`). Keep the existing production secure
session-cookie setting. Proxy the entire application, including `/api`.

BT's generated site config can use the settings in
`deploy/nginx/movie-library-proxy.conf`. Add them inside the domain's existing
`server` block; BT continues to own the `listen`, certificate, and HTTPS
redirect directives. Test the resulting configuration before reloading Nginx.

The poster CSV import accepts files up to 100 MiB and serializes the parsed
movies as JSON. Configure Nginx's request body limit with room for that JSON
overhead, for example `client_max_body_size 150m;` in this site's `server`
block. Configure a suitable proxy read timeout for imports; downloading
external poster URLs can take longer than importing embedded posters.

Prepare the Nginx configuration before making it the public entry point. Keep
all application/database services and persistent volumes. Test the Nginx
configuration, start Nginx, issue/install the domain certificate in BT, and
verify login, movie details, and a poster import over HTTPS. Never use
`docker compose down -v` as part of this migration.

## Other domains

Each additional domain gets its own BT site and reverse-proxy target. Publish
each corresponding Docker service on a different loopback host port, mapped
to that application's actual container port. All domain A records can point
to the same VPS public IP. Nginx selects the application by domain name.

## Updates

The CI/CD workflow deploys the immutable image digest built by that workflow
run and recreates only the `app` service. It verifies the Compose configuration,
the loopback port binding, the app's CSRF endpoint, and the public HTTPS route.
If the new app does not become ready, it restores the previously running image.
App deployments do not stop Nginx, PostgreSQL, or unrelated Docker services.
DNS and BT configurations are managed on the VPS and are not changed by an
application build.

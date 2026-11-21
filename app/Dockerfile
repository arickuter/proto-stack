# Wasp appends this file to the Dockerfile it generates, so these lines run in
# its final `server-production` stage.
#
# Wasp pins the base image to its minimum supported Node (24.22.1 as of Wasp
# 0.26.1), which goes stale as security releases land. Swap in the patched
# Node binary from the same Alpine base. Keep the major version on 24 until
# Wasp supports a newer one, and bump this tag with `.nvmrc`.
#
# Only the binary: the npm bundled with newer 24.x releases no longer puts
# parent node_modules/.bin on PATH, so Wasp's start script can't find prisma.
COPY --from=node:24.22.3-alpine3.23 /usr/local/bin/node /usr/local/bin/node

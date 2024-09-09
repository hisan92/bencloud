FROM oven/bun:1.1-alpine AS base

WORKDIR /usr/app

# install dependencies into temp directory
FROM base AS dependencies

COPY package.json bun.lockb ./

RUN bun install --frozen-lockfile

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease

COPY --from=dependencies /usr/app/node_modules node_modules

COPY . .

# build
ENV NODE_ENV=production

RUN bun build --compile ./src/main.ts --outfile ./dist/main

# runner
FROM ubuntu:24.04

WORKDIR /usr/app

ENV APP_PORT=4000

USER ubuntu

COPY --chown=ubuntu:ubuntu --from=prerelease /usr/app .

EXPOSE $APP_PORT

HEALTHCHECK --interval=15s --timeout=3s CMD curl -f http://localhost:$APP_PORT/v1/ || exit 1

CMD [ "./dist/main" ]

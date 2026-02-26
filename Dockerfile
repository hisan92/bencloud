FROM oven/bun:1.3-alpine AS base

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
FROM alpine:3.22

WORKDIR /usr/app

ENV PORT=3000 \
    NODE_ENV=production

ARG USER=vencloud \
    GROUP=vencloud \
    UID=1000 \
    GID=1000

RUN addgroup --system --gid $GID $USER
RUN adduser --system --uid $UID --disabled-password --no-create-home --ingroup $GROUP $USER

RUN apk update
RUN apk add --no-cache curl libgcc libstdc++ && \
    rm -rf /var/cache/apk/*

USER $USER

COPY --chown=$USER:$GROUP --from=prerelease /usr/app .

EXPOSE $PORT

HEALTHCHECK --interval=15s --timeout=3s CMD curl -f http://localhost:$PORT/v1/ || exit 1

CMD [ "./dist/main" ]

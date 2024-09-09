# Bencloud

Bencloud is Vencord's API for cloud settings sync rewrite in Typescript!

Here is [Vencloud original version](https://github.com/Vencord/Vencloud).

## Self Hosting

> [!WARNING]
> Your instance has to be HTTPS capable due to [mixed content restrictions](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content) in web browsers.

### Cloning the Repository

First of all, you'll have to clone the source code to a convenient location:

```sh
git clone https://github.com/hisan92/bencloud
```

### Setting up the Config

Copy the example configuration (`.env.example`) to `.env`. Now open it with your text editor of trust and fill in the configuration values.
All variables are documented there!

### Running

Don't forget to direct your terminal to the Bencloud directory, e.g. via `cd bencloud`!

#### Via Docker

1. Create a `docker-compose.override.yml` that maps the port from docker to your system.
   The following example assumes you will use port `8485`
   ```yaml
   services:
     backend:
       ports:
         - 8485:4000
   ```
2. Start the docker container via `docker compose up -d`. The server will be available at the configured host, in the above example `8485`

#### Natively

Alongisde the Bencloud setup, you will also have to setup Redis. This will not be covered here, please refer to the Redis documentation.

1. Install [Bun](https://bun.sh/)
2. Install dependencies: `bun install`
3. Build the code: `bun run build`
4. Start the server:

   ```sh
   # Load the .env file
   export $(grep -v '^#' .env | xargs)

   bun run ./dist/main.js
   ```

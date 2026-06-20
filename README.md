# Clocktower Local

Site mobile-first em Astro para montar partida local e consultar guia de roles.

## Rodar localmente

```bash
npm install
npm run dev
```

Se estiver usando o `base` de GitHub Pages no build, a URL publicada será algo como:

```txt
https://leonn190.github.io/Blood/
```

## Deploy no GitHub Pages

Este projeto já inclui `.github/workflows/deploy.yml` para publicar com GitHub Actions.

No GitHub, vá em:

```txt
Settings > Pages > Build and deployment > Source > GitHub Actions
```

Depois faça commit/push na branch `main`.

## Importante

Os arquivos do projeto precisam ficar na raiz do repositório, assim:

```txt
.github/workflows/deploy.yml
astro.config.mjs
package.json
src/pages/index.astro
src/scripts/app.js
src/scripts/roles.js
src/styles/global.css
public/favicon.svg
public/manifest.webmanifest
```

Não coloque tudo dentro de uma pasta extra tipo `botc-mobile-site/` dentro do repo, senão o Actions não acha o projeto Astro.

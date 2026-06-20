# Clocktower Local - Modo Clássico

Site Astro simples, mobile-first, para hostear uma partida local de Blood on the Clocktower usando um celular só.

## Rodar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Fluxo atual

1. Tela inicial: Partida Local ou Guia.
2. Partida Local: escolha a seleção. Por enquanto só existe Modo Clássico.
3. Subseleção: escolha número de jogadores, manual/automático e roles.
4. Entrega de roles: cada jogador toca no `?`, vê sua role, esconde, digita nome e devolve ao host.
5. Grimório do host.
6. Noites guiadas em ordem.
7. Dia: host marca vivos/mortos e quem foi executado, depois começa a próxima noite.
8. Fim automático se demônio morrer, se restarem só 2 bons vivos ou se o Anjo/Santo for executado.

## GitHub Pages

O projeto já inclui `.github/workflows/deploy.yml`, `.nojekyll` e `astro.config.mjs` com `base: '/Blood'`.

No GitHub, use **Settings > Pages > Source > GitHub Actions**.

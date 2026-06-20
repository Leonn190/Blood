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
4. O botão de preencher automático sorteia uma composição válida com ou sem Barão.
5. Entrega de roles: cada jogador toca no `?`, vê sua role, esconde, digita nome e devolve ao host.
6. Grimório do host, com painel de status.
7. Noites guiadas em ordem, pulando mortos e travando alvos confirmados.
8. Dia: host marca vivos/mortos e quem foi executado, depois começa a próxima noite.
9. Fim automático se demônio morrer, se restarem só 2 bons vivos ou se o Anjo/Santo for executado.

## Ajustes principais da v4

- Preencher automático corrigido para Barão e não-Barão.
- Duração da noite medida por etapas reais.
- Dropdowns corrigidos para fundo escuro e texto legível.
- Painel do host mostra envenenado, Mordomo/mestre, protegido e mortes da última noite.
- Mulher Escarlate agora vira Imp quando deve.
- Imp se matando passa o demônio para um minion vivo, priorizando a Mulher Escarlate.
- Guardião dos Corvos não acorda toda noite; só aparece como etapa condicional.

## GitHub Pages

O projeto já inclui `.github/workflows/deploy.yml`, `.nojekyll` e `astro.config.mjs` com `base: '/Blood'`.

No GitHub, use **Settings > Pages > Source > GitHub Actions**.

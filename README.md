# Clocktower Local - Mobile

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
2. Partida Local: escolha entre Modo Clássico, Seleção Completa ou Seleção Personalizada.
3. Subseleção: escolha número de jogadores, manual/automático e roles.
4. O preencher automático sorteia uma composição válida com ou sem Barão.
5. Entrega de roles: cada jogador toca no `?`, vê a role, esconde, digita nome e devolve ao host.
6. Host vê o grimório e recebe um link de guia com só as roles daquela partida.
7. Noites guiadas em ordem, pulando mortos e travando alvos confirmados.
8. Dia: host marca vivos/mortos e quem foi executado, depois começa a próxima noite.
9. Fim automático se o demônio morrer sem substituto, se restarem só 2 bons vivos ou se o Santo for executado.

## Ajustes principais da v5

- Cartuchos de entrega com tamanho fixo e cor do tipo da role.
- Botão/gesto de voltar volta uma etapa/tela do app em vez de reiniciar o jogo.
- Subseleção em duas colunas no celular.
- Métricas compactas: `🌙` para etapas da noite e `⚔️` para dificuldade do bem.
- Link de guia da partida no painel do host.
- Seleção Completa e Seleção Personalizada.
- Novas roles: Exorcista, Médico, Protetor e Canibal.
- Mecânicas novas ligadas ao automático: bloqueio de poderes malignos, proteção contra veneno/bebedeira, proteção lateral contra demônio e roubo de poder do morto.

## GitHub Pages

O projeto já inclui `.github/workflows/deploy.yml`, `.nojekyll` e `astro.config.mjs` com `base: '/Blood'`.

No GitHub, use **Settings > Pages > Source > GitHub Actions**.

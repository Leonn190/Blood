# Clocktower Local Mobile

Site Astro + JavaScript + CSS para jogar partidas locais no celular.

## Rodar localmente

```bash
npm install
npm run dev
```

## GitHub Pages

O projeto já inclui `.github/workflows/deploy.yml`, `astro.config.mjs` e `.nojekyll`.
No repositório, use **Settings > Pages > Source > GitHub Actions**.

## Fluxo

1. Tela inicial: Partida Local ou Guia.
2. Escolha de seleção: Modo Clássico, Seleção Completa ou Seleção Personalizada.
3. Na Personalizada, o host cria primeiro o pool de roles possíveis.
4. Na Subseleção, o host escolhe número de jogadores, modo manual/automático e roles exatas da partida.
5. Entrega de roles: cada jogador revela seu cartucho, esconde e digita nome.
6. Tela do host mostra grimório e link de guia da seleção.
7. Noite roda por etapas, pulando mortos e travando cada ação depois de confirmada.
8. Dia registra execução e ações manuais.

## V7

Esta versão adiciona novos Outsiders, Minions e Demônios ao modo expandido e à seleção personalizada, além de distribuição automática para Vampiro/Overlord, suporte a venenos permanentes, mortes pendentes e condições extras de fim de jogo.

As descrições são resumos curtos/originais em português para uso no protótipo.

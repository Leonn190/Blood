# Clocktower Local

MVP mobile-first em Astro + JavaScript + CSS para consultar roles e montar uma partida local de Blood on the Clocktower.

## O que já tem

- Tela inicial com apenas 2 botões: **Partida Local** e **Guia**.
- Guia com busca, filtro por tipo e filtro por seleção.
- Partida local com seleção principal: Trouble Brewing, Bad Moon Rising, Sects & Violets, Experimental e Todas as roles.
- Subseleção por role: o host liga/desliga cada personagem.
- Duas barras automáticas:
  - dificuldade para o bem / facilidade para o mal;
  - duração aproximada da noite.
- Resumo final e botão para copiar a seleção em JSON.
- Salva a última seleção no `localStorage` do navegador.

## Rodar localmente

```bash
npm install
npm run dev
```

Depois abra o endereço que o Astro mostrar no terminal.

## Build

```bash
npm run build
npm run preview
```

## Observação sobre conteúdo

Os nomes das roles e as seleções foram organizados com base em fontes públicas/official wiki. As descrições dentro do app são resumos curtos e originais, feitos para consulta rápida durante a partida, não substituem o almanac oficial.

O projeto não usa imagens, ícones oficiais ou textos longos copiados do jogo.

## Próximos passos sugeridos

- Criar tela de distribuição de roles para jogadores.
- Adicionar ordem da primeira noite e das outras noites.
- Adicionar seleção de jogadores vivos/mortos.
- Refinar as fórmulas das barras de dificuldade e noite.
- Criar presets personalizados salvos no navegador.

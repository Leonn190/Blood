# Clocktower Local — Modo Clássico

Site mobile-first em Astro para jogar uma partida local inspirada em Blood on the Clocktower usando um único celular.

## Fluxo

1. Tela inicial com **Partida Local** e **Guia**.
2. A partida começa escolhendo a seleção. Neste MVP só existe **Modo Clássico**.
3. Depois vem a tela de subseleção:
   - número de jogadores;
   - modo manual ou automático;
   - roles que entram no jogo;
   - barras de duração da noite e dificuldade para o bem.
4. Ao começar, as roles são embaralhadas.
5. Cada jogador pega o celular, toca no **?**, vê a role, esconde de novo, escreve o nome e devolve para o host.
6. O host vê o grimório completo.
7. O site guia a noite em ordem.
8. Depois de cada noite, o host registra o dia, mortos e execução.

## Modos

### Manual

O site só mostra a ordem de atuação da noite. O host resolve tudo manualmente.

### Automático

O site resolve uma versão simplificada das ações noturnas:

- Envenenador escolhe alvo pelo celular.
- Informações podem sair erradas se o jogador estiver envenenado ou for o Bêbado.
- Monge protege.
- Imp escolhe morte.
- Soldado resiste ao ataque direto do demônio.
- Prefeito pode redirecionar ataque.
- Guardião dos Corvos acorda se morrer à noite.
- Coveiro usa a execução registrada no dia.
- Mulher Escarlate pode virar Imp.
- Vidente usa red herring automático.

As ações de dia ainda são responsabilidade do host.

## Rodar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages

O ZIP já vem com workflow em `.github/workflows/deploy.yml`.

No GitHub, configure:

```txt
Settings > Pages > Build and deployment > Source > GitHub Actions
```

Depois suba os arquivos na raiz do repositório.

## Estrutura

```txt
.github/workflows/deploy.yml
astro.config.mjs
package.json
src/pages/index.astro
src/styles/global.css
public/scripts/roles.js
public/scripts/app.js
public/favicon.svg
public/manifest.webmanifest
```

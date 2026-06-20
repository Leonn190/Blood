# Implementação das roles clássicas — v4

Este MVP está focado apenas no Modo Clássico. O dia continua sendo responsabilidade do host: conversa, nomeações, voto, uso do Caçador, Virgem e execução. O site automatiza principalmente a ordem e as informações da noite.

## Regras gerais implementadas

- Jogador morto não é chamado para agir à noite.
- Se o Imp matar alguém antes da etapa dessa pessoa, a etapa dela é pulada.
- Depois que uma ação de noite é confirmada, a etapa trava e não permite trocar alvo.
- A tela de dia não tem botão de salvar: o host escolhe quem foi executado e clica direto em começar a próxima noite.
- O Coveiro lê automaticamente a pessoa executada no dia anterior.
- O Guardião dos Corvos pode agir se morreu à noite ou se foi executado no dia anterior.
- O jogo termina se o demônio morrer, se restarem só 2 pessoas boas vivas, ou se o Anjo/Santo for executado.
- A Mulher Escarlate agora tenta impedir o fim do jogo quando o demônio morre e ela está viva com 5+ jogadores vivos.
- A dificuldade começa em 5. Roles boas normalmente reduzem; Outsiders, Minions e Demônio aumentam.
- A duração da noite é medida em etapas: cada role que acorda adiciona 1 etapa. A noite 1 também conta as etapas de informação dos minions e do demônio.
- O painel do host mostra envenenado atual, mestre do Mordomo, protegido da noite e mortes da última noite.

## Townsfolk

- **Lavadeira**: age só na Noite 1. O sistema escolhe dois jogadores e uma role townsfolk; um dos dois pode ser aquela role. Se a Lavadeira estiver bêbada/envenenada, o sistema pode gerar uma informação falsa.
- **Bibliotecário**: age só na Noite 1. O sistema procura Outsider. Se não houver Outsider e o Bibliotecário estiver saudável, mostra que não há. Se estiver bêbado/envenenado, pode gerar par/role falsa.
- **Investigador**: age só na Noite 1. O sistema escolhe dois jogadores e uma role minion; um dos dois pode ser aquele minion. Pode ser falso se estiver bêbado/envenenado.
- **Chef**: age só na Noite 1. O sistema calcula quantos pares de jogadores malignos estão lado a lado na ordem dos assentos. Pode ser falso se estiver bêbado/envenenado.
- **Empata**: age toda noite enquanto vivo. O sistema pega os dois vizinhos vivos mais próximos e calcula quantos registram como malignos. Pode ser falso se estiver bêbado/envenenado.
- **Vidente**: age toda noite enquanto viva. O jogador escolhe dois alvos no celular. O sistema responde SIM se algum alvo registra como demônio, incluindo o red herring automático. Pode ser falso se estiver bêbada/envenenada.
- **Coveiro**: age nas noites depois da primeira enquanto vivo. O sistema mostra a role de quem foi executado no dia anterior. Pode ser falso se estiver bêbado/envenenado.
- **Monge**: age nas noites depois da primeira enquanto vivo. Escolhe outro jogador vivo para proteger do ataque do Imp naquela noite. Se o Monge estiver envenenado, a escolha aparece, mas a proteção real não funciona.
- **Guardião dos Corvos**: não acorda toda noite. O sistema cria uma etapa condicional nas noites depois da primeira. Se ele morreu na noite ou foi executado no dia anterior, escolhe um jogador e vê a role dele. Se não morreu, a etapa é pulada.
- **Virgem**: fica manual durante o dia. O host resolve nomeação/execução.
- **Caçador**: fica manual durante o dia. O host resolve o tiro e pode marcar morte manualmente.
- **Soldado**: passivo. Se for atacado diretamente pelo Imp, o sistema impede a morte. Se estiver envenenado, a proteção falha.
- **Prefeito**: passivo. Se for atacado pelo Imp, o sistema pode redirecionar a morte para outro jogador vivo. Se estiver envenenado, o redirecionamento não acontece.

## Outsiders

- **Mordomo**: age toda noite enquanto vivo. Escolhe um mestre pelo celular. O painel do host mostra quem ele serve.
- **Bêbado**: recebe uma role townsfolk falsa na entrega. O jogador age como essa role falsa, mas o sistema trata como bêbado e pode gerar informação errada.
- **Recluso**: passivo. Pode registrar como maligno nas checagens de Chef, Empata e Vidente. Se estiver envenenado, esse registro falso é desligado.
- **Anjo/Santo**: ação de dia. Se for executado no dropdown do dia e não estiver envenenado, o jogo termina com vitória do mal.

## Minions

- **Envenenador**: age toda noite enquanto vivo. Escolhe uma pessoa viva. Depois de confirmar, o alvo fica travado, aparece no painel do host e pode receber/gerar informação falsa naquela noite.
- **Espião**: age à noite enquanto vivo. Mostra o grimório completo para o Espião, incluindo roles reais e a role falsa vista pelo Bêbado.
- **Mulher Escarlate**: passiva. Se não houver mais demônio vivo e ela estiver viva com 5+ jogadores vivos, vira Imp automaticamente antes do fim de jogo ser declarado. Se estiver envenenada, não transforma. Também é prioridade se o Imp se mata.
- **Barão**: altera a composição da partida. Quando entra, a distribuição vira +2 Outsiders e -2 Townsfolk. O preencher automático sorteia composições com ou sem Barão e valida corretamente os dois casos.

## Demônio

- **Imp**: age nas noites depois da primeira enquanto vivo. Escolhe uma vítima viva. Se o Imp estiver envenenado, não há morte. Soldado sobrevive, Monge protege, Prefeito pode redirecionar. Se o alvo for o próprio Imp, o Imp morre e um minion vivo vira Imp, dando prioridade para a Mulher Escarlate. Se o Imp mata o Guardião dos Corvos, a etapa condicional dele acontece depois.

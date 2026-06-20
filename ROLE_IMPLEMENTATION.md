# Implementação das roles clássicas

Este MVP está focado apenas no Modo Clássico. O dia continua sendo responsabilidade do host: conversa, nomeações, voto, uso do Caçador, Virgem e execução. O site automatiza principalmente a ordem e as informações da noite.

## Regras gerais implementadas

- Jogador morto não é chamado para agir à noite.
- Depois que uma ação de noite é confirmada, a etapa trava e não permite trocar alvo.
- A tela de dia não tem botão de salvar: o host escolhe quem foi executado e clica direto em começar a próxima noite.
- O Coveiro lê automaticamente a pessoa executada no dia anterior.
- O Guardião dos Corvos pode agir se morreu à noite ou se foi executado no dia anterior, conforme pedido para este MVP.
- O jogo termina se o demônio morrer, se restarem só 2 jogadores bons vivos, ou se o Anjo/Santo for executado.
- A dificuldade começa em 5. Roles boas normalmente reduzem; Outsiders, Minions e Demônio aumentam.
- A duração da noite é medida em etapas.

## Townsfolk

- Lavadeira: noite 1. Gera dois jogadores e uma role townsfolk possível. Se estiver bêbada/envenenada, pode gerar informação falsa.
- Bibliotecário: noite 1. Procura outsider. Se não houver outsider e estiver saudável, mostra que não há. Se estiver bêbado/envenenado, pode gerar info falsa.
- Investigador: noite 1. Gera dois jogadores e uma role minion possível. Pode ser falso se bêbado/envenenado.
- Chef: noite 1. Calcula pares malignos sentados lado a lado. Pode ser falso se bêbado/envenenado.
- Empata: toda noite enquanto vivo. Calcula quantos dos dois vizinhos vivos registram como malignos. Pode ser falso se bêbado/envenenado.
- Vidente: toda noite enquanto viva. Escolhe dois jogadores e recebe SIM/NÃO se algum registra como demônio, incluindo red herring. Pode ser falso se bêbada/envenenada.
- Coveiro: noites depois da primeira, enquanto vivo. Mostra a role do executado no dia anterior. Pode ser falso se bêbado/envenenado.
- Monge: noites depois da primeira, enquanto vivo. Escolhe outro jogador vivo para proteger do ataque do demônio.
- Guardião dos Corvos: chamado se morreu à noite ou se foi executado no dia anterior. Escolhe um jogador e vê a role.
- Virgem: ação de dia manual pelo host.
- Caçador: ação de dia manual pelo host.
- Soldado: passivo. Se for atacado diretamente pelo Imp, não morre.
- Prefeito: passivo. Se for atacado à noite, o ataque pode ser redirecionado automaticamente.

## Outsiders

- Mordomo: toda noite enquanto vivo. Escolhe mestre para o dia seguinte.
- Bêbado: recebe uma role townsfolk falsa na entrega. Age como essa role falsa, mas a informação pode sair errada.
- Recluso: pode registrar como maligno em checagens do Chef/Empata/Vidente.
- Anjo/Santo: se for executado no dia, o jogo termina com vitória do mal.

## Minions

- Envenenador: toda noite enquanto vivo. Escolhe uma pessoa viva. Depois de confirmar, o alvo fica travado e informações daquele alvo podem sair falsas naquela noite.
- Espião: enquanto vivo, vê o grimório completo.
- Mulher Escarlate: mantida como role do clássico, mas neste MVP o fim de jogo pedido pelo usuário tem prioridade: se o demônio morrer, a partida termina.
- Barão: altera a composição da subseleção com +2 Outsiders e -2 Townsfolk. O preenchimento automático considera o Barão quando ele é sorteado ou já está marcado.

## Demônio

- Imp: noites depois da primeira, enquanto vivo. Escolhe uma vítima viva. Soldado sobrevive, Monge protege, Prefeito pode redirecionar. Se a vítima for o Guardião dos Corvos, ele pode agir depois.

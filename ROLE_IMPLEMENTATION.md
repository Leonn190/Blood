# Como cada role clássica foi programada

Este MVP usa descrições próprias e uma automação simplificada. O host ainda controla tudo que acontece de dia.

## Townsfolk

- **Lavadeira**: noite 1. O automático escolhe uma townsfolk real e outro jogador aleatório; se a Lavadeira estiver envenenada ou for o Bêbado fingindo Lavadeira, o site sorteia informação possivelmente falsa.
- **Bibliotecário**: noite 1. Procura outsider real; se não houver, informa que não há Outsiders. Se estiver envenenado/bêbado, sorteia informação falsa.
- **Investigador**: noite 1. Procura minion real e mistura com outro jogador. Se estiver envenenado/bêbado, sorteia informação falsa.
- **Chef**: noite 1. Conta pares de jogadores malignos sentados lado a lado. O Recluso pode registrar como maligno aleatoriamente. Se estiver envenenado/bêbado, recebe número aleatório.
- **Empata**: toda noite. Conta quantos dos dois vizinhos vivos registram como malignos. Se estiver envenenado/bêbado, recebe número aleatório.
- **Vidente**: toda noite. Jogador escolhe dois alvos pelo celular; o site responde SIM se algum for demônio, red herring ou Recluso. Se estiver envenenado/bêbado, responde aleatoriamente.
- **Coveiro**: a partir da noite 2. Usa quem o host marcou como executado no dia anterior. Se estiver envenenado/bêbado, mostra role aleatória.
- **Monge**: a partir da noite 2. Escolhe alguém vivo, exceto ele mesmo; essa pessoa fica protegida do ataque do demônio naquela noite.
- **Guardião dos Corvos**: a partir da noite 2. Só aparece de verdade se morreu durante a noite. Escolhe um jogador e aprende a role. Se estiver envenenado, recebe role aleatória.
- **Virgem**: ação de dia, manual. O site só deixa o host controlar mortes/execuções no registro do dia.
- **Caçador**: ação de dia, manual. O host resolve o tiro e marca morte se necessário.
- **Soldado**: passivo. Se for atacado diretamente pelo Imp, o site bloqueia a morte.
- **Prefeito**: passivo. Se for atacado pelo Imp, o site tem chance de redirecionar a morte para outro jogador vivo.

## Outsiders

- **Mordomo**: toda noite. Escolhe um mestre; o site salva o mestre como anotação da noite/dia.
- **Bêbado**: setup. O jogador não vê “Bêbado”; ele recebe uma role townsfolk falsa não usada na partida. Se essa role falsa acordar à noite, ele acorda e recebe informação aleatória/ruim.
- **Recluso**: passivo. Em checagens automáticas, pode registrar como maligno aleatoriamente.
- **Santo**: dia, manual. Se o host marcar o Santo como executado, o site mostra alerta de derrota do bem.

## Minions

- **Envenenador**: toda noite. Escolhe um alvo pelo celular. As ações/informações desse alvo naquela noite ficam ruins/sorteadas.
- **Espião**: toda noite. Pode ver o grimório completo no celular.
- **Mulher Escarlate**: passiva. Se não houver demônio vivo e ainda houver 5+ vivos, vira Imp automaticamente.
- **Barão**: setup. Ao entrar na subseleção, a validação passa a exigir +2 Outsiders e -2 Townsfolk.

## Demônio

- **Imp**: a partir da noite 2. Escolhe alvo pelo celular. O site aplica proteção do Monge, imunidade do Soldado, possível redirecionamento do Prefeito e morte noturna. Se matar a si mesmo, tenta passar o demônio para a Mulher Escarlate ou outro minion vivo.

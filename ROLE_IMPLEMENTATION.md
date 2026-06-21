# Implementação das roles — v5

Este arquivo descreve como o site programou cada role no MVP mobile. O dia continua sendo principalmente manual pelo host; o modo automático foca nas etapas noturnas, mortes e informações.

## Regras gerais do sistema

- A noite é dividida em etapas reais: cada pessoa que acorda/adquire ação noturna adiciona 1 etapa.
- Mortos não são chamados para agir, exceto o Guardião dos Corvos quando morreu à noite ou foi executado no dia anterior.
- Quando uma ação é confirmada, a etapa fica travada. O alvo não pode ser trocado naquela etapa.
- O painel do host mostra envenenado, protegido pelo Médico, alvo do Exorcista, mestre do Mordomo, protegido pelo Monge e mortes da última noite.
- O fim de jogo é checado depois de mortes/execução: demônio morto sem substituto = bem vence; só 2 bons vivos = mal vence; Santo executado = mal vence.
- A Mulher Escarlate tenta virar Imp antes do fim de jogo por morte do demônio.
- O Médico cancela veneno e bebedeira para o alvo da noite/rodada.
- O Exorcista bloqueia o poder noturno de um alvo maligno.

## Townsfolk

### Lavadeira
Age só na noite 1. O site pega um Townsfolk real, mistura com outro jogador e mostra a role. Se Lavadeira estiver bêbada/envenenada, a dupla/role pode ser falsa.

### Bibliotecário
Age só na noite 1. O site procura um Outsider real; se não houver Outsider e ele não estiver bêbado/envenenado, mostra que não há Outsiders. Se estiver bêbado/envenenado, pode mostrar informação falsa.

### Investigador
Age só na noite 1. O site procura um Minion real, mistura com outro jogador e mostra a role Minion. Bêbado/envenenado pode receber informação falsa.

### Chef
Age só na noite 1. O site conta pares malignos sentados lado a lado, incluindo registros falsos possíveis do Recluso. Bêbado/envenenado recebe número aleatório.

### Empata
Age toda noite enquanto vivo. O site encontra os dois vizinhos vivos mais próximos e mostra quantos registram como malignos. Bêbado/envenenado recebe número aleatório.

### Vidente
Age toda noite enquanto viva. Escolhe dois alvos. O site responde SIM se algum alvo registra como demônio, incluindo demônio real, red herring e possível registro falso do Recluso. Bêbada/envenenada recebe SIM/NÃO aleatório.

### Coveiro
Age nas noites depois da primeira. Mostra a role de quem foi executado no dia anterior. Bêbado/envenenado pode ver role falsa.

### Monge
Age nas noites depois da primeira. Escolhe uma pessoa viva diferente dele. Se não estiver bêbado/envenenado, o alvo fica protegido de morte do demônio naquela noite.

### Guardião dos Corvos
Não aparece toda noite. Só entra como etapa condicional se ele morreu à noite ou foi executado no dia anterior. Escolhe um alvo e vê a role dele; bêbado/envenenado pode ver role falsa.

### Virgem
Role de dia, manual. O site só mantém a role no grimório; o host resolve nomeação e execução.

### Caçador
Role de dia, manual. O site só mantém a role no grimório; o host resolve o tiro e marca morte se necessário.

### Soldado
Passivo. Se o Imp atacar diretamente o Soldado e ele não estiver bêbado/envenenado, ele sobrevive.

### Prefeito
Passivo. Se atacado pelo Imp e não estiver bêbado/envenenado, o site pode redirecionar a morte para outro jogador vivo.

### Exorcista
Nova role. Age toda noite. Escolhe alguém; se o alvo for maligno e o Exorcista não estiver bêbado/envenenado, o poder noturno desse alvo fica bloqueado. Isso impede veneno do Envenenador e morte do Imp quando eles forem agir.

### Médico
Nova role. Age toda noite. Escolhe alguém; se o Médico não estiver bêbado/envenenado, o alvo não fica envenenado nem bêbado naquela rodada. Isso também permite que o Bêbado funcione como a role falsa naquela noite.

### Protetor
Nova role passiva. Enquanto vivo e funcional, os dois vizinhos vivos mais próximos ficam protegidos contra morte causada pelo demônio.

### Canibal
Nova role. Age nas noites depois da primeira. Pode escolher um jogador morto. Se o morto era bom, o Canibal rouba a habilidade noturna daquele jogador para as próximas noites. Se o morto era maligno, o Canibal morre ao amanhecer.

## Outsiders

### Mordomo
Age toda noite enquanto vivo. Escolhe um mestre. O painel do host mostra quem o Mordomo serve.

### Bêbado
Recebe uma role Townsfolk falsa na entrega. O jogador vê essa role falsa. Internamente, o site sabe que ele é Bêbado e normalmente gera informação falsa, exceto se estiver protegido pelo Médico.

### Recluso
Passivo. Pode registrar como maligno/demônio em Chef, Empata e Vidente. Se estiver bêbado/envenenado, esse registro falso não acontece.

### Santo
Role de dia. Se for executado e não estiver bêbado/envenenado/protegido de falha, o mal vence automaticamente.

## Minions

### Envenenador
Age toda noite. Escolhe um jogador vivo. Se não estiver bêbado/envenenado/bloqueado pelo Exorcista, o alvo fica envenenado naquela noite. Se o alvo está protegido pelo Médico, o veneno falha.

### Espião
Age à noite. Mostra o grimório completo, incluindo roles reais, Bêbado vendo role falsa e Canibal com poder roubado.

### Mulher Escarlate
Passiva. Se o demônio morrer e ainda houver 5+ vivos, ela vira Imp se estiver viva e funcional. Se estiver envenenada/bêbada, não transforma.

### Barão
Afeta a montagem da partida. Quando está na seleção, a distribuição exigida vira +2 Outsiders e -2 Townsfolk. O preencher automático sorteia formações válidas com ou sem Barão.

## Demônio

### Imp
Age nas noites depois da primeira. Escolhe uma vítima viva. O ataque respeita Monge, Soldado, Prefeito e Protetor. Se o Imp estiver bêbado/envenenado ou bloqueado pelo Exorcista, o ataque não mata. Se escolher a si mesmo, morre e tenta passar o demônio para um Minion vivo, priorizando a Mulher Escarlate.

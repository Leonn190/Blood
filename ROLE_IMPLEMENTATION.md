# Implementação das roles no protótipo

Esta versão mantém o fluxo de celular único: o host entrega roles, depois o site guia a noite em ordem. O modo manual só mostra a etapa; o modo automático resolve escolhas, mortes, venenos, proteções e informações.

## Regras gerais programadas

- Jogador morto não acorda à noite.
- Cada ação noturna confirmada trava a etapa.
- Duração da noite é medida por etapas: cada role que acorda conta como 1 etapa.
- Dificuldade começa em 5 e soma o peso das roles.
- Barão adiciona +2 Outsiders e -2 Townsfolk.
- Vampiro tenta adicionar +1 Townsfolk à distribuição, substituindo Outsider primeiro e Minion se possível.
- Overlord tenta adicionar +1 Minion à distribuição, reduzindo Townsfolk primeiro.
- O preenchimento automático sorteia demônio e Barão de forma aleatória, sem forçar Barão.
- A seleção personalizada cria primeiro o pool possível e só depois a subseleção da partida.
- O link de guia mostra o pool da seleção, não apenas as roles escolhidas.

## Townsfolk

- Lavadeira: Noite 1 mostra dois jogadores e uma role Townsfolk possível.
- Bibliotecário: Noite 1 mostra Outsider possível ou avisa que não há Outsider.
- Investigador: Noite 1 mostra dois jogadores e uma role Minion possível.
- Chef: Noite 1 conta pares malignos vizinhos.
- Empata: Toda noite vê quantos vizinhos vivos registram como malignos.
- Vidente: Toda noite escolhe dois e recebe SIM/NÃO para demônio, red herring e Recluso.
- Coveiro: Só acorda se houve execução no dia anterior.
- Monge: Protege alguém da morte do demônio.
- Guardião dos Corvos: Só acorda se morreu à noite ou foi executado.
- Virgem: Manual de dia.
- Caçador: Ação de dia, mata se acertar demônio.
- Soldado: Passivo contra morte direta do demônio.
- Prefeito: Pode vencer com 3 vivos sem execução; pode redirecionar ataque.
- Exorcista: Bloqueia poder noturno se escolher alguém mau.
- Médico: Protege alvo contra veneno/bebedeira naquela rodada.
- Protetor: Vizinhos vivos ficam protegidos contra morte do demônio.
- Canibal: Só acorda se existe morto. Rouba poder de morto bom; morre se escolher morto mau.
- General: Noite 1 vê demônio/minions; depois vê contagem de bons e maus vivos.
- Cartógrafo: Vê uma role por noite em direção secreta circular.
- Historiador: Vê até 3 habilidades usadas na noite.
- Guardião: Na segunda noite escolhe proteção permanente até morrer.
- Religioso: Ação de dia para perguntar se role está em jogo.
- Juiz: Manual de dia; voto/nominação são controlados pelo host.
- Matemático: Vê quantidade de ações registradas e ações ineficazes.
- Sonhador: Escolhe alguém e vê duas roles possíveis.
- Nobre: Noite 1 vê três jogadores, um deles é o demônio.
- Infiltrado: Aparece para o demônio como Minion.
- Mágico: Oculta demônio dos minions e minions do demônio.
- Fazendeiro: Noite 1 aprende um jogador bom.
- Altruísta: Ação de dia, ressuscita morto e morre.
- Observador: Final da noite vê quem foi alvo de ações.
- Alquimista: Marca alguém; se morrer pelo demônio, mostra o demônio.
- Sentinela: Bloqueia alguém de acordar naquela noite.
- Missionário: Se só restar o demônio no time mau, o bem vence.
- Intelectual: Vê espaçamentos entre inimigos numa ordem fixa sorteada.
- Detetive: Ação de dia, uma vez vê a role de alguém.
- Professor: Troca roles de dois jogadores bons; se houver mau, falha.
- Princesa: Não morre em votação.
- Príncipe: Vê a role de alguém e desliga poder não-demônio.
- Técnico: Sem Barão, escolhe um Minion bêbado secreto e informa quem é.
- Herói: Se minion/demônio agir contra ele, ambos morrem.
- Sheriff: Ação de dia, tiros iguais ao número de minions, mata se acertar minion.
- Cirurgião: Ação de dia, ressuscita morto da última noite.
- Rei: Só válido com Soldado no pool e fora do jogo; vê demônio; se morrer normalmente, o mal vence.

## Outsiders

- Mordomo: Escolhe mestre à noite; aparece no card do jogador.
- Bêbado: Vê uma role Townsfolk falsa e age como informação inválida.
- Recluso: Pode registrar como maligno/demônio.
- Santo: Se executado, mal vence.
- Amaldiçoado: Se morto pelo demônio, outro jogador bom aleatório também morre.
- Lunático: Vê uma role que já existe em jogo e age como se fosse ela, mas falha/recebe info inválida.
- Isentão: Manual de dia; host controla que não vota nem nomina.
- Golem: Ação de dia; primeira nomeação mata alvo se não for demônio.
- Desajeitado: Se morto à noite, acorda na mesma noite; se errar o chute de mau, o alvo morre.
- Atormentado: Vê demônio e pode tentar agir, mas a morte falha.
- Figurante: Ação de dia para storyteller matar quando quiser.
- Encantada: Quando morre, alguém vivo fica bêbado aleatoriamente.

## Minions

- Envenenador: Envenena alguém por uma rodada, se não bloqueado e se alvo não estiver protegido pelo Médico.
- Espião: Vê o grimório completo.
- Mulher Escarlate: Vira Imp se o demônio morrer com 5+ vivos.
- Barão: Altera distribuição.
- Advogado do Diabo: Dá imunidade contra execução para o dia seguinte.
- Político: Manual de dia; voto e fala são controlados pelo host.
- Manipulador: Com 3 vivos, se demônio morrer executado, permite mais um dia.
- Explosivo: Quando morre, programa morte de dois bons aleatórios na próxima noite.
- Bruxa: Amaldiçoa alguém; no dia, o host marca se a pessoa nominou e ela morre.
- Marcador: Marca alguém na Noite 1; se esse jogador for executado, o mal vence.
- Assassino: Uma vez por jogo mata alguém à noite ignorando proteções.
- Widow: Noite 1 vê grimório, envenena alguém permanentemente e um jogador aleatório sabe quem é a Widow.

## Demônios

- Imp: Mata depois da primeira noite. Pode se matar e passar demônio para Minion vivo.
- Vampiro: Depois da primeira noite ataca. A primeira vítima bem-sucedida vira Advogado do Diabo; depois mata normalmente.
- Po: Pode pular noites para carregar. Quando mata, mata 1 + noites puladas, escolhendo alvo principal e sorteando extras.
- Overlord: Não mata direto. Marca alguém; no dia, se o host marcar que foi nominado por bom, a pessoa morre na próxima noite.
- Parasita: Na Noite 1 escolhe hospedeiro. O bem só vence com o demônio morto se o hospedeiro também estiver morto. Depois mata normalmente.
- Pukka: Escolhe alguém, que fica envenenado e marcado para morrer na próxima noite.

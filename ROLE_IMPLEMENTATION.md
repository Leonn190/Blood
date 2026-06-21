# Implementação das roles

## Regras gerais do sistema

- Mortos não acordam à noite.
- Cada role que acorda adiciona 1 etapa à noite.
- Uma ação confirmada fica travada e não pode trocar alvo.
- A tela de dia não mostra um painel separado; os efeitos aparecem no card de cada jogador.
- O link do guia da partida mostra o pool da seleção, não apenas a subseleção escolhida.
- O preenchimento automático sorteia formações válidas com Barão ou sem Barão. Se Barão entra, aplica +2 Outsiders e -2 Townsfolk.
- Dificuldade parte de 5. Townsfolk normalmente reduzem, Outsiders/Minions/Demônio aumentam.
- Fim automático: demônio morto, mal com só demônio e Missionário vivo, 2 bons vivos, Santo executado, Rei morto.

## Townsfolk clássicos

- Lavadeira: noite 1, mostra dois jogadores e uma role Townsfolk; um deles pode ter aquela role. Bêbado/envenenado gera informação falsa.
- Bibliotecário: noite 1, mostra dois jogadores e uma role Outsider; se não houver Outsider mostra isso. Bêbado/envenenado pode falsificar.
- Investigador: noite 1, mostra dois jogadores e uma role Minion possível. Bêbado/envenenado pode falsificar.
- Chef: noite 1, conta pares malignos lado a lado. Recluso pode registrar como mau. Bêbado/envenenado randomiza.
- Empata: toda noite, conta quantos dos dois vizinhos vivos registram como malignos.
- Vidente: toda noite, escolhe dois jogadores e recebe SIM/NÃO considerando demônio, red herring e Recluso.
- Coveiro: só acorda se houve execução no dia anterior; mostra a role do executado.
- Monge: escolhe alguém vivo para proteger do demônio.
- Guardião dos Corvos: só acorda se morreu à noite ou foi executado; vê a role de alguém.
- Virgem: manual de dia.
- Caçador: ação de dia; se atirar no demônio, o demônio morre.
- Soldado: passivo; sobrevive ao ataque direto do Imp se não estiver inválido.
- Prefeito: passivo; pode redirecionar ataque e vence com 3 vivos sem execução.

## Townsfolk expandidos

- Exorcista: escolhe alguém; se for maligno, bloqueia o poder noturno desse jogador.
- Médico: escolhe alguém; o alvo não fica envenenado/bêbado naquela rodada.
- Protetor: os dois vizinhos vivos ficam protegidos contra morte do demônio.
- Canibal: só acorda quando existe morto; escolhe morto. Se era bom, rouba o poder; se era mau, morre.
- General: noite 1 vê demônio e minions; depois vê quantos bons/maus estão vivos.
- Cartógrafo: recebe a role de uma pessoa por noite em direção secreta fixa.
- Historiador: no fim da noite vê três habilidades usadas naquela noite.
- Guardião: na segunda noite escolhe alguém para proteger até a própria morte.
- Religioso: ação de dia, uma vez, pergunta se uma role está em jogo.
- Juiz: manual de dia; voto vale por dois.
- Matemático: no fim da noite vê total de ações confirmadas e quantas foram ineficazes.
- Sonhador: escolhe alguém e vê duas roles possíveis, uma verdadeira e uma falsa se sóbrio.
- Nobre: noite 1 vê três jogadores; um deles é o demônio.
- Infiltrado: aparece para o demônio como minion.
- Mágico: oculta informação de time entre demônio e minions.
- Fazendeiro: noite 1 vê o nome de um jogador bom.
- Altruísta: ação de dia; ressuscita um morto e morre.
- Observador: no fim da noite vê quem foi alvo de ações.
- Alquimista: escolhe alguém; se o alvo morrer pelo demônio, o host vê quem é o demônio.
- Sentinela: escolhe alguém para impedir que acorde naquela noite.
- Missionário: se só restar o demônio do lado mau, o bem vence.
- Intelectual: recebe sequência de espaçamentos entre jogadores malignos em ordem fixa.
- Detetive: ação de dia, uma vez, vê a role de alguém.
- Professor: à noite escolhe dois jogadores; se ambos são bons, troca suas roles.
- Princesa: não morre em votação.
- Príncipe: vê a role de alguém; se não for demônio, o poder dessa pessoa fica parado.
- Técnico: se não houver Barão, um minion não-Barão fica bêbado; o Técnico vê quem é.
- Herói: se minion/demônio usar poder contra ele, ambos morrem à noite.
- Sheriff: ação de dia; tiros iguais ao número de minions; mata se acertar minion.
- Cirurgião: ação de dia; ressuscita alguém morto na última noite.
- Rei: só válido se Soldado estiver no pool e fora da partida; vê o demônio na noite 1, Imp não recebe Soldado como bluff, se morrer o mal vence. O botão de voto inválido mata o Rei sem ativar essa condição.

## Outsiders

- Mordomo: escolhe mestre à noite; aparece no card dele e do mestre.
- Bêbado: vê uma role Townsfolk falsa e suas ações/informações podem falhar.
- Recluso: pode registrar como maligno/demônio.
- Santo: se executado, mal vence.

## Minions

- Envenenador: escolhe alguém para envenenar, salvo se bloqueado, bêbado, alvo protegido pelo Médico ou Herói ativar.
- Espião: vê o grimório completo.
- Mulher Escarlate: vira Imp se o demônio morrer com 5+ vivos.
- Barão: altera a distribuição: +2 Outsiders e -2 Townsfolk. Dificuldade própria é baixa porque os Outsiders já pesam.

## Demônio

- Imp: mata à noite. Respeita Soldado, Monge, Protetor, Guardião e Prefeito. Pode se matar para passar o demônio a um minion vivo, priorizando Mulher Escarlate.

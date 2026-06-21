export const TYPE_LABEL = {
  townsfolk: 'Townsfolk',
  outsider: 'Outsider',
  minion: 'Minion',
  demon: 'Demônio'
};

export const TYPE_EMOJI = {
  townsfolk: '🔵',
  outsider: '🟡',
  minion: '🟣',
  demon: '🔴'
};

export const TYPE_ORDER = ['townsfolk', 'outsider', 'minion', 'demon'];

export const DISTRIBUTIONS = {
  5: { townsfolk: 3, outsider: 0, minion: 1, demon: 1 },
  6: { townsfolk: 3, outsider: 1, minion: 1, demon: 1 },
  7: { townsfolk: 5, outsider: 0, minion: 1, demon: 1 },
  8: { townsfolk: 5, outsider: 1, minion: 1, demon: 1 },
  9: { townsfolk: 5, outsider: 2, minion: 1, demon: 1 },
  10: { townsfolk: 7, outsider: 0, minion: 2, demon: 1 },
  11: { townsfolk: 7, outsider: 1, minion: 2, demon: 1 },
  12: { townsfolk: 7, outsider: 2, minion: 2, demon: 1 },
  13: { townsfolk: 9, outsider: 0, minion: 3, demon: 1 },
  14: { townsfolk: 9, outsider: 1, minion: 3, demon: 1 },
  15: { townsfolk: 9, outsider: 2, minion: 3, demon: 1 }
};

export const SCRIPTS = [
  { id: 'classic', name: 'Modo Clássico', subtitle: 'Base clássica', description: 'Seleção clássica inicial, boa para testar e jogar simples.' },
  { id: 'expanded', name: 'Seleção Completa', subtitle: 'Tudo do site', description: 'Todas as roles cadastradas no site entram no pool possível.' },
  { id: 'custom', name: 'Seleção Personalizada', subtitle: 'Pool criado por você', description: 'Você escolhe o pool de roles antes da subseleção.' }
];

export const CLASSIC_ROLE_IDS = [
  'washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortune_teller', 'undertaker', 'monk', 'ravenkeeper', 'virgin', 'slayer', 'soldier', 'mayor',
  'butler', 'drunk', 'recluse', 'saint',
  'poisoner', 'spy', 'scarlet_woman', 'baron',
  'imp'
];

export const ROLES = [
  { id: 'washerwoman', name: 'Lavadeira', type: 'townsfolk', difficulty: -2, nightOrderFirst: 40, nightOrderOther: null, summary: 'Na primeira noite, vê dois jogadores e uma role Townsfolk. Um deles é aquela role.', action: 'washerwoman' },
  { id: 'librarian', name: 'Bibliotecário', type: 'townsfolk', difficulty: -2, nightOrderFirst: 42, nightOrderOther: null, summary: 'Na primeira noite, vê dois jogadores e uma role Outsider. Um deles é aquela role.', action: 'librarian' },
  { id: 'investigator', name: 'Investigador', type: 'townsfolk', difficulty: -2, nightOrderFirst: 44, nightOrderOther: null, summary: 'Na primeira noite, vê dois jogadores e uma role Minion. Um deles é aquela role.', action: 'investigator' },
  { id: 'chef', name: 'Chef', type: 'townsfolk', difficulty: -1, nightOrderFirst: 46, nightOrderOther: null, summary: 'Na primeira noite, aprende quantos pares malignos estão lado a lado.', action: 'chef' },
  { id: 'empath', name: 'Empata', type: 'townsfolk', difficulty: -3, nightOrderFirst: 70, nightOrderOther: 70, summary: 'A cada noite, aprende quantos dos dois vizinhos vivos registram como malignos.', action: 'empath' },
  { id: 'fortune_teller', name: 'Vidente', type: 'townsfolk', difficulty: -3, nightOrderFirst: 72, nightOrderOther: 72, summary: 'A cada noite, escolhe dois jogadores e vê se algum registra como demônio.', action: 'fortune_teller' },
  { id: 'undertaker', name: 'Coveiro', type: 'townsfolk', difficulty: -2, nightOrderFirst: null, nightOrderOther: 58, summary: 'Nas noites depois da primeira, vê a role de quem foi executado no dia anterior.', action: 'undertaker' },
  { id: 'monk', name: 'Monge', type: 'townsfolk', difficulty: -2, nightOrderFirst: null, nightOrderOther: 32, summary: 'Nas noites depois da primeira, escolhe alguém para proteger da morte do demônio.', action: 'monk' },
  { id: 'ravenkeeper', name: 'Guardião dos Corvos', type: 'townsfolk', difficulty: -2, nightOrderFirst: null, nightOrderOther: null, summary: 'Se morreu à noite ou foi executado, acorda na próxima noite e vê a role de alguém.', action: 'ravenkeeper' },
  { id: 'virgin', name: 'Virgem', type: 'townsfolk', difficulty: -1, nightOrderFirst: null, nightOrderOther: null, summary: 'Durante o dia, a primeira nomeação contra ela pode executar quem nomeou se for Townsfolk.', action: 'day_manual' },
  { id: 'slayer', name: 'Caçador', type: 'townsfolk', difficulty: -1, nightOrderFirst: null, nightOrderOther: null, summary: 'Durante o dia, uma vez por jogo, escolhe alguém. Se for o demônio, ele morre.', action: 'day_slayer' },
  { id: 'soldier', name: 'Soldado', type: 'townsfolk', difficulty: -1, nightOrderFirst: null, nightOrderOther: null, summary: 'Não morre pelo ataque direto do demônio.', action: 'passive' },
  { id: 'mayor', name: 'Prefeito', type: 'townsfolk', difficulty: -2, nightOrderFirst: null, nightOrderOther: null, summary: 'Pode vencer com três vivos sem execução. Ataque noturno pode redirecionar.', action: 'passive' },
  { id: 'exorcist', name: 'Exorcista', type: 'townsfolk', difficulty: -2, nightOrderFirst: 6, nightOrderOther: 6, summary: 'À noite, escolhe alguém. Se for maligno, o poder daquela pessoa é bloqueado.', action: 'exorcist' },
  { id: 'doctor', name: 'Médico', type: 'townsfolk', difficulty: -2, nightOrderFirst: 8, nightOrderOther: 8, summary: 'À noite, escolhe alguém para não receber veneno nem bebedeira naquela rodada.', action: 'doctor' },
  { id: 'protector', name: 'Protetor', type: 'townsfolk', difficulty: -2, nightOrderFirst: null, nightOrderOther: null, summary: 'Os dois vizinhos vivos ao seu lado ficam protegidos contra morte do demônio.', action: 'passive' },
  { id: 'cannibal', name: 'Canibal', type: 'townsfolk', difficulty: -1, nightOrderFirst: null, nightOrderOther: 88, summary: 'À noite, pode roubar poder de alguém morto. Se escolher alguém maligno, morre.', action: 'cannibal' },
  { id: 'general', name: 'General', type: 'townsfolk', difficulty: -2, nightOrderFirst: 36, nightOrderOther: 120, summary: 'Na primeira noite vê demônio e minions. Depois aprende quantos bons e maus estão vivos.', action: 'general' },
  { id: 'cartographer', name: 'Cartógrafo', type: 'townsfolk', difficulty: -2, nightOrderFirst: 74, nightOrderOther: 74, summary: 'A cada noite recebe a role de uma pessoa em ordem circular secreta.', action: 'cartographer' },
  { id: 'historian', name: 'Historiador', type: 'townsfolk', difficulty: -1, nightOrderFirst: 132, nightOrderOther: 132, summary: 'Aprende três habilidades usadas ao longo da noite.', action: 'historian' },
  { id: 'guardian', name: 'Guardião', type: 'townsfolk', difficulty: -2, nightOrderFirst: null, nightOrderOther: 34, summary: 'Na segunda noite, escolhe alguém para proteger até a própria morte.', action: 'guardian' },
  { id: 'religious', name: 'Religioso', type: 'townsfolk', difficulty: -1, nightOrderFirst: null, nightOrderOther: null, summary: 'Uma vez durante o dia, pode perguntar se uma role está em jogo.', action: 'day_religious' },
  { id: 'judge', name: 'Juiz', type: 'townsfolk', difficulty: -1, nightOrderFirst: null, nightOrderOther: null, summary: 'Seu voto vale por dois e pode se declarar em qualquer nomeação.', action: 'day_manual' },
  { id: 'mathematician', name: 'Matemático', type: 'townsfolk', difficulty: -2, nightOrderFirst: 130, nightOrderOther: 130, summary: 'À noite, descobre quantas ações ocorreram e quantas foram ineficazes.', action: 'mathematician' },
  { id: 'dreamer', name: 'Sonhador', type: 'townsfolk', difficulty: -2, nightOrderFirst: 76, nightOrderOther: 76, summary: 'Toda noite escolhe alguém e recebe duas roles possíveis para essa pessoa.', action: 'dreamer' },
  { id: 'noble', name: 'Nobre', type: 'townsfolk', difficulty: -2, nightOrderFirst: 38, nightOrderOther: null, summary: 'Na primeira noite, vê três jogadores. Um deles é o demônio.', action: 'noble' },
  { id: 'infiltrator', name: 'Infiltrado', type: 'townsfolk', difficulty: -1, nightOrderFirst: null, nightOrderOther: null, summary: 'Aparece para o demônio como se fosse um dos minions.', action: 'passive' },
  { id: 'magician', name: 'Mágico', type: 'townsfolk', difficulty: -2, nightOrderFirst: null, nightOrderOther: null, summary: 'Minions não sabem quem é o demônio e o demônio não sabe quem são os minions.', action: 'passive' },
  { id: 'farmer', name: 'Fazendeiro', type: 'townsfolk', difficulty: -1, nightOrderFirst: 48, nightOrderOther: null, summary: 'Aprende o nome de um jogador bom.', action: 'farmer' },
  { id: 'altruist', name: 'Altruísta', type: 'townsfolk', difficulty: -1, nightOrderFirst: null, nightOrderOther: null, summary: 'Durante o dia, pode ressuscitar um morto, morrendo no lugar.', action: 'day_altruist' },
  { id: 'observer', name: 'Observador', type: 'townsfolk', difficulty: -2, nightOrderFirst: 134, nightOrderOther: 134, summary: 'No fim da noite, aprende quais pessoas foram alvos de alguma ação.', action: 'observer' },
  { id: 'alchemist', name: 'Alquimista', type: 'townsfolk', difficulty: -1, nightOrderFirst: 30, nightOrderOther: 30, summary: 'Escolhe alguém. Se essa pessoa morrer pelo demônio, descobre quem é o demônio.', action: 'alchemist' },
  { id: 'sentinel', name: 'Sentinela', type: 'townsfolk', difficulty: -2, nightOrderFirst: 4, nightOrderOther: 4, summary: 'À noite, escolhe alguém para impedir que acorde naquela noite.', action: 'sentinel' },
  { id: 'missionary', name: 'Missionário', type: 'townsfolk', difficulty: -2, nightOrderFirst: null, nightOrderOther: null, summary: 'Se só sobrar o demônio do lado mau, os Townsfolk vencem.', action: 'passive' },
  { id: 'intellectual', name: 'Intelectual', type: 'townsfolk', difficulty: -2, nightOrderFirst: 78, nightOrderOther: 78, summary: 'À noite, recebe a sequência de espaçamentos entre os jogadores malignos.', action: 'intellectual' },
  { id: 'detective', name: 'Detetive', type: 'townsfolk', difficulty: -1, nightOrderFirst: null, nightOrderOther: null, summary: 'Uma vez na partida, pode perguntar a role de alguém.', action: 'day_detective' },
  { id: 'professor', name: 'Professor', type: 'townsfolk', difficulty: -1, nightOrderFirst: null, nightOrderOther: 84, summary: 'À noite, pode trocar as roles de dois jogadores bons. Se houver mau, falha.', action: 'professor' },
  { id: 'princess', name: 'Princesa', type: 'townsfolk', difficulty: -1, nightOrderFirst: null, nightOrderOther: null, summary: 'Não pode morrer em votações.', action: 'passive' },
  { id: 'prince', name: 'Príncipe', type: 'townsfolk', difficulty: -2, nightOrderFirst: 12, nightOrderOther: 12, summary: 'Toda noite vê a role de alguém; depois o poder desse alvo para, exceto se for demônio.', action: 'prince' },
  { id: 'technician', name: 'Técnico', type: 'townsfolk', difficulty: -2, nightOrderFirst: 22, nightOrderOther: null, summary: 'Um minion fica bêbado sem saber. O Técnico descobre quem é. Não funciona com Barão.', action: 'technician' },
  { id: 'hero', name: 'Herói', type: 'townsfolk', difficulty: -1, nightOrderFirst: null, nightOrderOther: null, summary: 'Se minion ou demônio usar algo contra ele, ambos morrem durante a noite.', action: 'passive' },
  { id: 'sheriff', name: 'Sheriff', type: 'townsfolk', difficulty: -1, nightOrderFirst: null, nightOrderOther: null, summary: 'Durante o dia, pode atirar em minions. Tem tiros iguais ao número de minions.', action: 'day_sheriff' },
  { id: 'surgeon', name: 'Cirurgião', type: 'townsfolk', difficulty: -1, nightOrderFirst: null, nightOrderOther: null, summary: 'Durante o dia, pode ressuscitar alguém que morreu na última noite.', action: 'day_surgeon' },
  { id: 'king', name: 'Rei', type: 'townsfolk', difficulty: -3, nightOrderFirst: 35, nightOrderOther: null, summary: 'Só entra se Soldado estiver no pool e fora do jogo. Sabe o demônio, mas deve fingir Soldado.', action: 'king' },

  { id: 'butler', name: 'Mordomo', type: 'outsider', difficulty: 1, nightOrderFirst: 100, nightOrderOther: 90, summary: 'A cada noite, escolhe um mestre. No dia seguinte, só deve votar se o mestre votar junto.', action: 'butler' },
  { id: 'drunk', name: 'Bêbado', type: 'outsider', difficulty: 2, nightOrderFirst: null, nightOrderOther: null, summary: 'Não sabe que é o Bêbado. Recebe uma role Townsfolk falsa e pode receber informação errada.', action: 'drunk' },
  { id: 'recluse', name: 'Recluso', type: 'outsider', difficulty: 1, nightOrderFirst: null, nightOrderOther: null, summary: 'Pode registrar como maligno, Minion ou demônio mesmo sendo bom.', action: 'passive' },
  { id: 'saint', name: 'Santo', type: 'outsider', difficulty: 3, nightOrderFirst: null, nightOrderOther: null, summary: 'Se for executado e não estiver inválido, o mal vence.', action: 'day_manual' },
  { id: 'cursed', name: 'Amaldiçoado', type: 'outsider', difficulty: 2, nightOrderFirst: null, nightOrderOther: null, summary: 'Se for morto pelo demônio, outro aliado bom aleatório morre junto.', action: 'passive' },
  { id: 'lunatic', name: 'Lunático', type: 'outsider', difficulty: 2, nightOrderFirst: null, nightOrderOther: null, summary: 'Acha que é uma role boa que já está em jogo, mas sua habilidade não funciona.', action: 'lunatic' },
  { id: 'neutralist', name: 'Isentão', type: 'outsider', difficulty: 1, nightOrderFirst: null, nightOrderOther: null, summary: 'Não pode votar nem nominar.', action: 'day_manual' },
  { id: 'golem', name: 'Golem', type: 'outsider', difficulty: 2, nightOrderFirst: null, nightOrderOther: null, summary: 'Sua primeira nomeação mata o alvo se ele não for demônio. Depois não nomeia mais.', action: 'day_golem' },
  { id: 'clumsy', name: 'Desajeitado', type: 'outsider', difficulty: 2, nightOrderFirst: null, nightOrderOther: null, summary: 'Ao morrer à noite, escolhe alguém para chutar como mau. Se errar, essa pessoa morre.', action: 'clumsy' },
  { id: 'tormented', name: 'Atormentado', type: 'outsider', difficulty: 2, nightOrderFirst: null, nightOrderOther: null, summary: 'Acha que é o demônio, mas suas mortes sempre falham.', action: 'tormented' },
  { id: 'extra', name: 'Figurante', type: 'outsider', difficulty: 1, nightOrderFirst: null, nightOrderOther: null, summary: 'Pode morrer a qualquer momento por escolha do storyteller.', action: 'day_extra' },
  { id: 'enchanted', name: 'Encantada', type: 'outsider', difficulty: 2, nightOrderFirst: null, nightOrderOther: null, summary: 'Quando morre, alguém fica bêbado aleatoriamente.', action: 'passive' },

  { id: 'poisoner', name: 'Envenenador', type: 'minion', difficulty: 2, nightOrderFirst: 20, nightOrderOther: 20, summary: 'A cada noite, escolhe alguém para ficar envenenado. Ações e informações podem falhar.', action: 'poisoner' },
  { id: 'spy', name: 'Espião', type: 'minion', difficulty: 2, nightOrderFirst: 24, nightOrderOther: 24, summary: 'Vê o grimório completo. Para informações do bem, pode registrar como Townsfolk.', action: 'spy' },
  { id: 'scarlet_woman', name: 'Mulher Escarlate', type: 'minion', difficulty: 3, nightOrderFirst: null, nightOrderOther: null, summary: 'Se o demônio morrer com jogadores vivos suficientes, ela vira o novo Imp.', action: 'scarlet_woman' },
  { id: 'baron', name: 'Barão', type: 'minion', difficulty: 1, nightOrderFirst: null, nightOrderOther: null, summary: 'Na montagem, coloca +2 Outsiders e -2 Townsfolk.', action: 'baron' },
  { id: 'devils_advocate', name: 'Advogado do Diabo', type: 'minion', difficulty: 2, nightOrderFirst: 16, nightOrderOther: 16, summary: 'À noite, escolhe alguém para ficar imune a execuções no dia seguinte.', action: 'devils_advocate' },
  { id: 'politician', name: 'Político', type: 'minion', difficulty: 2, nightOrderFirst: null, nightOrderOther: null, summary: 'Seu voto vale por dois e pode falar em qualquer nominação.', action: 'day_manual' },
  { id: 'manipulator', name: 'Manipulador', type: 'minion', difficulty: 3, nightOrderFirst: null, nightOrderOther: null, summary: 'Com 3 vivos, pode dar mais um dia mesmo se o demônio morrer executado.', action: 'passive' },
  { id: 'explosive', name: 'Explosivo', type: 'minion', difficulty: 3, nightOrderFirst: null, nightOrderOther: null, summary: 'Ao morrer, dois jogadores bons aleatórios morrem na próxima noite.', action: 'explosive' },
  { id: 'witch', name: 'Bruxa', type: 'minion', difficulty: 2, nightOrderFirst: 18, nightOrderOther: 18, summary: 'Toda noite amaldiçoa alguém. Se essa pessoa nominar, ela morre.', action: 'witch' },
  { id: 'marker', name: 'Marcador', type: 'minion', difficulty: 3, nightOrderFirst: 22, nightOrderOther: null, summary: 'Na primeira noite marca alguém. Se o marcado morrer por execução, o mal vence.', action: 'marker' },
  { id: 'assassin', name: 'Assassino', type: 'minion', difficulty: 3, nightOrderFirst: null, nightOrderOther: 28, summary: 'Uma vez por jogo, mata uma pessoa ignorando proteções.', action: 'assassin' },
  { id: 'widow', name: 'Widow', type: 'minion', difficulty: 3, nightOrderFirst: 14, nightOrderOther: null, summary: 'Na primeira noite vê o grimório e envenena alguém permanentemente; alguém sabe quem ela é.', action: 'widow' },

  { id: 'imp', name: 'Imp', type: 'demon', difficulty: 4, nightOrderFirst: null, nightOrderOther: 50, summary: 'Nas noites depois da primeira, escolhe alguém para morrer. Pode se matar para passar o demônio.', action: 'imp' },
  { id: 'vampire', name: 'Vampiro', type: 'demon', difficulty: 5, nightOrderFirst: null, nightOrderOther: 50, summary: 'Há um Townsfolk a mais. Sua primeira vítima vira Advogado do Diabo.', action: 'vampire' },
  { id: 'po', name: 'Po', type: 'demon', difficulty: 5, nightOrderFirst: null, nightOrderOther: 50, summary: 'Só mata em uma noite. Quando mata, mata 1 + noites que ficou sem matar.', action: 'po' },
  { id: 'overlord', name: 'Overlord', type: 'demon', difficulty: 5, nightOrderFirst: null, nightOrderOther: 50, summary: 'Existe um minion a mais. Não mata direto; marca alguém que pode morrer se for nominado por bom.', action: 'overlord' },
  { id: 'parasite', name: 'Parasita', type: 'demon', difficulty: 5, nightOrderFirst: 50, nightOrderOther: 50, summary: 'Na primeira noite escolhe um hospedeiro. O bem só vence se o hospedeiro estiver morto.', action: 'parasite' },
  { id: 'pukka', name: 'Pukka', type: 'demon', difficulty: 5, nightOrderFirst: 50, nightOrderOther: 50, summary: 'Escolhe alguém; primeiro fica envenenado e morre na noite seguinte.', action: 'pukka' }
];

export function roleById(id) {
  return ROLES.find((role) => role.id === id);
}

export function rolesByType(type) {
  return ROLES.filter((role) => role.type === type);
}

export function rolesForScript(scriptId = 'classic') {
  if (scriptId === 'classic') return ROLES.filter((role) => CLASSIC_ROLE_IDS.includes(role.id));
  return ROLES;
}

export function scriptById(scriptId) {
  return SCRIPTS.find((script) => script.id === scriptId) || SCRIPTS[0];
}

export function getDistribution(playerCount, hasBaron = false) {
  const base = { ...(DISTRIBUTIONS[playerCount] || DISTRIBUTIONS[7]) };
  if (hasBaron) {
    base.outsider = Math.min(4, base.outsider + 2);
    base.townsfolk = Math.max(0, base.townsfolk - 2);
  }
  return base;
}

export function isEvilRole(roleId) {
  const role = roleById(roleId);
  return role?.type === 'minion' || role?.type === 'demon';
}

export function isGoodRole(roleId) {
  return !isEvilRole(roleId);
}

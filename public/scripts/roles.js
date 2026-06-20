export const TYPE_LABEL = {
  townsfolk: 'Townsfolk',
  outsider: 'Outsider',
  minion: 'Minion',
  demon: 'Demônio'
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
  {
    id: 'classic',
    name: 'Modo Clássico',
    subtitle: 'Trouble Brewing simplificado para celular',
    description: 'Única seleção ativa neste MVP. O host escolhe a subseleção de roles e o site guia a noite.'
  }
];

export const ROLES = [
  {
    id: 'washerwoman',
    name: 'Lavadeira',
    type: 'townsfolk',
    script: 'classic',
    duration: 2,
    difficulty: -2,
    nightOrderFirst: 40,
    nightOrderOther: null,
    tags: [],
    summary: 'Na primeira noite, vê dois jogadores e uma role townsfolk; um deles é aquela role.',
    action: 'washerwoman'
  },
  {
    id: 'librarian',
    name: 'Bibliotecário',
    type: 'townsfolk',
    script: 'classic',
    duration: 2,
    difficulty: -2,
    nightOrderFirst: 50,
    nightOrderOther: null,
    tags: [],
    summary: 'Na primeira noite, vê dois jogadores e uma role outsider; um deles é aquela role. Se não houver outsiders, pode saber isso.',
    action: 'librarian'
  },
  {
    id: 'investigator',
    name: 'Investigador',
    type: 'townsfolk',
    script: 'classic',
    duration: 2,
    difficulty: -2,
    nightOrderFirst: 60,
    nightOrderOther: null,
    tags: [],
    summary: 'Na primeira noite, vê dois jogadores e uma role minion; um deles é aquela role.',
    action: 'investigator'
  },
  {
    id: 'chef',
    name: 'Chef',
    type: 'townsfolk',
    script: 'classic',
    duration: 1,
    difficulty: -1,
    nightOrderFirst: 70,
    nightOrderOther: null,
    tags: [],
    summary: 'Na primeira noite, aprende quantos pares de jogadores malignos estão sentados lado a lado.',
    action: 'chef'
  },
  {
    id: 'empath',
    name: 'Empata',
    type: 'townsfolk',
    script: 'classic',
    duration: 2,
    difficulty: -3,
    nightOrderFirst: 80,
    nightOrderOther: 70,
    tags: [],
    summary: 'A cada noite, aprende quantos dos seus dois vizinhos vivos são malignos.',
    action: 'empath'
  },
  {
    id: 'fortune_teller',
    name: 'Vidente',
    type: 'townsfolk',
    script: 'classic',
    duration: 3,
    difficulty: -3,
    nightOrderFirst: 90,
    nightOrderOther: 80,
    tags: [],
    summary: 'A cada noite, escolhe dois jogadores e aprende se algum deles registra como demônio.',
    action: 'fortune_teller'
  },
  {
    id: 'undertaker',
    name: 'Coveiro',
    type: 'townsfolk',
    script: 'classic',
    duration: 2,
    difficulty: -2,
    nightOrderFirst: null,
    nightOrderOther: 60,
    tags: [],
    summary: 'A partir da segunda noite, aprende qual era a role do jogador executado durante o dia.',
    action: 'undertaker'
  },
  {
    id: 'monk',
    name: 'Monge',
    type: 'townsfolk',
    script: 'classic',
    duration: 2,
    difficulty: -2,
    nightOrderFirst: null,
    nightOrderOther: 20,
    tags: [],
    summary: 'A cada noite exceto a primeira, escolhe outro jogador para ficar protegido do demônio naquela noite.',
    action: 'monk'
  },
  {
    id: 'ravenkeeper',
    name: 'Guardião dos Corvos',
    type: 'townsfolk',
    script: 'classic',
    duration: 2,
    difficulty: -2,
    nightOrderFirst: null,
    nightOrderOther: 50,
    tags: [],
    summary: 'Se morrer durante a noite, acorda e escolhe um jogador para aprender a role dele.',
    action: 'ravenkeeper'
  },
  {
    id: 'virgin',
    name: 'Virgem',
    type: 'townsfolk',
    script: 'classic',
    duration: 0,
    difficulty: -1,
    nightOrderFirst: null,
    nightOrderOther: null,
    tags: [],
    summary: 'Durante o dia, a primeira nomeação feita contra ela pode executar o nomeador se ele for townsfolk.',
    action: 'manual_day'
  },
  {
    id: 'slayer',
    name: 'Caçador',
    type: 'townsfolk',
    script: 'classic',
    duration: 0,
    difficulty: -1,
    nightOrderFirst: null,
    nightOrderOther: null,
    tags: [],
    summary: 'Durante o dia, uma vez por jogo, escolhe um jogador; se for o demônio, ele morre.',
    action: 'manual_day'
  },
  {
    id: 'soldier',
    name: 'Soldado',
    type: 'townsfolk',
    script: 'classic',
    duration: 0,
    difficulty: -1,
    nightOrderFirst: null,
    nightOrderOther: null,
    tags: [],
    summary: 'Não morre pelo ataque direto do demônio.',
    action: 'passive'
  },
  {
    id: 'mayor',
    name: 'Prefeito',
    type: 'townsfolk',
    script: 'classic',
    duration: 0,
    difficulty: -2,
    nightOrderFirst: null,
    nightOrderOther: null,
    tags: [],
    summary: 'Pode vencer se restarem três vivos e não houver execução. Se atacado à noite, o ataque pode ser redirecionado.',
    action: 'passive'
  },
  {
    id: 'butler',
    name: 'Mordomo',
    type: 'outsider',
    script: 'classic',
    duration: 1,
    difficulty: 1,
    nightOrderFirst: 100,
    nightOrderOther: 90,
    tags: [],
    summary: 'A cada noite, escolhe um mestre. No dia seguinte, só deve votar se o mestre votar junto.',
    action: 'butler'
  },
  {
    id: 'drunk',
    name: 'Bêbado',
    type: 'outsider',
    script: 'classic',
    duration: 1,
    difficulty: 2,
    nightOrderFirst: null,
    nightOrderOther: null,
    tags: [],
    summary: 'Não sabe que é o Bêbado; recebe uma role townsfolk falsa e informações ruins.',
    action: 'drunk'
  },
  {
    id: 'recluse',
    name: 'Recluso',
    type: 'outsider',
    script: 'classic',
    duration: 0,
    difficulty: 1,
    nightOrderFirst: null,
    nightOrderOther: null,
    tags: [],
    summary: 'Pode registrar como maligno, minion ou demônio mesmo sendo bom.',
    action: 'passive'
  },
  {
    id: 'saint',
    name: 'Santo',
    type: 'outsider',
    script: 'classic',
    duration: 0,
    difficulty: 3,
    nightOrderFirst: null,
    nightOrderOther: null,
    tags: [],
    summary: 'Se for executado, o bem perde.',
    action: 'manual_day'
  },
  {
    id: 'poisoner',
    name: 'Envenenador',
    type: 'minion',
    script: 'classic',
    duration: 2,
    difficulty: 3,
    nightOrderFirst: 20,
    nightOrderOther: 10,
    tags: [],
    summary: 'A cada noite, escolhe alguém para ficar envenenado; ações e informações dessa pessoa podem falhar.',
    action: 'poisoner'
  },
  {
    id: 'spy',
    name: 'Espião',
    type: 'minion',
    script: 'classic',
    duration: 2,
    difficulty: 2,
    nightOrderFirst: 30,
    nightOrderOther: 30,
    tags: [],
    summary: 'Vê quem é quem. Para informações do bem, pode registrar como townsfolk.',
    action: 'spy'
  },
  {
    id: 'scarlet_woman',
    name: 'Mulher Escarlate',
    type: 'minion',
    script: 'classic',
    duration: 0,
    difficulty: 3,
    nightOrderFirst: null,
    nightOrderOther: null,
    tags: [],
    summary: 'Se o demônio morrer com jogadores vivos suficientes, ela pode virar o novo demônio.',
    action: 'scarlet_woman'
  },
  {
    id: 'baron',
    name: 'Barão',
    type: 'minion',
    script: 'classic',
    duration: 0,
    difficulty: 2,
    nightOrderFirst: null,
    nightOrderOther: null,
    tags: [],
    summary: 'Na montagem, adiciona mais outsiders e reduz townsfolk.',
    action: 'baron'
  },
  {
    id: 'imp',
    name: 'Imp',
    type: 'demon',
    script: 'classic',
    duration: 3,
    difficulty: 4,
    nightOrderFirst: null,
    nightOrderOther: 40,
    tags: [],
    summary: 'A cada noite exceto a primeira, escolhe alguém para morrer. Se matar a si mesmo, pode passar o demônio para um minion.',
    action: 'imp'
  }
];

export function roleById(id) {
  return ROLES.find((role) => role.id === id);
}

export function rolesByType(type) {
  return ROLES.filter((role) => role.type === type);
}

export function rolesForScript(scriptId = 'classic') {
  return ROLES.filter((role) => role.script === scriptId);
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

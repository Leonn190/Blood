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
  {
    id: 'classic',
    name: 'Modo Clássico',
    subtitle: 'Base clássica',
    description: 'Seleção clássica com as 22 roles iniciais. Boa para partidas mais simples.'
  },
  {
    id: 'expanded',
    name: 'Seleção Completa',
    subtitle: 'Tudo que existe no site',
    description: 'Usa todas as roles cadastradas no site, incluindo as novas roles personalizadas.'
  },
  {
    id: 'custom',
    name: 'Seleção Personalizada',
    subtitle: 'Você escolhe o pool',
    description: 'Pool livre com todas as roles do site. O guia gerado mostra só as roles escolhidas para a partida.'
  }
];

export const CLASSIC_ROLE_IDS = [
  'washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortune_teller', 'undertaker', 'monk', 'ravenkeeper', 'virgin', 'slayer', 'soldier', 'mayor',
  'butler', 'drunk', 'recluse', 'saint',
  'poisoner', 'spy', 'scarlet_woman', 'baron',
  'imp'
];

export const ROLES = [
  {
    id: 'washerwoman',
    name: 'Lavadeira',
    type: 'townsfolk',
    duration: 1,
    difficulty: -2,
    nightOrderFirst: 40,
    nightOrderOther: null,
    summary: 'Na primeira noite, vê dois jogadores e uma role Townsfolk. Um deles é aquela role.',
    action: 'washerwoman'
  },
  {
    id: 'librarian',
    name: 'Bibliotecário',
    type: 'townsfolk',
    duration: 1,
    difficulty: -2,
    nightOrderFirst: 50,
    nightOrderOther: null,
    summary: 'Na primeira noite, vê dois jogadores e uma role Outsider. Um deles é aquela role.',
    action: 'librarian'
  },
  {
    id: 'investigator',
    name: 'Investigador',
    type: 'townsfolk',
    duration: 1,
    difficulty: -2,
    nightOrderFirst: 60,
    nightOrderOther: null,
    summary: 'Na primeira noite, vê dois jogadores e uma role Minion. Um deles é aquela role.',
    action: 'investigator'
  },
  {
    id: 'chef',
    name: 'Chef',
    type: 'townsfolk',
    duration: 1,
    difficulty: -1,
    nightOrderFirst: 70,
    nightOrderOther: null,
    summary: 'Na primeira noite, aprende quantos pares malignos estão sentados lado a lado.',
    action: 'chef'
  },
  {
    id: 'empath',
    name: 'Empata',
    type: 'townsfolk',
    duration: 1,
    difficulty: -3,
    nightOrderFirst: 80,
    nightOrderOther: 70,
    summary: 'A cada noite, aprende quantos dos dois vizinhos vivos registram como malignos.',
    action: 'empath'
  },
  {
    id: 'fortune_teller',
    name: 'Vidente',
    type: 'townsfolk',
    duration: 1,
    difficulty: -3,
    nightOrderFirst: 90,
    nightOrderOther: 80,
    summary: 'A cada noite, escolhe dois jogadores e vê se algum deles registra como demônio.',
    action: 'fortune_teller'
  },
  {
    id: 'undertaker',
    name: 'Coveiro',
    type: 'townsfolk',
    duration: 1,
    difficulty: -2,
    nightOrderFirst: null,
    nightOrderOther: 60,
    summary: 'Nas noites depois da primeira, vê a role de quem foi executado no dia anterior.',
    action: 'undertaker'
  },
  {
    id: 'monk',
    name: 'Monge',
    type: 'townsfolk',
    duration: 1,
    difficulty: -2,
    nightOrderFirst: null,
    nightOrderOther: 30,
    summary: 'Nas noites depois da primeira, escolhe alguém para ficar protegido do demônio.',
    action: 'monk'
  },
  {
    id: 'ravenkeeper',
    name: 'Guardião dos Corvos',
    type: 'townsfolk',
    duration: 1,
    difficulty: -2,
    nightOrderFirst: null,
    nightOrderOther: null,
    summary: 'Se morreu à noite ou foi executado, acorda na próxima noite e vê a role de alguém.',
    action: 'ravenkeeper'
  },
  {
    id: 'virgin',
    name: 'Virgem',
    type: 'townsfolk',
    duration: 0,
    difficulty: -1,
    nightOrderFirst: null,
    nightOrderOther: null,
    summary: 'Durante o dia, a primeira nomeação contra ela pode executar quem nomeou se for Townsfolk.',
    action: 'manual_day'
  },
  {
    id: 'slayer',
    name: 'Caçador',
    type: 'townsfolk',
    duration: 0,
    difficulty: -1,
    nightOrderFirst: null,
    nightOrderOther: null,
    summary: 'Durante o dia, uma vez por jogo, escolhe alguém. Se for o demônio, ele morre.',
    action: 'manual_day'
  },
  {
    id: 'soldier',
    name: 'Soldado',
    type: 'townsfolk',
    duration: 0,
    difficulty: -1,
    nightOrderFirst: null,
    nightOrderOther: null,
    summary: 'Não morre pelo ataque direto do demônio.',
    action: 'passive'
  },
  {
    id: 'mayor',
    name: 'Prefeito',
    type: 'townsfolk',
    duration: 0,
    difficulty: -2,
    nightOrderFirst: null,
    nightOrderOther: null,
    summary: 'Pode vencer se restarem três vivos e ninguém for executado. Ataque noturno pode redirecionar.',
    action: 'passive'
  },
  {
    id: 'exorcist',
    name: 'Exorcista',
    type: 'townsfolk',
    duration: 1,
    difficulty: -3,
    nightOrderFirst: 5,
    nightOrderOther: 5,
    summary: 'A cada noite, escolhe alguém. Se for maligno, o poder dele é bloqueado naquela noite.',
    action: 'exorcist'
  },
  {
    id: 'doctor',
    name: 'Médico',
    type: 'townsfolk',
    duration: 1,
    difficulty: -2,
    nightOrderFirst: 6,
    nightOrderOther: 6,
    summary: 'A cada noite, escolhe alguém para ficar livre de veneno e de bebedeira naquela rodada.',
    action: 'doctor'
  },
  {
    id: 'protector',
    name: 'Protetor',
    type: 'townsfolk',
    duration: 0,
    difficulty: -2,
    nightOrderFirst: null,
    nightOrderOther: null,
    summary: 'Os dois jogadores vivos ao seu lado ficam protegidos de morte causada pelo demônio.',
    action: 'passive'
  },
  {
    id: 'cannibal',
    name: 'Canibal',
    type: 'townsfolk',
    duration: 1,
    difficulty: -1,
    nightOrderFirst: null,
    nightOrderOther: 95,
    summary: 'À noite, pode roubar poder de alguém morto. Se escolher alguém maligno, morre.',
    action: 'cannibal'
  },
  {
    id: 'butler',
    name: 'Mordomo',
    type: 'outsider',
    duration: 1,
    difficulty: 1,
    nightOrderFirst: 100,
    nightOrderOther: 90,
    summary: 'A cada noite, escolhe um mestre. No dia seguinte, só deve votar se o mestre votar junto.',
    action: 'butler'
  },
  {
    id: 'drunk',
    name: 'Bêbado',
    type: 'outsider',
    duration: 0,
    difficulty: 2,
    nightOrderFirst: null,
    nightOrderOther: null,
    summary: 'Não sabe que é o Bêbado. Recebe uma role Townsfolk falsa e pode receber informação errada.',
    action: 'drunk'
  },
  {
    id: 'recluse',
    name: 'Recluso',
    type: 'outsider',
    duration: 0,
    difficulty: 1,
    nightOrderFirst: null,
    nightOrderOther: null,
    summary: 'Pode registrar como maligno, Minion ou demônio mesmo sendo bom.',
    action: 'passive'
  },
  {
    id: 'saint',
    name: 'Santo',
    type: 'outsider',
    duration: 0,
    difficulty: 3,
    nightOrderFirst: null,
    nightOrderOther: null,
    summary: 'Se for executado e não estiver protegido de falha, o mal vence.',
    action: 'manual_day'
  },
  {
    id: 'poisoner',
    name: 'Envenenador',
    type: 'minion',
    duration: 1,
    difficulty: 3,
    nightOrderFirst: 20,
    nightOrderOther: 10,
    summary: 'A cada noite, escolhe alguém para ficar envenenado. Ações e informações dessa pessoa podem falhar.',
    action: 'poisoner'
  },
  {
    id: 'spy',
    name: 'Espião',
    type: 'minion',
    duration: 1,
    difficulty: 2,
    nightOrderFirst: 30,
    nightOrderOther: 20,
    summary: 'Vê o grimório completo. Para informações do bem, pode registrar como Townsfolk.',
    action: 'spy'
  },
  {
    id: 'scarlet_woman',
    name: 'Mulher Escarlate',
    type: 'minion',
    duration: 0,
    difficulty: 3,
    nightOrderFirst: null,
    nightOrderOther: null,
    summary: 'Se o demônio morrer com jogadores vivos suficientes, ela vira o novo Imp.',
    action: 'scarlet_woman'
  },
  {
    id: 'baron',
    name: 'Barão',
    type: 'minion',
    duration: 0,
    difficulty: 2,
    nightOrderFirst: null,
    nightOrderOther: null,
    summary: 'Na montagem, coloca +2 Outsiders e -2 Townsfolk.',
    action: 'baron'
  },
  {
    id: 'imp',
    name: 'Imp',
    type: 'demon',
    duration: 1,
    difficulty: 4,
    nightOrderFirst: null,
    nightOrderOther: 40,
    summary: 'Nas noites depois da primeira, escolhe alguém para morrer. Pode se matar para passar o demônio.',
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

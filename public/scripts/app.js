import {
  ROLES,
  SCRIPTS,
  TYPE_LABEL,
  TYPE_EMOJI,
  TYPE_ORDER,
  roleById,
  rolesForScript,
  scriptById,
  getDistribution,
  isEvilRole
} from './roles.js';

const STORAGE_KEY = 'clocktower-local-v7';
const app = document.querySelector('#app');
const sharedGuideIds = getSharedGuideIdsFromUrl();

const initialState = {
  view: 'home',
  guide: { search: '', type: 'all', scriptId: 'all' },
  setup: {
    scriptId: 'classic',
    playerCount: 7,
    mode: 'automatic',
    selectedRoleIds: [],
    customPoolIds: ROLES.map((role) => role.id)
  },
  revealOpen: false,
  game: null
};

let state = loadState();
let lastRenderedKey = '';
let historyReady = false;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === 'object') return mergeState(structuredClone(initialState), saved);
  } catch {}
  return structuredClone(initialState);
}

function mergeState(base, saved) {
  return {
    ...base,
    ...saved,
    guide: { ...base.guide, ...(saved.guide || {}) },
    setup: { ...base.setup, ...(saved.setup || {}) }
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveAndRender(options = {}) {
  saveState();
  if (options.push !== false) pushBrowserState();
  render(options);
}

function setState(patch, options = {}) {
  state = { ...state, ...patch };
  saveAndRender(options);
}

function go(view, options = {}) {
  setState({ view, revealOpen: false }, options);
}

function pushBrowserState() {
  if (sharedGuideIds.length || !historyReady) return;
  history.pushState({ clocktower: true, view: state.view }, '', location.pathname);
}

function getSharedGuideIdsFromUrl() {
  const params = new URLSearchParams(location.search);
  const raw = params.get('guia') || params.get('guide') || '';
  return raw.split(',').map((id) => id.trim()).filter((id) => roleById(id));
}

function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function sample(list) {
  if (!list?.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function sampleMany(list, count) {
  return shuffle(list).slice(0, Math.max(0, count));
}

function clamp(number, min, max) {
  return Math.min(max, Math.max(min, number));
}

function createId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `p-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function allPlayers() {
  return state.game?.players || [];
}

function livingPlayers() {
  return allPlayers().filter((player) => player.alive);
}

function pendingDeathIds() {
  return new Set(state.game?.night?.deadTonightIds || []);
}

function activeLivingPlayers() {
  const pending = pendingDeathIds();
  return livingPlayers().filter((player) => !pending.has(player.id));
}

function deadPlayersIncludingPending() {
  const pending = new Set(state.game?.night?.deadTonightIds || []);
  return allPlayers().filter((player) => !player.alive || pending.has(player.id));
}

function playerName(player) {
  return player?.name?.trim() || `Jogador ${player?.seat || '?'}`;
}

function trueRole(player) {
  return roleById(player?.currentRoleId || player?.trueRoleId);
}

function visibleRoleId(player) {
  return player?.fakeRoleId || player?.currentRoleId || player?.trueRoleId;
}

function visibleRole(player) {
  return roleById(visibleRoleId(player));
}

function actingRoleId(player) {
  return player?.abilityRoleId || player?.fakeRoleId || player?.currentRoleId || player?.trueRoleId;
}

function actingRole(player) {
  return roleById(actingRoleId(player));
}

function isPlayerEvil(player) {
  const role = trueRole(player);
  return role?.type === 'minion' || role?.type === 'demon';
}

function isSoberProtected(playerId) {
  return Boolean(playerId && state.game?.night?.soberProtectedId === playerId);
}

function isPoisoned(playerId) {
  if (!playerId || isSoberProtected(playerId)) return false;
  const status = state.game?.status || {};
  return state.game?.night?.poisonedId === playerId || status.widowPoisonedId === playerId || status.pukkaPoisonedId === playerId;
}

function isTechnicalDrunk(playerId) {
  if (!playerId || isSoberProtected(playerId)) return false;
  return state.game?.technicalDrunkId === playerId;
}

function isDrunkLike(player) {
  if (!player?.id) return false;
  if (isSoberProtected(player.id)) return false;
  return ['drunk', 'lunatic', 'tormented'].includes(player.trueRoleId) || isPoisoned(player.id) || isTechnicalDrunk(player.id) || state.game?.status?.charmedDrunkId === player.id;
}

function isBlockedActor(playerId) {
  return Boolean(playerId && state.game?.night?.blockedActorIds?.includes(playerId));
}

function hasAliveRole(roleId) {
  return activeLivingPlayers().some((player) => player.currentRoleId === roleId && !isDrunkLike(player));
}

function roleStepCount(role) {
  if (!role) return 0;
  if (['ravenkeeper', 'undertaker', 'cannibal', 'guardian', 'clumsy', 'explosive'].includes(role.action)) return 1;
  const first = role.nightOrderFirst !== null && role.nightOrderFirst !== undefined;
  const other = role.nightOrderOther !== null && role.nightOrderOther !== undefined;
  return first || other ? 1 : 0;
}

function roleCompactStats(role) {
  const diff = Number(role?.difficulty || 0);
  return `<span class="mini-stat" title="Etapas da noite">🌙 ${roleStepCount(role)}</span><span class="mini-stat" title="Dificuldade para o bem">⚔️ ${diff > 0 ? '+' : ''}${diff}</span>`;
}

function roleCard(role, options = {}) {
  const selectedClass = options.checked ? ' selected' : '';
  const action = options.action ? ` data-action="${escapeHTML(options.action)}" data-role-id="${escapeHTML(role.id)}"` : '';
  return `
    <article class="card role-card ${role.type}${selectedClass}"${action}>
      <div class="role-card-content">
        <div class="role-title compact-title">
          <div>
            <h3>${escapeHTML(role.name)}</h3>
            <p>${escapeHTML(role.summary)}</p>
          </div>
        </div>
        <p class="hint compact-hint">${roleCompactStats(role)}</p>
      </div>
    </article>
  `;
}

function roleMiniName(id) {
  return escapeHTML(roleById(id)?.name || '');
}

function selectedRoles() {
  return state.setup.selectedRoleIds.map(roleById).filter(Boolean);
}

function getRolePoolForSetup() {
  if (state.setup.scriptId === 'custom') {
    const ids = Array.isArray(state.setup.customPoolIds) ? state.setup.customPoolIds : ROLES.map((role) => role.id);
    return ids.map(roleById).filter(Boolean);
  }
  return rolesForScript(state.setup.scriptId);
}

function getRolePoolIdsForSetup() {
  return getRolePoolForSetup().map((role) => role.id);
}

function selectedCounts(roleIds = state.setup.selectedRoleIds) {
  const counts = { townsfolk: 0, outsider: 0, minion: 0, demon: 0 };
  roleIds.forEach((id) => {
    const role = roleById(id);
    if (role) counts[role.type] += 1;
  });
  return counts;
}

function targetForRoleIds(roleIds = state.setup.selectedRoleIds) {
  const target = getDistribution(Number(state.setup.playerCount), roleIds.includes('baron'));
  if (roleIds.includes('vampire')) {
    if (target.outsider > 0) { target.outsider -= 1; target.townsfolk += 1; }
    else if (target.minion > 1) { target.minion -= 1; target.townsfolk += 1; }
  }
  if (roleIds.includes('overlord')) {
    if (target.townsfolk > 0) { target.townsfolk -= 1; target.minion += 1; }
    else if (target.outsider > 0) { target.outsider -= 1; target.minion += 1; }
  }
  return target;
}

function setupTarget(roleIds = state.setup.selectedRoleIds) {
  return targetForRoleIds(roleIds);
}

function setupValidation(roleIds = state.setup.selectedRoleIds) {
  const counts = selectedCounts(roleIds);
  const target = setupTarget(roleIds);
  const selected = roleIds.length;
  const expected = Number(state.setup.playerCount);
  const errors = [];
  const poolIds = getRolePoolIdsForSetup();

  if (selected !== expected) errors.push(`Selecione exatamente ${expected} roles. Agora tem ${selected}.`);
  TYPE_ORDER.forEach((type) => {
    if (counts[type] !== target[type]) errors.push(`${TYPE_EMOJI[type]} precisa ${target[type]}, agora tem ${counts[type]}.`);
  });
  if (roleIds.includes('king')) {
    if (!poolIds.includes('soldier')) errors.push('Rei só pode existir se Soldado estiver na seleção/pool.');
    if (roleIds.includes('soldier')) errors.push('Rei só pode entrar se Soldado estiver fora da subseleção.');
  }
  return { counts, target, errors, valid: errors.length === 0 };
}

function metricInfo() {
  const roles = selectedRoles();
  const firstRoleSteps = roles.filter((role) => role.nightOrderFirst !== null && role.nightOrderFirst !== undefined).length;
  const otherRoleSteps = roles.filter((role) => role.nightOrderOther !== null && role.nightOrderOther !== undefined).length;
  const firstTeamSteps = roles.some((role) => role.type === 'minion') ? 1 : 0;
  const demonInfoStep = roles.some((role) => role.type === 'demon') ? 1 : 0;
  const firstNightSteps = firstRoleSteps + firstTeamSteps + demonInfoStep;
  const conditionalSteps = roles.filter((role) => ['ravenkeeper', 'cannibal', 'undertaker', 'guardian', 'clumsy', 'explosive'].includes(role.action)).length;
  const otherNightSteps = otherRoleSteps + conditionalSteps;
  const duration = Math.max(firstNightSteps, otherNightSteps);
  const rawDifficulty = roles.reduce((sum, role) => sum + Number(role.difficulty || 0), 0);
  const difficulty = clamp(5 + rawDifficulty, 0, 10);
  const durationPct = clamp((duration / 24) * 100, 4, 100);
  const difficultyPct = clamp(difficulty * 10, 4, 100);
  let difficultyLabel = 'padrão';
  if (difficulty <= 3) difficultyLabel = 'bem favorecido';
  if (difficulty >= 7) difficultyLabel = 'bem pressionado';
  return { duration, firstNightSteps, otherNightSteps, difficulty, durationPct, difficultyPct, difficultyLabel };
}

function rolesByTypeLocal(list, type) {
  return list.filter((role) => role.type === type);
}


function buildRandomValidRoleIds(forceBaron = null) {
  const pool = getRolePoolForSetup();
  const hasBaronInPool = pool.some((role) => role.id === 'baron');
  const includeBaron = hasBaronInPool && (forceBaron === null ? Math.random() < 0.25 : Boolean(forceBaron));

  const townsfolkPool = rolesByTypeLocal(pool, 'townsfolk');
  const outsiderPool = rolesByTypeLocal(pool, 'outsider');
  const minionPool = rolesByTypeLocal(pool, 'minion').filter((role) => role.id !== 'baron');
  const demonPool = rolesByTypeLocal(pool, 'demon');
  const demon = sample(demonPool);
  if (!demon) return null;

  const seedIds = [demon.id];
  if (includeBaron) seedIds.push('baron');
  const target = targetForRoleIds(seedIds);
  const picked = [];

  if (outsiderPool.length < target.outsider) return null;
  if (includeBaron && target.minion < 1) return null;
  const nonBaronMinionsNeeded = target.minion - (includeBaron ? 1 : 0);
  if (nonBaronMinionsNeeded < 0 || minionPool.length < nonBaronMinionsNeeded) return null;
  if (demonPool.length < target.demon) return null;

  const chosenTown = [];
  for (const role of shuffle(townsfolkPool)) {
    if (chosenTown.length >= target.townsfolk) break;
    if (role.id === 'king' && !pool.some((r) => r.id === 'soldier')) continue;
    if (role.id === 'soldier' && chosenTown.some((r) => r.id === 'king')) continue;
    if (role.id === 'king' && chosenTown.some((r) => r.id === 'soldier')) continue;
    chosenTown.push(role);
  }
  if (chosenTown.length < target.townsfolk) return null;

  picked.push(...chosenTown);
  picked.push(...sampleMany(outsiderPool, target.outsider));
  if (includeBaron) picked.push(roleById('baron'));
  picked.push(...sampleMany(minionPool, nonBaronMinionsNeeded));
  picked.push(demon);

  const ids = shuffle(picked.filter(Boolean).map((role) => role.id));
  return setupValidation(ids).valid ? ids : null;
}

function autoFillRoles() {
  let ids = null;
  const attempts = [];
  for (let i = 0; i < 80; i += 1) attempts.push(Math.random() < 0.28);
  attempts.push(null, null, null, true, false, null);
  for (let attempt = 0; attempt < attempts.length && !ids; attempt += 1) {
    ids = buildRandomValidRoleIds(attempts[attempt]);
  }
  if (!ids) {
    alert('Não consegui montar uma formação válida com esse número de jogadores e esse pool de roles. Ajuste o pool ou preencha manualmente.');
    return;
  }
  state.setup.selectedRoleIds = ids;
  saveAndRender({ push: false, keepScroll: true });
}

function resetAll() {
  state = structuredClone(initialState);
  saveAndRender({ push: false });
}

function createDemonBluffs(selectedIds) {
  const possible = getRolePoolForSetup()
    .filter((role) => role.type === 'townsfolk' && !selectedIds.includes(role.id))
    .filter((role) => !(selectedIds.includes('king') && role.id === 'soldier'))
    .map((role) => role.id);
  return sampleMany(possible, 3);
}

function startGame() {
  const validation = setupValidation();
  if (!validation.valid) {
    alert('A subseleção ainda não está válida. Ajuste as quantidades antes de começar.');
    return;
  }

  const selectedIds = shuffle(state.setup.selectedRoleIds);
  const poolIds = getRolePoolIdsForSetup();
  const possibleFakeTownsfolk = getRolePoolForSetup()
    .filter((role) => role.type === 'townsfolk' && !selectedIds.includes(role.id))
    .map((role) => role.id);
  const selectedDemonId = selectedIds.find((id) => roleById(id)?.type === 'demon') || 'imp';

  const players = selectedIds.map((roleId, index) => {
    const role = roleById(roleId);
    let fakeRoleId = null;
    if (roleId === 'drunk') {
      fakeRoleId = sample(possibleFakeTownsfolk) || sample(ROLES.filter((r) => r.type === 'townsfolk').map((r) => r.id));
    }
    if (roleId === 'lunatic') {
      const goodDuplicates = selectedIds.filter((id) => id !== 'lunatic' && !isEvilRole(id));
      fakeRoleId = sample(goodDuplicates) || sample(ROLES.filter((r) => !isEvilRole(r.id)).map((r) => r.id));
    }
    if (roleId === 'tormented') {
      fakeRoleId = selectedDemonId;
    }
    return {
      id: createId(),
      seat: index + 1,
      name: '',
      trueRoleId: role.id,
      currentRoleId: role.id,
      fakeRoleId,
      abilityRoleId: null,
      cannibalSourceId: null,
      alive: true,
      used: {},
      masterId: null,
      cartographerDirection: Math.random() < 0.5 ? 'left' : 'right'
    };
  });

  const goodPlayers = players.filter((player) => !isEvilRole(player.currentRoleId));
  const redHerring = sample(goodPlayers.filter((player) => player.trueRoleId !== 'fortune_teller'));
  const hasTechnician = players.some((player) => player.currentRoleId === 'technician');
  const hasBaron = players.some((player) => player.currentRoleId === 'baron');
  const technicalDrunk = hasTechnician && !hasBaron ? sample(players.filter((player) => trueRole(player)?.type === 'minion' && player.currentRoleId !== 'baron')) : null;
  const evilOrder = shuffle(players.filter((player) => isEvilRole(player.currentRoleId)).map((player) => player.id));

  state.game = {
    scriptId: state.setup.scriptId,
    roleGuideIds: poolIds,
    selectedRoleIds: [...state.setup.selectedRoleIds],
    mode: state.setup.mode,
    players,
    revealIndex: 0,
    redHerringId: redHerring?.id || null,
    bluffs: createDemonBluffs(selectedIds),
    technicalDrunkId: technicalDrunk?.id || null,
    intellectualEvilOrder: evilOrder,
    disabledPowerIds: [],
    nightNumber: 1,
    night: null,
    status: {
      poisonedId: null,
      poisonedNight: null,
      soberProtectedId: null,
      protectedId: null,
      permanentGuardedId: null,
      guardianId: null,
      exorcisedId: null,
      sentinelBlockedId: null,
      butlerId: null,
      butlerMasterId: null,
      lastNightDeaths: [],
      lastTargets: [],
      alchemistWatchId: null,
      alchemistDemonId: null,
      professorSwap: null,
      charmedDrunkId: null,
      widowPoisonedId: null,
      widowKnownById: null,
      pukkaPoisonedId: null,
      pukkaDoomedId: null,
      executionProtectedId: null,
      witchCursedId: null,
      markerMarkedId: null,
      vampireConvertedId: null,
      explosivePending: false,
      manipulatorGraceUntilDay: null,
      parasiteHostId: null,
      overlordTargetId: null,
      overlordKillPendingId: null
    },
    day: { number: 1, lastExecutedId: null, lastDayDeaths: [], warnings: [] },
    log: [],
    ended: false
  };
  state.revealOpen = false;
  go('reveal');
}

function saveCurrentPlayerName() {
  const player = state.game?.players?.[state.game.revealIndex];
  const input = document.querySelector('[data-player-name]');
  if (player && input) {
    player.name = input.value.trim() || `Jogador ${player.seat}`;
    saveState();
  }
}

function nextReveal() {
  saveCurrentPlayerName();
  if (state.game.revealIndex < state.game.players.length - 1) {
    state.game.revealIndex += 1;
    state.revealOpen = false;
    saveAndRender({ push: false });
  } else {
    go('grimoire');
  }
}

function previousReveal() {
  saveCurrentPlayerName();
  if (!state.game || state.game.revealIndex <= 0) return go('setup', { push: false });
  state.game.revealIndex -= 1;
  state.revealOpen = false;
  saveAndRender({ push: false });
}

function startNight(number = state.game.nightNumber) {
  state.game.nightNumber = number;
  state.game.status.poisonedId = null;
  state.game.status.poisonedNight = null;
  state.game.status.soberProtectedId = null;
  state.game.status.protectedId = null;
  state.game.status.exorcisedId = null;
  state.game.status.sentinelBlockedId = null;
  state.game.status.executionProtectedId = null;
  state.game.status.witchCursedId = null;
  state.game.status.overlordTargetId = null;
  state.game.status.lastTargets = [];
  state.game.status.alchemistDemonId = null;
  state.game.status.professorSwap = null;
  const executed = findPlayer(state.game.day?.lastExecutedId);
  const executedRavenkeeperId = executed?.currentRoleId === 'ravenkeeper' ? executed.id : null;
  state.game.night = {
    number,
    currentStep: 0,
    steps: [],
    results: {},
    poisonedId: null,
    soberProtectedId: null,
    protectedId: null,
    exorcisedId: null,
    blockedActorIds: [],
    deadTonightIds: [],
    pendingRavenkeeperId: executedRavenkeeperId,
    pendingClumsyIds: [],
    targetedIds: [],
    alchemistWatch: null,
    startedAt: Date.now()
  };
  state.game.night.steps = buildNightSteps(number);
  state.game.log.push(`Noite ${number} começou.`);
  go('night');
}

function shouldIncludeRoleStep(player, role, nightNumber) {
  if (!player.alive) return false;
  if (pendingDeathIds().has(player.id)) return false;
  if (!role?.action) return false;
  if (state.game.disabledPowerIds?.includes(player.id) && trueRole(player)?.type !== 'demon') return false;
  if (role.action === 'undertaker') return nightNumber > 1 && Boolean(state.game.day?.lastExecutedId);
  if (role.action === 'cannibal') return nightNumber > 1 && deadPlayersIncludingPending().some((p) => p.id !== player.id);
  if (role.action === 'guardian') return nightNumber === 2 && !player.used?.guardian;
  if (role.action === 'assassin') return nightNumber > 1 && !player.used?.assassin;
  if (role.action === 'po') return nightNumber > 1 && !player.used?.poKilled;
  if (role.action === 'vampire') return nightNumber > 1;
  if (role.action === 'overlord') return nightNumber > 1;
  if (role.action === 'ravenkeeper' || role.action === 'clumsy' || role.action === 'explosive') return false;
  const order = nightNumber === 1 ? role.nightOrderFirst : role.nightOrderOther;
  return order !== null && order !== undefined;
}

function buildNightSteps(nightNumber) {
  const steps = [];
  const players = allPlayers();

  if (nightNumber === 1) {
    if (players.some((p) => trueRole(p)?.type === 'minion')) steps.push({ id: 'minion-info', kind: 'team', title: 'Informação dos minions', order: 1, action: 'minion-info' });
    if (players.some((p) => trueRole(p)?.type === 'demon')) steps.push({ id: 'demon-info', kind: 'team', title: 'Informação do demônio', order: 2, action: 'demon-info' });
  }

  const roleSteps = [];
  players.forEach((player) => {
    const role = actingRole(player);
    if (!shouldIncludeRoleStep(player, role, nightNumber)) return;
    roleSteps.push({
      id: `${role.action}-${player.id}-${nightNumber}`,
      kind: 'role',
      title: role.name,
      roleId: role.id,
      actorId: player.id,
      action: role.action,
      order: nightNumber === 1 ? role.nightOrderFirst : role.nightOrderOther
    });
  });

  if (nightNumber > 1 && state.game.status?.pukkaDoomedId) {
    roleSteps.push({ id: `pukka-doom-${nightNumber}`, kind: 'status', title: 'Pukka', roleId: 'pukka', action: 'pukka-doom', order: 0 });
  }
  if (nightNumber > 1 && state.game.status?.overlordKillPendingId) {
    roleSteps.push({ id: `overlord-kill-${nightNumber}`, kind: 'status', title: 'Overlord', roleId: 'overlord', action: 'overlord-kill', order: 12 });
  }
  if (nightNumber > 1 && state.game.status?.explosivePending) {
    roleSteps.push({ id: `explosive-${nightNumber}`, kind: 'status', title: 'Explosivo', roleId: 'explosive', action: 'explosive', order: 60 });
  }
  if (nightNumber > 1 && state.game.night?.pendingRavenkeeperId) {
    roleSteps.push({ id: `ravenkeeper-conditional-${nightNumber}`, kind: 'conditional', title: 'Guardião dos Corvos', roleId: 'ravenkeeper', action: 'ravenkeeper', order: 62 });
  }
  (state.game.night?.pendingClumsyIds || []).forEach((id, index) => {
    roleSteps.push({ id: `clumsy-${id}-${nightNumber}`, kind: 'conditional', title: 'Desajeitado', roleId: 'clumsy', action: 'clumsy', actorId: id, order: 64 + index });
  });

  steps.push(...roleSteps.sort((a, b) => a.order - b.order));
  return steps;
}

function syncFutureNightSteps() {
  const night = state.game?.night;
  if (!night?.steps) return;
  const currentIndex = Math.max(0, night.currentStep || 0);
  const current = night.steps[currentIndex];
  const currentOrder = Number.isFinite(current?.order) ? current.order : -Infinity;
  const keep = night.steps.slice(0, currentIndex + 1);
  const futureSpecial = night.steps.slice(currentIndex + 1).filter((step) => step.kind !== 'role');
  const usedIds = new Set([...keep, ...futureSpecial].map((step) => step.id));
  const futureRoles = [];

  allPlayers().forEach((player) => {
    const role = actingRole(player);
    if (!shouldIncludeRoleStep(player, role, night.number)) return;
    const order = night.number === 1 ? role.nightOrderFirst : role.nightOrderOther;
    if (order === null || order === undefined || order <= currentOrder) return;
    const id = `${role.action}-${player.id}-${night.number}`;
    if (usedIds.has(id) || night.results?.[id]) return;
    futureRoles.push({
      id,
      kind: 'role',
      title: role.name,
      roleId: role.id,
      actorId: player.id,
      action: role.action,
      order
    });
  });

  const future = [...futureSpecial, ...futureRoles]
    .filter((step, index, list) => list.findIndex((item) => item.id === step.id) === index)
    .sort((a, b) => a.order - b.order);
  night.steps = [...keep, ...future];
}

function currentStep() {
  return state.game?.night?.steps?.[state.game.night.currentStep] || null;
}

function isStepSkipped(step) {
  if (!step?.actorId) return false;
  if (step.action === 'clumsy') return false;
  const actor = findPlayer(step.actorId);
  const pendingDeath = state.game?.night?.deadTonightIds?.includes(step.actorId);
  const blocked = state.game?.night?.blockedActorIds?.includes(step.actorId);
  return !actor || !actor.alive || pendingDeath || blocked || (state.game.disabledPowerIds?.includes(step.actorId) && trueRole(actor)?.type !== 'demon');
}

function nextStep(options = {}) {
  const night = state.game.night;
  let nextIndex = night.currentStep + 1;
  while (nextIndex < night.steps.length && isStepSkipped(night.steps[nextIndex])) nextIndex += 1;
  if (nextIndex < night.steps.length) {
    night.currentStep = nextIndex;
    saveAndRender(options);
  } else {
    finishNight();
  }
}

function prevStep(options = {}) {
  const night = state.game?.night;
  if (!night) return;
  if (night.currentStep > 0) {
    night.currentStep -= 1;
    saveAndRender(options);
  }
}

function finishNight() {
  const deaths = [...new Set(state.game.night.deadTonightIds || [])];
  deaths.forEach((id) => {
    const player = findPlayer(id);
    if (player) {
      player.alive = false;
      applyDeathTrigger(player, 'noite');
    }
  });
  state.game.status.lastNightDeaths = deaths;
  state.game.status.lastTargets = [...new Set(state.game.night.targetedIds || [])];
  const names = deaths.map((id) => playerName(findPlayer(id))).join(', ');
  state.game.log.push(`Noite ${state.game.night.number} terminou.${names ? ` Mortes: ${names}.` : ' Sem mortes noturnas.'}`);
  resolveDemonBackup('morte durante a noite');
  state.game.day = { number: state.game.night.number, lastExecutedId: null, lastDayDeaths: [], warnings: [] };
  if (state.game.status.alchemistDemonId) {
    const watcher = findPlayer(state.game.night.alchemistWatch?.actorId);
    const demon = findPlayer(state.game.status.alchemistDemonId);
    const message = `Alquimista${watcher ? ` (${playerName(watcher)})` : ''} descobriu o demônio: ${playerName(demon)}.`;
    state.game.day.warnings.push(message);
    state.game.log.push(message);
  }
  if (checkGameEnd()) return;
  go('day');
}

function findPlayer(id) {
  return allPlayers().find((player) => player.id === id);
}

function playerSelect(name, options = {}) {
  const players = options.deadOnly ? deadPlayersIncludingPending() : options.livingOnly ? activeLivingPlayers() : allPlayers();
  const exclude = new Set(options.exclude || []);
  return `
    <select name="${escapeHTML(name)}" data-field="${escapeHTML(name)}">
      <option value="">Escolher...</option>
      ${players.filter((player) => !exclude.has(player.id)).map((player) => `<option value="${player.id}">${escapeHTML(playerName(player))}${player.alive ? '' : ' (morto)'}</option>`).join('')}
    </select>
  `;
}

function roleSelect(name) {
  return `
    <select name="${escapeHTML(name)}" data-field="${escapeHTML(name)}">
      <option value="">Escolher role...</option>
      ${getRolePoolForSetup().map((role) => `<option value="${role.id}">${escapeHTML(role.name)}</option>`).join('')}
    </select>
  `;
}

function markResult(stepId, html, data = {}) {
  const targetIds = data.targetIds || [];
  state.game.night.targetedIds = [...new Set([...(state.game.night.targetedIds || []), ...targetIds])];
  state.game.night.results[stepId] = { html, data, at: Date.now() };
  saveAndRender({ push: false });
}

function getField(name) {
  return document.querySelector(`[data-field="${CSS.escape(name)}"]`)?.value || '';
}

function assertChoice(value, message = 'Escolha uma opção antes.') {
  if (!value) {
    alert(message);
    return false;
  }
  return true;
}

function actorBlockedOrDrunk(actor) {
  return isDrunkLike(actor) || isBlockedActor(actor?.id);
}

function queueNightStep(step) {
  const night = state.game?.night;
  if (!night || night.steps.some((item) => item.id === step.id)) return;
  night.steps.push(step);
  night.steps.sort((a, b) => a.order - b.order);
}

function addNightDeath(id) {
  if (!id) return;
  state.game.night.deadTonightIds = [...new Set([...(state.game.night.deadTonightIds || []), id])];
  const player = findPlayer(id);
  if (player?.currentRoleId === 'ravenkeeper') {
    state.game.night.pendingRavenkeeperId = id;
    queueNightStep({ id: `ravenkeeper-conditional-${state.game.night.number}`, kind: 'conditional', title: 'Guardião dos Corvos', roleId: 'ravenkeeper', action: 'ravenkeeper', order: 62 });
  }
  if (player?.currentRoleId === 'clumsy') {
    state.game.night.pendingClumsyIds = [...new Set([...(state.game.night.pendingClumsyIds || []), id])];
    queueNightStep({ id: `clumsy-${id}-${state.game.night.number}`, kind: 'conditional', title: 'Desajeitado', roleId: 'clumsy', action: 'clumsy', actorId: id, order: 64 + (state.game.night.pendingClumsyIds.length || 0) });
  }
  syncFutureNightSteps();
}

function applyDeathTrigger(player, source = '') {
  if (!player) return;
  const status = state.game.status || {};
  if (player.currentRoleId === 'enchanted' && !status.charmedDrunkId) {
    const target = sample(livingPlayers().filter((p) => p.id !== player.id));
    if (target) status.charmedDrunkId = target.id;
  }
  if (player.currentRoleId === 'explosive') {
    status.explosivePending = true;
  }
}

function addDemonNightDeath(id, demon) {
  if (!id) return;
  const target = findPlayer(id);
  addNightDeath(id);
  if (target?.currentRoleId === 'cursed') {
    const ally = sample(activeLivingPlayers().filter((p) => p.id !== id && p.id !== demon?.id && !isPlayerEvil(p)));
    if (ally) addNightDeath(ally.id);
  }
}

function heroTrap(actor, target) {
  if (!actor || !target) return false;
  if (trueRole(actor)?.type !== 'demon') return false;
  if (target.currentRoleId !== 'hero' || isDrunkLike(target)) return false;
  addNightDeath(actor.id);
  addNightDeath(target.id);
  return true;
}

function executeAutomaticAction(action) {
  const step = currentStep();
  if (!step) return;
  if (state.game.night.results[step.id]) return;
  if (isStepSkipped(step)) return markResult(step.id, 'Etapa pulada.', { ineffective: true });

  switch (action) {
    case 'minion-info': return actionMinionInfo(step);
    case 'demon-info': return actionDemonInfo(step);
    case 'sentinel': return actionSentinel(step);
    case 'exorcist': return actionExorcist(step);
    case 'doctor': return actionDoctor(step);
    case 'widow': return actionWidow(step);
    case 'devils_advocate': return actionDevilsAdvocate(step);
    case 'witch': return actionWitch(step);
    case 'poisoner': return actionPoisoner(step);
    case 'marker': return actionMarker(step);
    case 'spy': return actionSpy(step);
    case 'technician': return actionTechnician(step);
    case 'king': return actionKing(step);
    case 'general': return actionGeneral(step);
    case 'noble': return actionNoble(step);
    case 'washerwoman': return actionWasherwoman(step);
    case 'librarian': return actionLibrarian(step);
    case 'investigator': return actionInvestigator(step);
    case 'chef': return actionChef(step);
    case 'farmer': return actionFarmer(step);
    case 'undertaker': return actionUndertaker(step);
    case 'ravenkeeper': return actionRavenkeeper(step);
    case 'empath': return actionEmpath(step);
    case 'fortune_teller': return actionFortuneTeller(step);
    case 'cartographer': return actionCartographer(step);
    case 'dreamer': return actionDreamer(step);
    case 'intellectual': return actionIntellectual(step);
    case 'alchemist': return actionAlchemist(step);
    case 'professor': return actionProfessor(step);
    case 'prince': return actionPrince(step);
    case 'cannibal': return actionCannibal(step);
    case 'butler': return actionButler(step);
    case 'monk': return actionMonk(step);
    case 'guardian': return actionGuardian(step);
    case 'assassin': return actionAssassin(step);
    case 'imp': return actionImp(step);
    case 'vampire': return actionVampire(step);
    case 'po': return actionPo(step, 'kill');
    case 'po-kill': return actionPo(step, 'kill');
    case 'po-skip': return actionPo(step, 'skip');
    case 'overlord': return actionOverlord(step);
    case 'parasite': return actionParasite(step);
    case 'pukka': return actionPukka(step);
    case 'pukka-doom': return actionPukkaDoom(step);
    case 'overlord-kill': return actionOverlordKill(step);
    case 'explosive': return actionExplosive(step);
    case 'clumsy': return actionClumsy(step);
    case 'mathematician': return actionMathematician(step);
    case 'historian': return actionHistorian(step);
    case 'observer': return actionObserver(step);
    default: return markResult(step.id, 'Ação marcada como feita.');
  }
}

function actionMinionInfo(step) {
  if (hasAliveRole('magician')) return markResult(step.id, 'Mágico em jogo: identidade do demônio ocultada.');
  const demons = livingPlayers().filter((player) => trueRole(player)?.type === 'demon');
  markResult(step.id, `<strong>Demônio:</strong> ${demons.map(playerName).join(', ') || 'nenhum'}`);
}

function actionDemonInfo(step) {
  const bluffs = state.game.bluffs.map(roleById).filter(Boolean).map((role) => role.name).join(', ');
  if (hasAliveRole('magician')) return markResult(step.id, `<strong>Minions ocultados pelo Mágico.</strong><br><strong>Bluffs:</strong> ${bluffs || 'sem bluffs disponíveis'}`);
  const minions = livingPlayers().filter((player) => trueRole(player)?.type === 'minion');
  const infiltrators = livingPlayers().filter((player) => player.currentRoleId === 'infiltrator');
  const shown = [...minions, ...infiltrators];
  markResult(step.id, `<strong>Minions:</strong> ${shown.map(playerName).join(', ') || 'nenhum'}<br><strong>Bluffs:</strong> ${bluffs || 'sem bluffs disponíveis'}`);
}

function actionSentinel(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha o alvo da Sentinela.')) return;
  const actor = findPlayer(step.actorId);
  const target = findPlayer(targetId);
  state.game.status.sentinelBlockedId = targetId;
  if (!actorBlockedOrDrunk(actor)) {
    state.game.night.blockedActorIds = [...new Set([...(state.game.night.blockedActorIds || []), targetId])];
    syncFutureNightSteps();
  }
  markResult(step.id, `${escapeHTML(playerName(target))} foi impedido de acordar.`, { targetIds: [targetId], ineffective: actorBlockedOrDrunk(actor) });
}

function actionExorcist(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha o alvo do Exorcista.')) return;
  const actor = findPlayer(step.actorId);
  const target = findPlayer(targetId);
  state.game.night.exorcisedId = targetId;
  state.game.status.exorcisedId = targetId;
  const effective = !actorBlockedOrDrunk(actor) && isPlayerEvil(target);
  if (effective) {
    state.game.night.blockedActorIds = [...new Set([...(state.game.night.blockedActorIds || []), targetId])];
    syncFutureNightSteps();
  }
  markResult(step.id, `${escapeHTML(playerName(target))} foi escolhido.`, { targetIds: [targetId], ineffective: !effective });
}

function actionDoctor(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha o paciente do Médico.')) return;
  const actor = findPlayer(step.actorId);
  state.game.status.soberProtectedId = targetId;
  if (!actorBlockedOrDrunk(actor)) state.game.night.soberProtectedId = targetId;
  markResult(step.id, `${escapeHTML(playerName(findPlayer(targetId)))} ficou protegido contra veneno/bebedeira.`, { targetIds: [targetId], ineffective: actorBlockedOrDrunk(actor) });
}


function fakeGrimoireRows() {
  const possibleRoles = ROLES.filter(Boolean);
  return allPlayers().map((player) => {
    const fakeRole = sample(possibleRoles) || trueRole(player);
    return `${player.seat}. ${escapeHTML(playerName(player))}: ${escapeHTML(fakeRole.name)}${player.alive ? '' : ' — morto'}`;
  }).join('<br>');
}

function actionWidow(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha quem a Widow vai envenenar.')) return;
  const actor = findPlayer(step.actorId);
  const target = findPlayer(targetId);
  const blocked = actorBlockedOrDrunk(actor);
  const poisonBlocked = blocked || isSoberProtected(targetId);
  let knownBy = null;

  if (!blocked) {
    knownBy = sample(activeLivingPlayers().filter((p) => p.id !== actor.id));
    state.game.status.widowKnownById = knownBy?.id || null;
  }
  if (!poisonBlocked) state.game.status.widowPoisonedId = targetId;

  const rows = blocked
    ? fakeGrimoireRows()
    : allPlayers().map((player) => `${player.seat}. ${escapeHTML(playerName(player))}: ${escapeHTML(trueRole(player).name)}${player.fakeRoleId ? `, viu ${escapeHTML(visibleRole(player).name)}` : ''}${player.alive ? '' : ' — morto'}`).join('<br>');

  markResult(step.id, `<strong>${blocked ? 'Grimório inválido:' : 'Grimório:'}</strong><br>${rows}<br><br><strong>Envenenado:</strong> ${poisonBlocked ? 'ninguém' : escapeHTML(playerName(target))}<br><strong>Sabe quem é a Widow:</strong> ${knownBy ? escapeHTML(playerName(knownBy)) : 'ninguém'}`, { targetIds: [targetId], ineffective: poisonBlocked });
}

function actionDevilsAdvocate(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha quem ficará imune a execução.')) return;
  const actor = findPlayer(step.actorId);
  const target = findPlayer(targetId);
  if (!actorBlockedOrDrunk(actor)) state.game.status.executionProtectedId = targetId;
  markResult(step.id, `${escapeHTML(playerName(target))} ficou protegido contra execução.`, { targetIds: [targetId], ineffective: actorBlockedOrDrunk(actor) });
}

function actionWitch(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha quem a Bruxa vai amaldiçoar.')) return;
  const actor = findPlayer(step.actorId);
  const target = findPlayer(targetId);
  if (!actorBlockedOrDrunk(actor)) state.game.status.witchCursedId = targetId;
  markResult(step.id, `${escapeHTML(playerName(target))} foi amaldiçoado.`, { targetIds: [targetId], ineffective: actorBlockedOrDrunk(actor) });
}

function actionMarker(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha quem será marcado.')) return;
  const actor = findPlayer(step.actorId);
  const target = findPlayer(targetId);
  if (!actorBlockedOrDrunk(actor)) state.game.status.markerMarkedId = targetId;
  markResult(step.id, `${escapeHTML(playerName(target))} foi marcado.`, { targetIds: [targetId], ineffective: actorBlockedOrDrunk(actor) });
}

function actionPoisoner(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId)) return;
  const actor = findPlayer(step.actorId);
  const target = findPlayer(targetId);
  if (actorBlockedOrDrunk(actor) || isSoberProtected(targetId)) return markResult(step.id, `${escapeHTML(playerName(target))} foi escolhido, mas não ficou envenenado.`, { targetIds: [targetId], ineffective: true });
  state.game.night.poisonedId = targetId;
  state.game.status.poisonedId = targetId;
  state.game.status.poisonedNight = state.game.night.number;
  markResult(step.id, `${escapeHTML(playerName(target))} foi envenenado.`, { targetIds: [targetId] });
}

function actionSpy(step) {
  const actor = findPlayer(step.actorId);
  const blocked = actorBlockedOrDrunk(actor);
  const rows = blocked
    ? fakeGrimoireRows()
    : allPlayers().map((player) => `${player.seat}. ${escapeHTML(playerName(player))}: ${escapeHTML(trueRole(player).name)}${player.fakeRoleId ? `, viu ${escapeHTML(visibleRole(player).name)}` : ''}${player.abilityRoleId ? `, roubou ${escapeHTML(roleById(player.abilityRoleId)?.name || '')}` : ''}${player.alive ? '' : ' — morto'}`).join('<br>');
  markResult(step.id, `<strong>${blocked ? 'Grimório inválido:' : 'Grimório completo:'}</strong><br>${rows}`, { ineffective: blocked });
}

function actionTechnician(step) {
  const actor = findPlayer(step.actorId);
  if (actorBlockedOrDrunk(actor)) return markResult(step.id, '<strong>Não há informação confiável.</strong>', { ineffective: true });
  const target = findPlayer(state.game.technicalDrunkId);
  if (!target) return markResult(step.id, 'Não ativou: Barão em jogo ou nenhum minion válido.');
  markResult(step.id, `<strong>${escapeHTML(playerName(target))}</strong>`);
}

function actionKing(step) {
  const actor = findPlayer(step.actorId);
  const demon = livingPlayers().find((player) => trueRole(player)?.type === 'demon');
  if (actorBlockedOrDrunk(actor)) return markResult(step.id, `<strong>${escapeHTML(playerName(sample(livingPlayers()) || demon))}</strong>`, { ineffective: true });
  markResult(step.id, `<strong>${escapeHTML(playerName(demon))}</strong>`);
}

function actionGeneral(step) {
  const actor = findPlayer(step.actorId);
  if (state.game.night.number === 1) {
    const demons = livingPlayers().filter((player) => trueRole(player)?.type === 'demon');
    const minions = livingPlayers().filter((player) => trueRole(player)?.type === 'minion');
    if (actorBlockedOrDrunk(actor)) return markResult(step.id, `<strong>Informação instável.</strong>`, { ineffective: true });
    return markResult(step.id, `<strong>Demônio:</strong> ${demons.map(playerName).join(', ') || 'nenhum'}<br><strong>Minions:</strong> ${minions.map(playerName).join(', ') || 'nenhum'}`);
  }
  let good = livingPlayers().filter((p) => !isPlayerEvil(p)).length;
  let evil = livingPlayers().filter((p) => isPlayerEvil(p)).length;
  if (actorBlockedOrDrunk(actor)) { good = Math.max(0, good + sample([-1, 0, 1])); evil = Math.max(0, evil + sample([-1, 0, 1])); }
  markResult(step.id, `<strong>Bem vivo:</strong> ${good}<br><strong>Mal vivo:</strong> ${evil}`, { ineffective: actorBlockedOrDrunk(actor) });
}

function actionNoble(step) {
  const actor = findPlayer(step.actorId);
  const demon = sample(livingPlayers().filter((p) => trueRole(p)?.type === 'demon'));
  let trio = demon ? [demon, ...sampleMany(livingPlayers().filter((p) => p.id !== demon.id && p.id !== actor.id), 2)] : sampleMany(livingPlayers().filter((p) => p.id !== actor.id), 3);
  if (actorBlockedOrDrunk(actor)) trio = sampleMany(livingPlayers().filter((p) => p.id !== actor.id), 3);
  markResult(step.id, `<strong>${shuffle(trio).map(playerName).join(', ')}</strong>`, { ineffective: actorBlockedOrDrunk(actor) });
}

function actionWasherwoman(step) {
  const actor = findPlayer(step.actorId);
  const candidates = livingPlayers().filter((player) => trueRole(player)?.type === 'townsfolk' && player.id !== actor.id);
  let real = sample(candidates);
  let shownRole = real ? trueRole(real) : sample(ROLES.filter((role) => role.type === 'townsfolk'));
  let pair = real ? [real, sample(livingPlayers().filter((player) => player.id !== real.id && player.id !== actor.id))] : sampleMany(livingPlayers().filter((player) => player.id !== actor.id), 2);
  if (actorBlockedOrDrunk(actor)) {
    shownRole = sample(ROLES.filter((role) => role.type === 'townsfolk'));
    pair = sampleMany(livingPlayers().filter((player) => player.id !== actor.id), 2);
  }
  pair = shuffle(pair.filter(Boolean));
  markResult(step.id, `<strong>${pair.map(playerName).join(' ou ')}</strong><br><strong>${shownRole.name}</strong>`, { ineffective: actorBlockedOrDrunk(actor) });
}

function actionLibrarian(step) {
  const actor = findPlayer(step.actorId);
  const outsiders = livingPlayers().filter((player) => trueRole(player)?.type === 'outsider' && player.id !== actor.id);
  if (!outsiders.length && !actorBlockedOrDrunk(actor)) return markResult(step.id, '<strong>Não há Outsiders em jogo.</strong>');
  let real = sample(outsiders);
  let shownRole = real ? trueRole(real) : sample(ROLES.filter((role) => role.type === 'outsider'));
  let pair = real ? [real, sample(livingPlayers().filter((player) => player.id !== real.id && player.id !== actor.id))] : sampleMany(livingPlayers().filter((player) => player.id !== actor.id), 2);
  if (actorBlockedOrDrunk(actor)) {
    shownRole = sample(ROLES.filter((role) => role.type === 'outsider'));
    pair = sampleMany(livingPlayers().filter((player) => player.id !== actor.id), 2);
  }
  pair = shuffle(pair.filter(Boolean));
  markResult(step.id, `<strong>${pair.map(playerName).join(' ou ')}</strong><br><strong>${shownRole.name}</strong>`, { ineffective: actorBlockedOrDrunk(actor) });
}

function actionInvestigator(step) {
  const actor = findPlayer(step.actorId);
  const minions = livingPlayers().filter((player) => trueRole(player)?.type === 'minion' && player.id !== actor.id);
  let real = sample(minions);
  let shownRole = real ? trueRole(real) : sample(ROLES.filter((role) => role.type === 'minion'));
  let pair = real ? [real, sample(livingPlayers().filter((player) => player.id !== real.id && player.id !== actor.id))] : sampleMany(livingPlayers().filter((player) => player.id !== actor.id), 2);
  if (actorBlockedOrDrunk(actor)) {
    shownRole = sample(ROLES.filter((role) => role.type === 'minion'));
    pair = sampleMany(livingPlayers().filter((player) => player.id !== actor.id), 2);
  }
  pair = shuffle(pair.filter(Boolean));
  markResult(step.id, `<strong>${pair.map(playerName).join(' ou ')}</strong><br><strong>${shownRole.name}</strong>`, { ineffective: actorBlockedOrDrunk(actor) });
}

function actionChef(step) {
  const actor = findPlayer(step.actorId);
  const players = allPlayers();
  let count = 0;
  for (let i = 0; i < players.length; i += 1) {
    const a = players[i];
    const b = players[(i + 1) % players.length];
    if (registersEvil(a) && registersEvil(b)) count += 1;
  }
  if (actorBlockedOrDrunk(actor)) count = Math.floor(Math.random() * 3);
  markResult(step.id, `<strong>${count}</strong>`, { ineffective: actorBlockedOrDrunk(actor) });
}

function actionFarmer(step) {
  const actor = findPlayer(step.actorId);
  let good = sample(livingPlayers().filter((p) => !isPlayerEvil(p) && p.id !== actor.id));
  if (actorBlockedOrDrunk(actor)) good = sample(livingPlayers().filter((p) => p.id !== actor.id));
  markResult(step.id, `<strong>${escapeHTML(playerName(good))}</strong>`, { ineffective: actorBlockedOrDrunk(actor) });
}

function registersEvil(player) {
  if (isPlayerEvil(player)) return true;
  if (player?.currentRoleId === 'recluse' && !isDrunkLike(player)) return Math.random() < 0.5;
  return false;
}

function registersDemon(player) {
  if (trueRole(player)?.type === 'demon') return true;
  if (player?.id === state.game.redHerringId) return true;
  if (player?.currentRoleId === 'recluse' && !isDrunkLike(player)) return Math.random() < 0.5;
  return false;
}

function actionEmpath(step) {
  const actor = findPlayer(step.actorId);
  const neighbors = closestAliveNeighbors(actor.id);
  let count = neighbors.filter(registersEvil).length;
  if (actorBlockedOrDrunk(actor)) count = Math.floor(Math.random() * 3);
  markResult(step.id, `<strong>${count}</strong><br>${neighbors.map(playerName).join(' e ') || 'sem vizinhos vivos'}`, { ineffective: actorBlockedOrDrunk(actor) });
}

function closestAliveNeighbors(playerId) {
  const players = allPlayers();
  const index = players.findIndex((p) => p.id === playerId);
  if (index < 0 || players.length < 2) return [];
  const neighbors = [];
  for (let offset = 1; offset < players.length && neighbors.length < 1; offset += 1) {
    const left = players[(index - offset + players.length) % players.length];
    if (left.alive && !pendingDeathIds().has(left.id)) neighbors.push(left);
  }
  for (let offset = 1; offset < players.length && neighbors.length < 2; offset += 1) {
    const right = players[(index + offset) % players.length];
    if (right.alive && !pendingDeathIds().has(right.id) && right.id !== neighbors[0]?.id) neighbors.push(right);
  }
  return neighbors;
}

function actionFortuneTeller(step) {
  const actor = findPlayer(step.actorId);
  const aId = getField('targetA');
  const bId = getField('targetB');
  if (!assertChoice(aId, 'Escolha o primeiro alvo.') || !assertChoice(bId, 'Escolha o segundo alvo.')) return;
  if (aId === bId) return alert('Escolha duas pessoas diferentes.');
  const picked = [findPlayer(aId), findPlayer(bId)].filter(Boolean);
  let yes = picked.some(registersDemon);
  if (actorBlockedOrDrunk(actor)) yes = Math.random() < 0.5;
  markResult(step.id, `<strong>${yes ? 'SIM' : 'NÃO'}</strong><br>${picked.map(playerName).join(' e ')}`, { targetIds: [aId, bId], ineffective: actorBlockedOrDrunk(actor) });
}

function actionCartographer(step) {
  const actor = findPlayer(step.actorId);
  const players = allPlayers();
  const index = players.findIndex((p) => p.id === actor.id);
  const dir = actor.cartographerDirection || 'right';
  const offset = state.game.night.number;
  const targetIndex = dir === 'right' ? (index + offset) % players.length : (index - offset + players.length * 10) % players.length;
  const target = players[targetIndex];
  let role = trueRole(target);
  if (actorBlockedOrDrunk(actor)) role = sample(ROLES);
  markResult(step.id, `<strong>${escapeHTML(playerName(target))}</strong><br><strong>${escapeHTML(role.name)}</strong>`, { targetIds: [target.id], ineffective: actorBlockedOrDrunk(actor) });
}

function actionDreamer(step) {
  const actor = findPlayer(step.actorId);
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha o alvo do Sonhador.')) return;
  const target = findPlayer(targetId);
  let first = trueRole(target);
  let second = sample(ROLES.filter((role) => role.id !== first.id));
  if (actorBlockedOrDrunk(actor)) {
    first = sample(ROLES);
    second = sample(ROLES.filter((role) => role.id !== first.id));
  }
  markResult(step.id, `<strong>${escapeHTML(playerName(target))}</strong><br>${escapeHTML(first.name)} ou ${escapeHTML(second.name)}`, { targetIds: [targetId], ineffective: actorBlockedOrDrunk(actor) });
}

function actionIntellectual(step) {
  const actor = findPlayer(step.actorId);
  const players = allPlayers();
  const order = state.game.intellectualEvilOrder?.filter((id) => findPlayer(id)) || [];
  let numbers = [];
  if (order.length <= 1) numbers = [0];
  else {
    for (let i = 0; i < order.length; i += 1) {
      const a = players.findIndex((p) => p.id === order[i]);
      const b = players.findIndex((p) => p.id === order[(i + 1) % order.length]);
      const spaces = (b - a - 1 + players.length) % players.length;
      numbers.push(spaces);
    }
  }
  if (actorBlockedOrDrunk(actor)) numbers = numbers.map(() => Math.floor(Math.random() * Math.max(2, players.length - 1)));
  markResult(step.id, `<strong>${numbers.join(' - ')}</strong>`, { ineffective: actorBlockedOrDrunk(actor) });
}

function actionAlchemist(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha o alvo do Alquimista.')) return;
  const actor = findPlayer(step.actorId);
  if (!actorBlockedOrDrunk(actor)) state.game.night.alchemistWatch = { actorId: actor.id, targetId };
  state.game.status.alchemistWatchId = targetId;
  markResult(step.id, `${escapeHTML(playerName(findPlayer(targetId)))} foi observado.`, { targetIds: [targetId], ineffective: actorBlockedOrDrunk(actor) });
}

function actionProfessor(step) {
  const actor = findPlayer(step.actorId);
  const aId = getField('targetA');
  const bId = getField('targetB');
  if (!assertChoice(aId, 'Escolha o primeiro jogador.') || !assertChoice(bId, 'Escolha o segundo jogador.')) return;
  if (aId === bId) return alert('Escolha duas pessoas diferentes.');
  const a = findPlayer(aId); const b = findPlayer(bId);
  const canSwap = !actorBlockedOrDrunk(actor) && !isPlayerEvil(a) && !isPlayerEvil(b);
  if (canSwap) {
    [a.currentRoleId, b.currentRoleId] = [b.currentRoleId, a.currentRoleId];
    [a.trueRoleId, b.trueRoleId] = [b.trueRoleId, a.trueRoleId];
    [a.fakeRoleId, b.fakeRoleId] = [b.fakeRoleId, a.fakeRoleId];
    state.game.status.professorSwap = `${playerName(a)} ↔ ${playerName(b)}`;
    syncFutureNightSteps();
  }
  markResult(step.id, canSwap ? `${escapeHTML(playerName(a))} e ${escapeHTML(playerName(b))} trocaram de role.` : 'A troca falhou.', { targetIds: [aId, bId], ineffective: !canSwap });
}

function actionPrince(step) {
  const actor = findPlayer(step.actorId);
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha o alvo do Príncipe.')) return;
  const target = findPlayer(targetId);
  let role = trueRole(target);
  const effective = !actorBlockedOrDrunk(actor);
  if (!effective) role = sample(ROLES);
  if (effective && role.type !== 'demon') state.game.disabledPowerIds = [...new Set([...(state.game.disabledPowerIds || []), targetId])];
  markResult(step.id, `<strong>${escapeHTML(playerName(target))}</strong><br><strong>${escapeHTML(role.name)}</strong>`, { targetIds: [targetId], ineffective: !effective });
}

function actionButler(step) {
  const masterId = getField('target');
  if (!assertChoice(masterId, 'Escolha o mestre do Mordomo.')) return;
  const actor = findPlayer(step.actorId);
  actor.masterId = masterId;
  state.game.status.butlerId = actor.id;
  state.game.status.butlerMasterId = masterId;
  markResult(step.id, `<strong>${escapeHTML(playerName(findPlayer(masterId)))}</strong>`, { targetIds: [masterId], ineffective: actorBlockedOrDrunk(actor) });
}

function actionMonk(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha quem o Monge vai proteger.')) return;
  const actor = findPlayer(step.actorId);
  if (!actorBlockedOrDrunk(actor)) state.game.night.protectedId = targetId;
  state.game.status.protectedId = targetId;
  markResult(step.id, `${escapeHTML(playerName(findPlayer(targetId)))} foi escolhido.`, { targetIds: [targetId], ineffective: actorBlockedOrDrunk(actor) });
}

function actionGuardian(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha quem o Guardião vai proteger.')) return;
  const actor = findPlayer(step.actorId);
  actor.used.guardian = true;
  state.game.status.guardianId = actor.id;
  if (!actorBlockedOrDrunk(actor)) state.game.status.permanentGuardedId = targetId;
  markResult(step.id, `${escapeHTML(playerName(findPlayer(targetId)))} ficou sob guarda.`, { targetIds: [targetId], ineffective: actorBlockedOrDrunk(actor) });
}


function protectedFromDemonKill(target, demon, ignoreProtections = false) {
  if (ignoreProtections) return '';
  if (target.currentRoleId === 'soldier' && !isDrunkLike(target)) return `${playerName(target)} sobreviveu.`;
  if (state.game.night.protectedId === target.id) return `${playerName(target)} estava protegido.`;
  if (isProtectedByProtector(target.id)) return `${playerName(target)} estava protegido pelo Protetor.`;
  if (isProtectedByGuardian(target.id)) return `${playerName(target)} estava protegido pelo Guardião.`;
  return '';
}

function demonKillTarget(demon, target, options = {}) {
  if (!demon || !target) return 'Nenhum alvo válido.';
  if (!options.ignoreHero && heroTrap(demon, target)) return `${playerName(target)} ativou o Herói. Ambos morrerão.`;
  const protectedNote = protectedFromDemonKill(target, demon, options.ignoreProtections);
  if (protectedNote) return protectedNote;
  let killed = target;
  let note = '';
  if (!options.ignoreProtections && target.currentRoleId === 'mayor' && !isDrunkLike(target)) {
    const redirectOptions = activeLivingPlayers().filter((player) => player.id !== target.id && player.id !== demon.id);
    if (redirectOptions.length && Math.random() < 0.5) {
      killed = sample(redirectOptions);
      note = `Morte redirecionada para ${playerName(killed)}.`;
    }
  }
  addDemonNightDeath(killed.id, demon);
  if (state.game.night.alchemistWatch?.targetId === killed.id) {
    state.game.status.alchemistDemonId = demon.id;
  }
  return note || `${playerName(killed)} morrerá ao amanhecer.`;
}

function actionImp(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha a vítima do Imp.')) return;
  const target = findPlayer(targetId);
  const demon = findPlayer(step.actorId);

  if (actorBlockedOrDrunk(demon)) return markResult(step.id, 'O ataque não gerou morte.', { targetIds: [targetId], ineffective: true });
  if (target.id === demon.id) {
    addNightDeath(demon.id);
    const newDemon = passDemonAfterSelfKill(demon);
    const note = newDemon ? `${playerName(demon)} morreu. ${playerName(newDemon)} virou Imp.` : `${playerName(demon)} morreu. Não havia minion vivo para receber o demônio.`;
    markResult(step.id, note, { targetIds: [targetId] });
    return;
  }
  const note = demonKillTarget(demon, target);
  markResult(step.id, escapeHTML(note), { targetIds: [targetId] });
}

function actionVampire(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha a vítima do Vampiro.')) return;
  const target = findPlayer(targetId);
  const demon = findPlayer(step.actorId);
  if (target.id === demon.id) return markResult(step.id, 'Vampiro não pode escolher a si mesmo.', { targetIds: [targetId], ineffective: true });
  if (actorBlockedOrDrunk(demon)) return markResult(step.id, 'O ataque não gerou efeito.', { targetIds: [targetId], ineffective: true });
  if (!state.game.status.vampireConvertedId) {
    if (heroTrap(demon, target)) return markResult(step.id, `${escapeHTML(playerName(target))} ativou o Herói. Ambos morrerão.`, { targetIds: [targetId] });
    const protectedNote = protectedFromDemonKill(target, demon);
    if (protectedNote) return markResult(step.id, escapeHTML(protectedNote), { targetIds: [targetId], ineffective: true });
    target.previousRoleId = target.currentRoleId;
    target.currentRoleId = 'devils_advocate';
    target.trueRoleId = 'devils_advocate';
    target.fakeRoleId = null;
    target.abilityRoleId = null;
    state.game.status.vampireConvertedId = target.id;
    return markResult(step.id, `${escapeHTML(playerName(target))} virou Advogado do Diabo.`, { targetIds: [targetId] });
  }
  const note = demonKillTarget(demon, target);
  markResult(step.id, escapeHTML(note), { targetIds: [targetId] });
}

function actionPo(step, mode = 'kill') {
  const demon = findPlayer(step.actorId);
  if (mode === 'skip') {
    if (actorBlockedOrDrunk(demon)) return markResult(step.id, 'Po tentou carregar, mas falhou.', { ineffective: true });
    demon.used.poSkips = (demon.used.poSkips || 0) + 1;
    return markResult(step.id, `Po não matou. Carga atual: ${demon.used.poSkips + 1} mortes.`, { ineffective: false });
  }
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha pelo menos o alvo principal do Po.')) return;
  if (actorBlockedOrDrunk(demon)) return markResult(step.id, 'O Po tentou matar, mas falhou.', { targetIds: [targetId], ineffective: true });
  demon.used.poKilled = true;
  const totalKills = 1 + (demon.used.poSkips || 0);
  const firstTarget = findPlayer(targetId);
  const extraTargets = sampleMany(activeLivingPlayers().filter((p) => p.id !== demon.id && p.id !== targetId), Math.max(0, totalKills - 1));
  const targets = [firstTarget, ...extraTargets].filter(Boolean);
  const notes = targets.map((target) => demonKillTarget(demon, target));
  markResult(step.id, notes.map(escapeHTML).join('<br>'), { targetIds: targets.map((p) => p.id) });
}

function actionOverlord(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha o alvo do Overlord.')) return;
  const demon = findPlayer(step.actorId);
  const target = findPlayer(targetId);
  if (actorBlockedOrDrunk(demon)) return markResult(step.id, `${escapeHTML(playerName(target))} foi escolhido, mas o Overlord falhou.`, { targetIds: [targetId], ineffective: true });
  if (heroTrap(demon, target)) return markResult(step.id, `${escapeHTML(playerName(target))} ativou o Herói. Ambos morrerão.`, { targetIds: [targetId] });
  state.game.status.overlordTargetId = targetId;
  markResult(step.id, `${escapeHTML(playerName(target))} foi marcado pelo Overlord.`, { targetIds: [targetId] });
}

function actionOverlordKill(step) {
  const target = findPlayer(state.game.status.overlordKillPendingId);
  const demon = activeLivingPlayers().find((p) => trueRole(p)?.type === 'demon');
  if (!target || !target.alive || pendingDeathIds().has(target.id)) {
    state.game.status.overlordKillPendingId = null;
    return markResult(step.id, 'Nenhuma morte pendente do Overlord.');
  }
  const protectedNote = protectedFromDemonKill(target, demon);
  if (protectedNote) {
    state.game.status.overlordKillPendingId = null;
    return markResult(step.id, escapeHTML(protectedNote), { ineffective: true });
  }
  addNightDeath(target.id);
  state.game.status.overlordKillPendingId = null;
  markResult(step.id, `${escapeHTML(playerName(target))} morrerá pelo Overlord.`);
}

function actionParasite(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha o alvo do Parasita.')) return;
  const demon = findPlayer(step.actorId);
  const target = findPlayer(targetId);
  if (state.game.night.number === 1 && !state.game.status.parasiteHostId) {
    if (actorBlockedOrDrunk(demon)) return markResult(step.id, `${escapeHTML(playerName(target))} foi escolhido, mas o Parasita falhou.`, { targetIds: [targetId], ineffective: true });
    if (heroTrap(demon, target)) return markResult(step.id, `${escapeHTML(playerName(target))} ativou o Herói. Ambos morrerão.`, { targetIds: [targetId] });
    state.game.status.parasiteHostId = targetId;
    return markResult(step.id, `${escapeHTML(playerName(target))} virou hospedeiro.`, { targetIds: [targetId] });
  }
  if (actorBlockedOrDrunk(demon)) return markResult(step.id, 'O ataque não gerou morte.', { targetIds: [targetId], ineffective: true });
  const note = demonKillTarget(demon, target);
  markResult(step.id, escapeHTML(note), { targetIds: [targetId] });
}

function actionPukka(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha o alvo do Pukka.')) return;
  const demon = findPlayer(step.actorId);
  const target = findPlayer(targetId);
  if (actorBlockedOrDrunk(demon)) return markResult(step.id, `${escapeHTML(playerName(target))} foi escolhido, mas o Pukka falhou.`, { targetIds: [targetId], ineffective: true });
  if (heroTrap(demon, target)) return markResult(step.id, `${escapeHTML(playerName(target))} ativou o Herói. Ambos morrerão.`, { targetIds: [targetId] });
  if (isSoberProtected(targetId)) return markResult(step.id, `${escapeHTML(playerName(target))} foi escolhido, mas não ficou envenenado.`, { targetIds: [targetId], ineffective: true });
  state.game.status.pukkaPoisonedId = targetId;
  state.game.status.pukkaDoomedId = targetId;
  markResult(step.id, `${escapeHTML(playerName(target))} ficou envenenado e marcado para morrer na próxima noite.`, { targetIds: [targetId] });
}

function actionPukkaDoom(step) {
  const target = findPlayer(state.game.status.pukkaDoomedId);
  state.game.status.pukkaDoomedId = null;
  state.game.status.pukkaPoisonedId = null;
  if (!target || !target.alive || pendingDeathIds().has(target.id)) return markResult(step.id, 'A vítima anterior do Pukka já não está viva.');
  const demon = activeLivingPlayers().find((p) => trueRole(p)?.type === 'demon');
  const protectedNote = protectedFromDemonKill(target, demon);
  if (protectedNote) return markResult(step.id, escapeHTML(protectedNote), { ineffective: true });
  addDemonNightDeath(target.id, demon);
  markResult(step.id, `${escapeHTML(playerName(target))} morrerá pelo Pukka.`);
}

function actionAssassin(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha a vítima do Assassino.')) return;
  const actor = findPlayer(step.actorId);
  const target = findPlayer(targetId);
  actor.used.assassin = true;
  if (actorBlockedOrDrunk(actor)) return markResult(step.id, 'O Assassino falhou.', { targetIds: [targetId], ineffective: true });
  addNightDeath(targetId);
  markResult(step.id, `${escapeHTML(playerName(target))} morrerá.`, { targetIds: [targetId] });
}

function actionExplosive(step) {
  const victims = sampleMany(activeLivingPlayers().filter((p) => !isPlayerEvil(p)), 2);
  victims.forEach((p) => addNightDeath(p.id));
  state.game.status.explosivePending = false;
  markResult(step.id, victims.length ? `${victims.map(playerName).map(escapeHTML).join(', ')} morrerão pelo Explosivo.` : 'Explosivo não encontrou bons vivos.');
}

function actionClumsy(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha o chute do Desajeitado.')) return;
  const target = findPlayer(targetId);
  if (isPlayerEvil(target)) return markResult(step.id, `${escapeHTML(playerName(target))} era mau. Nada acontece.`, { targetIds: [targetId] });
  addNightDeath(targetId);
  markResult(step.id, `${escapeHTML(playerName(target))} não era mau e morrerá.`, { targetIds: [targetId] });
}

function isProtectedByProtector(targetId) {
  return livingPlayers().some((protector) => {
    if (protector.currentRoleId !== 'protector' || isDrunkLike(protector)) return false;
    return closestAliveNeighbors(protector.id).some((neighbor) => neighbor.id === targetId);
  });
}

function isProtectedByGuardian(targetId) {
  const status = state.game.status || {};
  const guardian = findPlayer(status.guardianId);
  return status.permanentGuardedId === targetId && guardian?.alive && !pendingDeathIds().has(guardian.id) && !isDrunkLike(guardian);
}

function passDemonAfterSelfKill(oldDemon) {
  const scarlet = livingPlayers().find((player) => player.currentRoleId === 'scarlet_woman' && player.id !== oldDemon.id && !isDrunkLike(player));
  const minion = scarlet || sample(livingPlayers().filter((player) => trueRole(player)?.type === 'minion' && player.id !== oldDemon.id));
  if (minion) {
    minion.previousRoleId = minion.currentRoleId;
    minion.currentRoleId = 'imp';
    minion.trueRoleId = 'imp';
    minion.fakeRoleId = null;
    minion.abilityRoleId = null;
    state.game.log.push(`${playerName(minion)} virou Imp depois da morte do demônio.`);
    return minion;
  }
  return null;
}

function actionRavenkeeper(step) {
  const ravenId = state.game.night.pendingRavenkeeperId;
  if (!ravenId) return markResult(step.id, 'O Guardião dos Corvos não foi ativado.');
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha quem o Guardião dos Corvos vai verificar.')) return;
  const raven = findPlayer(ravenId);
  const target = findPlayer(targetId);
  let role = trueRole(target);
  if (isDrunkLike(raven)) role = sample(ROLES);
  markResult(step.id, `<strong>${escapeHTML(playerName(target))}</strong><br><strong>${escapeHTML(role.name)}</strong>`, { targetIds: [targetId], ineffective: isDrunkLike(raven) });
}

function actionUndertaker(step) {
  const actor = findPlayer(step.actorId);
  const executed = findPlayer(state.game.day?.lastExecutedId);
  if (!executed) return markResult(step.id, 'Ninguém foi executado no dia anterior.');
  let role = trueRole(executed);
  if (actorBlockedOrDrunk(actor)) role = sample(ROLES);
  markResult(step.id, `<strong>${escapeHTML(playerName(executed))}</strong><br><strong>${escapeHTML(role.name)}</strong>`, { ineffective: actorBlockedOrDrunk(actor) });
}

function actionCannibal(step) {
  const targetId = getField('target');
  const actor = findPlayer(step.actorId);
  if (!targetId) return markResult(step.id, 'Nenhum morto foi escolhido.');
  const target = findPlayer(targetId);
  if (!target) return;
  if (actorBlockedOrDrunk(actor)) {
    return markResult(step.id, `${escapeHTML(playerName(target))} foi escolhido, mas o poder não foi roubado.`, { targetIds: [targetId], ineffective: true });
  }
  if (isPlayerEvil(target)) {
    addNightDeath(actor.id);
    return markResult(step.id, `${escapeHTML(playerName(actor))} morrerá ao amanhecer.`, { targetIds: [targetId] });
  }
  actor.abilityRoleId = target.currentRoleId;
  actor.cannibalSourceId = targetId;
  markResult(step.id, `${escapeHTML(playerName(actor))} roubou o poder de ${escapeHTML(playerName(target))}.`, { targetIds: [targetId] });
}

function actionMathematician(step) {
  const actor = findPlayer(step.actorId);
  const results = Object.values(state.game.night.results || {});
  let actions = results.length;
  let bad = results.filter((result) => result.data?.ineffective).length;
  if (actorBlockedOrDrunk(actor)) { actions = Math.max(0, actions + sample([-1, 0, 1])); bad = Math.max(0, bad + sample([-1, 0, 1])); }
  markResult(step.id, `<strong>Ações:</strong> ${actions}<br><strong>Ineficazes:</strong> ${bad}`, { ineffective: actorBlockedOrDrunk(actor) });
}

function actionHistorian(step) {
  const actor = findPlayer(step.actorId);
  let used = state.game.night.steps
    .filter((s) => state.game.night.results[s.id] && s.id !== step.id && s.action !== 'minion-info' && s.action !== 'demon-info')
    .map((s) => s.title);
  if (actorBlockedOrDrunk(actor)) used = sampleMany(ROLES, 3).map((role) => role.name);
  markResult(step.id, `<strong>${sampleMany(used, 3).join(', ') || 'nenhuma habilidade registrada'}</strong>`, { ineffective: actorBlockedOrDrunk(actor) });
}

function actionObserver(step) {
  const actor = findPlayer(step.actorId);
  let targets = [...new Set(state.game.night.targetedIds || [])].map(findPlayer).filter(Boolean);
  if (actorBlockedOrDrunk(actor)) targets = sampleMany(allPlayers(), Math.min(3, allPlayers().length));
  markResult(step.id, `<strong>${targets.map(playerName).join(', ') || 'ninguém'}</strong>`, { ineffective: actorBlockedOrDrunk(actor) });
}

function resolveDemonBackup(reason) {
  const aliveDemons = livingPlayers().filter((player) => trueRole(player)?.type === 'demon');
  if (aliveDemons.length) return;
  const scarlet = livingPlayers().find((player) => player.currentRoleId === 'scarlet_woman');
  if (scarlet && livingPlayers().length >= 5 && !isDrunkLike(scarlet)) {
    scarlet.previousRoleId = 'scarlet_woman';
    scarlet.currentRoleId = 'imp';
    scarlet.trueRoleId = 'imp';
    scarlet.fakeRoleId = null;
    scarlet.abilityRoleId = null;
    state.game.log.push(`${playerName(scarlet)} virou Imp pela Mulher Escarlate (${reason}).`);
  }
}

function endGame(winner, reason) {
  state.game.ended = true;
  state.game.winner = winner;
  state.game.endReason = reason;
  state.game.log.push(`Fim de jogo: ${winner}. ${reason}`);
  go('end');
}

function checkGameEnd() {
  if (!state.game || state.game.ended) return true;
  const deadKing = allPlayers().find((player) => player.currentRoleId === 'king' && !player.alive && !player.kingWrongVoteDeath);
  if (deadKing) {
    endGame('Mal venceu', 'O Rei morreu.');
    return true;
  }
  resolveDemonBackup('checagem de fim de jogo');
  const aliveDemons = livingPlayers().filter((player) => trueRole(player)?.type === 'demon');
  if (aliveDemons.length === 0) {
    const parasiteHost = findPlayer(state.game.status?.parasiteHostId);
    if (parasiteHost?.alive) return false;
    const grace = state.game.status?.manipulatorGraceUntilDay;
    if (grace && state.game.day?.number <= grace) return false;
    endGame('Bem venceu', parasiteHost ? 'O demônio morreu e o hospedeiro do Parasita já está morto.' : 'O demônio morreu.');
    return true;
  }
  const livingEvil = livingPlayers().filter((player) => isPlayerEvil(player));
  if (livingEvil.length === 1 && trueRole(livingEvil[0])?.type === 'demon' && hasAliveRole('missionary')) {
    endGame('Bem venceu', 'O Missionário deixou só o demônio do lado mau.');
    return true;
  }
  const livingGood = livingPlayers().filter((player) => !isPlayerEvil(player));
  if (livingGood.length <= 2) {
    endGame('Mal venceu', 'Restaram somente 2 pessoas do bem vivas.');
    return true;
  }
  return false;
}


function updateDayFromForm() {
  const warnings = [];
  const executedId = getField('executed');
  state.game.day.lastExecutedId = null;

  const wasAlive = new Map(allPlayers().map((player) => [player.id, player.alive]));
  allPlayers().forEach((player) => {
    const aliveInput = document.querySelector(`[data-alive-id="${player.id}"]`);
    if (aliveInput) player.alive = aliveInput.checked;
  });

  allPlayers().forEach((player) => {
    if (wasAlive.get(player.id) && !player.alive) applyDeathTrigger(player, 'manual');
  });

  if (executedId) {
    const executed = findPlayer(executedId);
    const aliveBeforeExecution = livingPlayers().length;
    if (executed) {
      if (state.game.status.executionProtectedId === executed.id) {
        warnings.push(`${playerName(executed)} estava protegido contra execução.`);
      } else if (executed.currentRoleId === 'princess' && !isDrunkLike(executed)) {
        warnings.push('Princesa não morreu por votação.');
      } else {
        executed.alive = false;
        state.game.day.lastExecutedId = executed.id;
        applyDeathTrigger(executed, 'execução');
        if (state.game.status.markerMarkedId === executed.id) {
          warnings.push('O Marcado foi executado: o mal vence.');
          state.game.day.warnings = warnings;
          endGame('Mal venceu', 'O jogador marcado pelo Marcador foi executado.');
          return;
        }
        if (executed.currentRoleId === 'saint' && !isDrunkLike(executed)) {
          warnings.push('O Santo foi executado: o mal vence.');
          state.game.day.warnings = warnings;
          endGame('Mal venceu', 'O Santo foi executado.');
          return;
        }
        if (trueRole(executed)?.type === 'demon' && aliveBeforeExecution === 3 && hasAliveRole('manipulator')) {
          state.game.status.manipulatorGraceUntilDay = state.game.day.number + 1;
          warnings.push('Manipulador ativou: o jogo ganha mais um dia apesar da execução do demônio.');
        }
      }
    }
  }
  if (!executedId && livingPlayers().length === 3 && hasAliveRole('mayor')) {
    endGame('Bem venceu', 'Prefeito vivo com 3 jogadores e sem execução.');
    return;
  }
  state.game.day.warnings = warnings;
  resolveDemonBackup('morte/execução durante o dia');
  if (checkGameEnd()) return;
  saveState();
}

function startNextNightFromDay() {
  updateDayFromForm();
  if (state.game.ended) return;
  const grace = state.game.status?.manipulatorGraceUntilDay;
  const noDemon = livingPlayers().filter((player) => trueRole(player)?.type === 'demon').length === 0;
  if (noDemon && grace && state.game.day?.number >= grace) {
    endGame('Bem venceu', 'O dia extra do Manipulador terminou e o demônio continua morto.');
    return;
  }
  state.game.nightNumber += 1;
  startNight(state.game.nightNumber);
}

function hostGuideUrl() {
  const ids = (state.game?.roleGuideIds?.length ? state.game.roleGuideIds : getRolePoolIdsForSetup()).filter(roleById);
  const base = `${location.origin}${location.pathname}`;
  return `${base}?guia=${encodeURIComponent(ids.join(','))}`;
}

function renderSharedGuide(roleIds) {
  const roles = roleIds.map(roleById).filter(Boolean);
  const grouped = TYPE_ORDER.map((type) => ({ type, roles: roles.filter((role) => role.type === type) })).filter((group) => group.roles.length);
  return `
    <main class="app-shell">
      <section class="hero"><div class="hero-badge">Guia da seleção</div><h1>Roles possíveis</h1><p>Este guia mostra o pool da seleção desta partida, não só as roles já escolhidas.</p></section>
      ${grouped.map((group) => `<section class="section-title"><h3>${TYPE_EMOJI[group.type]} ${TYPE_LABEL[group.type]}</h3><span>${group.roles.length}</span></section><section class="role-selection-grid readonly">${group.roles.map((role) => roleCard(role)).join('')}</section>`).join('')}
    </main>
  `;
}

function renderHome() {
  return `
    <main class="app-shell">
      <section class="hero"><div class="hero-badge">☾ Local · Celular único</div><h1>Clocktower Local</h1><p>Escolha a seleção, entregue os cartuchos e siga as etapas noturnas pelo celular.</p></section>
      <section class="home-actions"><button class="primary-btn" data-action="go-script">Partida Local</button><button class="secondary-btn" data-action="go-guide">Guia</button></section>
      <section class="section-title"><h3>Save local</h3></section><article class="card"><p>O jogo salva sozinho no navegador. Apague apenas para recomeçar do zero.</p><div class="grid" style="margin-top: 12px;"><button class="danger-btn" data-action="reset-all">Apagar save local</button></div></article>
    </main>
  `;
}

function renderGuide() {
  const search = state.guide.search.toLowerCase();
  const pool = state.guide.scriptId === 'all' ? ROLES : rolesForScript(state.guide.scriptId);
  const roles = pool.filter((role) => {
    const matchesType = state.guide.type === 'all' || role.type === state.guide.type;
    const blob = `${role.name} ${role.summary} ${TYPE_LABEL[role.type]}`.toLowerCase();
    return matchesType && blob.includes(search);
  });
  return `
    <main class="app-shell">
      ${topbar('Guia', 'Roles cadastradas no site')}
      <section class="filter-row"><input placeholder="Buscar role..." value="${escapeHTML(state.guide.search)}" data-action="guide-search" /><select data-action="guide-script"><option value="all" ${state.guide.scriptId === 'all' ? 'selected' : ''}>Todas</option>${SCRIPTS.map((script) => `<option value="${script.id}" ${state.guide.scriptId === script.id ? 'selected' : ''}>${escapeHTML(script.name)}</option>`).join('')}</select><select data-action="guide-type"><option value="all" ${state.guide.type === 'all' ? 'selected' : ''}>Tipos</option>${TYPE_ORDER.map((type) => `<option value="${type}" ${state.guide.type === type ? 'selected' : ''}>${TYPE_EMOJI[type]} ${TYPE_LABEL[type]}</option>`).join('')}</select></section>
      <section class="role-selection-grid readonly">${roles.map((role) => roleCard(role)).join('')}</section>
    </main>
  `;
}

function renderScriptSelect() {
  return `
    <main class="app-shell">
      ${topbar('Partida Local', 'Primeiro escolha a seleção')}
      <section class="grid">${SCRIPTS.map((script) => {
        const count = script.id === 'custom' ? (Array.isArray(state.setup.customPoolIds) ? state.setup.customPoolIds.length : ROLES.length) : rolesForScript(script.id).length;
        const active = state.setup.scriptId === script.id;
        return `<article class="card ${active ? 'selected' : ''}" data-action="select-script" data-script-id="${script.id}"><p class="kicker">${escapeHTML(script.subtitle)}</p><div class="role-title"><div><h3>${escapeHTML(script.name)}</h3><p>${escapeHTML(script.description)}</p></div><span class="pill">${count} roles</span></div></article>`;
      }).join('')}</section>
      <section class="sticky-actions"><button class="primary-btn" data-action="go-setup">Continuar</button></section>
    </main>
  `;
}

function renderCustomPool() {
  const selected = new Set(Array.isArray(state.setup.customPoolIds) ? state.setup.customPoolIds : ROLES.map((role) => role.id));
  const grouped = TYPE_ORDER.map((type) => ({ type, roles: ROLES.filter((role) => role.type === type) })).filter((group) => group.roles.length);
  return `
    <main class="app-shell">
      ${topbar('Seleção Personalizada', 'Crie o pool antes da subseleção')}
      <section class="card"><p>Escolha quais roles podem existir nesta seleção. Depois, na próxima tela, você monta a subseleção exata da partida.</p><div class="grid two" style="margin-top: 12px;"><button class="secondary-btn" data-action="pool-all">Todas</button><button class="ghost-btn" data-action="pool-clear">Limpar</button></div></section>
      <section class="section-title"><h3>Pool</h3><span>${selected.size}/${ROLES.length}</span></section>
      ${grouped.map((group) => `<section class="section-title"><h3>${TYPE_EMOJI[group.type]} ${TYPE_LABEL[group.type]}</h3></section><section class="role-selection-grid">${group.roles.map((role) => roleCard(role, { action: 'toggle-pool-role', checked: selected.has(role.id) })).join('')}</section>`).join('')}
      <section class="sticky-actions"><button class="primary-btn" data-action="finish-custom-pool" ${selected.size < Number(state.setup.playerCount) ? 'disabled' : ''}>Usar esta seleção</button></section>
    </main>
  `;
}

function renderSetup() {
  const validation = setupValidation();
  const metric = metricInfo();
  const roles = getRolePoolForSetup();
  const grouped = TYPE_ORDER.map((type) => ({ type, roles: roles.filter((role) => role.type === type) })).filter((group) => group.roles.length);
  const script = scriptById(state.setup.scriptId);
  return `
    <main class="app-shell">
      ${topbar('Subseleção', script.name)}
      <section class="card">
        <div class="form-row"><label>Número de jogadores</label><select data-action="player-count">${Array.from({ length: 11 }, (_, i) => i + 5).map((n) => `<option value="${n}" ${Number(state.setup.playerCount) === n ? 'selected' : ''}>${n} jogadores</option>`).join('')}</select></div>
        <div class="form-row"><label>Modo da noite</label><div class="grid two"><button class="choice-btn ${state.setup.mode === 'automatic' ? 'active' : ''}" data-action="set-mode" data-mode="automatic">Automático</button><button class="choice-btn ${state.setup.mode === 'manual' ? 'active' : ''}" data-action="set-mode" data-mode="manual">Manual</button></div></div>
        <div class="grid two"><button class="secondary-btn" data-action="auto-fill">Preencher automático</button><button class="ghost-btn" data-action="clear-selection">Limpar roles</button></div>
      </section>
      <section class="section-title"><h3>Exigido</h3><span>${state.setup.selectedRoleIds.length}/${state.setup.playerCount}</span></section>
      <section class="count-grid">${TYPE_ORDER.map((type) => `<div class="count-box ${type}"><strong>${validation.counts[type]}/${validation.target[type]}</strong><span>${TYPE_EMOJI[type]}</span></div>`).join('')}</section>
      ${validation.errors.length ? `<article class="card warning" style="margin-top: 10px;">${validation.errors.map(escapeHTML).join('<br>')}</article>` : `<article class="card success" style="margin-top: 10px;">Subseleção válida.</article>`}
      <section class="metrics compact-metrics"><div class="metric"><div class="metric-head"><strong>🌙</strong><span>${metric.duration} etapas · N1 ${metric.firstNightSteps} / prox ${metric.otherNightSteps}</span></div><div class="bar"><div class="bar-fill" style="--value:${metric.durationPct}%"></div></div></div><div class="metric"><div class="metric-head"><strong>⚔️</strong><span>${metric.difficulty}/10 · ${metric.difficultyLabel}</span></div><div class="bar"><div class="bar-fill" style="--value:${metric.difficultyPct}%"></div></div></div></section>
      ${grouped.map((group) => `<section class="section-title"><h3>${TYPE_EMOJI[group.type]} ${TYPE_LABEL[group.type]}</h3><span>${validation.counts[group.type]}/${validation.target[group.type]}</span></section><section class="role-selection-grid">${group.roles.map((role) => roleCard(role, { action: 'toggle-role', checked: state.setup.selectedRoleIds.includes(role.id) })).join('')}</section>`).join('')}
      <section class="sticky-actions"><button class="primary-btn" data-action="start-game" ${validation.valid ? '' : 'disabled'}>Começar jogo</button></section>
    </main>
  `;
}

function renderReveal() {
  const game = state.game;
  const player = game.players[game.revealIndex];
  const role = visibleRole(player);
  const revealText = state.revealOpen ? `<button class="reveal-card ${role.type}" data-action="toggle-reveal"><p class="kicker">Sua role</p><h2>${escapeHTML(role.name)}</h2><p>${escapeHTML(role.summary)}</p></button>` : `<button class="big-question" data-action="toggle-reveal">?</button>`;
  return `
    <main class="app-shell">
      ${topbar('Entrega de roles', `Jogador ${game.revealIndex + 1} de ${game.players.length}`)}
      <section class="card warning">A pessoa toca no <strong>?</strong>, vê a role, toca de novo para esconder, digita o nome e devolve para o host.</section>
      <section style="margin-top: 14px;">${revealText}</section>
      <section class="card" style="margin-top: 14px;"><div class="form-row"><label>Nome do jogador</label><input data-player-name value="${escapeHTML(player.name)}" placeholder="Ex: Ana" autocomplete="off" /></div><button class="primary-btn" data-action="next-reveal">${game.revealIndex === game.players.length - 1 ? 'Finalizar entrega' : 'Salvar e próximo'}</button></section>
    </main>
  `;
}

function playerStatusBadges(player) {
  const status = state.game?.status || {};
  const badges = [];
  if (!player.alive) badges.push('☠️ morto');
  if (status.poisonedId === player.id) badges.push('☠️ envenenado');
  if (status.widowPoisonedId === player.id) badges.push('🕷️ envenenado pela Widow');
  if (status.pukkaPoisonedId === player.id) badges.push('🩸 envenenado pelo Pukka');
  if (player.trueRoleId === 'drunk') badges.push('🍺 bêbado');
  if (player.trueRoleId === 'lunatic') badges.push('🌙 lunático');
  if (player.trueRoleId === 'tormented') badges.push('🔥 atormentado');
  if (state.game?.technicalDrunkId === player.id) badges.push('🍺 bêbado técnico');
  if (status.charmedDrunkId === player.id) badges.push('💫 bêbado pela Encantada');
  if (status.soberProtectedId === player.id) badges.push('🩺 protegido de veneno/bebedeira');
  if (status.protectedId === player.id) badges.push('🛡️ protegido pelo Monge');
  if (status.permanentGuardedId === player.id) badges.push('🛡️ protegido pelo Guardião');
  if (status.exorcisedId === player.id) badges.push('✝️ exorcizado');
  if (status.sentinelBlockedId === player.id) badges.push('🚫 bloqueado pela Sentinela');
  if (status.butlerId === player.id && status.butlerMasterId) badges.push(`🤝 serve ${playerName(findPlayer(status.butlerMasterId))}`);
  if (status.butlerMasterId === player.id) badges.push('👑 mestre do Mordomo');
  if (status.executionProtectedId === player.id) badges.push('⚖️ imune a execução');
  if (status.witchCursedId === player.id) badges.push('🧙 amaldiçoado pela Bruxa');
  if (status.markerMarkedId === player.id) badges.push('📍 marcado');
  if (status.parasiteHostId === player.id) badges.push('🪱 hospedeiro');
  if (status.overlordTargetId === player.id) badges.push('👁️ marcado pelo Overlord');
  if (status.overlordKillPendingId === player.id) badges.push('🌙 morte pendente do Overlord');
  if (status.pukkaDoomedId === player.id) badges.push('⏳ morrerá pelo Pukka');
  if (status.vampireConvertedId === player.id) badges.push('🧛 convertido pelo Vampiro');
  if (status.widowKnownById === player.id) badges.push('🕷️ sabe quem é a Widow');
  if ((status.lastNightDeaths || []).includes(player.id)) badges.push('🌙 morreu na última noite');
  if ((status.lastTargets || []).includes(player.id)) badges.push('🎯 alvo na última noite');
  if (status.alchemistWatchId === player.id) badges.push('⚗️ observado pelo Alquimista');
  if (status.alchemistDemonId === player.id) badges.push('⚗️ visto pelo Alquimista');
  if (state.game?.disabledPowerIds?.includes(player.id)) badges.push('🔒 poder parado');
  if (player.abilityRoleId) badges.push(`🍖 roubou ${roleById(player.abilityRoleId)?.name || 'poder'}`);
  return badges.length ? `<div class="status-badges">${badges.map((b) => `<span>${escapeHTML(b)}</span>`).join('')}</div>` : '<span class="small">sem efeito ativo</span>';
}

function renderPlayerHostCard(player, options = {}) {
  const role = trueRole(player);
  const roleText = options.showRole ? `<span>Real: ${escapeHTML(role.name)}${player.fakeRoleId ? ` · viu: ${escapeHTML(visibleRole(player).name)}` : ''}${player.abilityRoleId ? ` · roubou: ${escapeHTML(roleById(player.abilityRoleId)?.name || '')}` : ''}</span>` : '';
  return `<article class="card player-card ${role.type} ${player.alive ? '' : 'dead'}"><div><strong>${player.seat}. ${escapeHTML(playerName(player))}</strong>${roleText}${playerStatusBadges(player)}</div>${options.checkbox ? `<label class="pill"><input type="checkbox" data-alive-id="${player.id}" ${player.alive ? 'checked' : ''} /> Vivo</label>` : `<span class="pill">${player.alive ? 'Vivo' : 'Morto'}</span>`}</article>`;
}

function renderGrimoire() {
  const game = state.game;
  const guideUrl = hostGuideUrl();
  return `
    <main class="app-shell">
      ${topbar('Host', 'Grimório e guia da seleção')}
      <section class="card"><p class="kicker">Link do guia da seleção</p><p>Este link mostra todas as roles possíveis do pool escolhido.</p><input readonly value="${escapeHTML(guideUrl)}" /><button class="secondary-btn" style="margin-top: 10px;" data-action="copy-guide-link">Copiar link do guia</button></section>
      <section class="section-title"><h3>Grimório</h3></section><section class="grid">${game.players.map((player) => renderPlayerHostCard(player, { showRole: true })).join('')}</section>
      <section class="card" style="margin-top: 12px;"><p><strong>Modo:</strong> ${game.mode === 'automatic' ? 'Automático' : 'Manual'}</p><p><strong>Red herring:</strong> ${findPlayer(game.redHerringId) ? escapeHTML(playerName(findPlayer(game.redHerringId))) : 'nenhum'}</p><p><strong>Bluffs:</strong> ${game.bluffs.map(roleById).filter(Boolean).map((role) => role.name).join(', ') || 'nenhum'}</p><p><strong>Minion bêbado pelo Técnico:</strong> ${findPlayer(game.technicalDrunkId) ? escapeHTML(playerName(findPlayer(game.technicalDrunkId))) : 'nenhum'}</p></section>
      <section class="sticky-actions"><button class="primary-btn" data-action="start-night">Começar noite 1</button><button class="ghost-btn" data-action="copy-grimoire">Copiar grimório JSON</button></section>
    </main>
  `;
}

function renderNight() {
  const game = state.game;
  const night = game.night;
  const step = currentStep();
  const total = night.steps.length || 1;
  const index = Math.min(night.currentStep + 1, total);
  const progress = (index / total) * 100;
  const result = night.results[step?.id];
  return `
    <main class="app-shell">
      ${topbar(`Noite ${night.number}`, `${index}/${total} etapas`)}
      <section class="progress"><div style="--progress:${progress}%"></div></section>
      <section class="step-card" style="margin-top: 14px;"><p class="kicker">${game.mode === 'automatic' ? 'Automático' : 'Manual'}</p><h2>${escapeHTML(step?.title || 'Sem etapa')}</h2>${result ? '<p class="hint">Ação confirmada. Esta etapa está travada.</p>' : renderStepBody(step)}${result ? `<div class="result-box">${result.html}</div>` : ''}</section>
      <section class="sticky-actions"><div class="grid two"><button class="ghost-btn" data-action="prev-step" ${night.currentStep === 0 ? 'disabled' : ''}>Voltar</button><button class="primary-btn" data-action="next-step">${night.currentStep === total - 1 ? 'Encerrar noite' : 'Próxima etapa'}</button></div></section>
    </main>
  `;
}

function renderStepBody(step) {
  if (!step) return '<p>Nenhuma ação nesta noite.</p>';
  if (isStepSkipped(step)) return '<p>Etapa pulada.</p>';
  if (state.game.mode === 'manual') return renderManualStep(step);
  return renderAutomaticStep(step);
}

function renderManualStep(step) {
  const actor = findPlayer(step.actorId);
  if (step.id === 'minion-info') return '<div class="action-box"><strong>Informação dos minions</strong></div>';
  if (step.id === 'demon-info') return '<div class="action-box"><strong>Informação do demônio</strong></div>';
  if (step.action === 'ravenkeeper') return '<div class="action-box"><strong>Guardião dos Corvos condicional</strong></div>';
  return `<p class="actor-line"><strong>${escapeHTML(actor ? playerName(actor) : step.title)}</strong></p><div class="action-box"><strong>Manual:</strong><span>O site só indica a etapa. O host resolve fora do automático.</span></div>`;
}

function renderAutomaticStep(step) {
  const actor = findPlayer(step.actorId);
  const role = step.roleId ? roleById(step.roleId) : null;
  const actorLine = actor ? `<p class="actor-line"><strong>${escapeHTML(playerName(actor))}</strong>${role ? ` · ${escapeHTML(role.name)}` : ''}</p>` : '';
  if (step.id === 'minion-info') return autoButton('minion-info', 'Mostrar');
  if (step.id === 'demon-info') return autoButton('demon-info', 'Mostrar');
  if (['sentinel', 'exorcist', 'doctor', 'widow', 'devils_advocate', 'witch', 'poisoner', 'marker', 'assassin', 'vampire', 'overlord', 'pukka', 'alchemist', 'dreamer', 'prince'].includes(step.action)) return `${actorLine}<div class="action-box"><label>Alvo</label>${playerSelect('target', { livingOnly: step.action !== 'dreamer', exclude: step.action === 'vampire' ? [actor?.id] : [] })}${autoButton(step.action, 'Confirmar')}</div>`;
  if (step.action === 'spy') return `${actorLine}${autoButton('spy', 'Mostrar')}`;
  if (['technician', 'king', 'general', 'noble', 'washerwoman', 'librarian', 'investigator', 'chef', 'farmer', 'empath', 'undertaker', 'cartographer', 'intellectual', 'mathematician', 'historian', 'observer'].includes(step.action)) return `${actorLine}${autoButton(step.action, 'Mostrar')}`;
  if (step.action === 'fortune_teller' || step.action === 'professor') return `${actorLine}<div class="action-box"><label>Primeiro alvo</label>${playerSelect('targetA', { livingOnly: step.action === 'professor' })}<label>Segundo alvo</label>${playerSelect('targetB', { livingOnly: step.action === 'professor' })}${autoButton(step.action, step.action === 'professor' ? 'Confirmar' : 'Mostrar')}</div>`;
  if (step.action === 'butler') return `${actorLine}<div class="action-box"><label>Mestre</label>${playerSelect('target', { livingOnly: true, exclude: [actor.id] })}${autoButton('butler', 'Confirmar')}</div>`;
  if (step.action === 'monk' || step.action === 'guardian') return `${actorLine}<div class="action-box"><label>Proteção</label>${playerSelect('target', { livingOnly: true, exclude: [actor.id] })}${autoButton(step.action, 'Confirmar')}</div>`;
  if (step.action === 'imp' || step.action === 'parasite') return `${actorLine}<div class="action-box"><label>${step.action === 'parasite' && state.game.night.number === 1 ? 'Hospedeiro' : 'Alvo'}</label>${playerSelect('target', { livingOnly: true })}${autoButton(step.action, 'Confirmar')}</div>`;
  if (step.action === 'po') return `${actorLine}<div class="action-box"><label>Alvo principal</label>${playerSelect('target', { livingOnly: true })}<div class="grid two">${autoButton('po-kill', 'Matar agora')}${autoButton('po-skip', 'Não matar')}</div></div>`;
  if (step.action === 'pukka-doom' || step.action === 'overlord-kill' || step.action === 'explosive') return `${actorLine}${autoButton(step.action, 'Resolver')}`;
  if (step.action === 'ravenkeeper') {
    const pending = findPlayer(state.game.night.pendingRavenkeeperId);
    if (!pending) return autoButton('ravenkeeper', 'Pular');
    return `<p class="actor-line"><strong>${escapeHTML(playerName(pending))}</strong></p><div class="action-box"><label>Alvo</label>${playerSelect('target')}${autoButton('ravenkeeper', 'Mostrar')}</div>`;
  }
  if (step.action === 'cannibal') {
    const dead = deadPlayersIncludingPending().filter((player) => player.id !== actor.id);
    if (!dead.length) return `${actorLine}${autoButton('cannibal', 'Sem mortos')}`;
    return `${actorLine}<div class="action-box"><label>Jogador morto</label>${playerSelect('target', { deadOnly: true, exclude: [actor.id] })}${autoButton('cannibal', 'Confirmar')}</div>`;
  }
  if (step.action === 'clumsy') {
    const clumsy = findPlayer(step.actorId);
    return `<p class="actor-line"><strong>${escapeHTML(playerName(clumsy))}</strong></p><div class="action-box"><label>Chute de jogador mau</label>${playerSelect('target', { livingOnly: true, exclude: [clumsy?.id] })}${autoButton('clumsy', 'Confirmar')}</div>`;
  }
  return `${actorLine}${autoButton(step.action, 'Marcar')}`;
}

function autoButton(action, label) {
  return `<button class="secondary-btn" data-action="auto-action" data-auto-action="${escapeHTML(action)}">${escapeHTML(label)}</button>`;
}

function renderDayPowers() {
  const html = [];
  const slayer = livingPlayers().find((p) => p.currentRoleId === 'slayer' && !p.used?.slayer);
  if (slayer) html.push(`<div class="action-box"><strong>Caçador</strong>${playerSelect('slayer-target', { livingOnly: true })}<button class="secondary-btn" data-action="day-power" data-power="slayer">Atirar</button></div>`);
  const sheriff = livingPlayers().find((p) => p.currentRoleId === 'sheriff');
  if (sheriff) {
    sheriff.used.sheriffShots ??= allPlayers().filter((p) => trueRole(p)?.type === 'minion').length;
    if (sheriff.used.sheriffShots > 0) html.push(`<div class="action-box"><strong>Sheriff · ${sheriff.used.sheriffShots} tiros</strong>${playerSelect('sheriff-target', { livingOnly: true })}<button class="secondary-btn" data-action="day-power" data-power="sheriff">Atirar em minion</button></div>`);
  }
  const religious = livingPlayers().find((p) => p.currentRoleId === 'religious' && !p.used?.religious);
  if (religious) html.push(`<div class="action-box"><strong>Religioso</strong>${roleSelect('religious-role')}<button class="secondary-btn" data-action="day-power" data-power="religious">Perguntar</button></div>`);
  const detective = livingPlayers().find((p) => p.currentRoleId === 'detective' && !p.used?.detective);
  if (detective) html.push(`<div class="action-box"><strong>Detetive</strong>${playerSelect('detective-target')}<button class="secondary-btn" data-action="day-power" data-power="detective">Ver role</button></div>`);
  const altruist = livingPlayers().find((p) => p.currentRoleId === 'altruist' && !p.used?.altruist);
  if (altruist && allPlayers().some((p) => !p.alive)) html.push(`<div class="action-box"><strong>Altruísta</strong>${playerSelect('altruist-target', { deadOnly: true })}<button class="secondary-btn" data-action="day-power" data-power="altruist">Ressuscitar</button></div>`);
  const surgeon = livingPlayers().find((p) => p.currentRoleId === 'surgeon' && !p.used?.surgeon);
  const lastNightDead = (state.game.status.lastNightDeaths || []).map(findPlayer).filter(Boolean);
  if (surgeon && lastNightDead.length) html.push(`<div class="action-box"><strong>Cirurgião</strong><select data-field="surgeon-target"><option value="">Escolher...</option>${lastNightDead.map((p) => `<option value="${p.id}">${escapeHTML(playerName(p))}</option>`).join('')}</select><button class="secondary-btn" data-action="day-power" data-power="surgeon">Ressuscitar</button></div>`);
  const golem = livingPlayers().find((p) => p.currentRoleId === 'golem' && !p.used?.golem);
  if (golem) html.push(`<div class="action-box"><strong>Golem</strong>${playerSelect('golem-target', { livingOnly: true, exclude: [golem.id] })}<button class="secondary-btn" data-action="day-power" data-power="golem">Nomear</button></div>`);
  const extra = livingPlayers().find((p) => p.currentRoleId === 'extra');
  if (extra) html.push(`<div class="action-box"><strong>Figurante</strong><button class="danger-btn" data-action="day-power" data-power="extra-kill">Matar Figurante</button></div>`);
  if (state.game.status.witchCursedId && findPlayer(state.game.status.witchCursedId)?.alive) html.push(`<div class="action-box"><strong>Bruxa</strong><p>${escapeHTML(playerName(findPlayer(state.game.status.witchCursedId)))} está amaldiçoado.</p><button class="danger-btn" data-action="day-power" data-power="witch-nominated">Marcar que nominou</button></div>`);
  if (state.game.status.overlordTargetId && findPlayer(state.game.status.overlordTargetId)?.alive) html.push(`<div class="action-box"><strong>Overlord</strong><p>${escapeHTML(playerName(findPlayer(state.game.status.overlordTargetId)))} está marcado.</p><button class="danger-btn" data-action="day-power" data-power="overlord-good-nomination">Foi nominado por alguém do bem</button></div>`);
  const king = livingPlayers().find((p) => p.currentRoleId === 'king');
  if (king) html.push(`<div class="action-box"><strong>Rei</strong><button class="danger-btn" data-action="day-power" data-power="king-wrong-vote">Marcar voto inválido do Rei</button></div>`);

  const manualNotes = [];
  const virgin = livingPlayers().find((p) => p.currentRoleId === 'virgin');
  if (virgin) manualNotes.push(`<strong>Virgem:</strong> atenção à primeira nomeação contra ${escapeHTML(playerName(virgin))}.`);
  const judge = livingPlayers().find((p) => p.currentRoleId === 'judge');
  if (judge) manualNotes.push(`<strong>Juiz:</strong> ${escapeHTML(playerName(judge))} tem voto/fala manual controlado pelo host.`);
  const neutralist = livingPlayers().find((p) => p.currentRoleId === 'neutralist');
  if (neutralist) manualNotes.push(`<strong>Isentão:</strong> ${escapeHTML(playerName(neutralist))} não pode votar nem nominar.`);
  const politician = livingPlayers().find((p) => p.currentRoleId === 'politician');
  if (politician) manualNotes.push(`<strong>Político:</strong> ${escapeHTML(playerName(politician))} tem voto/fala manual controlado pelo host.`);
  if (manualNotes.length) html.push(`<div class="action-box"><strong>Avisos manuais do dia</strong><p>${manualNotes.join('<br>')}</p></div>`);

  return html.length ? `<section class="section-title"><h3>Ações de dia</h3></section><section class="grid">${html.join('')}</section>` : '';
}

function renderDay() {
  const game = state.game;
  const day = game.day;
  return `
    <main class="app-shell">
      ${topbar(`Dia ${day.number}`, 'Host registra execução e mortes')}
      <section class="card"><p>Dia é controlado pelo host. Escolha quem foi executado e vá direto para a próxima noite.</p></section>
      <section class="section-title"><h3>Jogadores</h3></section><section class="grid">${allPlayers().map((player) => renderPlayerHostCard(player, { checkbox: true, showRole: false })).join('')}</section>
      ${renderDayPowers()}
      <section class="card" style="margin-top: 12px;"><div class="form-row"><label>Quem foi executado hoje?</label>${playerSelect('executed', { livingOnly: true })}<p class="hint">Se ninguém foi executado, deixe vazio.</p></div></section>
      ${day.warnings?.length ? `<section class="card warning" style="margin-top: 12px;">${day.warnings.map(escapeHTML).join('<br>')}</section>` : ''}
      <section class="sticky-actions"><button class="primary-btn" data-action="next-night">Começar próxima noite</button></section>
    </main>
  `;
}

function renderEnd() {
  const game = state.game;
  return `
    <main class="app-shell">
      <section class="hero"><div class="hero-badge">Fim de jogo</div><h1>${escapeHTML(game.winner || 'Fim')}</h1><p>${escapeHTML(game.endReason || 'Partida encerrada.')}</p></section>
      <section class="section-title"><h3>Grimório final</h3></section><section class="grid">${game.players.map((player) => renderPlayerHostCard(player, { showRole: true })).join('')}</section>
      <section class="sticky-actions"><button class="danger-btn" data-action="reset-all">Nova partida do zero</button></section>
    </main>
  `;
}

function topbar(title, subtitle = '') {
  return `<header class="topbar"><button class="back-btn" data-action="smart-back">‹</button><div class="brand"><h2>${escapeHTML(title)}</h2><p>${escapeHTML(subtitle)}</p></div></header>`;
}

function smartBack() {
  if (sharedGuideIds.length) return;
  if (state.view === 'night') {
    if (state.game?.night?.currentStep > 0) return prevStep({ push: false });
    return go('grimoire', { push: false });
  }
  if (state.view === 'day') return go('night', { push: false });
  if (state.view === 'grimoire') return go('reveal', { push: false });
  if (state.view === 'reveal') return previousReveal();
  if (state.view === 'setup') return state.setup.scriptId === 'custom' ? go('customPool', { push: false }) : go('script', { push: false });
  if (state.view === 'customPool') return go('script', { push: false });
  if (state.view === 'script') return go('home', { push: false });
  if (state.view === 'guide') return go('home', { push: false });
  if (state.view === 'end') return go('grimoire', { push: false });
  return render();
}

function render(options = {}) {
  if (sharedGuideIds.length) {
    app.innerHTML = renderSharedGuide(sharedGuideIds);
    return;
  }
  const view = state.view;
  if (view === 'home') app.innerHTML = renderHome();
  if (view === 'guide') app.innerHTML = renderGuide();
  if (view === 'script') app.innerHTML = renderScriptSelect();
  if (view === 'customPool') app.innerHTML = renderCustomPool();
  if (view === 'setup') app.innerHTML = renderSetup();
  if (view === 'reveal') app.innerHTML = state.game ? renderReveal() : renderHome();
  if (view === 'grimoire') app.innerHTML = state.game ? renderGrimoire() : renderHome();
  if (view === 'night') app.innerHTML = state.game?.night ? renderNight() : renderGrimoire();
  if (view === 'day') app.innerHTML = state.game ? renderDay() : renderHome();
  if (view === 'end') app.innerHTML = state.game ? renderEnd() : renderHome();
  const key = `${view}:${state.game?.night?.currentStep ?? ''}`;
  if (!options.keepScroll && key !== lastRenderedKey) window.scrollTo({ top: 0, behavior: 'instant' });
  lastRenderedKey = key;
}

function executeDayPower(power) {
  if (!state.game) return;
  if (power === 'slayer') {
    const actor = livingPlayers().find((p) => p.currentRoleId === 'slayer' && !p.used?.slayer);
    const target = findPlayer(getField('slayer-target'));
    if (!actor || !target) return alert('Escolha alvo.');
    actor.used.slayer = true;
    if (!isDrunkLike(actor) && trueRole(target)?.type === 'demon') { target.alive = false; applyDeathTrigger(target, 'caçador'); }
    state.game.day.warnings.push(trueRole(target)?.type === 'demon' ? 'Caçador acertou o demônio.' : 'Caçador atirou.');
  }
  if (power === 'sheriff') {
    const actor = livingPlayers().find((p) => p.currentRoleId === 'sheriff');
    const target = findPlayer(getField('sheriff-target'));
    if (!actor || !target) return alert('Escolha alvo.');
    actor.used.sheriffShots = Math.max(0, (actor.used.sheriffShots || 0) - 1);
    if (!isDrunkLike(actor) && trueRole(target)?.type === 'minion') { target.alive = false; applyDeathTrigger(target, 'sheriff'); }
    state.game.day.warnings.push(trueRole(target)?.type === 'minion' ? 'Sheriff acertou um minion.' : 'Sheriff atirou.');
  }
  if (power === 'religious') {
    const actor = livingPlayers().find((p) => p.currentRoleId === 'religious' && !p.used?.religious);
    const roleId = getField('religious-role');
    if (!actor || !roleId) return alert('Escolha role.');
    actor.used.religious = true;
    const inGame = allPlayers().some((p) => p.currentRoleId === roleId || p.trueRoleId === roleId);
    state.game.day.warnings.push(`Religioso: ${roleMiniName(roleId)} ${inGame ? 'está' : 'não está'} em jogo.`);
  }
  if (power === 'detective') {
    const actor = livingPlayers().find((p) => p.currentRoleId === 'detective' && !p.used?.detective);
    const target = findPlayer(getField('detective-target'));
    if (!actor || !target) return alert('Escolha alvo.');
    actor.used.detective = true;
    const role = isDrunkLike(actor) ? sample(ROLES) : trueRole(target);
    state.game.day.warnings.push(`Detetive viu ${playerName(target)}: ${role.name}.`);
  }
  if (power === 'altruist') {
    const actor = livingPlayers().find((p) => p.currentRoleId === 'altruist' && !p.used?.altruist);
    const target = findPlayer(getField('altruist-target'));
    if (!actor || !target) return alert('Escolha alvo.');
    actor.used.altruist = true;
    if (!isDrunkLike(actor)) { target.alive = true; actor.alive = false; applyDeathTrigger(actor, 'altruista'); }
    state.game.day.warnings.push(`${playerName(target)} foi ressuscitado pelo Altruísta.`);
  }
  if (power === 'surgeon') {
    const actor = livingPlayers().find((p) => p.currentRoleId === 'surgeon' && !p.used?.surgeon);
    const target = findPlayer(getField('surgeon-target'));
    if (!actor || !target) return alert('Escolha alvo.');
    actor.used.surgeon = true;
    if (!isDrunkLike(actor)) target.alive = true;
    state.game.day.warnings.push(`${playerName(target)} foi ressuscitado pelo Cirurgião.`);
  }
  if (power === 'king-wrong-vote') {
    const king = livingPlayers().find((p) => p.currentRoleId === 'king');
    if (!king) return;
    king.alive = false;
    king.kingWrongVoteDeath = true;
    applyDeathTrigger(king, 'dia');
    state.game.day.warnings.push('Rei morreu por votar em nomeação de outro jogador.');
  }
  if (power === 'golem') {
    const actor = livingPlayers().find((p) => p.currentRoleId === 'golem' && !p.used?.golem);
    const target = findPlayer(getField('golem-target'));
    if (!actor || !target) return alert('Escolha alvo.');
    actor.used.golem = true;
    if (!isDrunkLike(actor) && trueRole(target)?.type !== 'demon') { target.alive = false; applyDeathTrigger(target, 'golem'); }
    state.game.day.warnings.push(trueRole(target)?.type === 'demon' ? 'Golem nomeou o demônio: ninguém morreu.' : 'Golem matou o alvo da primeira nomeação.');
  }
  if (power === 'extra-kill') {
    const extra = livingPlayers().find((p) => p.currentRoleId === 'extra');
    if (!extra) return;
    extra.alive = false;
    applyDeathTrigger(extra, 'storyteller');
    state.game.day.warnings.push('Figurante morreu por escolha do storyteller.');
  }
  if (power === 'witch-nominated') {
    const cursed = findPlayer(state.game.status.witchCursedId);
    if (cursed?.alive) { cursed.alive = false; applyDeathTrigger(cursed, 'bruxa'); state.game.day.warnings.push(`${playerName(cursed)} morreu pela maldição da Bruxa.`); }
    state.game.status.witchCursedId = null;
  }
  if (power === 'overlord-good-nomination') {
    const target = findPlayer(state.game.status.overlordTargetId);
    if (target?.alive) { state.game.status.overlordKillPendingId = target.id; state.game.day.warnings.push(`${playerName(target)} morrerá à noite pelo Overlord.`); }
  }
  resolveDemonBackup('ação de dia');
  if (!checkGameEnd()) saveAndRender({ push: false });
}

app.addEventListener('input', (event) => {
  const action = event.target?.dataset?.action;
  if (action === 'guide-search') {
    state.guide.search = event.target.value;
    saveAndRender({ push: false, keepScroll: true });
  }
});

app.addEventListener('change', (event) => {
  const action = event.target?.dataset?.action;
  if (action === 'guide-type') { state.guide.type = event.target.value; saveAndRender({ push: false, keepScroll: true }); }
  if (action === 'guide-script') { state.guide.scriptId = event.target.value; saveAndRender({ push: false, keepScroll: true }); }
  if (action === 'player-count') { state.setup.playerCount = Number(event.target.value); state.setup.selectedRoleIds = []; saveAndRender({ push: false }); }
});

app.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'smart-back') return smartBack();
  if (action === 'go-home') return go('home');
  if (action === 'go-guide') return go('guide');
  if (action === 'go-script') return go('script');
  if (action === 'go-setup') return state.setup.scriptId === 'custom' ? go('customPool') : go('setup');
  if (action === 'select-script') { state.setup.scriptId = button.dataset.scriptId; state.setup.selectedRoleIds = []; saveAndRender({ push: false, keepScroll: true }); return; }
  if (action === 'reset-all') { if (confirm('Apagar todo o save local?')) resetAll(); return; }
  if (action === 'set-mode') { state.setup.mode = button.dataset.mode; saveAndRender({ push: false, keepScroll: true }); return; }
  if (action === 'pool-all') { state.setup.customPoolIds = ROLES.map((role) => role.id); saveAndRender({ push: false, keepScroll: true }); return; }
  if (action === 'pool-clear') { state.setup.customPoolIds = []; saveAndRender({ push: false, keepScroll: true }); return; }
  if (action === 'toggle-pool-role') { const id = button.dataset.roleId; const set = new Set(Array.isArray(state.setup.customPoolIds) ? state.setup.customPoolIds : ROLES.map((role) => role.id)); set.has(id) ? set.delete(id) : set.add(id); state.setup.customPoolIds = [...set]; state.setup.selectedRoleIds = state.setup.selectedRoleIds.filter((roleId) => set.has(roleId)); saveAndRender({ push: false, keepScroll: true }); return; }
  if (action === 'finish-custom-pool') return go('setup');
  if (action === 'auto-fill') return autoFillRoles();
  if (action === 'clear-selection') { state.setup.selectedRoleIds = []; saveAndRender({ push: false, keepScroll: true }); return; }
  if (action === 'toggle-role') { const roleId = button.dataset.roleId; if (state.setup.selectedRoleIds.includes(roleId)) state.setup.selectedRoleIds = state.setup.selectedRoleIds.filter((id) => id !== roleId); else state.setup.selectedRoleIds = [...state.setup.selectedRoleIds, roleId]; saveAndRender({ push: false, keepScroll: true }); return; }
  if (action === 'start-game') return startGame();
  if (action === 'toggle-reveal') { state.revealOpen = !state.revealOpen; saveAndRender({ push: false }); return; }
  if (action === 'next-reveal') return nextReveal();
  if (action === 'start-night') return startNight(1);
  if (action === 'prev-step') return prevStep();
  if (action === 'next-step') return nextStep();
  if (action === 'auto-action') return executeAutomaticAction(button.dataset.autoAction);
  if (action === 'day-power') return executeDayPower(button.dataset.power);
  if (action === 'next-night') return startNextNightFromDay();
  if (action === 'copy-grimoire') { navigator.clipboard?.writeText(JSON.stringify(state.game, null, 2)); alert('Grimório copiado em JSON.'); }
  if (action === 'copy-guide-link') { navigator.clipboard?.writeText(hostGuideUrl()); alert('Link do guia copiado.'); }
});

window.addEventListener('popstate', () => {
  smartBack();
  if (!sharedGuideIds.length) history.pushState({ clocktower: true, view: state.view }, '', location.pathname);
});

if (!sharedGuideIds.length) {
  history.replaceState({ clocktower: true, view: state.view }, '', location.pathname);
  history.pushState({ clocktower: true, view: state.view }, '', location.pathname);
  historyReady = true;
}
render();

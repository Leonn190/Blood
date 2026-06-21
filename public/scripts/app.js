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

const STORAGE_KEY = 'clocktower-local-v5';
const app = document.querySelector('#app');
const sharedGuideIds = getSharedGuideIdsFromUrl();

const initialState = {
  view: 'home',
  guide: { search: '', type: 'all', scriptId: 'all' },
  setup: {
    scriptId: 'classic',
    playerCount: 7,
    mode: 'automatic',
    selectedRoleIds: []
  },
  revealOpen: false,
  game: null
};

let state = loadState();
let lastRenderedView = null;
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
  render();
}

function setState(patch, options = {}) {
  state = { ...state, ...patch };
  saveAndRender(options);
}

function go(view, options = {}) {
  setState({ view, revealOpen: false }, options);
}

function pushBrowserState() {
  if (sharedGuideIds.length) return;
  if (!historyReady) return;
  const url = `${location.pathname}${location.search && !location.search.includes('guia=') ? location.search : ''}`;
  history.pushState({ clocktower: true, view: state.view }, '', url || location.pathname);
}

function getSharedGuideIdsFromUrl() {
  const params = new URLSearchParams(location.search);
  const raw = params.get('guia') || params.get('guide') || '';
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter((id) => roleById(id));
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
  return state.game?.night?.poisonedId === playerId;
}

function isDrunkLike(player) {
  if (!player?.id) return false;
  if (isSoberProtected(player.id)) return false;
  return player.trueRoleId === 'drunk' || isPoisoned(player.id);
}

function isBlockedActor(playerId) {
  return Boolean(playerId && state.game?.night?.blockedActorIds?.includes(playerId));
}

function rolePill(role) {
  if (!role) return '';
  return `<span class="type-pill ${role.type}">${TYPE_EMOJI[role.type]} ${TYPE_LABEL[role.type]}</span>`;
}

function roleStepCount(role) {
  if (!role) return 0;
  if (role.action === 'ravenkeeper') return 1;
  const first = role.nightOrderFirst !== null && role.nightOrderFirst !== undefined;
  const other = role.nightOrderOther !== null && role.nightOrderOther !== undefined;
  return first || other ? 1 : 0;
}

function roleNightLabel(role) {
  const first = role.nightOrderFirst !== null && role.nightOrderFirst !== undefined;
  const other = role.nightOrderOther !== null && role.nightOrderOther !== undefined;
  if (role.id === 'ravenkeeper') return 'condicional';
  if (first && other) return 'noites';
  if (first) return 'noite 1';
  if (other) return 'próximas';
  return 'sem noite';
}

function roleCompactStats(role) {
  const diff = Number(role.difficulty || 0);
  return `<span class="mini-stat">🌙 ${roleStepCount(role)}</span><span class="mini-stat">⚔️ ${diff > 0 ? '+' : ''}${diff}</span>`;
}

function roleCard(role, options = {}) {
  const checked = options.checked ? 'checked' : '';
  const selectedClass = options.checked ? ' selected' : '';
  const input = options.checkbox
    ? `<input type="checkbox" data-action="toggle-role" data-role-id="${role.id}" ${checked} />`
    : '';
  return `
    <article class="card role-card ${role.type}${selectedClass}">
      <div class="${options.checkbox ? 'role-check' : ''}">
        ${input}
        <div class="role-card-content">
          <div class="role-title compact-title">
            <div>
              <h3>${escapeHTML(role.name)}</h3>
              <p>${escapeHTML(role.summary)}</p>
            </div>
            ${rolePill(role)}
          </div>
          <p class="hint compact-hint">${roleCompactStats(role)} <span>${escapeHTML(roleNightLabel(role))}</span></p>
        </div>
      </div>
    </article>
  `;
}

function selectedRoles() {
  return state.setup.selectedRoleIds.map(roleById).filter(Boolean);
}

function selectedCounts(roleIds = state.setup.selectedRoleIds) {
  const counts = { townsfolk: 0, outsider: 0, minion: 0, demon: 0 };
  roleIds.forEach((id) => {
    const role = roleById(id);
    if (role) counts[role.type] += 1;
  });
  return counts;
}

function setupTarget(roleIds = state.setup.selectedRoleIds) {
  const hasBaron = roleIds.includes('baron');
  return getDistribution(Number(state.setup.playerCount), hasBaron);
}

function setupValidation(roleIds = state.setup.selectedRoleIds) {
  const counts = selectedCounts(roleIds);
  const target = setupTarget(roleIds);
  const selected = roleIds.length;
  const expected = Number(state.setup.playerCount);
  const errors = [];

  if (selected !== expected) errors.push(`Selecione exatamente ${expected} roles. Agora tem ${selected}.`);
  TYPE_ORDER.forEach((type) => {
    if (counts[type] !== target[type]) errors.push(`${TYPE_LABEL[type]}: precisa ${target[type]}, agora tem ${counts[type]}.`);
  });
  return { counts, target, errors, valid: errors.length === 0 };
}

function metricInfo() {
  const roles = selectedRoles();
  const firstRoleSteps = roles.filter((role) => role.nightOrderFirst !== null && role.nightOrderFirst !== undefined).length;
  const otherRoleSteps = roles.filter((role) => role.nightOrderOther !== null && role.nightOrderOther !== undefined).length;
  const firstTeamSteps = roles.some((role) => role.type === 'minion') ? 1 : 0;
  const demonInfoStep = roles.some((role) => role.type === 'demon') ? 1 : 0;
  const firstNightSteps = firstRoleSteps + firstTeamSteps + demonInfoStep;
  const conditionalSteps = roles.some((role) => role.id === 'ravenkeeper') ? 1 : 0;
  const otherNightSteps = otherRoleSteps + conditionalSteps;
  const duration = Math.max(firstNightSteps, otherNightSteps);
  const rawDifficulty = roles.reduce((sum, role) => sum + Number(role.difficulty || 0), 0);
  const difficulty = clamp(5 + rawDifficulty, 0, 10);
  const durationPct = clamp((duration / 14) * 100, 4, 100);
  const difficultyPct = clamp(difficulty * 10, 4, 100);
  let difficultyLabel = 'padrão';
  if (difficulty <= 3) difficultyLabel = 'bem favorecido';
  if (difficulty >= 7) difficultyLabel = 'bem pressionado';
  return { duration, firstNightSteps, otherNightSteps, difficulty, durationPct, difficultyPct, difficultyLabel };
}

function rolesByTypeLocal(list, type) {
  return list.filter((role) => role.type === type);
}

function getRolePoolForSetup() {
  return rolesForScript(state.setup.scriptId);
}

function buildRandomValidRoleIds(forceBaron = null) {
  const playerCount = Number(state.setup.playerCount);
  const pool = getRolePoolForSetup();
  const includeBaron = forceBaron === null ? Math.random() < 0.5 : forceBaron;
  const target = getDistribution(playerCount, includeBaron);
  const picked = [];

  const townsfolkPool = rolesByTypeLocal(pool, 'townsfolk');
  const outsiderPool = rolesByTypeLocal(pool, 'outsider');
  const minionPool = rolesByTypeLocal(pool, 'minion').filter((role) => role.id !== 'baron');
  const demonPool = rolesByTypeLocal(pool, 'demon');

  picked.push(...sampleMany(townsfolkPool, target.townsfolk));
  picked.push(...sampleMany(outsiderPool, target.outsider));
  if (includeBaron && target.minion > 0 && pool.some((role) => role.id === 'baron')) picked.push(roleById('baron'));
  const remainingMinionsNeeded = Math.max(0, target.minion - picked.filter((role) => role?.type === 'minion').length);
  picked.push(...sampleMany(minionPool, remainingMinionsNeeded));
  picked.push(...sampleMany(demonPool, target.demon));

  const ids = shuffle(picked.filter(Boolean).map((role) => role.id));
  return setupValidation(ids).valid ? ids : null;
}

function autoFillRoles() {
  let ids = null;
  for (let attempt = 0; attempt < 80 && !ids; attempt += 1) {
    const forced = attempt % 3 === 0 ? true : attempt % 3 === 1 ? false : null;
    ids = buildRandomValidRoleIds(forced);
  }
  if (!ids) {
    alert('Não consegui montar uma formação válida com esse número de jogadores e esse pool de roles. Tente Seleção Completa ou ajuste manualmente.');
    return;
  }
  state.setup.selectedRoleIds = ids;
  saveAndRender();
}

function resetAll() {
  state = structuredClone(initialState);
  saveAndRender({ push: false });
}

function startGame() {
  const validation = setupValidation();
  if (!validation.valid) {
    alert('A subseleção ainda não está válida. Ajuste as quantidades antes de começar.');
    return;
  }

  const selectedIds = shuffle(state.setup.selectedRoleIds);
  const possibleFakeTownsfolk = ROLES
    .filter((role) => role.type === 'townsfolk' && !selectedIds.includes(role.id))
    .map((role) => role.id);

  const players = selectedIds.map((roleId, index) => {
    const role = roleById(roleId);
    let fakeRoleId = null;
    if (roleId === 'drunk') {
      fakeRoleId = sample(possibleFakeTownsfolk) || sample(ROLES.filter((r) => r.type === 'townsfolk').map((r) => r.id));
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
      notes: [],
      usedSlayer: false
    };
  });

  const goodPlayers = players.filter((player) => !isEvilRole(player.currentRoleId));
  const redHerring = sample(goodPlayers.filter((player) => player.trueRoleId !== 'fortune_teller'));

  state.game = {
    scriptId: state.setup.scriptId,
    roleGuideIds: [...state.setup.selectedRoleIds],
    mode: state.setup.mode,
    players,
    revealIndex: 0,
    redHerringId: redHerring?.id || null,
    bluffs: createDemonBluffs(selectedIds),
    nightNumber: 1,
    night: null,
    status: {
      poisonedId: null,
      poisonedNight: null,
      soberProtectedId: null,
      protectedId: null,
      exorcisedId: null,
      butlerId: null,
      butlerMasterId: null,
      lastNightDeaths: []
    },
    day: {
      number: 1,
      lastExecutedId: null,
      lastDayDeaths: [],
      warnings: []
    },
    log: []
  };
  state.revealOpen = false;
  go('reveal');
}

function createDemonBluffs(selectedIds) {
  const possible = ROLES.filter((role) => role.type === 'townsfolk' && !selectedIds.includes(role.id)).map((role) => role.id);
  return sampleMany(possible, 3);
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
    saveAndRender();
  } else {
    go('grimoire');
  }
}

function previousReveal() {
  saveCurrentPlayerName();
  if (!state.game || state.game.revealIndex <= 0) return go('setup');
  state.game.revealIndex -= 1;
  state.revealOpen = false;
  saveAndRender({ push: false });
}

function startNight(number = state.game.nightNumber) {
  state.game.nightNumber = number;
  state.game.status = state.game.status || {};
  state.game.status.poisonedId = null;
  state.game.status.poisonedNight = null;
  state.game.status.soberProtectedId = null;
  state.game.status.protectedId = null;
  state.game.status.exorcisedId = null;
  const executed = findPlayer(state.game.day?.lastExecutedId);
  const executedRavenkeeperId = executed?.currentRoleId === 'ravenkeeper' ? executed.id : null;
  state.game.night = {
    number,
    currentStep: 0,
    steps: buildNightSteps(number),
    results: {},
    poisonedId: null,
    soberProtectedId: null,
    protectedId: null,
    exorcisedId: null,
    blockedActorIds: [],
    deadTonightIds: [],
    pendingRavenkeeperId: executedRavenkeeperId,
    startedAt: Date.now()
  };
  state.game.log.push(`Noite ${number} começou.`);
  go('night');
}

function buildNightSteps(nightNumber) {
  const steps = [];
  const players = allPlayers();

  if (nightNumber === 1) {
    if (players.some((p) => isPlayerEvil(p))) steps.push({ id: 'minion-info', kind: 'team', title: 'Informação dos minions', order: 1 });
    if (players.some((p) => trueRole(p)?.type === 'demon')) steps.push({ id: 'demon-info', kind: 'team', title: 'Informação do demônio', order: 2 });
  }

  const roleSteps = [];
  players.forEach((player) => {
    if (!player.alive) return;
    const role = actingRole(player);
    const order = nightNumber === 1 ? role?.nightOrderFirst : role?.nightOrderOther;
    if (!role || role.action === 'ravenkeeper') return;
    if (order !== null && order !== undefined && role.action) {
      roleSteps.push({
        id: `${role.action}-${player.id}-${nightNumber}`,
        kind: 'role',
        title: role.name,
        roleId: role.id,
        actorId: player.id,
        action: role.action,
        order
      });
    }
  });

  const executed = findPlayer(state.game.day?.lastExecutedId);
  const ravenkeeperDead = players.some((p) => p.currentRoleId === 'ravenkeeper' && !p.alive) || executed?.currentRoleId === 'ravenkeeper';
  if (nightNumber > 1 && ravenkeeperDead) {
    roleSteps.push({ id: `ravenkeeper-conditional-${nightNumber}`, kind: 'conditional', title: 'Guardião dos Corvos', roleId: 'ravenkeeper', action: 'ravenkeeper', order: 50 });
  }

  steps.push(...roleSteps.sort((a, b) => a.order - b.order));
  return steps;
}

function currentStep() {
  return state.game?.night?.steps?.[state.game.night.currentStep] || null;
}

function isStepSkippedByDeath(step) {
  if (!step?.actorId) return false;
  const actor = findPlayer(step.actorId);
  const pendingDeath = state.game?.night?.deadTonightIds?.includes(step.actorId);
  return !actor || !actor.alive || pendingDeath;
}

function nextStep(options = {}) {
  const night = state.game.night;
  let nextIndex = night.currentStep + 1;
  while (nextIndex < night.steps.length && isStepSkippedByDeath(night.steps[nextIndex])) nextIndex += 1;
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
  const deaths = state.game.night.deadTonightIds || [];
  deaths.forEach((id) => {
    const player = findPlayer(id);
    if (player) player.alive = false;
  });
  state.game.status = state.game.status || {};
  state.game.status.lastNightDeaths = deaths;
  const names = deaths.map((id) => playerName(findPlayer(id))).join(', ');
  state.game.log.push(`Noite ${state.game.night.number} terminou.${names ? ` Mortes: ${names}.` : ' Sem mortes noturnas.'}`);
  resolveDemonBackup('morte durante a noite');
  state.game.day = { number: state.game.night.number, lastExecutedId: null, lastDayDeaths: [], warnings: [] };
  if (checkGameEnd()) return;
  go('day');
}

function findPlayer(id) {
  return allPlayers().find((player) => player.id === id);
}

function playerSelect(name, options = {}) {
  const players = options.deadOnly ? deadPlayersIncludingPending() : options.livingOnly ? livingPlayers() : allPlayers();
  const exclude = new Set(options.exclude || []);
  return `
    <select name="${escapeHTML(name)}" data-field="${escapeHTML(name)}">
      <option value="">Escolher...</option>
      ${players
        .filter((player) => !exclude.has(player.id))
        .map((player) => `<option value="${player.id}">${escapeHTML(playerName(player))}${player.alive ? '' : ' (morto)'}</option>`)
        .join('')}
    </select>
  `;
}

function markResult(stepId, html, data = {}) {
  state.game.night.results[stepId] = { html, data, at: Date.now() };
  saveAndRender();
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

function executeAutomaticAction(action) {
  const step = currentStep();
  if (!step) return;
  if (state.game.night.results[step.id]) return;
  if (isStepSkippedByDeath(step)) return markResult(step.id, 'Etapa pulada: jogador morto.');
  if (step.actorId && isBlockedActor(step.actorId) && isPlayerEvil(findPlayer(step.actorId))) {
    return markResult(step.id, 'Poder bloqueado nesta noite.');
  }

  switch (action) {
    case 'minion-info': return actionMinionInfo(step);
    case 'demon-info': return actionDemonInfo(step);
    case 'exorcist': return actionExorcist(step);
    case 'doctor': return actionDoctor(step);
    case 'poisoner': return actionPoisoner(step);
    case 'spy': return actionSpy(step);
    case 'washerwoman': return actionWasherwoman(step);
    case 'librarian': return actionLibrarian(step);
    case 'investigator': return actionInvestigator(step);
    case 'chef': return actionChef(step);
    case 'empath': return actionEmpath(step);
    case 'fortune_teller': return actionFortuneTeller(step);
    case 'butler': return actionButler(step);
    case 'monk': return actionMonk(step);
    case 'imp': return actionImp(step);
    case 'ravenkeeper': return actionRavenkeeper(step);
    case 'undertaker': return actionUndertaker(step);
    case 'cannibal': return actionCannibal(step);
    default: return markResult(step.id, 'Ação marcada como feita.');
  }
}

function actionMinionInfo(step) {
  const minions = livingPlayers().filter((player) => trueRole(player)?.type === 'minion');
  const demons = livingPlayers().filter((player) => trueRole(player)?.type === 'demon');
  markResult(step.id, `<strong>Demônio:</strong> ${demons.map(playerName).join(', ') || 'nenhum'}<br><strong>Minions:</strong> ${minions.map((p) => `${playerName(p)} (${trueRole(p).name})`).join(', ') || 'nenhum'}`);
}

function actionDemonInfo(step) {
  const minions = livingPlayers().filter((player) => trueRole(player)?.type === 'minion');
  const bluffs = state.game.bluffs.map(roleById).filter(Boolean).map((role) => role.name).join(', ');
  markResult(step.id, `<strong>Minions:</strong> ${minions.map(playerName).join(', ') || 'nenhum'}<br><strong>Bluffs:</strong> ${bluffs || 'sem bluffs disponíveis'}`);
}

function actionExorcist(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha o alvo do Exorcista.')) return;
  const actor = findPlayer(step.actorId);
  const target = findPlayer(targetId);
  state.game.night.exorcisedId = targetId;
  state.game.status.exorcisedId = targetId;
  if (!isDrunkLike(actor) && isPlayerEvil(target)) {
    state.game.night.blockedActorIds = [...new Set([...(state.game.night.blockedActorIds || []), targetId])];
  }
  markResult(step.id, `${escapeHTML(playerName(target))} foi escolhido.`);
}

function actionDoctor(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha o paciente do Médico.')) return;
  const actor = findPlayer(step.actorId);
  state.game.status.soberProtectedId = targetId;
  if (!isDrunkLike(actor)) state.game.night.soberProtectedId = targetId;
  markResult(step.id, `${escapeHTML(playerName(findPlayer(targetId)))} ficou protegido contra veneno/bebedeira nesta rodada.`);
}

function actionPoisoner(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId)) return;
  const actor = findPlayer(step.actorId);
  const target = findPlayer(targetId);
  if (isDrunkLike(actor) || isBlockedActor(actor.id) || isSoberProtected(targetId)) {
    markResult(step.id, `${escapeHTML(playerName(target))} foi escolhido, mas ninguém ficou envenenado.`);
    return;
  }
  state.game.night.poisonedId = targetId;
  state.game.status.poisonedId = targetId;
  state.game.status.poisonedNight = state.game.night.number;
  markResult(step.id, `${escapeHTML(playerName(target))} foi envenenado.`);
}

function actionSpy(step) {
  const rows = allPlayers()
    .map((player) => `${player.seat}. ${escapeHTML(playerName(player))}: ${escapeHTML(trueRole(player).name)}${player.fakeRoleId ? `, viu ${escapeHTML(visibleRole(player).name)}` : ''}${player.abilityRoleId ? `, roubou ${escapeHTML(roleById(player.abilityRoleId)?.name || '')}` : ''}${player.alive ? '' : ' — morto'}`)
    .join('<br>');
  markResult(step.id, `<strong>Grimório completo:</strong><br>${rows}`);
}

function actionWasherwoman(step) {
  const actor = findPlayer(step.actorId);
  const candidates = livingPlayers().filter((player) => trueRole(player)?.type === 'townsfolk' && player.id !== actor.id);
  let real = sample(candidates);
  let shownRole = real ? trueRole(real) : sample(ROLES.filter((role) => role.type === 'townsfolk'));
  let pair = real ? [real, sample(livingPlayers().filter((player) => player.id !== real.id && player.id !== actor.id))] : sampleMany(livingPlayers().filter((player) => player.id !== actor.id), 2);
  if (isDrunkLike(actor)) {
    shownRole = sample(ROLES.filter((role) => role.type === 'townsfolk'));
    pair = sampleMany(livingPlayers().filter((player) => player.id !== actor.id), 2);
  }
  pair = shuffle(pair.filter(Boolean));
  markResult(step.id, `<strong>${pair.map(playerName).join(' ou ')}</strong><br><strong>${shownRole.name}</strong>`);
}

function actionLibrarian(step) {
  const actor = findPlayer(step.actorId);
  const outsiders = livingPlayers().filter((player) => trueRole(player)?.type === 'outsider' && player.id !== actor.id);
  if (!outsiders.length && !isDrunkLike(actor)) return markResult(step.id, '<strong>Não há Outsiders em jogo.</strong>');
  let real = sample(outsiders);
  let shownRole = real ? trueRole(real) : sample(ROLES.filter((role) => role.type === 'outsider'));
  let pair = real ? [real, sample(livingPlayers().filter((player) => player.id !== real.id && player.id !== actor.id))] : sampleMany(livingPlayers().filter((player) => player.id !== actor.id), 2);
  if (isDrunkLike(actor)) {
    shownRole = sample(ROLES.filter((role) => role.type === 'outsider'));
    pair = sampleMany(livingPlayers().filter((player) => player.id !== actor.id), 2);
  }
  pair = shuffle(pair.filter(Boolean));
  markResult(step.id, `<strong>${pair.map(playerName).join(' ou ')}</strong><br><strong>${shownRole.name}</strong>`);
}

function actionInvestigator(step) {
  const actor = findPlayer(step.actorId);
  const minions = livingPlayers().filter((player) => trueRole(player)?.type === 'minion' && player.id !== actor.id);
  let real = sample(minions);
  let shownRole = real ? trueRole(real) : sample(ROLES.filter((role) => role.type === 'minion'));
  let pair = real ? [real, sample(livingPlayers().filter((player) => player.id !== real.id && player.id !== actor.id))] : sampleMany(livingPlayers().filter((player) => player.id !== actor.id), 2);
  if (isDrunkLike(actor)) {
    shownRole = sample(ROLES.filter((role) => role.type === 'minion'));
    pair = sampleMany(livingPlayers().filter((player) => player.id !== actor.id), 2);
  }
  pair = shuffle(pair.filter(Boolean));
  markResult(step.id, `<strong>${pair.map(playerName).join(' ou ')}</strong><br><strong>${shownRole.name}</strong>`);
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
  if (isDrunkLike(actor)) count = Math.floor(Math.random() * 3);
  markResult(step.id, `<strong>${count}</strong>`);
}

function registersEvil(player) {
  if (isPlayerEvil(player)) return true;
  if (player.currentRoleId === 'recluse' && !isDrunkLike(player)) return Math.random() < 0.5;
  return false;
}

function registersDemon(player) {
  if (trueRole(player)?.type === 'demon') return true;
  if (player.id === state.game.redHerringId) return true;
  if (player.currentRoleId === 'recluse' && !isDrunkLike(player)) return Math.random() < 0.5;
  return false;
}

function actionEmpath(step) {
  const actor = findPlayer(step.actorId);
  const neighbors = closestAliveNeighbors(actor.id);
  let count = neighbors.filter(registersEvil).length;
  if (isDrunkLike(actor)) count = Math.floor(Math.random() * 3);
  markResult(step.id, `<strong>${count}</strong><br>${neighbors.map(playerName).join(' e ') || 'sem vizinhos vivos'}`);
}

function closestAliveNeighbors(playerId) {
  const players = allPlayers();
  const index = players.findIndex((p) => p.id === playerId);
  if (index < 0 || players.length < 2) return [];
  const neighbors = [];
  for (let offset = 1; offset < players.length && neighbors.length < 1; offset += 1) {
    const left = players[(index - offset + players.length) % players.length];
    if (left.alive) neighbors.push(left);
  }
  for (let offset = 1; offset < players.length && neighbors.length < 2; offset += 1) {
    const right = players[(index + offset) % players.length];
    if (right.alive && right.id !== neighbors[0]?.id) neighbors.push(right);
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
  if (isDrunkLike(actor)) yes = Math.random() < 0.5;
  markResult(step.id, `<strong>${yes ? 'SIM' : 'NÃO'}</strong><br>${picked.map(playerName).join(' e ')}`);
}

function actionButler(step) {
  const masterId = getField('target');
  if (!assertChoice(masterId, 'Escolha o mestre do Mordomo.')) return;
  const actor = findPlayer(step.actorId);
  actor.masterId = masterId;
  state.game.status.butlerId = actor.id;
  state.game.status.butlerMasterId = masterId;
  markResult(step.id, `<strong>${escapeHTML(playerName(findPlayer(masterId)))}</strong>`);
}

function actionMonk(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha quem o Monge vai proteger.')) return;
  const actor = findPlayer(step.actorId);
  if (!isDrunkLike(actor)) state.game.night.protectedId = targetId;
  state.game.status.protectedId = targetId;
  markResult(step.id, `${escapeHTML(playerName(findPlayer(targetId)))} foi escolhido.`);
}

function actionImp(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha a vítima do Imp.')) return;
  const target = findPlayer(targetId);
  const demon = findPlayer(step.actorId);
  let killed = target;
  let note = '';

  if (isDrunkLike(demon) || isBlockedActor(demon.id)) return markResult(step.id, 'O ataque não gerou morte.');

  if (target.id === demon.id) {
    state.game.night.deadTonightIds = [...new Set([...state.game.night.deadTonightIds, demon.id])];
    const newDemon = passDemonAfterSelfKill(demon);
    note = newDemon ? `${playerName(demon)} morreu. ${playerName(newDemon)} virou Imp.` : `${playerName(demon)} morreu. Não havia minion vivo para receber o demônio.`;
    markResult(step.id, note);
    return;
  }

  if (target.currentRoleId === 'soldier' && !isDrunkLike(target)) {
    killed = null;
    note = `${playerName(target)} sobreviveu.`;
  } else if (state.game.night.protectedId === target.id) {
    killed = null;
    note = `${playerName(target)} estava protegido.`;
  } else if (isProtectedByProtector(target.id)) {
    killed = null;
    note = `${playerName(target)} estava protegido pelo Protetor.`;
  } else if (target.currentRoleId === 'mayor' && !isDrunkLike(target)) {
    const redirectOptions = livingPlayers().filter((player) => player.id !== target.id && player.id !== demon.id);
    if (redirectOptions.length && Math.random() < 0.5) {
      killed = sample(redirectOptions);
      note = `Morte redirecionada para ${playerName(killed)}.`;
    }
  }

  if (killed) {
    state.game.night.deadTonightIds = [...new Set([...state.game.night.deadTonightIds, killed.id])];
    if (killed.currentRoleId === 'ravenkeeper') state.game.night.pendingRavenkeeperId = killed.id;
    note = note || `${playerName(killed)} morrerá ao amanhecer.`;
  }
  markResult(step.id, note);
}

function isProtectedByProtector(targetId) {
  return livingPlayers().some((protector) => {
    if (protector.currentRoleId !== 'protector' || isDrunkLike(protector)) return false;
    return closestAliveNeighbors(protector.id).some((neighbor) => neighbor.id === targetId);
  });
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
  markResult(step.id, `<strong>${escapeHTML(playerName(target))}</strong><br><strong>${escapeHTML(role.name)}</strong>`);
}

function actionUndertaker(step) {
  const actor = findPlayer(step.actorId);
  const executed = findPlayer(state.game.day?.lastExecutedId);
  if (!executed) return markResult(step.id, 'Ninguém foi executado no dia anterior.');
  let role = trueRole(executed);
  if (isDrunkLike(actor)) role = sample(ROLES);
  markResult(step.id, `<strong>${escapeHTML(playerName(executed))}</strong><br><strong>${escapeHTML(role.name)}</strong>`);
}

function actionCannibal(step) {
  const targetId = getField('target');
  const actor = findPlayer(step.actorId);
  if (!targetId) return markResult(step.id, 'Nenhum morto foi escolhido.');
  const target = findPlayer(targetId);
  if (!target) return;
  if (isDrunkLike(actor)) {
    actor.abilityRoleId = sample(ROLES.filter((role) => role.type === 'townsfolk')).id;
    actor.cannibalSourceId = targetId;
    return markResult(step.id, `${escapeHTML(playerName(target))} foi escolhido.`);
  }
  if (isPlayerEvil(target)) {
    state.game.night.deadTonightIds = [...new Set([...state.game.night.deadTonightIds, actor.id])];
    return markResult(step.id, `${escapeHTML(playerName(actor))} morrerá ao amanhecer.`);
  }
  actor.abilityRoleId = target.currentRoleId;
  actor.cannibalSourceId = targetId;
  markResult(step.id, `${escapeHTML(playerName(actor))} roubou o poder de ${escapeHTML(playerName(target))}.`);
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
  resolveDemonBackup('checagem de fim de jogo');
  const aliveDemons = livingPlayers().filter((player) => trueRole(player)?.type === 'demon');
  if (aliveDemons.length === 0) {
    endGame('Bem venceu', 'O demônio morreu.');
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
  state.game.day.lastExecutedId = executedId || null;

  allPlayers().forEach((player) => {
    const aliveInput = document.querySelector(`[data-alive-id="${player.id}"]`);
    if (aliveInput) player.alive = aliveInput.checked;
  });

  if (executedId) {
    const executed = findPlayer(executedId);
    if (executed) {
      executed.alive = false;
      if (executed.currentRoleId === 'saint' && !isDrunkLike(executed)) {
        warnings.push('O Santo foi executado: o mal vence.');
        state.game.day.warnings = warnings;
        endGame('Mal venceu', 'O Santo foi executado.');
        return;
      }
    }
  }
  state.game.day.warnings = warnings;
  resolveDemonBackup('morte/execução durante o dia');
  if (checkGameEnd()) return;
  saveState();
}

function startNextNightFromDay() {
  updateDayFromForm();
  if (state.game.ended) return;
  state.game.nightNumber += 1;
  startNight(state.game.nightNumber);
}

function hostGuideUrl() {
  const ids = (state.game?.roleGuideIds?.length ? state.game.roleGuideIds : state.setup.selectedRoleIds).filter(roleById);
  const base = `${location.origin}${location.pathname}`;
  return `${base}?guia=${encodeURIComponent(ids.join(','))}`;
}

function renderSharedGuide(roleIds) {
  const roles = roleIds.map(roleById).filter(Boolean);
  const grouped = TYPE_ORDER.map((type) => ({ type, roles: roles.filter((role) => role.type === type) })).filter((group) => group.roles.length);
  return `
    <main class="app-shell">
      <section class="hero">
        <div class="hero-badge">Guia da partida</div>
        <h1>Roles possíveis</h1>
        <p>Este guia mostra só as roles da seleção/subseleção desta partida.</p>
      </section>
      ${grouped.map((group) => `
        <section class="section-title"><h3>${TYPE_EMOJI[group.type]} ${TYPE_LABEL[group.type]}</h3><span>${group.roles.length}</span></section>
        <section class="grid">${group.roles.map((role) => roleCard(role)).join('')}</section>
      `).join('')}
    </main>
  `;
}

function renderHome() {
  return `
    <main class="app-shell">
      <section class="hero">
        <div class="hero-badge">☾ Local · Celular único</div>
        <h1>Clocktower Local</h1>
        <p>Escolha roles, entregue os cartuchos um por um e siga as etapas da noite no celular.</p>
      </section>
      <section class="home-actions">
        <button class="primary-btn" data-action="go-script">Partida Local</button>
        <button class="secondary-btn" data-action="go-guide">Guia</button>
      </section>
      <section class="section-title"><h3>Save local</h3></section>
      <article class="card">
        <p>O jogo salva sozinho no navegador. Apague apenas quando quiser recomeçar tudo.</p>
        <div class="grid" style="margin-top: 12px;"><button class="danger-btn" data-action="reset-all">Apagar save local</button></div>
      </article>
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
      <section class="filter-row">
        <input placeholder="Buscar role..." value="${escapeHTML(state.guide.search)}" data-action="guide-search" />
        <select data-action="guide-script">
          <option value="all" ${state.guide.scriptId === 'all' ? 'selected' : ''}>Todas</option>
          ${SCRIPTS.map((script) => `<option value="${script.id}" ${state.guide.scriptId === script.id ? 'selected' : ''}>${escapeHTML(script.name)}</option>`).join('')}
        </select>
        <select data-action="guide-type">
          <option value="all" ${state.guide.type === 'all' ? 'selected' : ''}>Tipos</option>
          ${TYPE_ORDER.map((type) => `<option value="${type}" ${state.guide.type === type ? 'selected' : ''}>${TYPE_EMOJI[type]} ${TYPE_LABEL[type]}</option>`).join('')}
        </select>
      </section>
      <section class="grid">${roles.map((role) => roleCard(role)).join('')}</section>
    </main>
  `;
}

function renderScriptSelect() {
  return `
    <main class="app-shell">
      ${topbar('Partida Local', 'Primeiro escolha a seleção')}
      <section class="grid">
        ${SCRIPTS.map((script) => {
          const count = rolesForScript(script.id).length;
          const active = state.setup.scriptId === script.id;
          return `
            <article class="card ${active ? 'selected' : ''}" data-action="select-script" data-script-id="${script.id}">
              <p class="kicker">${escapeHTML(script.subtitle)}</p>
              <div class="role-title">
                <div><h3>${escapeHTML(script.name)}</h3><p>${escapeHTML(script.description)}</p></div>
                <span class="pill">${count} roles</span>
              </div>
            </article>
          `;
        }).join('')}
      </section>
      <section class="sticky-actions"><button class="primary-btn" data-action="go-setup">Continuar</button></section>
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
        <div class="form-row">
          <label>Número de jogadores</label>
          <select data-action="player-count">
            ${Array.from({ length: 11 }, (_, i) => i + 5).map((n) => `<option value="${n}" ${Number(state.setup.playerCount) === n ? 'selected' : ''}>${n} jogadores</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label>Modo da noite</label>
          <div class="grid two">
            <button class="choice-btn ${state.setup.mode === 'automatic' ? 'active' : ''}" data-action="set-mode" data-mode="automatic">Automático</button>
            <button class="choice-btn ${state.setup.mode === 'manual' ? 'active' : ''}" data-action="set-mode" data-mode="manual">Manual</button>
          </div>
        </div>
        <div class="grid two">
          <button class="secondary-btn" data-action="auto-fill">Preencher automático</button>
          <button class="ghost-btn" data-action="clear-selection">Limpar roles</button>
        </div>
      </section>
      <section class="section-title"><h3>Exigido</h3><span>${state.setup.selectedRoleIds.length}/${state.setup.playerCount}</span></section>
      <section class="count-grid">
        ${TYPE_ORDER.map((type) => `<div class="count-box ${type}"><strong>${validation.counts[type]}/${validation.target[type]}</strong><span>${TYPE_EMOJI[type]} ${TYPE_LABEL[type]}</span></div>`).join('')}
      </section>
      ${validation.errors.length ? `<article class="card warning" style="margin-top: 10px;">${validation.errors.map(escapeHTML).join('<br>')}</article>` : `<article class="card success" style="margin-top: 10px;">Subseleção válida.</article>`}
      <section class="metrics compact-metrics">
        <div class="metric"><div class="metric-head"><strong>🌙</strong><span>${metric.duration} etapas · N1 ${metric.firstNightSteps} / prox ${metric.otherNightSteps}</span></div><div class="bar"><div class="bar-fill" style="--value:${metric.durationPct}%"></div></div></div>
        <div class="metric"><div class="metric-head"><strong>⚔️</strong><span>${metric.difficulty}/10 · ${metric.difficultyLabel}</span></div><div class="bar"><div class="bar-fill" style="--value:${metric.difficultyPct}%"></div></div></div>
      </section>
      ${grouped.map((group) => `
        <section class="section-title"><h3>${TYPE_EMOJI[group.type]} ${TYPE_LABEL[group.type]}</h3><span>${validation.counts[group.type]}/${validation.target[group.type]}</span></section>
        <section class="role-selection-grid">${group.roles.map((role) => roleCard(role, { checkbox: true, checked: state.setup.selectedRoleIds.includes(role.id) })).join('')}</section>
      `).join('')}
      <section class="sticky-actions"><button class="primary-btn" data-action="start-game" ${validation.valid ? '' : 'disabled'}>Começar jogo</button></section>
    </main>
  `;
}

function renderReveal() {
  const game = state.game;
  const player = game.players[game.revealIndex];
  const role = visibleRole(player);
  const revealText = state.revealOpen
    ? `<button class="reveal-card ${role.type}" data-action="toggle-reveal"><p class="kicker">Sua role</p><h2>${escapeHTML(role.name)}</h2><p>${escapeHTML(role.summary)}</p>${rolePill(role)}</button>`
    : `<button class="big-question" data-action="toggle-reveal">?</button>`;
  return `
    <main class="app-shell">
      ${topbar('Entrega de roles', `Jogador ${game.revealIndex + 1} de ${game.players.length}`)}
      <section class="card warning">A pessoa toca no <strong>?</strong>, vê a role, toca de novo para esconder, digita o nome e devolve para o host.</section>
      <section style="margin-top: 14px;">${revealText}</section>
      <section class="card" style="margin-top: 14px;">
        <div class="form-row"><label>Nome do jogador</label><input data-player-name value="${escapeHTML(player.name)}" placeholder="Ex: Ana" autocomplete="off" /></div>
        <button class="primary-btn" data-action="next-reveal">${game.revealIndex === game.players.length - 1 ? 'Finalizar entrega' : 'Salvar e próximo'}</button>
      </section>
    </main>
  `;
}

function renderHostStatusCard() {
  const status = state.game?.status || {};
  const poisoned = findPlayer(status.poisonedId);
  const sober = findPlayer(status.soberProtectedId);
  const exorcised = findPlayer(status.exorcisedId);
  const butler = findPlayer(status.butlerId);
  const master = findPlayer(status.butlerMasterId);
  const protectedPlayer = findPlayer(status.protectedId);
  const nightDeaths = (status.lastNightDeaths || []).map((id) => playerName(findPlayer(id))).filter(Boolean);
  return `
    <section class="card host-status" style="margin-top: 12px;">
      <p class="kicker">Painel do host</p>
      <p><strong>Envenenado:</strong> ${poisoned ? escapeHTML(playerName(poisoned)) : 'ninguém'}</p>
      <p><strong>Médico:</strong> ${sober ? escapeHTML(playerName(sober)) : 'ninguém'}</p>
      <p><strong>Exorcista:</strong> ${exorcised ? escapeHTML(playerName(exorcised)) : 'ninguém'}</p>
      <p><strong>Mordomo:</strong> ${butler && master ? `${escapeHTML(playerName(butler))} serve ${escapeHTML(playerName(master))}` : 'sem mestre definido'}</p>
      <p><strong>Protegido:</strong> ${protectedPlayer ? escapeHTML(playerName(protectedPlayer)) : 'ninguém'}</p>
      <p><strong>Mortes da última noite:</strong> ${nightDeaths.length ? escapeHTML(nightDeaths.join(', ')) : 'nenhuma'}</p>
    </section>
  `;
}

function renderGrimoire() {
  const game = state.game;
  const guideUrl = hostGuideUrl();
  return `
    <main class="app-shell">
      ${topbar('Host', 'Grimório e guia da partida')}
      <section class="card">
        <p class="kicker">Link do guia</p>
        <p>Envie este link para jogadores verem só as roles que podem estar nesta partida.</p>
        <input readonly value="${escapeHTML(guideUrl)}" />
        <button class="secondary-btn" style="margin-top: 10px;" data-action="copy-guide-link">Copiar link do guia</button>
      </section>
      <section class="section-title"><h3>Grimório</h3></section>
      <section class="grid">
        ${game.players.map((player) => `
          <article class="card player-card ${player.alive ? '' : 'dead'}">
            <div><strong>${player.seat}. ${escapeHTML(playerName(player))}</strong><span>Real: ${escapeHTML(trueRole(player).name)}${player.fakeRoleId ? ` · viu: ${escapeHTML(visibleRole(player).name)}` : ''}${player.abilityRoleId ? ` · roubou: ${escapeHTML(roleById(player.abilityRoleId)?.name || '')}` : ''}</span><span>${player.alive ? 'Vivo' : 'Morto'}</span></div>
            ${rolePill(trueRole(player))}
          </article>
        `).join('')}
      </section>
      <section class="card" style="margin-top: 12px;"><p><strong>Modo:</strong> ${game.mode === 'automatic' ? 'Automático' : 'Manual'}</p><p><strong>Red herring:</strong> ${findPlayer(game.redHerringId) ? escapeHTML(playerName(findPlayer(game.redHerringId))) : 'nenhum'}</p><p><strong>Bluffs:</strong> ${game.bluffs.map(roleById).filter(Boolean).map((role) => role.name).join(', ') || 'nenhum'}</p></section>
      ${renderHostStatusCard()}
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
      <section class="step-card" style="margin-top: 14px;">
        <p class="kicker">${game.mode === 'automatic' ? 'Automático' : 'Manual'}</p>
        <h2>${escapeHTML(step?.title || 'Sem etapa')}</h2>
        ${result ? '<p class="hint">Ação confirmada. Esta etapa está travada para não trocar alvo.</p>' : renderStepBody(step)}
        ${result ? `<div class="result-box">${result.html}</div>` : ''}
      </section>
      <section class="sticky-actions"><div class="grid two"><button class="ghost-btn" data-action="prev-step" ${night.currentStep === 0 ? 'disabled' : ''}>Voltar</button><button class="primary-btn" data-action="next-step">${night.currentStep === total - 1 ? 'Encerrar noite' : 'Próxima etapa'}</button></div></section>
    </main>
  `;
}

function renderStepBody(step) {
  if (!step) return '<p>Nenhuma ação nesta noite.</p>';
  if (isStepSkippedByDeath(step)) return '<p>Esta pessoa está morta ou morrerá ao amanhecer. Etapa pulada.</p>';
  if (state.game.mode === 'manual') return renderManualStep(step);
  return renderAutomaticStep(step);
}

function renderManualStep(step) {
  const actor = findPlayer(step.actorId);
  if (step.id === 'minion-info') return '<div class="action-box"><strong>Informação dos minions</strong></div>';
  if (step.id === 'demon-info') return '<div class="action-box"><strong>Informação do demônio</strong></div>';
  if (step.action === 'ravenkeeper') return '<div class="action-box"><strong>Guardião dos Corvos condicional</strong></div>';
  return `<p class="actor-line"><strong>${escapeHTML(actor ? playerName(actor) : step.title)}</strong></p><div class="action-box"><strong>Manual:</strong><span>O site só indica a etapa. O host resolve tudo fora do automático.</span></div>`;
}

function renderAutomaticStep(step) {
  const actor = findPlayer(step.actorId);
  const role = step.roleId ? roleById(step.roleId) : null;
  if (step.id === 'minion-info') return autoButton('minion-info', 'Mostrar');
  if (step.id === 'demon-info') return autoButton('demon-info', 'Mostrar');
  const actorLine = actor ? `<p class="actor-line"><strong>${escapeHTML(playerName(actor))}</strong>${role ? ` · ${escapeHTML(role.name)}` : ''}</p>` : '';
  if (step.action === 'exorcist') return `${actorLine}<div class="action-box"><label>Alvo</label>${playerSelect('target', { livingOnly: true, exclude: [actor.id] })}${autoButton('exorcist', 'Confirmar')}</div>`;
  if (step.action === 'doctor') return `${actorLine}<div class="action-box"><label>Paciente</label>${playerSelect('target', { livingOnly: true })}${autoButton('doctor', 'Confirmar')}</div>`;
  if (step.action === 'poisoner') return `${actorLine}<div class="action-box"><label>Alvo</label>${playerSelect('target', { livingOnly: true })}${autoButton('poisoner', 'Confirmar')}</div>`;
  if (step.action === 'spy') return `${actorLine}${autoButton('spy', 'Mostrar')}`;
  if (['washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'undertaker'].includes(step.action)) return `${actorLine}${autoButton(step.action, 'Mostrar')}`;
  if (step.action === 'fortune_teller') return `${actorLine}<div class="action-box"><label>Primeiro alvo</label>${playerSelect('targetA')}<label>Segundo alvo</label>${playerSelect('targetB')}${autoButton('fortune_teller', 'Mostrar')}</div>`;
  if (step.action === 'butler') return `${actorLine}<div class="action-box"><label>Mestre</label>${playerSelect('target', { livingOnly: true, exclude: [actor.id] })}${autoButton('butler', 'Confirmar')}</div>`;
  if (step.action === 'monk') return `${actorLine}<div class="action-box"><label>Proteção</label>${playerSelect('target', { livingOnly: true, exclude: [actor.id] })}${autoButton('monk', 'Confirmar')}</div>`;
  if (step.action === 'imp') return `${actorLine}<div class="action-box"><label>Alvo</label>${playerSelect('target', { livingOnly: true })}${autoButton('imp', 'Confirmar')}</div>`;
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
  return `${actorLine}${autoButton(step.action, 'Marcar')}`;
}

function autoButton(action, label) {
  return `<button class="secondary-btn" data-action="auto-action" data-auto-action="${escapeHTML(action)}">${escapeHTML(label)}</button>`;
}

function renderDay() {
  const game = state.game;
  const day = game.day;
  return `
    <main class="app-shell">
      ${topbar(`Dia ${day.number}`, 'Host registra execução e mortes')}
      <section class="card"><p>Dia é controlado pelo host. Escolha quem foi executado e vá direto para a próxima noite.</p></section>
      ${renderHostStatusCard()}
      <section class="section-title"><h3>Vivos/mortos</h3></section>
      <section class="grid">
        ${allPlayers().map((player) => `<article class="card player-card ${player.alive ? '' : 'dead'}"><div><strong>${player.seat}. ${escapeHTML(playerName(player))}</strong><span>${escapeHTML(trueRole(player).name)}${player.fakeRoleId ? ` · viu ${escapeHTML(visibleRole(player).name)}` : ''}</span></div><label class="pill"><input type="checkbox" data-alive-id="${player.id}" ${player.alive ? 'checked' : ''} /> Vivo</label></article>`).join('')}
      </section>
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
      <section class="section-title"><h3>Grimório final</h3></section>
      <section class="grid">
        ${game.players.map((player) => `<article class="card player-card ${player.alive ? '' : 'dead'}"><div><strong>${player.seat}. ${escapeHTML(playerName(player))}</strong><span>${escapeHTML(trueRole(player).name)}${player.fakeRoleId ? ` · viu ${escapeHTML(visibleRole(player).name)}` : ''}</span><span>${player.alive ? 'Vivo' : 'Morto'}</span></div>${rolePill(trueRole(player))}</article>`).join('')}
      </section>
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
  if (state.view === 'setup') return go('script', { push: false });
  if (state.view === 'script') return go('home', { push: false });
  if (state.view === 'guide') return go('home', { push: false });
  if (state.view === 'end') return go('grimoire', { push: false });
  return render();
}

function render() {
  if (sharedGuideIds.length) {
    app.innerHTML = renderSharedGuide(sharedGuideIds);
    return;
  }
  const view = state.view;
  if (view === 'home') app.innerHTML = renderHome();
  if (view === 'guide') app.innerHTML = renderGuide();
  if (view === 'script') app.innerHTML = renderScriptSelect();
  if (view === 'setup') app.innerHTML = renderSetup();
  if (view === 'reveal') app.innerHTML = state.game ? renderReveal() : renderHome();
  if (view === 'grimoire') app.innerHTML = state.game ? renderGrimoire() : renderHome();
  if (view === 'night') app.innerHTML = state.game?.night ? renderNight() : renderGrimoire();
  if (view === 'day') app.innerHTML = state.game ? renderDay() : renderHome();
  if (view === 'end') app.innerHTML = state.game ? renderEnd() : renderHome();
  if (view !== lastRenderedView) window.scrollTo({ top: 0, behavior: 'instant' });
  lastRenderedView = view;
}

app.addEventListener('input', (event) => {
  const action = event.target?.dataset?.action;
  if (action === 'guide-search') {
    state.guide.search = event.target.value;
    saveAndRender({ push: false });
  }
});

app.addEventListener('change', (event) => {
  const action = event.target?.dataset?.action;
  if (action === 'guide-type') {
    state.guide.type = event.target.value;
    saveAndRender({ push: false });
  }
  if (action === 'guide-script') {
    state.guide.scriptId = event.target.value;
    saveAndRender({ push: false });
  }
  if (action === 'player-count') {
    state.setup.playerCount = Number(event.target.value);
    state.setup.selectedRoleIds = [];
    saveAndRender({ push: false });
  }
  if (action === 'toggle-role') {
    const roleId = event.target.dataset.roleId;
    if (event.target.checked) state.setup.selectedRoleIds = [...new Set([...state.setup.selectedRoleIds, roleId])];
    else state.setup.selectedRoleIds = state.setup.selectedRoleIds.filter((id) => id !== roleId);
    saveAndRender({ push: false });
  }
});

app.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'smart-back') return smartBack();
  if (action === 'go-home') return go('home');
  if (action === 'go-guide') return go('guide');
  if (action === 'go-script') return go('script');
  if (action === 'go-setup') return go('setup');
  if (action === 'select-script') {
    state.setup.scriptId = button.dataset.scriptId;
    state.setup.selectedRoleIds = [];
    saveAndRender({ push: false });
    return;
  }
  if (action === 'reset-all') {
    if (confirm('Apagar todo o save local?')) resetAll();
    return;
  }
  if (action === 'set-mode') {
    state.setup.mode = button.dataset.mode;
    saveAndRender({ push: false });
    return;
  }
  if (action === 'auto-fill') return autoFillRoles();
  if (action === 'clear-selection') {
    state.setup.selectedRoleIds = [];
    saveAndRender({ push: false });
    return;
  }
  if (action === 'start-game') return startGame();
  if (action === 'toggle-reveal') {
    state.revealOpen = !state.revealOpen;
    saveAndRender({ push: false });
    return;
  }
  if (action === 'next-reveal') return nextReveal();
  if (action === 'start-night') return startNight(1);
  if (action === 'prev-step') return prevStep();
  if (action === 'next-step') return nextStep();
  if (action === 'auto-action') return executeAutomaticAction(button.dataset.autoAction);
  if (action === 'next-night') return startNextNightFromDay();
  if (action === 'copy-grimoire') {
    navigator.clipboard?.writeText(JSON.stringify(state.game, null, 2));
    alert('Grimório copiado em JSON.');
  }
  if (action === 'copy-guide-link') {
    navigator.clipboard?.writeText(hostGuideUrl());
    alert('Link do guia copiado.');
  }
});

window.addEventListener('popstate', () => {
  smartBack();
  if (!sharedGuideIds.length) history.pushState({ clocktower: true, view: state.view }, '', location.pathname);
});

if (!sharedGuideIds.length) {
  history.replaceState({ clocktower: true, view: state.view }, '', location.pathname);
  historyReady = true;
}
render();

import {
  ROLES,
  SCRIPTS,
  TYPE_LABEL,
  TYPE_ORDER,
  roleById,
  rolesForScript,
  getDistribution,
  isEvilRole
} from './roles.js';

const STORAGE_KEY = 'clocktower-classico-v3';
const app = document.querySelector('#app');

const initialState = {
  view: 'home',
  previousView: 'home',
  guide: { search: '', type: 'all' },
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

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === 'object') return { ...initialState, ...saved };
  } catch {}
  return structuredClone(initialState);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setState(patch) {
  state = { ...state, ...patch };
  saveState();
  render();
}

function go(view) {
  setState({ previousView: state.view, view, revealOpen: false });
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
  if (!list.length) return null;
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

function playerName(player) {
  return player?.name?.trim() || `Jogador ${player?.seat || '?'}`;
}

function displayRoleId(player) {
  return player?.fakeRoleId || player?.currentRoleId || player?.trueRoleId;
}

function trueRole(player) {
  return roleById(player?.currentRoleId || player?.trueRoleId);
}

function displayRole(player) {
  return roleById(displayRoleId(player));
}

function isPlayerEvil(player) {
  const role = trueRole(player);
  return role?.type === 'minion' || role?.type === 'demon';
}

function isPoisoned(playerId) {
  return state.game?.night?.poisonedId === playerId;
}

function isDrunkLike(player) {
  return player?.trueRoleId === 'drunk' || isPoisoned(player?.id);
}

function rolePill(role) {
  if (!role) return '';
  return `<span class="type-pill ${role.type}">${TYPE_LABEL[role.type]}</span>`;
}

function tagsHTML(tags = []) {
  return `<div class="tags">${tags.map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}</div>`;
}

function roleCard(role, options = {}) {
  const checked = options.checked ? 'checked' : '';
  const disabled = options.disabled ? 'disabled' : '';
  const selectedClass = options.checked ? ' selected' : '';
  const input = options.checkbox
    ? `<input type="checkbox" data-action="toggle-role" data-role-id="${role.id}" ${checked} ${disabled} />`
    : '';
  return `
    <article class="card${selectedClass}${options.disabled ? ' disabled' : ''}">
      <div class="${options.checkbox ? 'role-check' : ''}">
        ${input}
        <div>
          <div class="role-title">
            <div>
              <h3>${escapeHTML(role.name)}</h3>
              <p>${escapeHTML(role.summary)}</p>
            </div>
            ${rolePill(role)}
          </div>
          <p class="hint">Noite: ${role.duration} etapa${role.duration === 1 ? '' : 's'} · Dificuldade para o bem: ${role.difficulty > 0 ? '+' : ''}${role.difficulty}</p>
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

function setupTarget() {
  const hasBaron = state.setup.selectedRoleIds.includes('baron');
  return getDistribution(Number(state.setup.playerCount), hasBaron);
}

function setupValidation() {
  const counts = selectedCounts();
  const target = setupTarget();
  const selected = state.setup.selectedRoleIds.length;
  const expected = Number(state.setup.playerCount);
  const errors = [];

  if (selected !== expected) errors.push(`Selecione exatamente ${expected} roles. Agora tem ${selected}.`);
  TYPE_ORDER.forEach((type) => {
    if (counts[type] !== target[type]) {
      errors.push(`${TYPE_LABEL[type]}: precisa ${target[type]}, agora tem ${counts[type]}.`);
    }
  });
  return { counts, target, errors, valid: errors.length === 0 };
}

function metricInfo() {
  const roles = selectedRoles();
  const duration = roles.reduce((sum, role) => sum + Number(role.duration || 0), 0);
  const rawDifficulty = roles.reduce((sum, role) => sum + Number(role.difficulty || 0), 0);
  const difficulty = clamp(5 + rawDifficulty, 0, 10);
  const durationPct = clamp((duration / 22) * 100, 4, 100);
  const difficultyPct = clamp(difficulty * 10, 4, 100);
  let difficultyLabel = 'Padrão';
  if (difficulty <= 3) difficultyLabel = 'Mais fácil para o bem';
  if (difficulty >= 7) difficultyLabel = 'Mais difícil para o bem';
  let durationLabel = 'Noite média';
  if (duration <= 6) durationLabel = 'Noite rápida';
  if (duration >= 13) durationLabel = 'Noite longa';
  return { duration, difficulty, rawDifficulty, durationPct, difficultyPct, durationLabel, difficultyLabel };
}

function autoFillRoles() {
  const playerCount = Number(state.setup.playerCount);
  const all = rolesForScript(state.setup.scriptId);
  const minions = rolesByTypeLocal(all, 'minion');
  const includeBaron = state.setup.selectedRoleIds.includes('baron') || Math.random() < 0.28;
  const pickedMinions = [];
  if (includeBaron && getDistribution(playerCount, true).minion > 0) pickedMinions.push(roleById('baron'));
  const target = getDistribution(playerCount, includeBaron);
  const remainingMinions = minions.filter((role) => !pickedMinions.includes(role));
  pickedMinions.push(...sampleMany(remainingMinions, target.minion - pickedMinions.length));

  const picked = [
    ...sampleMany(rolesByTypeLocal(all, 'townsfolk'), target.townsfolk),
    ...sampleMany(rolesByTypeLocal(all, 'outsider'), target.outsider),
    ...pickedMinions,
    roleById('imp')
  ].filter(Boolean);

  state.setup.selectedRoleIds = picked.map((role) => role.id);
  saveState();
  render();
}

function rolesByTypeLocal(list, type) {
  return list.filter((role) => role.type === type);
}

function resetAll() {
  state = structuredClone(initialState);
  saveState();
  render();
}

function startGame() {
  const validation = setupValidation();
  if (!validation.valid) {
    alert('A subseleção ainda não está válida. Ajuste as quantidades antes de começar.');
    return;
  }

  const selectedIds = shuffle(state.setup.selectedRoleIds);
  const unselectedTownsfolk = ROLES
    .filter((role) => role.type === 'townsfolk' && !selectedIds.includes(role.id))
    .map((role) => role.id);

  const players = selectedIds.map((roleId, index) => {
    const role = roleById(roleId);
    let fakeRoleId = null;
    if (roleId === 'drunk') {
      fakeRoleId = sample(unselectedTownsfolk) || sample(ROLES.filter((r) => r.type === 'townsfolk').map((r) => r.id));
    }
    return {
      id: createId(),
      seat: index + 1,
      name: '',
      trueRoleId: role.id,
      currentRoleId: role.id,
      fakeRoleId,
      alive: true,
      notes: [],
      usedSlayer: false
    };
  });

  const goodPlayers = players.filter((player) => !isEvilRole(player.currentRoleId));
  const redHerring = sample(goodPlayers.filter((player) => player.trueRoleId !== 'fortune_teller'));

  state.game = {
    scriptId: state.setup.scriptId,
    mode: state.setup.mode,
    players,
    revealIndex: 0,
    redHerringId: redHerring?.id || null,
    bluffs: createDemonBluffs(selectedIds),
    nightNumber: 1,
    night: null,
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
  const possible = ROLES
    .filter((role) => role.type === 'townsfolk' && !selectedIds.includes(role.id))
    .map((role) => role.id);
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
    saveState();
    render();
  } else {
    go('grimoire');
  }
}

function startNight(number = state.game.nightNumber) {
  state.game.nightNumber = number;
  const executed = findPlayer(state.game.day?.lastExecutedId);
  const executedRavenkeeperId = executed?.currentRoleId === 'ravenkeeper' ? executed.id : null;
  state.game.night = {
    number,
    currentStep: 0,
    steps: buildNightSteps(number),
    results: {},
    poisonedId: null,
    protectedId: null,
    deadTonightIds: [],
    pendingRavenkeeperId: executedRavenkeeperId,
    startedAt: Date.now()
  };
  state.game.log.push(`Noite ${number} começou.`);
  saveState();
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
    const candidateRoleId = player.fakeRoleId || player.currentRoleId;
    const role = roleById(candidateRoleId);
    const order = nightNumber === 1 ? role?.nightOrderFirst : role?.nightOrderOther;
    if (order !== null && order !== undefined && role?.action) {
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
  const ravenkeeperMightAct = players.some((p) => p.alive && p.currentRoleId === 'ravenkeeper') || executed?.currentRoleId === 'ravenkeeper';
  if (nightNumber > 1 && ravenkeeperMightAct) {
    roleSteps.push({
      id: `ravenkeeper-conditional-${nightNumber}`,
      kind: 'conditional',
      title: 'Guardião dos Corvos',
      roleId: 'ravenkeeper',
      action: 'ravenkeeper',
      order: 50
    });
  }

  steps.push(...roleSteps.sort((a, b) => a.order - b.order));
  return steps;
}

function currentStep() {
  return state.game?.night?.steps?.[state.game.night.currentStep] || null;
}

function nextStep() {
  const night = state.game.night;
  if (night.currentStep < night.steps.length - 1) {
    night.currentStep += 1;
    saveState();
    render();
  } else {
    finishNight();
  }
}

function prevStep() {
  const night = state.game.night;
  if (night.currentStep > 0) {
    night.currentStep -= 1;
    saveState();
    render();
  }
}

function finishNight() {
  const deaths = state.game.night.deadTonightIds || [];
  deaths.forEach((id) => {
    const player = findPlayer(id);
    if (player) player.alive = false;
  });
  const names = deaths.map((id) => playerName(findPlayer(id))).join(', ');
  state.game.log.push(`Noite ${state.game.night.number} terminou.${names ? ` Mortes: ${names}.` : ' Sem mortes noturnas.'}`);
  state.game.day = {
    number: state.game.night.number,
    lastExecutedId: null,
    lastDayDeaths: [],
    warnings: []
  };
  if (checkGameEnd()) return;
  saveState();
  go('day');
}

function findPlayer(id) {
  return allPlayers().find((player) => player.id === id);
}

function playerSelect(name, options = {}) {
  const players = options.livingOnly ? livingPlayers() : allPlayers();
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
  state.game.night.results[stepId] = {
    html,
    data,
    at: Date.now()
  };
  saveState();
  render();
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

  switch (action) {
    case 'minion-info': return actionMinionInfo(step);
    case 'demon-info': return actionDemonInfo(step);
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
    default: return markResult(step.id, 'Ação marcada como feita.');
  }
}

function actionMinionInfo(step) {
  const minions = livingPlayers().filter((player) => trueRole(player)?.type === 'minion');
  const demons = livingPlayers().filter((player) => trueRole(player)?.type === 'demon');
  const html = `
    <strong>Informação dos minions</strong><br>
    Demônio: ${demons.map(playerName).join(', ') || 'nenhum'}<br>
    Minions em jogo: ${minions.map((p) => `${playerName(p)} (${trueRole(p).name})`).join(', ') || 'nenhum'}
  `;
  markResult(step.id, html);
}

function actionDemonInfo(step) {
  const minions = livingPlayers().filter((player) => trueRole(player)?.type === 'minion');
  const bluffs = state.game.bluffs.map(roleById).filter(Boolean).map((role) => role.name).join(', ');
  const html = `
    <strong>Informação do demônio</strong><br>
    Minions: ${minions.map(playerName).join(', ') || 'nenhum'}<br>
    Bluffs seguros: ${bluffs || 'sem bluffs disponíveis'}
  `;
  markResult(step.id, html);
}

function actionPoisoner(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId)) return;
  state.game.night.poisonedId = targetId;
  const target = findPlayer(targetId);
  markResult(step.id, `${escapeHTML(playerName(target))} está envenenado até esta noite terminar.`);
}

function actionSpy(step) {
  const rows = allPlayers()
    .map((player) => `${player.seat}. ${escapeHTML(playerName(player))}: ${escapeHTML(trueRole(player).name)}${player.fakeRoleId ? `, viu ${escapeHTML(displayRole(player).name)}` : ''}${player.alive ? '' : ' — morto'}`)
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
  markResult(step.id, `<strong>${pair.map(playerName).join(' ou ')}</strong><br>Role indicada: <strong>${shownRole.name}</strong>`);
}

function actionLibrarian(step) {
  const actor = findPlayer(step.actorId);
  const outsiders = livingPlayers().filter((player) => trueRole(player)?.type === 'outsider' && player.id !== actor.id);
  if (!outsiders.length && !isDrunkLike(actor)) {
    markResult(step.id, '<strong>Não há Outsiders em jogo</strong>.');
    return;
  }
  let real = sample(outsiders);
  let shownRole = real ? trueRole(real) : sample(ROLES.filter((role) => role.type === 'outsider'));
  let pair = real ? [real, sample(livingPlayers().filter((player) => player.id !== real.id && player.id !== actor.id))] : sampleMany(livingPlayers().filter((player) => player.id !== actor.id), 2);
  if (isDrunkLike(actor)) {
    shownRole = sample(ROLES.filter((role) => role.type === 'outsider'));
    pair = sampleMany(livingPlayers().filter((player) => player.id !== actor.id), 2);
  }
  pair = shuffle(pair.filter(Boolean));
  markResult(step.id, `<strong>${pair.map(playerName).join(' ou ')}</strong><br>Role indicada: <strong>${shownRole.name}</strong>`);
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
  markResult(step.id, `<strong>${pair.map(playerName).join(' ou ')}</strong><br>Role indicada: <strong>${shownRole.name}</strong>`);
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
  markResult(step.id, `Número do Chef: <strong>${count}</strong>.`);
}

function registersEvil(player) {
  if (isPlayerEvil(player)) return true;
  if (player.currentRoleId === 'recluse') return Math.random() < 0.5;
  return false;
}

function actionEmpath(step) {
  const actor = findPlayer(step.actorId);
  const neighbors = closestAliveNeighbors(actor.id);
  let count = neighbors.filter(registersEvil).length;
  if (isDrunkLike(actor)) count = Math.floor(Math.random() * 3);
  markResult(step.id, `Vizinhos vivos: ${neighbors.map(playerName).join(' e ') || 'sem vizinhos'}<br>Número do Empata: <strong>${count}</strong>.`);
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
  if (aId === bId) {
    alert('Escolha duas pessoas diferentes.');
    return;
  }
  const picked = [findPlayer(aId), findPlayer(bId)].filter(Boolean);
  let yes = picked.some((player) => trueRole(player)?.type === 'demon' || player.id === state.game.redHerringId || player.currentRoleId === 'recluse');
  if (isDrunkLike(actor)) yes = Math.random() < 0.5;
  markResult(step.id, `Alvos: ${picked.map(playerName).join(' e ')}. Resposta: <strong>${yes ? 'SIM' : 'NÃO'}</strong>.`);
}

function actionButler(step) {
  const masterId = getField('target');
  if (!assertChoice(masterId, 'Escolha o mestre do Mordomo.')) return;
  const actor = findPlayer(step.actorId);
  actor.masterId = masterId;
  markResult(step.id, `${escapeHTML(playerName(actor))} escolheu <strong>${escapeHTML(playerName(findPlayer(masterId)))}</strong> como mestre para o próximo dia.`);
}

function actionMonk(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha quem o Monge vai proteger.')) return;
  state.game.night.protectedId = targetId;
  markResult(step.id, `${escapeHTML(playerName(findPlayer(targetId)))} está protegido do demônio nesta noite.`);
}

function actionImp(step) {
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha a vítima do Imp.')) return;
  const target = findPlayer(targetId);
  const demon = findPlayer(step.actorId);
  let killed = target;
  let note = '';

  if (target.currentRoleId === 'soldier') {
    killed = null;
    note = `${playerName(target)} é Soldado e sobreviveu ao ataque do demônio.`;
  } else if (state.game.night.protectedId === target.id) {
    killed = null;
    note = `${playerName(target)} estava protegido pelo Monge e não morreu.`;
  } else if (target.currentRoleId === 'mayor') {
    const redirectOptions = livingPlayers().filter((player) => player.id !== target.id && player.id !== demon.id);
    if (redirectOptions.length && Math.random() < 0.5) {
      killed = sample(redirectOptions);
      note = `O ataque no Prefeito foi redirecionado para ${playerName(killed)}.`;
    }
  }

  if (killed) {
    state.game.night.deadTonightIds = [...new Set([...state.game.night.deadTonightIds, killed.id])];
    if (killed.currentRoleId === 'ravenkeeper') state.game.night.pendingRavenkeeperId = killed.id;
    note = note || `${playerName(killed)} morrerá ao amanhecer.`;
  }

  markResult(step.id, note);
}

function passDemonAfterSelfKill(oldDemon) {
  const scarlet = livingPlayers().find((player) => player.currentRoleId === 'scarlet_woman' && player.id !== oldDemon.id);
  const minion = scarlet || sample(livingPlayers().filter((player) => trueRole(player)?.type === 'minion' && player.id !== oldDemon.id));
  if (minion) {
    minion.previousRoleId = minion.currentRoleId;
    minion.currentRoleId = 'imp';
    minion.trueRoleId = 'imp';
    minion.fakeRoleId = null;
    state.game.log.push(`${playerName(minion)} virou Imp depois da morte do demônio.`);
  }
}

function actionRavenkeeper(step) {
  const ravenId = state.game.night.pendingRavenkeeperId;
  if (!ravenId) {
    markResult(step.id, 'O Guardião dos Corvos não morreu nesta noite. Pule esta etapa.');
    return;
  }
  const targetId = getField('target');
  if (!assertChoice(targetId, 'Escolha quem o Guardião dos Corvos vai verificar.')) return;
  const raven = findPlayer(ravenId);
  const target = findPlayer(targetId);
  let role = trueRole(target);
  if (isDrunkLike(raven)) role = sample(ROLES);
  markResult(step.id, `<strong>${escapeHTML(playerName(target))}</strong><br>Role: <strong>${escapeHTML(role.name)}</strong>.`);
}

function actionUndertaker(step) {
  const actor = findPlayer(step.actorId);
  const executed = findPlayer(state.game.day?.lastExecutedId);
  if (!executed) {
    markResult(step.id, 'Ninguém foi executado no dia anterior.');
    return;
  }
  let role = trueRole(executed);
  if (isDrunkLike(actor)) role = sample(ROLES);
  markResult(step.id, `<strong>${escapeHTML(playerName(executed))}</strong><br>Era: <strong>${escapeHTML(role.name)}</strong>.`);
}

function resolveDemonBackup(reason) {
  const aliveDemons = livingPlayers().filter((player) => trueRole(player)?.type === 'demon');
  if (aliveDemons.length) return;
  const scarlet = livingPlayers().find((player) => player.currentRoleId === 'scarlet_woman');
  if (scarlet && livingPlayers().length >= 5) {
    scarlet.previousRoleId = 'scarlet_woman';
    scarlet.currentRoleId = 'imp';
    scarlet.trueRoleId = 'imp';
    scarlet.fakeRoleId = null;
    state.game.log.push(`${playerName(scarlet)} virou Imp pela habilidade da Mulher Escarlate (${reason}).`);
  }
}


function endGame(winner, reason) {
  state.game.ended = true;
  state.game.winner = winner;
  state.game.endReason = reason;
  state.game.log.push(`Fim de jogo: ${winner}. ${reason}`);
  saveState();
  go('end');
}

function checkGameEnd() {
  if (!state.game || state.game.ended) return true;
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
      if (executed.currentRoleId === 'saint') {
        warnings.push('O Anjo/Santo foi executado: o mal vence.');
        state.game.day.warnings = warnings;
        endGame('Mal venceu', 'O Anjo/Santo foi executado.');
        return;
      }
    }
  }
  state.game.day.warnings = warnings;
  if (checkGameEnd()) return;
  saveState();
}

function startNextNightFromDay() {
  updateDayFromForm();
  if (state.game.ended) return;
  state.game.nightNumber += 1;
  startNight(state.game.nightNumber);
}

function renderHome() {
  return `
    <main class="app-shell">
      <section class="hero">
        <div class="hero-badge">☾ MVP Local · Celular único</div>
        <h1>Clocktower Local</h1>
        <p>Site simples para hostear uma partida clássica no mesmo celular: escolha roles, revele uma por uma e siga a ordem da noite.</p>
      </section>

      <section class="home-actions">
        <button class="primary-btn" data-action="go-script">Partida Local</button>
        <button class="secondary-btn" data-action="go-guide">Guia</button>
      </section>

      <section class="section-title"><h3>Estado salvo</h3></section>
      <article class="card">
        <p>O jogo salva sozinho no navegador. Se der ruim ou quiser recomeçar do zero, apague tudo.</p>
        <div class="grid" style="margin-top: 12px;">
          <button class="danger-btn" data-action="reset-all">Apagar save local</button>
        </div>
      </article>
    </main>
  `;
}

function renderGuide() {
  const search = state.guide.search.toLowerCase();
  const roles = rolesForScript('classic').filter((role) => {
    const matchesType = state.guide.type === 'all' || role.type === state.guide.type;
    const blob = `${role.name} ${role.summary} ${TYPE_LABEL[role.type]}`.toLowerCase();
    return matchesType && blob.includes(search);
  });

  return `
    <main class="app-shell">
      ${topbar('Guia', 'Roles do modo clássico', 'home')}
      <section class="filter-row">
        <input placeholder="Buscar role ou tag..." value="${escapeHTML(state.guide.search)}" data-action="guide-search" />
        <select data-action="guide-type">
          <option value="all" ${state.guide.type === 'all' ? 'selected' : ''}>Todos os tipos</option>
          ${TYPE_ORDER.map((type) => `<option value="${type}" ${state.guide.type === type ? 'selected' : ''}>${TYPE_LABEL[type]}</option>`).join('')}
        </select>
      </section>
      <section class="grid">
        ${roles.map((role) => roleCard(role)).join('')}
      </section>
    </main>
  `;
}

function renderScriptSelect() {
  return `
    <main class="app-shell">
      ${topbar('Partida Local', 'Primeiro escolha a seleção', 'home')}
      <section class="grid">
        ${SCRIPTS.map((script) => `
          <article class="card selected">
            <p class="kicker">Seleção disponível</p>
            <div class="role-title">
              <div>
                <h3>${escapeHTML(script.name)}</h3>
                <p>${escapeHTML(script.description)}</p>
              </div>
              <span class="pill">22 roles</span>
            </div>
          </article>
        `).join('')}
      </section>
      <section class="sticky-actions">
        <button class="primary-btn" data-action="go-setup">Usar Modo Clássico</button>
      </section>
    </main>
  `;
}

function renderSetup() {
  const validation = setupValidation();
  const metric = metricInfo();
  const roles = rolesForScript(state.setup.scriptId);
  const grouped = TYPE_ORDER.map((type) => ({ type, roles: roles.filter((role) => role.type === type) }));

  return `
    <main class="app-shell">
      ${topbar('Subseleção', 'Escolha jogadores, modo e roles', 'script')}

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
          <p class="hint">Manual só mostra a ordem. Automático deixa jogadores escolherem no celular e gera informações/mortes.</p>
        </div>
        <div class="grid two">
          <button class="secondary-btn" data-action="auto-fill">Preencher automático</button>
          <button class="ghost-btn" data-action="clear-selection">Limpar roles</button>
        </div>
      </section>

      <section class="section-title"><h3>Quantidade exigida</h3><span>${state.setup.selectedRoleIds.length}/${state.setup.playerCount}</span></section>
      <section class="count-grid">
        ${TYPE_ORDER.map((type) => `
          <div class="count-box">
            <strong>${validation.counts[type]}/${validation.target[type]}</strong>
            <span>${TYPE_LABEL[type]}</span>
          </div>
        `).join('')}
      </section>
      ${validation.errors.length ? `<article class="card warning" style="margin-top: 10px;">${validation.errors.map(escapeHTML).join('<br>')}</article>` : `<article class="card success" style="margin-top: 10px;">Subseleção válida. Pode começar.</article>`}

      <section class="section-title"><h3>Barras da partida</h3></section>
      <section class="metrics">
        <div class="metric">
          <div class="metric-head"><strong>Duração da noite</strong><span>${metric.duration} etapas · ${metric.durationLabel}</span></div>
          <div class="bar"><div class="bar-fill" style="--value:${metric.durationPct}%"></div></div>
        </div>
        <div class="metric">
          <div class="metric-head"><strong>Dificuldade para o bem</strong><span>${metric.difficulty}/10 · ${metric.difficultyLabel}</span></div>
          <div class="bar"><div class="bar-fill" style="--value:${metric.difficultyPct}%"></div></div>
          <p class="hint">A escala começa em 5. Abaixo disso fica melhor para o bem; acima disso fica mais pesado para o bem.</p>
        </div>
      </section>

      ${grouped.map((group) => `
        <section class="section-title"><h3>${TYPE_LABEL[group.type]}</h3><span>${validation.counts[group.type]}/${validation.target[group.type]}</span></section>
        <section class="grid">
          ${group.roles.map((role) => roleCard(role, { checkbox: true, checked: state.setup.selectedRoleIds.includes(role.id) })).join('')}
        </section>
      `).join('')}

      <section class="sticky-actions">
        <button class="primary-btn" data-action="start-game" ${validation.valid ? '' : 'disabled'}>Começar jogo</button>
      </section>
    </main>
  `;
}

function renderReveal() {
  const game = state.game;
  const player = game.players[game.revealIndex];
  const role = displayRole(player);
  const isHiddenDrunk = player.trueRoleId === 'drunk';
  const revealText = state.revealOpen
    ? `
      <button class="reveal-card" data-action="toggle-reveal">
        <p class="kicker">Sua role</p>
        <h2>${escapeHTML(role.name)}</h2>
        <p>${escapeHTML(role.summary)}</p>
        ${tagsHTML(role.tags)}
        ${isHiddenDrunk ? '<p class="hint">Esta é a role que o jogador verá. O host verá a role real depois.</p>' : ''}
      </button>
    `
    : `<button class="big-question" data-action="toggle-reveal">?</button>`;

  return `
    <main class="app-shell">
      ${topbar('Entrega de roles', `Jogador ${game.revealIndex + 1} de ${game.players.length}`, 'setup')}
      <section class="card warning">
        Entregue o celular para uma pessoa. Ela toca no <strong>?</strong>, vê a role, toca de novo para esconder, digita o nome e devolve para o host.
      </section>
      <section style="margin-top: 14px;">${revealText}</section>
      <section class="card" style="margin-top: 14px;">
        <div class="form-row">
          <label>Nome do jogador</label>
          <input data-player-name value="${escapeHTML(player.name)}" placeholder="Ex: Ana" autocomplete="off" />
        </div>
        <button class="primary-btn" data-action="next-reveal">${game.revealIndex === game.players.length - 1 ? 'Finalizar entrega' : 'Salvar e próximo'}</button>
      </section>
    </main>
  `;
}

function renderGrimoire() {
  const game = state.game;
  return `
    <main class="app-shell">
      ${topbar('Grimório do Host', 'Quem é quem na partida', 'reveal')}
      <section class="grid">
        ${game.players.map((player) => `
          <article class="card player-card ${player.alive ? '' : 'dead'}">
            <div>
              <strong>${player.seat}. ${escapeHTML(playerName(player))}</strong>
              <span>Role real: ${escapeHTML(trueRole(player).name)}${player.fakeRoleId ? ` · viu: ${escapeHTML(displayRole(player).name)}` : ''}</span>
              <span>${player.alive ? 'Vivo' : 'Morto'}</span>
            </div>
            ${rolePill(trueRole(player))}
          </article>
        `).join('')}
      </section>
      <section class="card" style="margin-top: 12px;">
        <p><strong>Modo:</strong> ${game.mode === 'automatic' ? 'Automático' : 'Manual'}</p>
        <p><strong>Red herring da Vidente:</strong> ${escapeHTML(playerName(findPlayer(game.redHerringId)) || 'nenhum')}</p>
        <p><strong>Bluffs do demônio:</strong> ${game.bluffs.map(roleById).filter(Boolean).map((role) => role.name).join(', ') || 'nenhum'}</p>
      </section>
      <section class="sticky-actions">
        <button class="primary-btn" data-action="start-night">Começar noite 1</button>
        <button class="ghost-btn" data-action="copy-grimoire">Copiar grimório JSON</button>
      </section>
    </main>
  `;
}

function renderNight() {
  const game = state.game;
  const night = game.night;
  const step = currentStep();
  const total = night.steps.length || 1;
  const index = night.currentStep + 1;
  const progress = (index / total) * 100;
  const result = night.results[step?.id];

  return `
    <main class="app-shell">
      ${topbar(`Noite ${night.number}`, `${index}/${total} etapas`, 'grimoire')}
      <section class="progress"><div style="--progress:${progress}%"></div></section>
      <section class="step-card" style="margin-top: 14px;">
        <p class="kicker">${game.mode === 'automatic' ? 'Modo automático' : 'Modo manual'}</p>
        <h2>${escapeHTML(step?.title || 'Sem etapa')}</h2>
        ${result ? '<p class="hint">Ação já confirmada. Para evitar troca de alvo, esta etapa ficou travada.</p>' : renderStepBody(step)}
        ${result ? `<div class="result-box">${result.html}</div>` : ''}
      </section>
      <section class="sticky-actions">
        <div class="grid two">
          <button class="ghost-btn" data-action="prev-step" ${night.currentStep === 0 ? 'disabled' : ''}>Voltar</button>
          <button class="primary-btn" data-action="next-step">${night.currentStep === total - 1 ? 'Encerrar noite' : 'Próxima etapa'}</button>
        </div>
      </section>
    </main>
  `;
}

function renderStepBody(step) {
  if (!step) return '<p>Nenhuma ação nesta noite.</p>';
  if (state.game.mode === 'manual') return renderManualStep(step);
  return renderAutomaticStep(step);
}

function renderManualStep(step) {
  const actor = findPlayer(step.actorId);
  const role = step.roleId ? roleById(step.roleId) : null;
  return `
    <p>${manualInstruction(step, actor, role)}</p>
    <div class="action-box">
      <strong>Manual de verdade:</strong>
      <span>O site não escolhe alvo, não calcula informação e não mata ninguém. O host conversa com a pessoa e resolve usando o grimório.</span>
    </div>
  `;
}

function manualInstruction(step, actor, role) {
  if (step.id === 'minion-info') return 'Tela de informação dos minions.';
  if (step.id === 'demon-info') return 'Tela de informação do demônio.';
  if (step.action === 'ravenkeeper') return 'Se o Guardião dos Corvos morreu, entregue a tela para ele escolher.';
  return `Vez de ${actor ? playerName(actor) : `a role ${role?.name || step.title}`}.`;
}

function renderAutomaticStep(step) {
  const actor = findPlayer(step.actorId);
  const role = step.roleId ? roleById(step.roleId) : null;
  if (step.id === 'minion-info') return autoButton('minion-info', 'Revelar informação dos minions');
  if (step.id === 'demon-info') return autoButton('demon-info', 'Revelar informação do demônio');

  const actorLine = actor ? `<p>Passe o celular para: <strong>${escapeHTML(playerName(actor))}</strong>${actor.fakeRoleId ? `, que acredita ser <strong>${escapeHTML(role.name)}</strong>` : ''}.</p>` : '';

  if (step.action === 'poisoner') {
    return `${actorLine}<div class="action-box"><label>Quem será envenenado?</label>${playerSelect('target', { livingOnly: true })}${autoButton('poisoner', 'Confirmar veneno')}</div>`;
  }
  if (step.action === 'spy') {
    return `${actorLine}${autoButton('spy', 'Mostrar grimório para o Espião')}`;
  }
  if (['washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'undertaker'].includes(step.action)) {
    return `${actorLine}${autoButton(step.action, 'Gerar informação')}`;
  }
  if (step.action === 'fortune_teller') {
    return `${actorLine}<div class="action-box"><label>Primeiro alvo</label>${playerSelect('targetA')}<label>Segundo alvo</label>${playerSelect('targetB')}${autoButton('fortune_teller', 'Responder SIM/NÃO')}</div>`;
  }
  if (step.action === 'butler') {
    return `${actorLine}<div class="action-box"><label>Mestre do Mordomo</label>${playerSelect('target', { livingOnly: true, exclude: [actor.id] })}${autoButton('butler', 'Confirmar mestre')}</div>`;
  }
  if (step.action === 'monk') {
    return `${actorLine}<div class="action-box"><label>Quem o Monge protege?</label>${playerSelect('target', { livingOnly: true, exclude: [actor.id] })}${autoButton('monk', 'Confirmar proteção')}</div>`;
  }
  if (step.action === 'imp') {
    return `${actorLine}<div class="action-box"><label>Quem o Imp ataca?</label>${playerSelect('target', { livingOnly: true })}${autoButton('imp', 'Confirmar ataque')}</div>`;
  }
  if (step.action === 'ravenkeeper') {
    const pending = findPlayer(state.game.night.pendingRavenkeeperId);
    if (!pending) return `<p>O Guardião dos Corvos não morreu nesta noite.</p>${autoButton('ravenkeeper', 'Marcar como pulado')}`;
    return `<p>Passe o celular para <strong>${escapeHTML(playerName(pending))}</strong>.</p><div class="action-box"><label>Quem ele quer verificar?</label>${playerSelect('target')}${autoButton('ravenkeeper', 'Revelar role')}</div>`;
  }
  return `${actorLine}${autoButton(step.action, 'Marcar como feito')}`;
}

function autoButton(action, label) {
  return `<button class="secondary-btn" data-action="auto-action" data-auto-action="${escapeHTML(action)}">${escapeHTML(label)}</button>`;
}

function renderDay() {
  const game = state.game;
  const day = game.day;
  return `
    <main class="app-shell">
      ${topbar(`Dia ${day.number}`, 'Host registra mortes e execução', 'night')}
      <section class="card">
        <p>Durante o dia, o host controla conversa, nomeações, Caçador, Virgem e Anjo/Santo. Escolha quem foi executado e vá direto para a próxima noite.</p>
      </section>
      <section class="section-title"><h3>Vivos/mortos</h3></section>
      <section class="grid">
        ${allPlayers().map((player) => `
          <article class="card player-card ${player.alive ? '' : 'dead'}">
            <div>
              <strong>${player.seat}. ${escapeHTML(playerName(player))}</strong>
              <span>${escapeHTML(trueRole(player).name)}${player.fakeRoleId ? ` · viu ${escapeHTML(displayRole(player).name)}` : ''}</span>
            </div>
            <label class="pill"><input type="checkbox" data-alive-id="${player.id}" ${player.alive ? 'checked' : ''} /> Vivo</label>
          </article>
        `).join('')}
      </section>
      <section class="card" style="margin-top: 12px;">
        <div class="form-row">
          <label>Quem foi executado hoje?</label>
          ${playerSelect('executed', { livingOnly: true })}
          <p class="hint">Se ninguém foi executado, deixe vazio. O Coveiro usa esta informação na próxima noite.</p>
        </div>
      </section>
      ${day.warnings?.length ? `<section class="card warning" style="margin-top: 12px;">${day.warnings.map(escapeHTML).join('<br>')}</section>` : ''}
      <section class="sticky-actions">
        <button class="primary-btn" data-action="next-night">Começar próxima noite</button>
      </section>
    </main>
  `;
}

function topbar(title, subtitle, backView) {
  return `
    <header class="topbar">
      <button class="back-btn" data-action="go-${backView}">‹</button>
      <div class="brand">
        <h2>${escapeHTML(title)}</h2>
        <p>${escapeHTML(subtitle)}</p>
      </div>
    </header>
  `;
}


function renderEnd() {
  const game = state.game;
  return `
    <main class="app-shell">
      <section class="hero">
        <div class="hero-badge">Fim de jogo</div>
        <h1>${escapeHTML(game.winner || 'Fim')}</h1>
        <p>${escapeHTML(game.endReason || 'Partida encerrada.')}</p>
      </section>
      <section class="section-title"><h3>Grimório final</h3></section>
      <section class="grid">
        ${game.players.map((player) => `
          <article class="card player-card ${player.alive ? '' : 'dead'}">
            <div>
              <strong>${player.seat}. ${escapeHTML(playerName(player))}</strong>
              <span>${escapeHTML(trueRole(player).name)}${player.fakeRoleId ? ` · viu ${escapeHTML(displayRole(player).name)}` : ''}</span>
              <span>${player.alive ? 'Vivo' : 'Morto'}</span>
            </div>
            ${rolePill(trueRole(player))}
          </article>
        `).join('')}
      </section>
      <section class="sticky-actions">
        <button class="danger-btn" data-action="reset-all">Nova partida do zero</button>
      </section>
    </main>
  `;
}

function render() {
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
    saveState();
    render();
  }
});

app.addEventListener('change', (event) => {
  const action = event.target?.dataset?.action;
  if (action === 'guide-type') {
    state.guide.type = event.target.value;
    saveState();
    render();
  }
  if (action === 'player-count') {
    state.setup.playerCount = Number(event.target.value);
    saveState();
    render();
  }
  if (action === 'toggle-role') {
    const roleId = event.target.dataset.roleId;
    if (event.target.checked) {
      state.setup.selectedRoleIds = [...new Set([...state.setup.selectedRoleIds, roleId])];
    } else {
      state.setup.selectedRoleIds = state.setup.selectedRoleIds.filter((id) => id !== roleId);
    }
    saveState();
    render();
  }
});

app.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;

  if (action === 'go-home') return go('home');
  if (action === 'go-guide') return go('guide');
  if (action === 'go-script') return go('script');
  if (action === 'go-setup') return go('setup');
  if (action === 'go-grimoire') return go('grimoire');
  if (action === 'go-reveal') return go('reveal');
  if (action === 'reset-all') {
    if (confirm('Apagar todo o save local?')) resetAll();
    return;
  }
  if (action === 'set-mode') {
    state.setup.mode = button.dataset.mode;
    saveState();
    render();
    return;
  }
  if (action === 'auto-fill') return autoFillRoles();
  if (action === 'clear-selection') {
    state.setup.selectedRoleIds = [];
    saveState();
    render();
    return;
  }
  if (action === 'start-game') return startGame();
  if (action === 'toggle-reveal') {
    state.revealOpen = !state.revealOpen;
    saveState();
    render();
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
});

render();

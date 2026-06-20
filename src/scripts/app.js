import { ROLES, SCRIPT_PRESETS, TEAM_LABELS, EDITION_LABELS, PLAYER_ROLE_TEAMS, GUIDE_TEAMS } from './roles.js';

const state = {
  screen: 'home',
  guideQuery: '',
  guideTeam: 'all',
  guideEdition: 'all',
  selectedPresetId: 'tb',
  selectedRoleIds: new Set(),
  playerCount: 10,
};

const byId = (id) => document.getElementById(id);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const roleById = new Map(ROLES.map((role) => [role.id, role]));

function getPreset() {
  return SCRIPT_PRESETS.find((preset) => preset.id === state.selectedPresetId) ?? SCRIPT_PRESETS[0];
}

function getPresetRoles({ playableOnly = false } = {}) {
  const preset = getPreset();
  return ROLES.filter((role) => {
    const inPreset = preset.editions.includes(role.edition);
    const playable = !playableOnly || PLAYER_ROLE_TEAMS.includes(role.team);
    return inPreset && playable;
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function percent(value, max = 10) {
  return `${clamp(Math.round((value / max) * 100), 0, 100)}%`;
}

function showScreen(screen) {
  state.screen = screen;
  $$('.screen').forEach((section) => section.classList.toggle('active', section.dataset.screen === screen));
  document.body.dataset.view = screen;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
}

function groupByTeam(roles, teams) {
  return teams
    .map((team) => ({ team, roles: roles.filter((role) => role.team === team) }))
    .filter((group) => group.roles.length > 0);
}

function chip(text, className = '') {
  return `<span class="chip ${className}">${text}</span>`;
}

function renderHome() {
  byId('homeStats').innerHTML = `
    ${chip(`${ROLES.length} roles cadastradas`)}
    ${chip(`${SCRIPT_PRESETS.length} seleções`)}
    ${chip('Mobile-first')}
  `;
}

function renderGuideFilters() {
  const teamOptions = ['all', ...GUIDE_TEAMS]
    .map((team) => `<option value="${team}" ${state.guideTeam === team ? 'selected' : ''}>${team === 'all' ? 'Todos os tipos' : TEAM_LABELS[team]}</option>`)
    .join('');
  const editionOptions = ['all', ...Object.keys(EDITION_LABELS)]
    .map((edition) => `<option value="${edition}" ${state.guideEdition === edition ? 'selected' : ''}>${edition === 'all' ? 'Todas as seleções' : EDITION_LABELS[edition]}</option>`)
    .join('');

  byId('guideControls').innerHTML = `
    <label class="field">
      <span>Buscar role</span>
      <input id="guideSearch" type="search" placeholder="Ex: Demon, Poisoner, Washerwoman" value="${state.guideQuery}" autocomplete="off" />
    </label>
    <div class="filterRow">
      <label class="field compact"><span>Tipo</span><select id="guideTeam">${teamOptions}</select></label>
      <label class="field compact"><span>Seleção</span><select id="guideEdition">${editionOptions}</select></label>
    </div>
  `;

  byId('guideSearch').addEventListener('input', (event) => {
    state.guideQuery = event.target.value;
    renderGuideList();
  });
  byId('guideTeam').addEventListener('change', (event) => {
    state.guideTeam = event.target.value;
    renderGuideList();
  });
  byId('guideEdition').addEventListener('change', (event) => {
    state.guideEdition = event.target.value;
    renderGuideList();
  });
}

function renderGuideList() {
  const query = state.guideQuery.trim().toLowerCase();
  const filtered = ROLES.filter((role) => {
    const matchesQuery = !query || `${role.name} ${role.summary} ${TEAM_LABELS[role.team]} ${EDITION_LABELS[role.edition]}`.toLowerCase().includes(query);
    const matchesTeam = state.guideTeam === 'all' || role.team === state.guideTeam;
    const matchesEdition = state.guideEdition === 'all' || role.edition === state.guideEdition;
    return matchesQuery && matchesTeam && matchesEdition;
  });

  const groups = groupByTeam(filtered, GUIDE_TEAMS);
  byId('guideCount').textContent = `${filtered.length} role${filtered.length === 1 ? '' : 's'}`;
  byId('guideList').innerHTML = groups.map((group) => `
    <section class="roleGroup">
      <div class="groupHeader">
        <h3>${TEAM_LABELS[group.team]}</h3>
        <span>${group.roles.length}</span>
      </div>
      <div class="roleList">
        ${group.roles.map(renderGuideCard).join('')}
      </div>
    </section>
  `).join('') || `<div class="empty">Nada encontrado com esses filtros.</div>`;
}

function renderGuideCard(role) {
  return `
    <article class="roleCard ${role.team}">
      <div>
        <h4>${role.name}</h4>
        <p>${role.summary}</p>
      </div>
      <div class="metaLine">
        ${chip(TEAM_LABELS[role.team], `team ${role.team}`)}
        ${chip(EDITION_LABELS[role.edition])}
        ${role.night ? chip(`Noite ${role.night}/4`) : ''}
      </div>
    </article>
  `;
}

function renderPresetCards() {
  byId('presetCards').innerHTML = SCRIPT_PRESETS.map((preset) => {
    const count = ROLES.filter((role) => preset.editions.includes(role.edition)).length;
    return `
      <button class="presetCard ${preset.id === state.selectedPresetId ? 'selected' : ''}" data-preset="${preset.id}">
        <span class="eyebrow">${preset.recommended ? 'Recomendado' : `${count} roles`}</span>
        <strong>${preset.name}</strong>
        <small>${preset.subtitle}</small>
        <p>${preset.description}</p>
      </button>
    `;
  }).join('');

  $$('.presetCard').forEach((button) => button.addEventListener('click', () => {
    state.selectedPresetId = button.dataset.preset;
    state.selectedRoleIds = new Set(getPresetRoles({ playableOnly: true }).map((role) => role.id));
    saveLocal();
    renderLocal();
  }));
}

function renderLocal() {
  renderPresetCards();
  renderRolePicker();
  renderMeters();
  renderSelectionSummary();
}

function renderRolePicker() {
  const roles = getPresetRoles({ playableOnly: true });
  if (state.selectedRoleIds.size === 0) {
    state.selectedRoleIds = new Set(roles.map((role) => role.id));
  }

  const groups = groupByTeam(roles, PLAYER_ROLE_TEAMS);
  byId('rolePickerHeader').innerHTML = `
    <div>
      <span class="eyebrow">Subseleção</span>
      <h3>${getPreset().name}</h3>
      <p>Toque nas roles para ligar/desligar. O host decide o script final.</p>
    </div>
    <div class="quickActions">
      <button class="ghost" id="selectAll">Tudo</button>
      <button class="ghost" id="clearAll">Limpar</button>
    </div>
  `;

  byId('rolePicker').innerHTML = groups.map((group) => `
    <section class="roleGroup pickerGroup">
      <div class="groupHeader">
        <h3>${TEAM_LABELS[group.team]}</h3>
        <span>${group.roles.filter((role) => state.selectedRoleIds.has(role.id)).length}/${group.roles.length}</span>
      </div>
      <div class="toggleGrid">
        ${group.roles.map(renderToggleRole).join('')}
      </div>
    </section>
  `).join('');

  byId('selectAll').addEventListener('click', () => {
    state.selectedRoleIds = new Set(roles.map((role) => role.id));
    saveLocal();
    renderLocal();
  });
  byId('clearAll').addEventListener('click', () => {
    state.selectedRoleIds.clear();
    saveLocal();
    renderLocal();
  });

  $$('.roleToggle').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.role;
      if (state.selectedRoleIds.has(id)) state.selectedRoleIds.delete(id);
      else state.selectedRoleIds.add(id);
      saveLocal();
      renderRolePicker();
      renderMeters();
      renderSelectionSummary();
    });
  });
}

function renderToggleRole(role) {
  const active = state.selectedRoleIds.has(role.id);
  return `
    <button class="roleToggle ${active ? 'active' : ''} ${role.team}" data-role="${role.id}" aria-pressed="${active}">
      <strong>${role.name}</strong>
      <small>${role.summary}</small>
    </button>
  `;
}

function selectedRoles() {
  return [...state.selectedRoleIds].map((id) => roleById.get(id)).filter(Boolean);
}

function calculateBalance(roles) {
  const playableRoles = roles.filter((role) => PLAYER_ROLE_TEAMS.includes(role.team));
  const evilRoles = playableRoles.filter((role) => role.team === 'minion' || role.team === 'demon');
  const goodInfo = playableRoles.reduce((sum, role) => sum + (role.info ?? 0), 0);
  const evilPower = playableRoles.reduce((sum, role) => sum + (role.evil ?? 0), 0);
  const setupChaos = playableRoles.filter((role) => role.setup).length;
  const demonCount = playableRoles.filter((role) => role.team === 'demon').length;
  const minionCount = playableRoles.filter((role) => role.team === 'minion').length;
  const outsiderCount = playableRoles.filter((role) => role.team === 'outsider').length;
  const nightLoad = playableRoles.reduce((sum, role) => sum + (role.night ?? 0), 0);
  const nightActors = playableRoles.filter((role) => role.night > 0).length;

  const evilDifficulty = clamp(
    2.5 + evilPower * 0.22 + minionCount * 0.25 + demonCount * 0.35 + outsiderCount * 0.18 + setupChaos * 0.25 - goodInfo * 0.08,
    1,
    10
  );

  const nightDuration = clamp(1.5 + nightLoad * 0.33 + nightActors * 0.12, 1, 10);
  const minutes = Math.round(2 + nightLoad * 0.55 + nightActors * 0.18);

  return {
    evilDifficulty,
    nightDuration,
    minutes,
    evilCount: evilRoles.length,
    goodInfo,
    nightActors,
    roleCount: playableRoles.length,
    demonCount,
    minionCount,
    outsiderCount,
  };
}

function renderMeters() {
  const roles = selectedRoles();
  const balance = calculateBalance(roles);
  byId('playerCount').value = state.playerCount;
  byId('playerCountValue').textContent = `${state.playerCount} jogadores`;

  byId('meters').innerHTML = `
    <article class="meterCard">
      <div class="meterTop">
        <span>Dificuldade para o bem</span>
        <strong>${balance.evilDifficulty.toFixed(1)}/10</strong>
      </div>
      <div class="meter"><span style="width:${percent(balance.evilDifficulty)}"></span></div>
      <p>${evilHint(balance.evilDifficulty)} Mede o quão confortável o mal tende a ficar com esta lista.</p>
    </article>
    <article class="meterCard">
      <div class="meterTop">
        <span>Duração da noite</span>
        <strong>${balance.minutes} min</strong>
      </div>
      <div class="meter"><span style="width:${percent(balance.nightDuration)}"></span></div>
      <p>${nightHint(balance.nightDuration)} Estimativa baseada nas roles que acordam ou exigem decisões à noite.</p>
    </article>
  `;

  byId('balanceDetails').innerHTML = `
    ${chip(`${balance.roleCount} roles selecionadas`)}
    ${chip(`${balance.demonCount} Demon`)}
    ${chip(`${balance.minionCount} Minion`)}
    ${chip(`${balance.outsiderCount} Outsider`)}
    ${chip(`${balance.nightActors} agem à noite`)}
  `;
}

function evilHint(value) {
  if (value < 3.5) return 'Bem favorecido.';
  if (value < 6.5) return 'Equilibrado.';
  if (value < 8.3) return 'Mal perigoso.';
  return 'Mal muito favorecido.';
}

function nightHint(value) {
  if (value < 3.5) return 'Noite curta.';
  if (value < 6.5) return 'Noite média.';
  if (value < 8.5) return 'Noite longa.';
  return 'Noite bem pesada.';
}

function renderSelectionSummary() {
  const roles = selectedRoles().filter((role) => PLAYER_ROLE_TEAMS.includes(role.team));
  byId('selectedCount').textContent = `${roles.length} selecionadas`;
  const groups = groupByTeam(roles, PLAYER_ROLE_TEAMS);
  byId('selectionSummary').innerHTML = groups.map((group) => `
    <div class="summaryBlock">
      <h4>${TEAM_LABELS[group.team]}</h4>
      <p>${group.roles.map((role) => role.name).join(', ')}</p>
    </div>
  `).join('') || '<div class="empty">Nenhuma role selecionada ainda.</div>';
}

function exportSelection() {
  const roles = selectedRoles().filter((role) => PLAYER_ROLE_TEAMS.includes(role.team));
  const payload = {
    name: getPreset().name,
    playerCount: state.playerCount,
    roles: roles.map((role) => ({ name: role.name, team: TEAM_LABELS[role.team], edition: EDITION_LABELS[role.edition] })),
    balance: calculateBalance(roles)
  };
  const text = JSON.stringify(payload, null, 2);
  navigator.clipboard?.writeText(text).then(() => {
    toast('Seleção copiada como JSON.');
  }).catch(() => {
    byId('exportOutput').value = text;
    byId('exportOutput').classList.remove('hidden');
    toast('Não consegui copiar automaticamente; deixei o JSON abaixo.');
  });
}

function toast(message) {
  const node = byId('toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => node.classList.remove('show'), 2200);
}

function saveLocal() {
  const payload = {
    selectedPresetId: state.selectedPresetId,
    selectedRoleIds: [...state.selectedRoleIds],
    playerCount: state.playerCount
  };
  localStorage.setItem('clocktower-local-state', JSON.stringify(payload));
}

function loadLocal() {
  const raw = localStorage.getItem('clocktower-local-state');
  if (!raw) {
    state.selectedRoleIds = new Set(getPresetRoles({ playableOnly: true }).map((role) => role.id));
    return;
  }
  try {
    const payload = JSON.parse(raw);
    state.selectedPresetId = payload.selectedPresetId ?? state.selectedPresetId;
    state.selectedRoleIds = new Set(payload.selectedRoleIds ?? getPresetRoles({ playableOnly: true }).map((role) => role.id));
    state.playerCount = payload.playerCount ?? state.playerCount;
  } catch {
    state.selectedRoleIds = new Set(getPresetRoles({ playableOnly: true }).map((role) => role.id));
  }
}

function bindStaticEvents() {
  $$('[data-go]').forEach((button) => {
    button.addEventListener('click', () => showScreen(button.dataset.go));
  });

  byId('playerCount').addEventListener('input', (event) => {
    state.playerCount = Number(event.target.value);
    byId('playerCountValue').textContent = `${state.playerCount} jogadores`;
    saveLocal();
  });

  byId('copySelection').addEventListener('click', exportSelection);
}

function render() {
  renderHome();
  if (state.screen === 'guide') {
    renderGuideFilters();
    renderGuideList();
  }
  if (state.screen === 'local') {
    renderLocal();
  }
}

export function initApp() {
  loadLocal();
  bindStaticEvents();
  render();
}

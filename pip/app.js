// ------------------------------------------
// HJÆLPEFUNKTIONER (ingen localStorage mere)
// ------------------------------------------
function renderAvatar(username) {
  const initial = (username || '?').trim().charAt(0).toUpperCase() || '?';
  const div = document.createElement('div');
  div.className = 'avatar';
  div.textContent = initial;
  return div;
}

function formatTimestamp(isoOrLike) {
  const d = new Date(isoOrLike);
  if (isNaN(d.getTime())) return isoOrLike; // fallback hvis parsing fejler
  return d.toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'short' });
}

function createPipItem(pip) {
  const item = document.createElement('article');
  item.className = 'pip';
  item.setAttribute('role', 'listitem');

  const avatar = renderAvatar(pip.username);
  item.appendChild(avatar);

  const content = document.createElement('div');

  const header = document.createElement('div');
  const nameEl = document.createElement('span');
  nameEl.className = 'pip-username';
  nameEl.textContent = pip.username;

  const metaEl = document.createElement('span');
  metaEl.className = 'pip-meta';
  // backend sender 'created_at'
  metaEl.textContent = ' · ' + formatTimestamp(pip.created_at);

  header.appendChild(nameEl);
  header.appendChild(metaEl);

  const msg = document.createElement('div');
  msg.className = 'pip-message';
  msg.textContent = pip.message;

  content.appendChild(header);
  content.appendChild(msg);
  item.appendChild(content);

  return item;
}

// ---- server helpers ----
async function fetchPipsFromServer() {
  const res = await fetch('pips.php');
  if (!res.ok) throw new Error('GET /pips.php failed');
  return res.json(); // liste af pips (nyeste først)
}

async function createPipOnServer(username, message) {
  const res = await fetch('pips.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ username, message })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('POST /pips.php failed: ' + txt);
  }
  return res.json(); // oprettet pip
}

// ------------------------------------------
// MODAL HÅNDTERING
// ------------------------------------------
const modalBackdrop = document.getElementById('modalBackdrop');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const pipForm = document.getElementById('pipForm');
const usernameInput = document.getElementById('username');

'use strict';

// ---------- UI HJÆLPEFUNKTIONER ----------
function renderAvatar(username) {
  const initial = (username || '?').trim().charAt(0).toUpperCase() || '?';
  const div = document.createElement('div');
  div.className = 'avatar';
  div.textContent = initial;
  return div;
}

function formatTimestamp(value) {
  // Backend sender "YYYY-MM-DD HH:mm:ss"
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value; // fallback (viser rå streng hvis parsing fejler)
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

// ---------- SERVER HELPERS ----------
async function fetchPipsFromServer() {
  const res = await fetch('pips.php', { cache: 'no-store' });
  if (!res.ok) throw new Error('GET /pips.php failed (' + res.status + ')');
  return res.json(); // array af pips
}

async function createPipOnServer(username, message) {
  const res = await fetch('pips.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, message })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('POST /pips.php failed (' + res.status + '): ' + txt);
  }
  return res.json(); // den oprettede række
}

// ---------- MODAL & FORM ----------
const modalBackdrop = document.getElementById('modalBackdrop');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const pipForm = document.getElementById('pipForm');
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');
const usernameError = document.getElementById('usernameError');
const messageError = document.getElementById('messageError');
const charCounter = document.getElementById('charCounter');
const submitBtn = document.getElementById('submitBtn');

function openModal() {
  modalBackdrop.classList.add('show');
  modalBackdrop.setAttribute('aria-hidden', 'false');
  usernameInput.focus();
}

function closeModal() {
  modalBackdrop.classList.remove('show');
  modalBackdrop.setAttribute('aria-hidden', 'true');
  pipForm.reset();
  charCounter.textContent = '0/255';
  usernameError.hidden = true;
  messageError.hidden = true;
  submitBtn.disabled = false;
}

openModalBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalBackdrop.classList.contains('show')) closeModal();
});

messageInput.addEventListener('input', () => {
  charCounter.textContent = `${messageInput.value.length}/255`;
});

// ---------- SUBMIT ----------
pipForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const message = messageInput.value.trim();

  let valid = true;
  if (!username || username.length > 30) { usernameError.hidden = false; valid = false; } else { usernameError.hidden = true; }
  if (!message || message.length > 255) { messageError.hidden = false; valid = false; } else { messageError.hidden = true; }
  if (!valid) return;

  // undgå dobbelt-submit
  submitBtn.disabled = true;

  try {
    await createPipOnServer(username, message);
    await renderFeed();
    closeModal();
    document.getElementById('feed').scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    alert('Kunne ikke oprette pip: ' + err.message);
    submitBtn.disabled = false;
  }
});

// ---------- RENDER & INIT ----------
async function renderFeed() {
  const list = document.getElementById('pipList');
  list.innerHTML = '';
  try {
    const pips = await fetchPipsFromServer(); // nyeste først (sorteres i PHP)
    pips.forEach(p => list.appendChild(createPipItem(p)));
  } catch (err) {
    list.innerHTML = '<div style="padding:16px;color:#f4212e;">Fejl ved hentning af pips: ' + err.message + '</div>';
  }
}

renderFeed();

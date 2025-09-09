// ------------------------------------------
// TILSTAND & KONSTANTER
// ------------------------------------------
/* Lokal nøgle til localStorage – bruges i denne frontend-only MVP
   Når PHP-backenden er klar, kan vi skifte til fetch() i stedet. */
const STORAGE_KEY = 'pipper.pips';

// ------------------------------------------
// HJÆLPEFUNKTIONER
// ------------------------------------------
/** Hent pips fra localStorage (seneste først) */
function loadPips() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const arr = raw ? JSON.parse(raw) : [];
  // Sortér nyeste øverst (createdAt i ms)
  return arr.sort((a, b) => b.createdAt - a.createdAt);
}

/** Gem pips i localStorage */
function savePips(pips) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pips));
}

/** Lav en avatar med initial (midlertidig – erstattes evt. med Dicebear senere) */
function renderAvatar(username) {
  const initial = (username || '?').trim().charAt(0).toUpperCase() || '?';
  const div = document.createElement('div');
  div.className = 'avatar';
  div.textContent = initial;
  return div;
}

/** Formater tid – simpel ISO-tekst (kan udvides til "for X min siden") */
function formatTimestamp(ms) {
  const d = new Date(ms);
  return d.toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'short' });
}

/** Lav ét pip DOM-element */
function createPipItem(pip) {
  const item = document.createElement('article');
  item.className = 'pip';
  item.setAttribute('role', 'listitem');

  // Avatar kolonne
  const avatar = renderAvatar(pip.username);
  item.appendChild(avatar);

  // Indhold kolonne
  const content = document.createElement('div');

  const header = document.createElement('div');
  const nameEl = document.createElement('span');
  nameEl.className = 'pip-username';
  nameEl.textContent = pip.username;

  const metaEl = document.createElement('span');
  metaEl.className = 'pip-meta';
  metaEl.textContent = ' · ' + formatTimestamp(pip.createdAt);

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

/** Render hele feedet */
function renderFeed() {
  const list = document.getElementById('pipList');
  list.innerHTML = '';
  const pips = loadPips();
  pips.forEach(p => list.appendChild(createPipItem(p)));
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
const messageInput = document.getElementById('message');
const usernameError = document.getElementById('usernameError');
const messageError = document.getElementById('messageError');
const charCounter = document.getElementById('charCounter');

/** Åbn modal */
function openModal() {
  modalBackdrop.classList.add('show');
  modalBackdrop.setAttribute('aria-hidden', 'false');
  usernameInput.focus();
}

/** Luk modal og nulstil form */
function closeModal() {
  modalBackdrop.classList.remove('show');
  modalBackdrop.setAttribute('aria-hidden', 'true');
  pipForm.reset();
  charCounter.textContent = '0/255';
  usernameError.hidden = true;
  messageError.hidden = true;
}

openModalBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

// Luk modal ved klik udenfor indholdet
modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});

// Luk modal med Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalBackdrop.classList.contains('show')) {
    closeModal();
  }
});

// Karaktertæller for besked
messageInput.addEventListener('input', () => {
  const len = messageInput.value.length;
  charCounter.textContent = `${len}/255`;
});

// ------------------------------------------
// FORM VALIDERING & SUBMIT
// ------------------------------------------
pipForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Stop standard form submission

  // Trim værdier for at undgå kun mellemrum
  const username = usernameInput.value.trim();
  const message = messageInput.value.trim();

  // Simpel validering (krævet + max længder)
  let valid = true;

  if (!username || username.length > 30) {
    usernameError.hidden = false;
    valid = false;
  } else {
    usernameError.hidden = true;
  }

  if (!message || message.length > 255) {
    messageError.hidden = false;
    valid = false;
  } else {
    messageError.hidden = true;
  }

  if (!valid) return; // Afbryd hvis ugyldigt

  // Opret nyt pip-objekt – createdAt i millisekunder til sortering
  const newPip = {
    id: crypto.randomUUID(),
    username,
    message,
    createdAt: Date.now(),
  };

  // FRONTEND-ONLY (localStorage) – erstattes senere af POST /pips.php
  const pips = loadPips();
  pips.push(newPip);
  savePips(pips);

  // Opdater feed, luk modal
  renderFeed();
  closeModal();

  // Scroll til top så brugeren ser det nye pip øverst
  document.getElementById('feed').scrollTo({ top: 0, behavior: 'smooth' });

  /*
    Når backend er klar:
    fetch('pips.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, message })
    })
    .then(r => r.json())
    .then(() => {
      // Efter succes: hent ny liste
      return fetch('pips.php').then(r => r.json());
    })
    .then(data => {
      // data forventes at være en liste af pips (nyeste først)
      // renderFeedFromServer(data)
    });
  */
});

// ------------------------------------------
// INITIALISERING
// ------------------------------------------
// Seed med et par demo-pips hvis tomt – så læreren ser noget med det samme
(function seedIfEmpty() {
  const existing = loadPips();
  if (existing.length === 0) {
    const now = Date.now();
    const demo = [
      { id: crypto.randomUUID(), username: 'Admin', message: 'Velkommen til Pipper! 🎉', createdAt: now - 60000 },
      { id: crypto.randomUUID(), username: 'Victor', message: 'Første test-pip – det virker!', createdAt: now - 30000 },
    ];
    savePips(demo);
  }
})();

// Render feed ved load
renderFeed();

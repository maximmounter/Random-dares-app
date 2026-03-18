// ---- API Key ----
// const API_KEY = 'sk-ant-api03-xxxxxx...';
const API_KEY = 'YOUR_API_KEY_HERE';

// ---- State ----
let currentDare = null;
let streak = 0;
let history = [];

// ---- DOM refs ----
const dareCard    = document.getElementById('dareCard');
const dareText    = document.getElementById('dareText');
const typePill    = document.getElementById('typePill');
const diffRow     = document.getElementById('difficultyRow');
const newBtn      = document.getElementById('newBtn');
const doneBtn     = document.getElementById('doneBtn');
const skipBtn     = document.getElementById('skipBtn');
const streakNum   = document.getElementById('streakNum');
const streakBadge = document.getElementById('streakBadge');
const histSection = document.getElementById('historySection');
const histList    = document.getElementById('historyList');

// ---- Fetch a dare from Claude ----
async function fetchDare() {
  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
    dareText.textContent = 'Open script.js and paste your Anthropic API key on line 2!';
    dareText.className = 'dare-text placeholder';
    return;
  }

  setLoading(true);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: 'You generate fun morning dares. Each dare is either "fitness" or "silly" type. Fitness dares involve quick physical challenges (exercises, stretches, balance tests). Silly dares are lighthearted and fun (sing something, do a funny voice, make a face in the mirror). Respond ONLY with a raw JSON object, no markdown, no backticks, no preamble. Example: {"dare": "Do 15 jumping jacks while humming your favorite song.", "type": "fitness", "difficulty": 2}. difficulty is 1 (easy), 2 (medium), or 3 (hard).',
        messages: [
          {
            role: 'user',
            content: 'Give me one random morning dare. Mix between fitness and silly types.'
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = (data.error && data.error.message) ? data.error.message : JSON.stringify(data);
      dareText.textContent = 'API error: ' + msg;
      dareText.className = 'dare-text placeholder';
      setLoading(false);
      return;
    }

    const raw = data.content.map(b => b.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    currentDare = parsed;
    renderDare(parsed);

  } catch (err) {
    dareText.textContent = 'Error: ' + err.message;
    dareText.className = 'dare-text placeholder';
  }

  setLoading(false);
}

// ---- Render dare on card ----
function renderDare(dare) {
  const isFitness = dare.type === 'fitness';

  dareText.textContent = dare.dare;
  dareText.className = 'dare-text';

  typePill.textContent = isFitness ? 'Fitness' : 'Fun & Silly';
  typePill.className = 'type-pill ' + (isFitness ? 'fitness' : 'silly');
  typePill.style.display = 'inline-block';

  diffRow.style.display = 'flex';
  setDots(dare.difficulty || 1, isFitness ? 'green' : 'amber');

  dareCard.className = 'dare-card ' + (isFitness ? 'fitness-active' : 'silly-active');

  doneBtn.disabled = false;
  skipBtn.disabled = false;
}

// ---- Set difficulty dots ----
function setDots(level, color) {
  const suffix = color === 'green' ? 'on-green' : 'on-amber';
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById('dot' + i);
    dot.className = 'dot' + (i <= level ? ' ' + suffix : '');
  }
}

// ---- Loading state ----
function setLoading(on) {
  newBtn.disabled = on;
  doneBtn.disabled = true;
  skipBtn.disabled = true;
  dareCard.className = 'dare-card';

  if (on) {
    dareText.textContent = 'Generating your dare...';
    dareText.className = 'dare-text loading';
    typePill.style.display = 'none';
    diffRow.style.display = 'none';
    setDots(0, 'green');
  }
}

// ---- Mark done ----
function markDone() {
  if (!currentDare) return;
  addHistory(currentDare.dare, true);
  streak++;
  streakNum.textContent = streak;
  if (streak >= 3) streakBadge.classList.add('hot');
  resetCard('Nice one! Ready for another?');
}

// ---- Mark skip ----
function markSkip() {
  if (!currentDare) return;
  addHistory(currentDare.dare, false);
  resetCard('No worries - grab another dare?');
}

// ---- Reset card to idle ----
function resetCard(message) {
  currentDare = null;
  dareText.textContent = message;
  dareText.className = 'dare-text placeholder';
  typePill.style.display = 'none';
  diffRow.style.display = 'none';
  dareCard.className = 'dare-card';
  doneBtn.disabled = true;
  skipBtn.disabled = true;
  setDots(0, 'green');
}

// ---- Add to history list ----
function addHistory(dare, done) {
  history.push({ dare, done });
  histSection.style.display = 'block';

  const li = document.createElement('li');
  li.className = 'history-item';

  const snippet = dare.length > 70 ? dare.slice(0, 70) + '...' : dare;
  li.innerHTML = `<span class="dare-snippet">${snippet}</span><span class="history-status ${done ? 'status-done' : 'status-skip'}">${done ? 'Done' : 'Skipped'}</span>`;

  histList.appendChild(li);
}

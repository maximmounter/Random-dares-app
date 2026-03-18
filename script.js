// ---- State ----
let currentDare = null;
let streak = 0;
let history = [];

// ---- DOM refs ----
const dareCard   = document.getElementById('dareCard');
const dareText   = document.getElementById('dareText');
const typePill   = document.getElementById('typePill');
const diffRow    = document.getElementById('difficultyRow');
const cardGlow   = document.getElementById('cardGlow');
const newBtn     = document.getElementById('newBtn');
const doneBtn    = document.getElementById('doneBtn');
const skipBtn    = document.getElementById('skipBtn');
const streakNum  = document.getElementById('streakNum');
const streakBadge = document.getElementById('streakBadge');
const histSection = document.getElementById('historySection');
const histList    = document.getElementById('historyList');

// ---- Fetch a dare from Claude ----
async function fetchDare() {
  setLoading(true);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: `You generate fun morning dares. Each dare is either "fitness" or "silly" type.
Fitness dares: quick physical challenges (30-second exercises, balance tests, stretches, burpees, etc).
Silly dares: lighthearted and fun (sing something, do a funny voice, make a face in the mirror, etc).
Respond ONLY with a raw JSON object, no markdown, no backticks, no preamble:
{"dare": "Do 15 jumping jacks while humming your favorite song.", "type": "fitness", "difficulty": 2}
difficulty: 1 = easy, 2 = medium, 3 = hard.`,
        messages: [
          {
            role: 'user',
            content: 'Give me one random morning dare. Alternate between fitness and silly types randomly.'
          }
        ]
      })
    });

    const data = await response.json();
    const raw = data.content.map(b => b.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    currentDare = parsed;
    renderDare(parsed);

  } catch (err) {
    console.error('Error fetching dare:', err);
    dareText.textContent = 'Something went wrong — check your connection and try again.';
    dareText.className = 'dare-text placeholder';
  }

  setLoading(false);
}

// ---- Render dare on card ----
function renderDare(dare) {
  const isFitness = dare.type === 'fitness';

  // Text
  dareText.textContent = dare.dare;
  dareText.className = 'dare-text';

  // Type pill
  typePill.textContent = isFitness ? 'Fitness' : 'Fun & Silly';
  typePill.className = 'type-pill ' + (isFitness ? 'fitness' : 'silly');
  typePill.style.display = 'inline-block';

  // Difficulty dots
  diffRow.style.display = 'flex';
  setDots(dare.difficulty || 1, isFitness ? 'green' : 'amber');

  // Card glow class
  dareCard.className = 'dare-card ' + (isFitness ? 'fitness-active' : 'silly-active');

  // Enable done/skip
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
  resetCard('No worries — grab another dare?');
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

  const snippet = dare.length > 70 ? dare.slice(0, 70) + '…' : dare;

  li.innerHTML = `
    <span class="dare-snippet">${snippet}</span>
    <span class="history-status ${done ? 'status-done' : 'status-skip'}">${done ? 'Done' : 'Skipped'}</span>
  `;

  histList.appendChild(li);
}

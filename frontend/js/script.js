function enterApp(){
  const token = localStorage.getItem('skillpilot_token');
  if (!token){
    // not logged in — send them to the login/signup page instead
    window.location.href = 'login.html';
    return;
  }
  document.getElementById('landing-view').style.display = 'none';
  document.getElementById('app-view').style.display = 'block';
  window.scrollTo(0,0);
  loadLoggedInUser();
}
function exitApp(){
  document.getElementById('app-view').style.display = 'none';
  document.getElementById('landing-view').style.display = 'block';
  window.scrollTo(0,0);
}
function logout(){
  localStorage.removeItem('skillpilot_token');
  localStorage.removeItem('skillpilot_user');
  exitApp();
}

// Fetches the REAL logged-in user's data from the backend and fills the dashboard.
// This is called every time the dashboard opens, so it's always fresh — not just
// whatever was cached in localStorage at login time.
async function loadLoggedInUser(){
  const token = localStorage.getItem('skillpilot_token');
  if (!token) return;

  try {
    const result = await apiGet('/auth/me', token);
    const user = result.user;

    // keep localStorage in sync too, in case other tabs/pages read it
    localStorage.setItem('skillpilot_user', JSON.stringify(user));

    const heading = document.getElementById('welcome-heading');
    const goalEl = document.getElementById('user-goal');
    const readinessEl = document.getElementById('stat-readiness');
    const progressEl = document.getElementById('stat-progress');
    const streakEl = document.getElementById('stat-streak');

    if (heading) heading.textContent = `Welcome back, ${user.name} 👋`;
    if (goalEl) goalEl.textContent = user.goal || 'Choose your career goal';
    if (readinessEl) readinessEl.innerHTML = `${user.careerReadiness}<span style="font-size:16px;color:var(--ink-faint)">/100</span>`;
    if (progressEl) progressEl.innerHTML = `${user.roadmapProgress}<span style="font-size:16px;color:var(--ink-faint)">%</span>`;
    if (streakEl) streakEl.textContent = `${user.dayStreak} 🔥`;

    // Fill the Roadmap tab based on the real user object (js/roadmap.js) — steps come from the DB
    if (typeof renderRoadmap === 'function') renderRoadmap(user);

    // First-time user with no goal yet -> show the goal-selection screen instead of the dashboard
    if (!user.goal){
      showGoalSelection();
    }
  } catch (err) {
    console.error('Could not load user data:', err.message);
    // If the token is invalid/expired, send them back to login
    if (err.message.toLowerCase().includes('token')){
      logout();
    }
  }
}

// "Change goal" link on the dashboard — reopens the goal-selection screen anytime
const changeGoalLink = document.getElementById('change-goal-link');
if (changeGoalLink){
  changeGoalLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.side-item').forEach(i => i.classList.remove('active'));
    showGoalSelection();
  });
}

// "Cancel" link on the goal-selection screen — goes back to dashboard without changing anything
const cancelGoalSelect = document.getElementById('cancel-goal-select');
if (cancelGoalSelect){
  cancelGoalSelect.addEventListener('click', (e) => {
    e.preventDefault();
    goBackToDashboard();
  });
}

function goBackToDashboard(){
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-dashboard').classList.add('active');
  document.querySelectorAll('.side-item').forEach(i => i.classList.remove('active'));
  document.querySelector('.side-item[data-tab="dashboard"]').classList.add('active');
}

function goToRoadmapTab(){
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-roadmap').classList.add('active');
  document.querySelectorAll('.side-item').forEach(i => i.classList.remove('active'));
  document.querySelector('.side-item[data-tab="roadmap"]').classList.add('active');
}

function showGoalSelection(){
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-goal-select').classList.add('active');
}

// Goal submit — free text, ANY goal. Calls the AI roadmap generator (Gemini),
// which saves the goal + a freshly generated roadmap to MongoDB in one call.
const goalSubmitBtn = document.getElementById('goal-submit-btn');
if (goalSubmitBtn){
  goalSubmitBtn.addEventListener('click', async () => {
    const input = document.getElementById('goal-input');
    const errorEl = document.getElementById('goal-select-error');
    const goal = input.value.trim();
    const token = localStorage.getItem('skillpilot_token');

    if (!goal){
      errorEl.textContent = 'Please type a goal first';
      return;
    }

    errorEl.textContent = '';
    goalSubmitBtn.disabled = true;
    goalSubmitBtn.textContent = 'Generating your roadmap... (few seconds)';

    try {
      const result = await apiPost('/ai/roadmap', { goal }, token);
      localStorage.setItem('skillpilot_user', JSON.stringify(result.user));

      await loadLoggedInUser(); // refresh dashboard data + render the new roadmap BEFORE navigating
      goToRoadmapTab(); // land the user right where the new roadmap is, not the dashboard
    } catch (err) {
      errorEl.textContent = err.message || 'Something went wrong generating your roadmap';
    } finally {
      goalSubmitBtn.disabled = false;
      goalSubmitBtn.textContent = 'Generate my roadmap →';
    }
  });
}

// If the user just logged in (login.html redirects here with ?enter=true),
// automatically open the dashboard instead of showing the landing page again.
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('enter') === 'true' && localStorage.getItem('skillpilot_token')){
    enterApp();
  }
});
document.querySelectorAll('.side-item').forEach(item=>{
  item.addEventListener('click', ()=>{
    document.querySelectorAll('.side-item').forEach(i=>i.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    item.classList.add('active');
    document.getElementById('tab-' + item.dataset.tab).classList.add('active');
  });
});

/* ================= AI MENTOR — real chatbot via Gemini API ================= */

function appendChatMsg(text, sender){
  const wrap = document.getElementById('chat-wrap');
  const msg = document.createElement('div');
  msg.className = 'chat-msg ' + sender;
  msg.textContent = text;
  wrap.appendChild(msg);
  wrap.scrollTop = wrap.scrollHeight;
}

async function sendChatMessage(){
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const text = input.value.trim();
  if (!text) return;

  appendChatMsg(text, 'user');
  input.value = '';
  sendBtn.disabled = true;

  // small "typing..." indicator while we wait for the real AI response
  appendChatMsg('Typing...', 'bot');
  const wrap = document.getElementById('chat-wrap');
  const typingMsgEl = wrap.lastElementChild;

  try {
    const token = localStorage.getItem('skillpilot_token');
    const result = await apiPost('/ai/chat', { message: text }, token);
    typingMsgEl.textContent = result.reply;
  } catch (err) {
    typingMsgEl.textContent = "Sorry, I couldn't reach the AI right now — " + (err.message || 'please try again.');
  } finally {
    sendBtn.disabled = false;
  }
}

const chatSendBtn = document.getElementById('chat-send');
const chatInputEl = document.getElementById('chat-input');
if (chatSendBtn && chatInputEl){
  chatSendBtn.addEventListener('click', sendChatMessage);
  chatInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });
}

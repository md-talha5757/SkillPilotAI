// js/industryDashboard.js
// Handles the "Industry Demand" tab: posting a skill requirement + rendering the aggregate chart

const INDUSTRY_API_BASE = 'http://localhost:5001/api/industry';

let industryChart = null; // keep reference so repeated refreshes don't stack chart instances

function getThemeColor(varName, fallback){
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
}

async function fetchAggregateDemand(){
  try {
    const res = await fetch(`${INDUSTRY_API_BASE}/demand/aggregate`);
    const data = await res.json();
    renderIndustryChart(data);
  } catch (err) {
    console.error('Failed to fetch aggregate demand:', err);
  }
}

function renderIndustryChart(data){
  const canvas = document.getElementById('industryChart');
  const emptyState = document.getElementById('industryEmptyState');
  if (!canvas) return; // tab not in DOM yet (safety check)

  if (!data || data.length === 0){
    canvas.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  canvas.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  const labels = data.map(d => d.skill);
  const counts = data.map(d => d.count);
  const palette = [
    getThemeColor('--acc-purple', '#7C3AED'),
    getThemeColor('--acc-pink', '#EC4899'),
    getThemeColor('--acc-teal', '#0EA5A8'),
    getThemeColor('--acc-orange', '#F59E0B'),
    getThemeColor('--acc-blue', '#2563EB'),
    getThemeColor('--acc-green', '#16A34A')
  ];
  const barColors = labels.map((_, i) => palette[i % palette.length]);
  const border = getThemeColor('--border', '#E8E8F0');
  const inkSoft = getThemeColor('--ink-soft', '#5B5D70');

  if (industryChart) industryChart.destroy();

  industryChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Demand count',
        data: counts,
        backgroundColor: barColors,
        borderRadius: 8,
        maxBarThickness: 42
      }]
    },
    options: {
      responsive: true,
      animation: { duration: 900, easing: 'easeOutBack' },
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, color: inkSoft }, grid: { color: border } },
        x: { ticks: { color: inkSoft }, grid: { display: false } }
      }
    }
  });
}

async function handleIndustryPost(){
  const companyName = document.getElementById('industryCompanyName').value.trim();
  const role = document.getElementById('industryRole').value.trim();
  const skillInput = document.getElementById('industrySkills').value.trim();
  const messageEl = document.getElementById('industryFormMessage');
  const btn = document.getElementById('industryPostBtn');

  if (!companyName || !role || !skillInput){
    messageEl.textContent = 'Please fill all fields';
    return;
  }

  const skillRequired = skillInput.split(',').map(s => s.trim()).filter(Boolean);

  btn.disabled = true;
  messageEl.textContent = '';

  try {
    const res = await fetch(`${INDUSTRY_API_BASE}/demand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, role, skillRequired })
    });

    if (!res.ok) throw new Error('Submit failed');

    messageEl.style.color = 'var(--earn)';
    messageEl.textContent = 'Demand posted successfully!';
    document.getElementById('industryCompanyName').value = '';
    document.getElementById('industryRole').value = '';
    document.getElementById('industrySkills').value = '';
    fetchAggregateDemand();
  } catch (err) {
    messageEl.style.color = '#D92D20';
    messageEl.textContent = 'Something went wrong, please try again';
    console.error(err);
  } finally {
    btn.disabled = false;
  }
}

const industryPostBtn = document.getElementById('industryPostBtn');
if (industryPostBtn){
  industryPostBtn.addEventListener('click', handleIndustryPost);
  fetchAggregateDemand(); // load chart on page load
  loadMatchScores();
}

async function loadMatchScores(){
  const token = localStorage.getItem('skillpilot_token');
  if (!token) return; // not logged in, skip silently

  const listEl = document.getElementById('matchScoreList');
  if (!listEl) return;

  try {
    const res = await fetch(`${INDUSTRY_API_BASE}/match-scores`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const scores = await res.json();

    if (!scores.length){
      listEl.innerHTML = '<p style="color:var(--ink-soft);font-size:14px;">No industry demands posted yet.</p>';
      return;
    }

    listEl.innerHTML = scores.map(s => `
      <div class="opp-card">
        <div>
          <div class="opp-title">${s.role} @ ${s.companyName}</div>
          <div class="opp-meta">${s.skillRequired.join(', ')}</div>
        </div>
        <div class="match-chip">${s.matchPercent}% match</div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load match scores:', err);
  }
}

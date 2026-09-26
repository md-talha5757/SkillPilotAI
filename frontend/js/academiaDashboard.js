// js/academiaDashboard.js
// Academia Dashboard tab — top skill gaps across all students + cohort stats.
// Uses EXISTING student roadmap data, no new data entry needed.

const ACADEMIA_API_BASE = 'http://localhost:5001/api/academia';

let academiaChart = null;

async function loadAcademiaDashboard() {
  try {
    const res = await fetch(`${ACADEMIA_API_BASE}/skill-gaps`);
    const data = await res.json();

    document.getElementById('academiaTotalStudents').textContent = data.totalStudents ?? 0;
    document.getElementById('academiaAvgCompletion').textContent = (data.avgCompletion ?? 0) + '%';

    renderAcademiaChart(data.topGaps || []);
  } catch (err) {
    console.error('Failed to load academia dashboard:', err);
  }
}

function renderAcademiaChart(topGaps) {
  const canvas = document.getElementById('academiaChart');
  const emptyState = document.getElementById('academiaEmptyState');
  if (!canvas) return;

  if (!topGaps.length) {
    canvas.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  canvas.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  const labels = topGaps.map(g => g.skill);
  const counts = topGaps.map(g => g.count);

  const style = getComputedStyle(document.documentElement);
  const accent = style.getPropertyValue('--acc-green').trim() || '#16A34A';
  const border = style.getPropertyValue('--border').trim() || '#E8E8F0';
  const inkSoft = style.getPropertyValue('--ink-soft').trim() || '#5B5D70';

  if (academiaChart) academiaChart.destroy();

  academiaChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Students stuck on this skill',
        data: counts,
        backgroundColor: accent,
        borderRadius: 8,
        maxBarThickness: 36
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      animation: { duration: 700 },
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { stepSize: 1, color: inkSoft }, grid: { color: border } },
        y: { ticks: { color: inkSoft }, grid: { display: false } }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('tab-academia')) {
    loadAcademiaDashboard();
  }
});

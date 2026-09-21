const jobSearchBtn = document.getElementById('job-search-btn');
const jobSearchInput = document.getElementById('job-search-input');

async function searchJobs(){
  const keyword = jobSearchInput.value.trim();
  const errorEl = document.getElementById('job-search-error');
  const jobsList = document.getElementById('jobs-list');

  errorEl.textContent = '';
  jobSearchBtn.disabled = true;
  jobSearchBtn.textContent = 'Searching...';
  jobsList.innerHTML = `<p style="color:var(--ink-soft);font-size:14px;">Loading jobs...</p>`;

  try {
    const token = localStorage.getItem('skillpilot_token');
    const result = await apiGet(`/jobs?keyword=${encodeURIComponent(keyword)}`, token);

    if (result.jobs && result.jobs.length){
      jobsList.innerHTML = result.jobs.map(j => `
        <div class="opp-card">
          <div>
            <div class="opp-title">${j.title}</div>
            <div class="opp-meta">${j.company} · ${j.type || 'Remote'} · ${j.category || ''}</div>
          </div>
          <a href="${j.url}" target="_blank" class="pill">Apply</a>
        </div>
      `).join('');
    } else {
      jobsList.innerHTML = `<p style="color:var(--ink-soft);font-size:14px;">No jobs found for that search — try a broader keyword.</p>`;
    }
  } catch (err) {
    errorEl.textContent = err.message || 'Something went wrong searching for jobs';
  } finally {
    jobSearchBtn.disabled = false;
    jobSearchBtn.textContent = 'Search';
  }
}

if (jobSearchBtn){
  jobSearchBtn.addEventListener('click', searchJobs);
  jobSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchJobs();
  });

  // Pre-fill the search with the user's real goal once it loads, and auto-search once
  const cachedUser = localStorage.getItem('skillpilot_user');
  if (cachedUser){
    try {
      const user = JSON.parse(cachedUser);
      if (user.goal) jobSearchInput.value = user.goal;
    } catch {}
  }
}

const courseSearchBtn = document.getElementById('course-search-btn');
const courseSearchInput = document.getElementById('course-search-input');

async function searchCourses(){
  const topic = courseSearchInput.value.trim();
  const errorEl = document.getElementById('course-search-error');
  const platformsList = document.getElementById('course-platforms-list');
  const videosList = document.getElementById('course-videos-list');

  if (!topic){
    errorEl.textContent = 'Please type a topic first';
    return;
  }

  errorEl.textContent = '';
  courseSearchBtn.disabled = true;
  courseSearchBtn.textContent = 'Searching...';
  platformsList.innerHTML = `<p style="color:var(--ink-soft);font-size:14px;">Loading recommendations...</p>`;
  videosList.innerHTML = '';

  try {
    const token = localStorage.getItem('skillpilot_token');
    const result = await apiGet(`/courses?topic=${encodeURIComponent(topic)}`, token);

    // Render AI-recommended platforms
    if (result.platforms && result.platforms.length){
      platformsList.innerHTML = result.platforms.map(p => `
        <div class="resource-card">
          <div>
            <div class="resource-tag">${p.type || ''}</div>
            <div class="resource-title">${p.platform}</div>
            <div class="resource-meta">${p.why || ''}</div>
          </div>
        </div>
      `).join('');
    } else {
      platformsList.innerHTML = `<p style="color:var(--ink-soft);font-size:14px;">No platform suggestions available right now.</p>`;
    }

    // Render real YouTube videos
    if (result.videos && result.videos.length){
      videosList.innerHTML = result.videos.map(v => `
        <div class="resource-card">
          <div>
            <div class="resource-tag">YouTube</div>
            <div class="resource-title">${v.title}</div>
            <div class="resource-meta">${v.channel}</div>
          </div>
          <a href="${v.url}" target="_blank" class="pill">Watch</a>
        </div>
      `).join('');
    } else {
      videosList.innerHTML = `<p style="color:var(--ink-soft);font-size:14px;">No YouTube results — check that YOUTUBE_API_KEY is set in the backend .env, or try a different topic.</p>`;
    }
  } catch (err) {
    errorEl.textContent = err.message || 'Something went wrong searching for courses';
  } finally {
    courseSearchBtn.disabled = false;
    courseSearchBtn.textContent = 'Search';
  }
}

if (courseSearchBtn){
  courseSearchBtn.addEventListener('click', searchCourses);
  courseSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchCourses();
  });
}

// Auto-fill with the user's real goal and search automatically the FIRST time
// they open the Resources tab, so it isn't just a blank search box.
let resourcesAutoSearched = false;
const resourcesSideItem = document.querySelector('.side-item[data-tab="resources"]');
if (resourcesSideItem){
  resourcesSideItem.addEventListener('click', () => {
    if (resourcesAutoSearched) return; // only auto-search once per session
    resourcesAutoSearched = true;

    const cachedUser = localStorage.getItem('skillpilot_user');
    if (!cachedUser) return;
    try {
      const user = JSON.parse(cachedUser);
      if (user.goal && courseSearchInput){
        courseSearchInput.value = user.goal;
        searchCourses();
      }
    } catch {}
  });
}

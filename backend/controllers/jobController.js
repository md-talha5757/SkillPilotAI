// GET /api/jobs?keyword=...  (protected)
// Uses Remotive's free, public, no-key-required API for real remote job listings.
// https://remotive.com/api-documentation
async function getJobRecommendations(req, res) {
  try {
    const keyword = req.query.keyword || '';
    const url = `https://remotive.com/api/remote-jobs${keyword ? `?search=${encodeURIComponent(keyword)}` : ''}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Job listing service is unavailable right now');
    }
    const data = await response.json();

    const jobs = (data.jobs || []).slice(0, 8).map((job) => ({
      title: job.title,
      company: job.company_name,
      type: job.job_type,
      url: job.url,
      category: job.category,
    }));

    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching jobs', error: err.message });
  }
}

module.exports = { getJobRecommendations };

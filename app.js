/* =========================
   Profile (profile.html)
========================= */
const profileContainer = document.getElementById("profile-container");

if (profileContainer) {
  const params = new URLSearchParams(window.location.search);
  const profileId = params.get("id");

  const renderProfile = (p) => {
    const name = escapeHtml(p?.name || "");
    const headline = escapeHtml(p?.headline || "");
    const location = escapeHtml(p?.location || "");
    const phone = escapeHtml(p?.phone || "");
    const bio = escapeHtml(p?.bio || "");
    const skills = escapeHtml(p?.skills || "");

    // ✅ Salary text
    const salary = (p?.salary_min || p?.salary_max)
      ? `${p?.salary_min || "?"} - ${p?.salary_max || "?"} USD`
      : "Not specified";

    // ✅ Avatar
    const avatar = p?.avatar_url
      ? `<img src="${escapeHtml(p.avatar_url)}" alt="Avatar" class="avatar" loading="lazy" decoding="async" width="160" height="160">`
      : `<div class="avatar placeholder">No Photo</div>`;

    // ✅ CV card (still using cv_url link)
    const cvLink = p?.cv_url
      ? `
        <div class="cv-card">
          <div class="cv-left">
            <div class="cv-icon">CV</div>
            <div class="cv-meta">
              <p class="cv-title">Resume</p>
              <p class="cv-sub">Open or download the CV file</p>
            </div>
          </div>

          <div class="cv-actions">
            <a class="btn btn-small" href="${escapeHtml(p.cv_url)}" target="_blank" rel="noopener">View</a>
            <a class="btn btn-small btn-outline" href="${escapeHtml(p.cv_url)}" download>Download</a>
          </div>
        </div>
      `
      : `
        <div class="cv-card">
          <div class="cv-left">
            <div class="cv-icon">CV</div>
            <div class="cv-meta">
              <p class="cv-title">No CV yet</p>
              <p class="cv-sub">This user didn’t upload a resume.</p>
            </div>
          </div>
        </div>
      `;

    // ✅ Render HTML (salary is inside template now)
    profileContainer.innerHTML = `
      <div class="profile-card">
        <div class="profile-header">
          ${avatar}
          <div class="profile-info">
            <h1>${name}</h1>
            <p><strong>${headline}</strong></p>
            <p>${location}</p>
            <p>${phone}</p>
            <p><strong>Salary:</strong> ${salary}</p>
          </div>
        </div>

        <hr/>

        <h3>About</h3>
        <p>${bio}</p>

        <h3>Skills</h3>
        <p>${skills}</p>

        <h3>CV</h3>
        ${cvLink}
      </div>
    `;
  };

  const loadProfile = async () => {
    if (!profileId) {
      profileContainer.innerHTML = "<p>No profile id in URL.</p>";
      return;
    }

    const { data, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (error) {
      console.error(error);
      profileContainer.innerHTML = `<p>Error loading profile: ${escapeHtml(error.message)}</p>`;
      return;
    }

    renderProfile(data);
  };

  loadProfile();
}
console.log("APP JS VERSION 101 (fast avatars + upgraded search)");

const SUPABASE_URL = "https://fknmufaymoefcvljnitu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_rETTErV0GMfPB-xM73nDWw_777TD36v";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* =========================
   Helpers
========================= */
function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

// ✅ Compress image BEFORE upload (makes it small + loads fast)
async function compressImage(file) {
  const img = document.createElement("img");
  const url = URL.createObjectURL(file);

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });

  const maxSize = 512;  // px
  const quality = 0.75; // 0.1 - 1

  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  URL.revokeObjectURL(url);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );

  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}

/* =========================
   Register (register.html)
========================= */
const registerForm = document.getElementById("register-form");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const headline = document.getElementById("headline").value.trim();
    const skills = document.getElementById("skills").value.trim();
    const location = document.getElementById("location").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const bio = document.getElementById("bio").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // ✅ change const -> let (so we can compress it)
    let avatarFile = document.getElementById("avatar")?.files?.[0] || null;

    try {
      // ✅ compress avatar if exists
      if (avatarFile) {
        avatarFile = await compressImage(avatarFile);
      }

      // 1) Sign up
      const { error: signUpError } = await supabaseClient.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;

      // 2) Sign in (to get session for RLS)
      const { data: signInData, error: signInError } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });
      if (signInError) throw signInError;

      const userId = signInData.user.id;

      // 3) Upload avatar (optional)
      let avatarUrl = null;

      if (avatarFile) {
        // ✅ always jpg (faster + consistent)
        const fileName = `public/${userId}.jpg`;

        const { error: uploadError } = await supabaseClient
          .storage
          .from("avatars")
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabaseClient
          .storage
          .from("avatars")
          .getPublicUrl(fileName);

        avatarUrl = data.publicUrl;
      }

      // 4) Insert profile
      const { error: profileError } = await supabaseClient
        .from("profiles")
        .insert([{
          user_id: userId,
          name,
          headline,
          skills,
          location,
          phone,
          bio,
          avatar_url: avatarUrl,
          cv_url: null,
        }]);

      if (profileError) throw profileError;

      alert("Registration successful ✅");
      registerForm.reset();
      window.location.href = "./search.html";
    } catch (err) {
      console.error(err);
      alert("Error: " + (err?.message || "Something went wrong"));
    }
  });
}

/* =========================
   Search (search.html) - 3 fields
========================= */
const keywordEl = document.getElementById("search-keyword");
const locationEl = document.getElementById("search-location");
const roleEl = document.getElementById("search-role");
const searchBtn = document.getElementById("search-btn");
const clearBtn = document.getElementById("clear-btn");
const resultsDiv = document.getElementById("results");
const resultsCountEl = document.getElementById("results-count");
const loadingEl = document.getElementById("loading");

if (searchBtn && resultsDiv) {
  const renderProfiles = (profiles) => {
    if (!profiles || profiles.length === 0) {
      resultsDiv.innerHTML = `<div class="search-panel" style="margin-top:14px;">No profiles found.</div>`;
      return;
    }

    resultsDiv.innerHTML = profiles.map((p) => {
      const id = p.id;
      const name = escapeHtml(p.name || "Unnamed");
      const headline = escapeHtml(p.headline || "—");
      const location = escapeHtml(p.location || "Lebanon");
      const avatar = p.avatar_url || "https://via.placeholder.com/80?text=User";

      return `
        <a class="result-card" href="./profile.html?id=${encodeURIComponent(id)}">
          <div class="result-top">
            <img
              class="result-avatar"
              src="${escapeHtml(avatar)}"
              alt="avatar"
              loading="lazy"
              decoding="async"
              width="54"
              height="54"
            />
            <div>
              <h3 class="result-name">${name}</h3>
              <p class="result-headline">${headline}</p>
            </div>
          </div>
          <div class="result-meta">${location}</div>
        </a>
      `;
    }).join("");
  };

  const loadAllProfiles = async () => {
    if (loadingEl) loadingEl.style.display = "inline";
    if (resultsCountEl) resultsCountEl.textContent = "Loading latest profiles…";

    const { data, error } = await supabaseClient
      .from("profiles")
      .select("id, name, headline, location, avatar_url, skills")
      .order("created_at", { ascending: false })
      .limit(60);

    if (loadingEl) loadingEl.style.display = "none";

    if (error) {
      console.error(error);
      resultsDiv.innerHTML = `<div class="search-panel" style="margin-top:14px;">Error loading profiles: ${escapeHtml(error.message)}</div>`;
      if (resultsCountEl) resultsCountEl.textContent = "0 results";
      return;
    }

    if (resultsCountEl) resultsCountEl.textContent = `Showing latest (${data.length})`;
    renderProfiles(data);
  };

  const searchProfiles = async () => {
    const keyword = (keywordEl?.value || "").trim();
    const location = (locationEl?.value || "").trim();
    const role = (roleEl?.value || "").trim();

    if (loadingEl) loadingEl.style.display = "inline";
    if (resultsCountEl) resultsCountEl.textContent = "Searching…";

    let query = supabaseClient
      .from("profiles")
      .select("id, name, headline, location, avatar_url, skills")
      .order("created_at", { ascending: false })
      .limit(60);

    if (keyword) {
      const k = keyword.replaceAll(",", " ");
      query = query.or(`name.ilike.%${k}%,headline.ilike.%${k}%,skills.ilike.%${k}%`);
    }

    if (location) {
      query = query.ilike("location", `%${location}%`);
    }

    if (role) {
      query = query.or(`headline.ilike.%${role}%,skills.ilike.%${role}%`);
    }

    const { data, error } = await query;

    if (loadingEl) loadingEl.style.display = "none";

    if (error) {
      console.error(error);
      resultsDiv.innerHTML = `<div class="search-panel" style="margin-top:14px;">Error searching: ${escapeHtml(error.message)}</div>`;
      if (resultsCountEl) resultsCountEl.textContent = "0 results";
      return;
    }

    if (resultsCountEl) resultsCountEl.textContent = `${data.length} result${data.length === 1 ? "" : "s"}`;
    renderProfiles(data);
  };

  searchBtn.addEventListener("click", searchProfiles);

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (keywordEl) keywordEl.value = "";
      if (locationEl) locationEl.value = "";
      if (roleEl) roleEl.value = "";
      if (resultsCountEl) resultsCountEl.textContent = "Showing latest profiles";
      loadAllProfiles();
    });
  }

  if (keywordEl) {
    keywordEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") searchProfiles();
    });
  }

  loadAllProfiles();
}

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

    const avatar = p?.avatar_url
      ? `<img src="${escapeHtml(p.avatar_url)}" alt="Avatar" class="avatar" loading="lazy" decoding="async" width="160" height="160">`
      : `<div class="avatar placeholder">No Photo</div>`;
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

    profileContainer.innerHTML = `
      <div class="profile-card">
        <div class="profile-header">
          ${avatar}
          <div class="profile-info">
            <h1>${name}</h1>
            <p><strong>${headline}</strong></p>
            <p>${location}</p>
            <p>${phone}</p>
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
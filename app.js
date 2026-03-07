/* =========================
   Search (search.html)
========================= */
const keywordEl = document.getElementById("search-keyword");
const locationEl = document.getElementById("search-location");
const roleEl = document.getElementById("search-role");
const clearBtn = document.getElementById("clear-btn");
const resultsDiv = document.getElementById("results");
const resultsCountEl = document.getElementById("results-count");
const loadingEl = document.getElementById("loading");

if (resultsDiv) {
  const renderProfiles = (profiles) => {
    if (!profiles || profiles.length === 0) {
      resultsDiv.innerHTML = `<div class="search-panel" style="margin-top:14px;">No profiles found.</div>`;
      if (resultsCountEl) resultsCountEl.textContent = "0 results";
      return;
    }

    resultsDiv.innerHTML = profiles.map((p) => {
      const id = p.id;
      const name = p.name || "Unnamed";
      const headline = p.headline || "—";
      const location = p.location || "Lebanon";
      const avatar = p.avatar_url || "https://via.placeholder.com/80?text=User";

      return `
        <a class="result-card" href="./profile.html?id=${encodeURIComponent(id)}">
          <div class="result-top">
            <img
              class="result-avatar"
              src="${avatar}"
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

    const { data, error } = await window.supabaseClient
      .from("profiles")
      .select("id, name, headline, location, avatar_url, skills")
      .order("created_at", { ascending: false })
      .limit(60);

    if (loadingEl) loadingEl.style.display = "none";

    if (error) {
      console.error("❌ Search load error:", error);
      resultsDiv.innerHTML = `<div class="search-panel" style="margin-top:14px;">Error loading profiles.</div>`;
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

    if (!keyword && !location && !role) {
      loadAllProfiles();
      return;
    }

    if (loadingEl) loadingEl.style.display = "inline";
    if (resultsCountEl) resultsCountEl.textContent = "Searching…";

    let query = window.supabaseClient
      .from("profiles")
      .select("id, name, headline, location, avatar_url, skills")
      .order("created_at", { ascending: false })
      .limit(60);

    if (keyword) {
      query = query.or(`name.ilike.%${keyword}%,headline.ilike.%${keyword}%,skills.ilike.%${keyword}%`);
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
      console.error("❌ Search filter error:", error);
      resultsDiv.innerHTML = `<div class="search-panel" style="margin-top:14px;">Error searching profiles.</div>`;
      if (resultsCountEl) resultsCountEl.textContent = "0 results";
      return;
    }

    if (resultsCountEl) resultsCountEl.textContent = `${data.length} result${data.length === 1 ? "" : "s"}`;
    renderProfiles(data);
  };

  let timer = null;
  const runAutoSearch = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      searchProfiles();
    }, 350);
  };

  if (keywordEl) keywordEl.addEventListener("input", runAutoSearch);
  if (locationEl) locationEl.addEventListener("input", runAutoSearch);
  if (roleEl) roleEl.addEventListener("input", runAutoSearch);

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (keywordEl) keywordEl.value = "";
      if (locationEl) locationEl.value = "";
      if (roleEl) roleEl.value = "";
      loadAllProfiles();
    });
  }

  loadAllProfiles();
}
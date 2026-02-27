// 1) Connect to Supabase (fill these in)
console.log("NEW VERSION LIVE");

const SUPABASE_URL = "https://fknmufaymoefcvljnitu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_rETTErV0GMfPB-xM73nDWw_777TD36v";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Handle registration form submit (register.html)
const registerForm = document.getElementById("register-form");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1) Read values from the form
    const name = document.getElementById("name").value.trim();
    const headline = document.getElementById("headline").value.trim();
    const skills = document.getElementById("skills").value.trim();
    const location = document.getElementById("location").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const bio = document.getElementById("bio").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      // 2) Create user in Supabase Auth
      const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      const userId = signUpData.user.id;

      // 3) Insert CV/profile info into the "profiles" table
      const { error: profileError } = await supabaseClient
        .from("profiles")
        .insert([
          {
            user_id: userId,
            name,
            headline,
            skills,
            location,
            phone,
            bio,    
            avatar_url: null,
            cv_url: null,
          },
        ]);

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

// --- Public Search (search.html) ---
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const resultsDiv = document.getElementById("results");

if (searchInput && searchBtn && resultsDiv) {
  // render cards
  const renderProfiles = (profiles) => {
    if (!profiles || profiles.length === 0) {
      resultsDiv.innerHTML = "<p>No profiles found.</p>";
      return;
    }

    resultsDiv.innerHTML = profiles
      .map((p) => {
        const safeName = p.name || "";
        const safeHeadline = p.headline || "";
        const safeLocation = p.location || "";
        const id = p.id;

        return `
          <div class="card">
            <div class="card-body">
              <h3>${safeName}</h3>
              <p><strong>${safeHeadline}</strong></p>
              <p>${safeLocation}</p>
              <a class="btn btn-small" href="./profile.html?id=${id}">View Profile</a>
            </div>
          </div>
        `;
      })
      .join("");
  };

  // load all on page open
  const loadAllProfiles = async () => {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("id, name, headline, location")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      resultsDiv.innerHTML = `<p>Error loading profiles: ${error.message}</p>`;
      return;
    }

    renderProfiles(data);
  };

  // search by name
  const searchProfiles = async () => {
    const q = searchInput.value.trim();

    let query = supabaseClient
      .from("profiles")
      .select("id, name, headline, location")
      .order("created_at", { ascending: false });

    if (q) {
      // case-insensitive "contains"
      query = query.ilike("name", `%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      resultsDiv.innerHTML = `<p>Error searching: ${error.message}</p>`;
      return;
    }

    renderProfiles(data);
  };

  searchBtn.addEventListener("click", searchProfiles);

  // Press Enter to search
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchProfiles();
  });

  loadAllProfiles();
}
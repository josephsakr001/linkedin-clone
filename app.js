console.log("APP JS RUNNING");

/* =========================
   Supabase Client
========================= */
const supabaseClient = window.supabaseClient;

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

    const salaryMin = parseInt(document.getElementById("salary-min")?.value || 0, 10);
    const salaryMax = parseInt(document.getElementById("salary-max")?.value || 0, 10);

    const avatarFile = document.getElementById("avatar")?.files?.[0] || null;

    try {
      const { data: signUpData, error: signUpError } =
        await supabaseClient.auth.signUp({ email, password });

      if (signUpError) throw signUpError;

      let userId = signUpData?.user?.id;

      if (!userId) {
        const { data: signInData, error: signInError } =
          await supabaseClient.auth.signInWithPassword({ email, password });

        if (signInError) throw signInError;
        userId = signInData.user.id;
      }

      let avatarUrl = null;

      if (avatarFile) {
        const fileName = `public/${userId}.jpg`;

        const { error: uploadError } = await supabaseClient.storage
          .from("avatars")
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabaseClient.storage
          .from("avatars")
          .getPublicUrl(fileName);

        avatarUrl = data.publicUrl;
      }

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
          salary_min: salaryMin || null,
          salary_max: salaryMax || null,
          avatar_url: avatarUrl
        }]);

      if (profileError) throw profileError;

      alert("Registration successful ✅");
      registerForm.reset();
      window.location.href = "./search.html";
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  });
}

/* =========================
   Search (search.html)
========================= */
const resultsDiv = document.getElementById("results");

if (resultsDiv) {
  const keywordEl = document.getElementById("search-keyword");
  const locationEl = document.getElementById("search-location");
  const roleEl = document.getElementById("search-role");

  const renderProfiles = (profiles) => {
    if (!profiles || profiles.length === 0) {
      resultsDiv.innerHTML = "<p>No profiles found.</p>";
      return;
    }

    resultsDiv.innerHTML = profiles.map((p) => {
      const avatar = p.avatar_url || "https://via.placeholder.com/80?text=User";

      return `
        <a class="result-card" href="./profile.html?id=${p.id}">
          <div class="result-top">
            <img class="result-avatar" src="${avatar}" alt="Avatar" loading="lazy" decoding="async" />
            <div>
              <h3>${p.name || ""}</h3>
              <p>${p.headline || ""}</p>
            </div>
          </div>

          <div class="result-meta">
            ${p.location || ""}
          </div>
        </a>
      `;
    }).join("");
  };

  const loadProfiles = async () => {
    let query = supabaseClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const keyword = keywordEl?.value.trim();
    const location = locationEl?.value.trim();
    const role = roleEl?.value.trim();

    if (keyword) {
      query = query.ilike("name", `%${keyword}%`);
    }

    if (location) {
      query = query.ilike("location", `%${location}%`);
    }

    if (role) {
      query = query.or(`headline.ilike.%${role}%,skills.ilike.%${role}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      resultsDiv.innerHTML = "<p>Error loading profiles.</p>";
      return;
    }

    renderProfiles(data);
  };

  loadProfiles();

  keywordEl?.addEventListener("input", loadProfiles);
  locationEl?.addEventListener("input", loadProfiles);
  roleEl?.addEventListener("input", loadProfiles);
}

/* =========================
   Profile Page (profile.html)
========================= */
const profileContainer = document.getElementById("profile-container");

if (profileContainer) {
  const params = new URLSearchParams(window.location.search);
  const profileId = params.get("id");

  const loadProfile = async () => {
    if (!profileId) {
      profileContainer.innerHTML = "<p>No profile id.</p>";
      return;
    }

    profileContainer.innerHTML = "<p>Loading profile...</p>";

    const { data, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (error) {
      console.error(error);
      profileContainer.innerHTML = "<p>Error loading profile.</p>";
      return;
    }

    const { data: authData } = await supabaseClient.auth.getUser();
    const currentUserId = authData?.user?.id || null;
    const isOwner = currentUserId && currentUserId === data.user_id;

    const avatar = data.avatar_url || "https://via.placeholder.com/150?text=User";

    const salary =
      data.salary_min || data.salary_max
        ? `${data.salary_min || "?"} - ${data.salary_max || "?"} USD`
        : "Not specified";

    const skillsList = (data.skills || "")
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean)
      .map((skill) => `<span class="skill-tag">${skill}</span>`)
      .join("");

    profileContainer.innerHTML = `
      <div class="simple-profile">
        <div class="simple-profile-topbar"></div>

        <div class="simple-profile-header">
          <img src="${avatar}" class="simple-profile-avatar" alt="Avatar" />

          <div class="simple-profile-info">
            <h1>${data.name || "No name"}</h1>
            <p class="simple-headline">${data.headline || "No headline yet."}</p>
            ${isOwner ? `<a href="./edit-profile.html" class="edit-profile-btn">Edit Profile</a>` : ""}
          </div>
        </div>

        <div class="simple-profile-section">
          <h3>Details</h3>
          <div class="profile-details-grid">
            <div class="detail-box">
              <span class="detail-label">Location</span>
              <strong>${data.location || "Not provided"}</strong>
            </div>

            <div class="detail-box">
              <span class="detail-label">Phone</span>
              <strong>${data.phone || "Not provided"}</strong>
            </div>

            <div class="detail-box">
              <span class="detail-label">Salary</span>
              <strong>${salary}</strong>
            </div>
          </div>
        </div>

        <div class="simple-profile-section">
          <h3>About</h3>
          <p>${data.bio || "No bio yet."}</p>
        </div>

        <div class="simple-profile-section">
          <h3>Skills</h3>
          <div class="skills-wrap">
            ${skillsList || '<span class="no-skills">No skills added yet.</span>'}
          </div>
        </div>
      </div>
    `;
  };

  loadProfile();
}
/* =========================
   Edit Profile Page (edit-profile.html)
========================= */
const editProfileForm = document.getElementById("edit-profile-form");

if (editProfileForm) {
  let currentProfileId = null;

  const loadEditProfile = async () => {
    try {
      const { data: authData, error: authError } = await supabaseClient.auth.getUser();

      if (authError || !authData?.user) {
        alert("You must be logged in to edit your profile.");
        window.location.href = "./login.html";
        return;
      }

      const userId = authData.user.id;

      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError || !profile) {
        console.error(profileError);
        alert("Could not load profile.");
        return;
      }

      currentProfileId = profile.id;

      document.getElementById("edit-name").value = profile.name || "";
      document.getElementById("edit-headline").value = profile.headline || "";
      document.getElementById("edit-skills").value = profile.skills || "";
      document.getElementById("edit-location").value = profile.location || "";
      document.getElementById("edit-phone").value = profile.phone || "";
      document.getElementById("edit-bio").value = profile.bio || "";
      document.getElementById("edit-salary-min").value = profile.salary_min || "";
      document.getElementById("edit-salary-max").value = profile.salary_max || "";
    } catch (err) {
      console.error(err);
      alert("Error loading edit page.");
    }
  };

  loadEditProfile();

  editProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const { data: authData, error: authError } = await supabaseClient.auth.getUser();

      if (authError || !authData?.user) {
        alert("You must be logged in.");
        window.location.href = "./login.html";
        return;
      }

      const userId = authData.user.id;

      const updatedProfile = {
        name: document.getElementById("edit-name").value.trim(),
        headline: document.getElementById("edit-headline").value.trim(),
        skills: document.getElementById("edit-skills").value.trim(),
        location: document.getElementById("edit-location").value.trim(),
        phone: document.getElementById("edit-phone").value.trim(),
        bio: document.getElementById("edit-bio").value.trim(),
        salary_min: parseInt(document.getElementById("edit-salary-min").value || 0, 10) || null,
        salary_max: parseInt(document.getElementById("edit-salary-max").value || 0, 10) || null
      };

      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update(updatedProfile)
        .eq("user_id", userId);

      if (updateError) {
        console.error(updateError);
        alert("Update failed: " + updateError.message);
        return;
      }

      alert("Profile updated successfully ✅");

      if (currentProfileId) {
        window.location.href = `./profile.html?id=${currentProfileId}`;
      } else {
        window.location.href = "./search.html";
      }
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  });
}

/* =========================
   My Profile Link
========================= */
const myProfileLink = document.getElementById("my-profile-link");

if (myProfileLink) {
  const loadMyProfileLink = async () => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();

      // not logged in
      if (!user) {
        myProfileLink.style.display = "none";
        return;
      }

      // logged in → show link
      myProfileLink.style.display = "inline-block";

      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        myProfileLink.href = `./profile.html?id=${profile.id}`;
      } else {
        // user logged in but didn't create profile yet
        myProfileLink.href = "./register.html";
      }

    } catch (err) {
      console.error("My Profile error:", err);
    }
  };

  loadMyProfileLink();
}

/* =========================
   Featured Users (index.html)
========================= */
const featuredUsersContainer = document.getElementById("featured-users");

if (featuredUsersContainer) {
  const loadFeaturedUsers = async () => {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("id, name, headline, avatar_url")
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) {
      console.error(error);
      featuredUsersContainer.innerHTML = "<p>Error loading featured users.</p>";
      return;
    }

    featuredUsersContainer.innerHTML = data.map((user) => {
      const avatar = user.avatar_url || "https://via.placeholder.com/80?text=User";

      return `
        <a class="user-card" href="./profile.html?id=${user.id}">
          <div class="user-top">
            <img src="${avatar}" alt="Avatar" loading="lazy" decoding="async" />
            <div>
              <h3>${user.name || ""}</h3>
              <p>${user.headline || ""}</p>
            </div>
          </div>
        </a>
      `;
    }).join("");
  };

  loadFeaturedUsers();
}






/* =========================
   Login (login.html)
========================= */
const loginForm = document.getElementById("login-form");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      alert("Login successful ✅");
      window.location.href = "./search.html";
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  });
}
console.log("APP JS RUNNING");

/* =========================
   Supabase Client
========================= */
const supabaseClient = window.supabaseClient;

/* =========================
   Shared Service Map
   Used in search + register
========================= */
const serviceOptionsMap = {
  "Child Care": [
    "Babysitting Services",
    "Newborn Care Specialist",
    "Professional Nanny Services",
    "After-School Care",
    "Special Needs child Support"
  ],
  "Elder Care": [
    "Personal Care Assistance",
    "Dementia & Alzheimer’s Support",
    "Live-In Caregiving",
    "Mobility & Transfer Assistance",
    "Companionship Care",
    "Palliative & End-of-Life Support"
  ],
  "Home Nursing Care": [
    "Patient Handling & Mobility Support",
    "Post-Surgical Care",
    "Wound Care & Infection Control",
    "Chronic Disease Management",
    "Medication Administration",
    "First Aid & CPR Certification",
    "Vital Signs Monitoring"
  ],
  "Pregnancy & Maternity Care": [
    "Prenatal Care Support",
    "Postnatal Recovery Care",
    "Mother & Newborn Care",
    "Lactation Consulting Support",
    "Midwifery Assistance"
  ],
  "Therapy & Rehab": [
    "Physiotherapy Assistance",
    "Occupational Therapy Support",
    "Mobility Enhancement Techniques",
    "Rehabilitation Programs Support",
    "Injury Recovery Assistance"
  ],
  "Nutrition & Diet": [
    "Weight Management Programs",
    "Clinical Nutrition Planning",
    "Sports Nutrition Guidancet",
    "Diabetes Nutrition Management",
    "Maternal & Prenatal Nutrition"
  ],
  "Disability & Special Needs Care": [
    "Autism Spectrum Support",
    "Physical Disability Assistance",
    "Developmental Delay Support",
    "Behavioral Therapy Assistance",
    "Daily living  skills  Suppor"
  ],
  "Mental Health & Emotional Support Care": [
    "Emotional Support Care",
    "Elderly Mental Support",
    "Depression Support Services",
    "Anxiety Managment Support Services",
    "Companionship-Based Emotional Care"
  ]
};

/* =========================
   Helpers
========================= */
function getExpiryDate(plan) {
  const now = new Date();

  if (plan === "starter") {
    now.setMonth(now.getMonth() + 1);
  } else if (plan === "professional") {
    now.setMonth(now.getMonth() + 4);
  } else if (plan === "premium") {
    now.setFullYear(now.getFullYear() + 1);
  }

  return now.toISOString();
}

function getPlanRank(plan) {
  if (plan === "premium") return 3;
  if (plan === "professional") return 2;
  return 1;
}

function isProfileExpired(profile) {
  if (!profile) return true;

  const now = new Date();
  const expiresAt = new Date(profile.expires_at);

  return profile.is_active === false || expiresAt <= now;
}

/* =========================
   Reactivate Button
========================= */
async function loadReactivateButton() {
  try {
    const navLinks = document.querySelector(".nav-links");
    if (!navLinks) return;

    let reactivateLink = document.getElementById("reactivate-link");

    if (!reactivateLink) {
      reactivateLink = document.createElement("a");
      reactivateLink.id = "reactivate-link";
      reactivateLink.href = "./packages.html";
      reactivateLink.textContent = "Reactivate";
      reactivateLink.style.display = "none";
      navLinks.appendChild(reactivateLink);
    }

    const {
      data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {
      reactivateLink.style.display = "none";
      return;
    }

    const { data: profile, error } = await supabaseClient
      .from("profiles")
      .select("expires_at, is_active")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !profile) {
      reactivateLink.style.display = "none";
      return;
    }

    if (isProfileExpired(profile)) {
      reactivateLink.style.display = "inline-block";
      reactivateLink.href = "./packages.html";
    } else {
      reactivateLink.style.display = "none";
    }
  } catch (err) {
    console.error("Reactivate button error:", err);
  }
}

/* =========================
   Register page
   Dynamic service options + submit
========================= */

const registerForm = document.getElementById("register-form");
const registerCareTypeEl = document.getElementById("headline");
const registerSkillSelect = document.getElementById("skill-select");
const registerSkillsInput = document.getElementById("skills");
const selectedSkillsContainer = document.getElementById("selected-skills");

if (registerCareTypeEl && registerSkillSelect && registerSkillsInput) {
  let selectedSkills = [];

  const renderSelectedSkills = () => {
    registerSkillsInput.value = selectedSkills.join(", ");

    if (!selectedSkillsContainer) return;

    if (selectedSkills.length === 0) {
      selectedSkillsContainer.innerHTML = "";
      return;
    }

    selectedSkillsContainer.innerHTML = selectedSkills
      .map(
        (skill) => `
          <span class="skill-pill">
            ${skill}
            <button type="button" class="remove-skill-btn" data-skill="${skill}">&times;</button>
          </span>
        `
      )
      .join("");

    selectedSkillsContainer.querySelectorAll(".remove-skill-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const skillToRemove = btn.dataset.skill;
        selectedSkills = selectedSkills.filter((item) => item !== skillToRemove);
        renderSelectedSkills();
      });
    });
  };

  const renderRegisterServiceOptions = () => {
    const selectedCareType = registerCareTypeEl.value || "";
    const options = serviceOptionsMap[selectedCareType] || [];

    registerSkillSelect.innerHTML = `<option value="">Select Service Type</option>`;

    options.forEach((option) => {
      registerSkillSelect.innerHTML += `<option value="${option}">${option}</option>`;
    });

    selectedSkills = [];
    renderSelectedSkills();
  };

  registerCareTypeEl.addEventListener("change", renderRegisterServiceOptions);

  registerSkillSelect.addEventListener("change", () => {
    const skill = registerSkillSelect.value;

    if (!skill) return;
    if (selectedSkills.includes(skill)) {
      registerSkillSelect.value = "";
      return;
    }

    selectedSkills.push(skill);
    renderSelectedSkills();
    registerSkillSelect.value = "";
  });
}


if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const headline = document.getElementById("headline").value.trim();
    const skills = document.getElementById("skills").value.trim();
    const location = document.getElementById("location").value.trim();
    const languages = document.getElementById("languages").value.trim();
    const availability = document.getElementById("availability").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const bio = document.getElementById("bio").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const salaryMin = parseInt(document.getElementById("salary-min")?.value || 0, 10);
    const salaryMax = parseInt(document.getElementById("salary-max")?.value || 0, 10);

    const avatarFile = document.getElementById("avatar")?.files?.[0] || null;

    try {
      const pendingData = {
        name,
        headline,
        skills,
        location,
        languages,
        availability,
        phone,
        bio,
        email,
        password,
        salaryMin,
        salaryMax
      };

      localStorage.setItem("pendingRegistration", JSON.stringify(pendingData));

      if (avatarFile) {
        const reader = new FileReader();

        reader.onload = function () {
          localStorage.setItem("pendingAvatar", reader.result);
          window.location.href = "./packages.html";
        };

        reader.readAsDataURL(avatarFile);
      } else {
        localStorage.removeItem("pendingAvatar");
        window.location.href = "./packages.html";
      }
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  });
}

/* =========================
   Packages (packages.html)
========================= */
const pricingButtons = document.querySelectorAll(".pricing-btn");

if (pricingButtons.length > 0) {
  pricingButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const selectedPlan = button.dataset.plan;
      const savedData = JSON.parse(localStorage.getItem("pendingRegistration") || "null");
      const savedAvatar = localStorage.getItem("pendingAvatar");

      try {
        const {
          data: { user: currentUser }
        } = await supabaseClient.auth.getUser();

        if (currentUser && !savedData) {
          const userId = currentUser.id;

          const { data: existingProfile, error: existingProfileError } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .single();

          if (existingProfileError || !existingProfile) {
            throw new Error("Profile not found for reactivation.");
          }

          const { error: updateError } = await supabaseClient
            .from("profiles")
            .update({
              plan: selectedPlan,
              plan_rank: getPlanRank(selectedPlan),
              payment_status: "paid",
              is_active: true,
              starts_at: new Date().toISOString(),
              expires_at: getExpiryDate(selectedPlan),
              reminder_sent: false
            })
            .eq("user_id", userId);

          if (updateError) throw updateError;

          alert(`Plan reactivated: ${selectedPlan} ✅`);
          window.location.href = "./profile.html?id=" + existingProfile.id;
          return;
        }

        if (!savedData) {
          alert("Please complete your Profile first.");
          window.location.href = "./register.html";
          return;
        }

        const {
          name,
          headline,
          skills,
          location,
          languages,
          availability,
          phone,
          bio,
          email,
          password,
          salaryMin,
          salaryMax
        } = savedData;

        const { data: signUpData, error: signUpError } =
          await supabaseClient.auth.signUp({ email, password });

        if (signUpError) {
          const message = (signUpError.message || "").toLowerCase();

          if (
            message.includes("already") ||
            message.includes("exists") ||
            message.includes("registered")
          ) {
            alert("This email is already registered. Please log in first or use another email.");
            window.location.href = "./login.html";
            return;
          }

          throw signUpError;
        }

        const userId = signUpData?.user?.id;

        if (!userId) {
          alert("Account created, but login is not ready yet. Please log in manually.");
          window.location.href = "./login.html";
          return;
        }

        const DEFAULT_AVATAR =
          "https://ui-avatars.com/api/?name=CareXpert+User&background=0A66C2&color=ffffff&size=200&bold=true";

        let avatarUrl = DEFAULT_AVATAR;

        if (savedAvatar) {
          const response = await fetch(savedAvatar);
          const blob = await response.blob();
          const fileName = `public/${userId}.jpg`;

          const { error: uploadError } = await supabaseClient.storage
            .from("avatars")
            .upload(fileName, blob, {
              upsert: true,
              contentType: blob.type || "image/jpeg"
            });

          if (uploadError) throw uploadError;

          const { data } = supabaseClient.storage
            .from("avatars")
            .getPublicUrl(fileName);

          avatarUrl = data.publicUrl;
        }

        const profileData = {
          user_id: userId,
          name,
          headline,
          skills,
          location,
          languages,
          availability,
          phone,
          bio,
          salary_min: salaryMin || null,
          salary_max: salaryMax || null,
          avatar_url: avatarUrl,
          email: email,
          plan: selectedPlan,
          plan_rank: getPlanRank(selectedPlan),
          payment_status: "paid",
          is_active: true,
          starts_at: new Date().toISOString(),
          expires_at: getExpiryDate(selectedPlan),
          reminder_sent: false
        };

        const { data: existingProfile } = await supabaseClient
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        let profileError = null;

        if (existingProfile) {
          const { error } = await supabaseClient
            .from("profiles")
            .update(profileData)
            .eq("user_id", userId);

          profileError = error;
        } else {
          const { error } = await supabaseClient
            .from("profiles")
            .insert([profileData]);

          profileError = error;
        }

        if (profileError) throw profileError;

        localStorage.removeItem("pendingRegistration");
        localStorage.removeItem("pendingAvatar");

        alert(`Package selected: ${selectedPlan} ✅`);
        window.location.href = "./search.html";
      } catch (err) {
        console.error(err);
        alert("Error: " + err.message);
      }
    });
  });
}

/* =========================
   Search (search.html)
========================= */
const resultsDiv = document.getElementById("results");

if (resultsDiv) {
  const careTypeEl = document.getElementById("search-role");
  const serviceOptionEl = document.getElementById("search-service-option");
  const locationEl = document.getElementById("search-location");

  const renderServiceOptions = () => {
    if (!serviceOptionEl) return;

    const selectedCareType = careTypeEl?.value || "";
    const options = serviceOptionsMap[selectedCareType] || [];

    serviceOptionEl.innerHTML = `<option value="">All Service Options</option>`;

    options.forEach((option) => {
      serviceOptionEl.innerHTML += `<option value="${option}">${option}</option>`;
    });
  };

  const renderProfiles = (profiles) => {
    if (!profiles || profiles.length === 0) {
      resultsDiv.innerHTML = "<p>No profiles found.</p>";
      return;
    }

    resultsDiv.innerHTML = profiles.map((p) => {
      const avatar = p.avatar_url || "https://via.placeholder.com/80?text=User";

      return `
        <a class="result-card ${p.plan || "starter"}" href="./profile.html?id=${p.id}">
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
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .order("plan_rank", { ascending: false })
      .order("created_at", { ascending: false });

    const careType = careTypeEl?.value.trim();
    const serviceOption = serviceOptionEl?.value.trim();
    const location = locationEl?.value.trim();

    if (location) {
      query = query.ilike("location", `%${location}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      resultsDiv.innerHTML = "<p>Error loading profiles.</p>";
      return;
    }

    let filteredData = data || [];

    if (careType) {
      filteredData = filteredData.filter((profile) => {
        const headline = profile.headline || "";
        return headline.toLowerCase().includes(careType.toLowerCase());
      });
    }

    if (serviceOption) {
      filteredData = filteredData.filter((profile) => {
        const skills = profile.skills || "";
        const headline = profile.headline || "";
        return (
          skills.toLowerCase().includes(serviceOption.toLowerCase()) ||
          headline.toLowerCase().includes(serviceOption.toLowerCase())
        );
      });
    }

    renderProfiles(filteredData);
  };

  renderServiceOptions();
  loadProfiles();

  careTypeEl?.addEventListener("change", () => {
    renderServiceOptions();
    loadProfiles();
  });

  serviceOptionEl?.addEventListener("change", loadProfiles);
  locationEl?.addEventListener("change", loadProfiles);
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

    if (error || !data) {
      console.error(error);
      profileContainer.innerHTML = "<p>Error loading profile.</p>";
      return;
    }

    const { data: authData } = await supabaseClient.auth.getUser();
    const currentUserId = authData?.user?.id || null;
    const isOwner = currentUserId && currentUserId === data.user_id;
    const expired = isProfileExpired(data);

    if (expired && !isOwner) {
      profileContainer.innerHTML = "<p>This profile is not available.</p>";
      return;
    }

    if (expired && isOwner) {
      profileContainer.innerHTML = `
        <div class="simple-profile">
          <div class="simple-profile-topbar"></div>
          <div class="simple-profile-section">
            <h3>Your plan has expired</h3>
            <p>Your profile is hidden from the public.</p>
            <a href="./packages.html" class="edit-profile-btn">Reactivate</a>
          </div>
        </div>
      `;
      return;
    }

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

    const badge = data.plan
      ? `<span class="profile-badge ${data.plan}">${data.plan}</span>`
      : "";

    profileContainer.innerHTML = `
      <div class="simple-profile">
        <div class="simple-profile-topbar"></div>

        <div class="simple-profile-header">
          <img src="${avatar}" class="simple-profile-avatar" alt="Avatar" />

          <div class="simple-profile-info">
            <div class="profile-name-row">
              <h1>${data.name || "No name"}</h1>
              ${badge}
            </div>
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
              <span class="detail-label">Languages</span>
              <strong>${data.languages || "Not provided"}</strong>
            </div>

            <div class="detail-box">
              <span class="detail-label">Availability</span>
              <strong>${data.availability || "Not provided"}</strong>
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
      document.getElementById("edit-languages").value = profile.languages || "";
      document.getElementById("edit-availability").value = profile.availability || "";
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
        languages: document.getElementById("edit-languages").value.trim(),
        availability: document.getElementById("edit-availability").value.trim(),
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
      const {
        data: { user }
      } = await supabaseClient.auth.getUser();

      if (!user) {
        myProfileLink.style.display = "none";
        return;
      }

      myProfileLink.style.display = "inline-block";

      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        myProfileLink.href = `./profile.html?id=${profile.id}`;
      } else {
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
      .select("id, name, headline, avatar_url, plan, plan_rank")
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .order("plan_rank", { ascending: false })
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
        <a class="user-card ${user.plan || "starter"}" href="./profile.html?id=${user.id}">
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
      const { error } = await supabaseClient.auth.signInWithPassword({
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

/* =========================
   Pricing Toggle (packages.html)
========================= */
const billingButtons = document.querySelectorAll(".billing-btn");

if (billingButtons.length > 0) {
  const prices = {
    monthly: {
      starter: "$15.5",
      builder: "$21.5",
      expert: "$25"
    },
    annually: {
      starter: "$130",
      builder: "$180",
      expert: "$210"
    }
  };

  function updatePrices(mode) {
    const starterPrice = document.getElementById("starter-price");
    const builderPrice = document.getElementById("builder-price");
    const expertPrice = document.getElementById("expert-price");

    const starterDuration = document.getElementById("starter-duration");
    const builderDuration = document.getElementById("builder-duration");
    const expertDuration = document.getElementById("expert-duration");

    const starterNote = document.getElementById("starter-note");
    const builderNote = document.getElementById("builder-note");
    const expertNote = document.getElementById("expert-note");

    if (starterPrice) starterPrice.textContent = prices[mode].starter;
    if (builderPrice) builderPrice.textContent = prices[mode].builder;
    if (expertPrice) expertPrice.textContent = prices[mode].expert;

    const durationText = mode === "monthly" ? "/ month" : "/ year";

    if (starterDuration) starterDuration.textContent = durationText;
    if (builderDuration) builderDuration.textContent = durationText;
    if (expertDuration) expertDuration.textContent = durationText;

    if (mode === "annually") {
      if (starterNote) starterNote.textContent = "$186 → $130 • Save 30%";
      if (builderNote) builderNote.textContent = "$258 → $180 • Save 30%";
      if (expertNote) expertNote.textContent = "$300 → $210 • Save 30%";
    } else {
      if (starterNote) starterNote.textContent = "1st month free";
      if (builderNote) builderNote.textContent = "";
      if (expertNote) expertNote.textContent = "";
    }
  }

  billingButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      billingButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      updatePrices(btn.dataset.billing);
    });
  });
}
/* =========================
   Password Toggle (register.html)
========================= */
const registerPasswordInput = document.getElementById("password");
const togglePasswordBtn = document.getElementById("toggle-password");

if (registerPasswordInput && togglePasswordBtn) {
  togglePasswordBtn.addEventListener("click", () => {
    const isPassword = registerPasswordInput.type === "password";

    registerPasswordInput.type = isPassword ? "text" : "password";
    togglePasswordBtn.textContent = isPassword ? "Hide" : "Show";
  });
}


/* =========================
   Init
========================= */
loadReactivateButton();
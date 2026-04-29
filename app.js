console.log("APP JS RUNNING");

const supabaseClient = window.supabaseClient;

/* =========================
   SERVICE OPTIONS
========================= */

const defaultServiceOptions = [
  "Professional Communication with Families",
  "Time & Task Management",
  "Empathy & Emotional Intelligence",
  "Conflict Resolution Skills",
  "Respect for Privacy & Dignity",
  "Emergency Responsiveness & Adaptability",
  "Multilingual Communication Skills"
];

const serviceOptionsMap = {
  "Child Care": [
    "Babysitting Services",
    "Newborn Care Specialist",
    "Professional Nanny Services",
    "After-School Care",
    "Special Needs Child Support"
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
    "Sports Nutrition Guidance",
    "Diabetes Nutrition Management",
    "Maternal & Prenatal Nutrition"
  ],
  "Disability & Special Needs Care": [
    "Autism Spectrum Support",
    "Physical Disability Assistance",
    "Developmental Delay Support",
    "Behavioral Therapy Assistance",
    "Daily Living Skills Support"
  ],
  "Mental Health & Emotional Support Care": [
    "Emotional Support Care",
    "Elderly Mental Support",
    "Depression Support Services",
    "Anxiety Management Support Services",
    "Companionship-Based Emotional Care"
  ]
};

/* =========================
   HELPERS
========================= */

function getExpiryDate(plan) {
  const now = new Date();

  if (plan === "starter") now.setMonth(now.getMonth() + 1);
  else if (plan === "professional") now.setMonth(now.getMonth() + 4);
  else if (plan === "premium") now.setFullYear(now.getFullYear() + 1);

  return now.toISOString();
}

function getPlanRank(plan) {
  if (plan === "premium") return 3;
  if (plan === "professional") return 2;
  return 1;
}

function isProfileExpired(profile) {
  if (!profile) return true;
  const expiresAt = new Date(profile.expires_at);
  return profile.is_active === false || expiresAt <= new Date();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/* =========================
   REACTIVATE LINK
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

    const { data: { user } } = await supabaseClient.auth.getUser();

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

    reactivateLink.style.display = isProfileExpired(profile)
      ? "inline-block"
      : "none";

  } catch (err) {
    console.error("Reactivate button error:", err);
  }
}

/* =========================
   REGISTER
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

    selectedSkillsContainer.innerHTML = selectedSkills
      .map(skill => `
        <span class="skill-pill">
          ${skill}
          <button type="button" class="remove-skill-btn" data-skill="${skill}">&times;</button>
        </span>
      `)
      .join("");

    selectedSkillsContainer.querySelectorAll(".remove-skill-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedSkills = selectedSkills.filter(item => item !== btn.dataset.skill);
        renderSelectedSkills();
      });
    });
  };

  const renderRegisterServiceOptions = () => {
    const selectedCareType = registerCareTypeEl.value || "";
    const careSkills = serviceOptionsMap[selectedCareType] || [];

    registerSkillSelect.innerHTML = `<option value="">Select Service Type</option>`;

    if (careSkills.length > 0) {
      const careGroup = document.createElement("optgroup");
      careGroup.label = "Care Type Skills";

      careSkills.forEach(skill => {
        const opt = document.createElement("option");
        opt.value = skill;
        opt.textContent = skill;
        careGroup.appendChild(opt);
      });

      registerSkillSelect.appendChild(careGroup);
    }

    const coreGroup = document.createElement("optgroup");
    coreGroup.label = "Core Caregiver Competencies";

    defaultServiceOptions.forEach(skill => {
      const opt = document.createElement("option");
      opt.value = skill;
      opt.textContent = skill;
      coreGroup.appendChild(opt);
    });

    registerSkillSelect.appendChild(coreGroup);

    selectedSkills = [];
    renderSelectedSkills();
  };

  registerCareTypeEl.addEventListener("change", renderRegisterServiceOptions);

  registerSkillSelect.addEventListener("change", () => {
    const skill = registerSkillSelect.value;
    if (!skill) return;

    if (!selectedSkills.includes(skill)) {
      selectedSkills.push(skill);
      renderSelectedSkills();
    }

    registerSkillSelect.value = "";
  });

  renderRegisterServiceOptions();
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const pendingData = {
      name: document.getElementById("name").value.trim(),
      headline: document.getElementById("headline").value.trim(),
      skills: document.getElementById("skills").value.trim(),
      location: document.getElementById("location").value.trim(),
      languages: document.getElementById("languages").value.trim(),
      availability: document.getElementById("availability").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      bio: document.getElementById("bio").value.trim(),
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
      salaryMin: parseInt(document.getElementById("salary-min")?.value || 0, 10),
      salaryMax: parseInt(document.getElementById("salary-max")?.value || 0, 10)
    };

    const avatarFile = document.getElementById("avatar")?.files?.[0] || null;

    try {
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
   PACKAGES
========================= */

const pricingButtons = document.querySelectorAll(".pricing-btn");

if (pricingButtons.length > 0) {
  pricingButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const selectedPlan = button.dataset.plan;
      const savedData = JSON.parse(localStorage.getItem("pendingRegistration") || "null");
      const savedAvatar = localStorage.getItem("pendingAvatar");

      try {
        const { data: { user: currentUser } } = await supabaseClient.auth.getUser();

        /* REACTIVATION FLOW */
        if (currentUser && !savedData) {
          const userId = currentUser.id;

          const { data: existingProfile, error: existingProfileError } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          if (existingProfileError || !existingProfile) {
            throw new Error("Profile not found for reactivation.");
          }

          if (!isProfileExpired(existingProfile)) {
            alert("Your profile is already active ✅");
            window.location.href = "./profile.html?id=" + existingProfile.id;
            return;
          }

          const newExpiryDate = getExpiryDate(selectedPlan);

          const { data: updatedProfile, error: updateError } = await supabaseClient
            .from("profiles")
            .update({
              plan: selectedPlan,
              plan_rank: getPlanRank(selectedPlan),
              payment_status: "paid",
              is_active: true,
              starts_at: new Date().toISOString(),
              expires_at: newExpiryDate,
              reminder_sent: false
            })
            .eq("id", existingProfile.id)
            .select("*")
            .single();

          if (updateError) {
            console.error(updateError);
            throw new Error("Reactivation failed");
          }

          if (!updatedProfile || !updatedProfile.is_active) {
            throw new Error("Profile still inactive");
          }

          if (new Date(updatedProfile.expires_at) <= new Date()) {
            throw new Error("Expiry not updated");
          }

          const reactivateLink = document.getElementById("reactivate-link");
          if (reactivateLink) reactivateLink.style.display = "none";

          alert("Plan reactivated successfully ✅");
          window.location.href = "./profile.html?id=" + updatedProfile.id;
          return;
        }

        /* NEW REGISTRATION FLOW */
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
            alert("This email is already registered. Please log in first.");
            window.location.href = "./login.html";
            return;
          }

          throw signUpError;
        }

        const userId = signUpData?.user?.id;

        if (!userId) {
          alert("Account created. Please log in manually.");
          window.location.href = "./login.html";
          return;
        }

        const DEFAULT_AVATAR =
          "https://ui-avatars.com/api/?name=CareExpert+User&background=0A66C2&color=ffffff&size=200&bold=true";

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
          email,
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
            .eq("id", existingProfile.id);

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
   PRICING TOGGLE
========================= */

const billingButtons = document.querySelectorAll(".billing-btn");

if (billingButtons.length > 0) {
  let currentBilling = "monthly";
  let isReactivation = false;

  const prices = {
    monthly: {
      starter: {
        newPrice: "$0",
        reactivePrice: "$15.5",
        durationNew: "/ first month",
        durationReactive: "/ month",
        newNote: "First month free",
        reactiveNote: "Monthly reactivation"
      },
      builder: {
        price: "$21.5",
        duration: "/ month",
        note: "Best monthly value"
      },
      expert: {
        price: "$25",
        duration: "/ month",
        note: "Maximum visibility"
      }
    },
    annually: {
      starter: {
        price: "$130",
        duration: "/ year",
        note: "Was $186 → Now $130 • Save $56"
      },
      builder: {
        price: "$180",
        duration: "/ year",
        note: "Was $258 → Now $180 • Save $78"
      },
      expert: {
        price: "$210",
        duration: "/ year",
        note: "Was $300 → Now $210 • Save $90"
      }
    }
  };

  function updatePrices(mode) {
    currentBilling = mode;

    if (mode === "monthly") {
      setText("starter-price", isReactivation ? prices.monthly.starter.reactivePrice : prices.monthly.starter.newPrice);
      setText("starter-duration", isReactivation ? prices.monthly.starter.durationReactive : prices.monthly.starter.durationNew);
      setText("starter-note", isReactivation ? prices.monthly.starter.reactiveNote : prices.monthly.starter.newNote);

      setText("builder-price", prices.monthly.builder.price);
      setText("builder-duration", prices.monthly.builder.duration);
      setText("builder-note", prices.monthly.builder.note);

      setText("expert-price", prices.monthly.expert.price);
      setText("expert-duration", prices.monthly.expert.duration);
      setText("expert-note", prices.monthly.expert.note);
    }

    if (mode === "annually") {
      setText("starter-price", prices.annually.starter.price);
      setText("starter-duration", prices.annually.starter.duration);
      setText("starter-note", prices.annually.starter.note);

      setText("builder-price", prices.annually.builder.price);
      setText("builder-duration", prices.annually.builder.duration);
      setText("builder-note", prices.annually.builder.note);

      setText("expert-price", prices.annually.expert.price);
      setText("expert-duration", prices.annually.expert.duration);
      setText("expert-note", prices.annually.expert.note);
    }
  }

  async function checkReactivation() {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      const savedData = JSON.parse(localStorage.getItem("pendingRegistration") || "null");

      isReactivation = !!user && !savedData;
      updatePrices(currentBilling);
    } catch (err) {
      console.error("Pricing check error:", err);
      updatePrices(currentBilling);
    }
  }

  billingButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      billingButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      updatePrices(btn.dataset.billing);
    });
  });

  checkReactivation();
}
/* =========================
   SEARCH
========================= */

const resultsDiv = document.getElementById("results");

if (resultsDiv) {
  const careTypeEl = document.getElementById("search-role");
  const serviceOptionEl = document.getElementById("search-service-option");
  const locationEl = document.getElementById("search-location");

  const renderServiceOptions = () => {
    if (!serviceOptionEl) return;

    const selectedCareType = careTypeEl?.value || "";
    const options = [
      ...(serviceOptionsMap[selectedCareType] || []),
      ...defaultServiceOptions
    ];

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
          <div class="result-meta">${p.location || ""}</div>
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

    const careType = careTypeEl?.value.trim().toLowerCase();
    const serviceOption = serviceOptionEl?.value.trim().toLowerCase();

    let filteredData = data || [];

    // Care Type must match headline
    if (careType) {
      filteredData = filteredData.filter((profile) =>
        (profile.headline || "").toLowerCase() === careType
      );
    }

    // Service Type must exist inside skills
    if (serviceOption) {
      filteredData = filteredData.filter((profile) =>
        (profile.skills || "").toLowerCase().includes(serviceOption)
      );
    }

    renderProfiles(filteredData);
  };

  renderServiceOptions();
  loadProfiles();

  careTypeEl?.addEventListener("change", () => {
    renderServiceOptions();

    // reset service when care type changes
    if (serviceOptionEl) serviceOptionEl.value = "";

    loadProfiles();
  });

  serviceOptionEl?.addEventListener("change", loadProfiles);
  locationEl?.addEventListener("change", loadProfiles);
}

/* =========================
   PROFILE
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
      .map(skill => skill.trim())
      .filter(Boolean)
      .map(skill => `<span class="skill-tag">${skill}</span>`)
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
   EDIT PROFILE
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
   MY PROFILE LINK
========================= */

const myProfileLink = document.getElementById("my-profile-link");

if (myProfileLink) {
  const loadMyProfileLink = async () => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();

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

      myProfileLink.href = profile
        ? `./profile.html?id=${profile.id}`
        : "./register.html";

    } catch (err) {
      console.error("My Profile error:", err);
    }
  };

  loadMyProfileLink();
}

/* =========================
   FEATURED USERS
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

    featuredUsersContainer.innerHTML = (data || []).map((user) => {
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
   LOGIN
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
   PASSWORD TOGGLE
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
   START
========================= */

loadReactivateButton();
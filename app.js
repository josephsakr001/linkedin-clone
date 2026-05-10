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
  else if (plan === "builder") now.setMonth(now.getMonth() + 4);
  else if (plan === "premium") now.setFullYear(now.getFullYear() + 1);

  return now.toISOString();
}

function getPlanRank(plan) {
  if (plan === "premium") return 3;
  if (plan === "builder") return 2;
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
const serviceOptionsBox = document.getElementById("service-options-box");
const registerSkillsInput = document.getElementById("skills");
const selectedSkillsContainer = document.getElementById("selected-skills");
const confirmSkillsBtn = document.getElementById("confirm-skills-btn");

if (registerCareTypeEl && serviceOptionsBox && registerSkillsInput) {
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

        const chip = serviceOptionsBox.querySelector(`[data-skill="${btn.dataset.skill}"]`);
        if (chip) chip.classList.remove("selected");

        renderSelectedSkills();
      });
    });
  };

  const renderServiceChips = () => {
    const selectedCareType = registerCareTypeEl.value || "";
    const careSkills = serviceOptionsMap[selectedCareType] || [];
    const allSkills = [...careSkills, ...defaultServiceOptions];

    selectedSkills = [];
    registerSkillsInput.value = "";
    if (selectedSkillsContainer) selectedSkillsContainer.innerHTML = "";

    serviceOptionsBox.innerHTML = allSkills
      .map(skill => `
        <button type="button" class="service-chip" data-skill="${skill}">
          ${skill}
        </button>
      `)
      .join("");

    serviceOptionsBox.querySelectorAll(".service-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const skill = chip.dataset.skill;

        if (selectedSkills.includes(skill)) {
          selectedSkills = selectedSkills.filter(item => item !== skill);
          chip.classList.remove("selected");
        } else {
          selectedSkills.push(skill);
          chip.classList.add("selected");
        }
      });
    });
  };

  registerCareTypeEl.addEventListener("change", renderServiceChips);

  if (confirmSkillsBtn) {
    confirmSkillsBtn.addEventListener("click", () => {
      renderSelectedSkills();
    });
  }

  renderServiceChips();
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
   AVAILABILITY
========================= */

const availabilityBox = document.getElementById("availability-options-box");
const availabilityInput = document.getElementById("availability");

if (availabilityBox && availabilityInput) {
  let selectedAvailability = "";

  availabilityBox.querySelectorAll(".availability-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      availabilityBox.querySelectorAll(".availability-chip")
        .forEach(c => c.classList.remove("selected"));

      chip.classList.add("selected");
      selectedAvailability = chip.dataset.availability;
      availabilityInput.value = selectedAvailability;
    });
  });
}

/* =========================
   BILLING TOGGLE
========================= */

const billingButtons = document.querySelectorAll(".billing-btn");

if (billingButtons.length > 0) {
  const pricingData = {
    monthly: {
      starter: {
        price: "$0",
        duration: "/ first month",
        note: "Then $15.5 / month"
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
        note: 'Save 30% • <s>$186/year</s>'
      },
      builder: {
        price: "$194",
        duration: "/ year",
        note: 'Save 25% • <s>$258/year</s>'
      },
      expert: {
        price: "$240",
        duration: "/ year",
        note: 'Save 20% • <s>$300/year</s>'
      }
    }
  };

  billingButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      billingButtons.forEach((b) => {
        b.classList.remove("active");
      });

      btn.classList.add("active");

      const billingType = btn.dataset.billing;
      const data = pricingData[billingType];

      setText("starter-price", data.starter.price);
      setText("starter-duration", data.starter.duration);
      document.getElementById("starter-note").innerHTML = data.starter.note;

      setText("builder-price", data.builder.price);
      setText("builder-duration", data.builder.duration);
      document.getElementById("builder-note").innerHTML = data.builder.note;

      setText("expert-price", data.expert.price);
      setText("expert-duration", data.expert.duration);
      document.getElementById("expert-note").innerHTML = data.expert.note;
    });
  });
}

/* =========================
   PACKAGES
========================= */

const pricingButtons = document.querySelectorAll(".pricing-btn");

if (pricingButtons.length > 0) {
  pricingButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const plan = btn.dataset.plan;

      try {
        const pendingData = JSON.parse(localStorage.getItem("pendingRegistration"));

        if (!pendingData) {
          alert("Please register first.");
          window.location.href = "./register.html";
          return;
        }

        const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
          email: pendingData.email,
          password: pendingData.password
        });

        if (signUpError) throw signUpError;

        const userId = signUpData.user.id;

        let avatarUrl = null;
        const avatarBase64 = localStorage.getItem("pendingAvatar");

        if (avatarBase64) {
          const fileName = `avatar-${userId}.png`;

          const { error: uploadError } = await supabaseClient.storage
            .from("avatars")
            .upload(fileName, dataURLtoBlob(avatarBase64));

          if (!uploadError) {
            avatarUrl = supabaseClient
              .storage
              .from("avatars")
              .getPublicUrl(fileName).data.publicUrl;
          }
        }

        const profileData = {
          user_id: userId,
          name: pendingData.name,
          headline: pendingData.headline,
          skills: pendingData.skills,
          location: pendingData.location,
          languages: pendingData.languages,
          availability: pendingData.availability,
          phone: pendingData.phone,
          bio: pendingData.bio,
          salary_min: pendingData.salaryMin,
          salary_max: pendingData.salaryMax,
          avatar_url: avatarUrl,
          plan: plan,
          plan_rank: getPlanRank(plan),
          expires_at: getExpiryDate(plan),
          is_active: true
        };

        const { error: insertError } = await supabaseClient
          .from("profiles")
          .insert([profileData]);

        if (insertError) throw insertError;

        localStorage.removeItem("pendingRegistration");
        localStorage.removeItem("pendingAvatar");

        alert("Profile created successfully ✅");

        window.location.href = "./search.html";

      } catch (err) {
        console.error(err);
        alert("Error: " + err.message);
      }
    });
  });
}

/* helper for avatar */
function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
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
  let editSelectedSkills = [];

  const editCareTypeEl = document.getElementById("edit-headline");
  const editServiceOptionsBox = document.getElementById("edit-service-options-box");
  const editSkillsInput = document.getElementById("edit-skills");
  const editSelectedSkillsContainer = document.getElementById("edit-selected-skills");



  const editAvailabilityBox = document.getElementById("edit-availability-options-box");
const editAvailabilityInput = document.getElementById("edit-availability");

const setEditAvailability = (value) => {
  if (!editAvailabilityBox || !editAvailabilityInput) return;

  editAvailabilityInput.value = value || "";

  editAvailabilityBox.querySelectorAll(".availability-chip").forEach((chip) => {
    chip.classList.toggle("selected", chip.dataset.availability === value);
  });
};

if (editAvailabilityBox && editAvailabilityInput) {
  editAvailabilityBox.querySelectorAll(".availability-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const value = chip.dataset.availability;

      editAvailabilityBox.querySelectorAll(".availability-chip")
        .forEach(c => c.classList.remove("selected"));

      chip.classList.add("selected");
      editAvailabilityInput.value = value;
    });
  });
}

  const renderEditSelectedSkills = () => {
    if (!editSkillsInput) return;

    editSkillsInput.value = editSelectedSkills.join(", ");

    if (!editSelectedSkillsContainer) return;

    editSelectedSkillsContainer.innerHTML = editSelectedSkills
      .map(skill => `
        <span class="skill-pill">
          ${skill}
          <button type="button" class="remove-skill-btn" data-skill="${skill}">&times;</button>
        </span>
      `)
      .join("");

    editSelectedSkillsContainer.querySelectorAll(".remove-skill-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        editSelectedSkills = editSelectedSkills.filter(item => item !== btn.dataset.skill);

        const chip = editServiceOptionsBox?.querySelector(`[data-skill="${btn.dataset.skill}"]`);
        if (chip) chip.classList.remove("selected");

        renderEditSelectedSkills();
      });
    });
  };

  const renderEditServiceChips = () => {
    if (!editCareTypeEl || !editServiceOptionsBox || !editSkillsInput) return;

    const selectedCareType = editCareTypeEl.value || "";
    const careSkills = serviceOptionsMap[selectedCareType] || [];
    const allSkills = [...careSkills, ...defaultServiceOptions];

    editServiceOptionsBox.innerHTML = allSkills
      .map(skill => `
        <button type="button" class="service-chip ${editSelectedSkills.includes(skill) ? "selected" : ""}" data-skill="${skill}">
          ${skill}
        </button>
      `)
      .join("");

    editServiceOptionsBox.querySelectorAll(".service-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const skill = chip.dataset.skill;

        if (editSelectedSkills.includes(skill)) {
          editSelectedSkills = editSelectedSkills.filter(item => item !== skill);
          chip.classList.remove("selected");
        } else {
          editSelectedSkills.push(skill);
          chip.classList.add("selected");
        }

        renderEditSelectedSkills();
      });
    });
  };

  editCareTypeEl?.addEventListener("change", () => {
    editSelectedSkills = [];
    renderEditSelectedSkills();
    renderEditServiceChips();
  });

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
      document.getElementById("edit-location").value = profile.location || "";
      document.getElementById("edit-languages").value = profile.languages || "";
              setEditAvailability(profile.availability || "");
      document.getElementById("edit-phone").value = profile.phone || "";
      document.getElementById("edit-bio").value = profile.bio || "";
      document.getElementById("edit-salary-min").value = profile.salary_min || "";
      document.getElementById("edit-salary-max").value = profile.salary_max || "";

      editSelectedSkills = (profile.skills || "")
        .split(",")
        .map(skill => skill.trim())
        .filter(Boolean);

      renderEditServiceChips();
      renderEditSelectedSkills();

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
   SEARCH
========================= */

const resultsDiv = document.getElementById("results");

if (resultsDiv) {
  const careTypeEl = document.getElementById("search-role");
  const serviceOptionEl = document.getElementById("search-service-option");
  const serviceBox = document.getElementById("search-service-box");
  const locationEl = document.getElementById("search-location");

  let selectedServices = [];

  const renderServiceChipsSearch = () => {
    if (!serviceBox || !serviceOptionEl) return;

    const selectedCareType = careTypeEl?.value || "";
    const options = serviceOptionsMap[selectedCareType] || [];

    selectedServices = [];
    serviceOptionEl.value = "";
    serviceBox.innerHTML = "";

    if (!selectedCareType) {
      serviceBox.innerHTML = `<p class="small-help">Select care type first</p>`;
      return;
    }

    serviceBox.innerHTML = options.map(option => `
      <button type="button" class="service-chip" data-service="${option}">
        ${option}
      </button>
    `).join("");

    serviceBox.querySelectorAll(".service-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const service = chip.dataset.service;

        if (selectedServices.includes(service)) {
          selectedServices = selectedServices.filter(s => s !== service);
          chip.classList.remove("selected");
        } else {
          selectedServices.push(service);
          chip.classList.add("selected");
        }

        serviceOptionEl.value = selectedServices.join(", ");
        loadProfiles();
      });
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
            <img class="result-avatar" src="${avatar}" alt="Avatar" />
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

    const careType = careTypeEl?.value.trim().toLowerCase() || "";

    let filtered = data || [];

    if (careType) {
      filtered = filtered.filter((p) =>
        (p.headline || "").toLowerCase() === careType
      );
    }

    if (selectedServices.length > 0) {
      filtered = filtered.filter((p) => {
        const profileSkills = (p.skills || "").toLowerCase();

        return selectedServices.some(service =>
          profileSkills.includes(service.toLowerCase())
        );
      });
    }

    renderProfiles(filtered);
  };

  careTypeEl?.addEventListener("change", () => {
    renderServiceChipsSearch();
    loadProfiles();
  });

  locationEl?.addEventListener("change", loadProfiles);

  renderServiceChipsSearch();
  loadProfiles();
}

/* =========================
   START
========================= */

loadReactivateButton();
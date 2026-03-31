console.log("APP JS RUNNING");

/* =========================
   Supabase Client
========================= */
const supabaseClient = window.supabaseClient;

/* =========================
   CHECK EXPIRATION
========================= */
async function checkUserExpiration() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("expires_at, is_active")
    .eq("user_id", user.id)
    .single();

  if (error || !profile) return;

  const now = new Date();
  const expires = new Date(profile.expires_at);

  if (expires < now || profile.is_active === false) {
    showExpiredPopup();
  }
}

function showExpiredPopup() {
  if (document.getElementById("expired-popup")) return;

  const popup = document.createElement("div");
  popup.id = "expired-popup";

  popup.innerHTML = `
    <div style="
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
    ">
      <div style="
        background: white;
        max-width: 420px;
        width: 100%;
        border-radius: 22px;
        padding: 30px;
        text-align: center;
      ">
        <h2>Plan Expired</h2>
        <p>Your profile is hidden. Reactivate your plan.</p>

        <button id="reactivate-btn" style="
          margin-right: 10px;
          padding: 10px 16px;
          border: none;
          border-radius: 10px;
          background: #0a66c2;
          color: white;
          cursor: pointer;
          font-weight: 700;
        ">Reactivate</button>

        <button id="close-popup" style="
          padding: 10px 16px;
          border: none;
          border-radius: 10px;
          background: #e5e7eb;
          color: #111827;
          cursor: pointer;
          font-weight: 700;
        ">Later</button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  document.getElementById("reactivate-btn").onclick = () => {
    window.location.href = "./packages.html";
  };

  document.getElementById("close-popup").onclick = () => {
    popup.remove();
  };
}

/* =========================
   Helpers
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

/* =========================
   Register
========================= */
const registerForm = document.getElementById("register-form");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const pendingData = {
      name: document.getElementById("name").value.trim(),
      headline: document.getElementById("headline").value.trim(),
      skills: document.getElementById("skills").value.trim(),
      location: document.getElementById("location").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      bio: document.getElementById("bio").value.trim(),
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
      salaryMin: parseInt(document.getElementById("salary-min")?.value || 0, 10),
      salaryMax: parseInt(document.getElementById("salary-max")?.value || 0, 10)
    };

    localStorage.setItem("pendingRegistration", JSON.stringify(pendingData));

    const avatarFile = document.getElementById("avatar")?.files?.[0];

    if (avatarFile) {
      const reader = new FileReader();
      reader.onload = () => {
        localStorage.setItem("pendingAvatar", reader.result);
        window.location.href = "./packages.html";
      };
      reader.readAsDataURL(avatarFile);
    } else {
      localStorage.removeItem("pendingAvatar");
      window.location.href = "./packages.html";
    }
  });
}

/* =========================
   Packages
========================= */
const pricingButtons = document.querySelectorAll(".pricing-btn");

if (pricingButtons.length > 0) {
  pricingButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const selectedPlan = button.dataset.plan;
        const savedData = JSON.parse(localStorage.getItem("pendingRegistration") || "null");
        const savedAvatar = localStorage.getItem("pendingAvatar");

        if (!savedData) {
          alert("Complete CV first.");
          return;
        }

        const { email, password } = savedData;

        const { data: currentUserData } = await supabaseClient.auth.getUser();
        let userId = currentUserData?.user?.id || null;

        if (!userId) {
          const { data: signUpData, error: signUpError } =
            await supabaseClient.auth.signUp({ email, password });

          if (signUpError && !signUpError.message.toLowerCase().includes("already")) {
            throw signUpError;
          }

          userId = signUpData?.user?.id || null;

          if (!userId) {
            const { data: signInData, error: signInError } =
              await supabaseClient.auth.signInWithPassword({ email, password });

            if (signInError) throw signInError;
            userId = signInData.user.id;
          }
        }

        let avatarUrl = "https://ui-avatars.com/api/?name=User";

        if (savedAvatar) {
          const blob = await (await fetch(savedAvatar)).blob();
          const fileName = `public/${userId}.jpg`;

          const { error: uploadError } = await supabaseClient
            .storage
            .from("avatars")
            .upload(fileName, blob, { upsert: true });

          if (uploadError) throw uploadError;

          const { data } = supabaseClient
            .storage
            .from("avatars")
            .getPublicUrl(fileName);

          avatarUrl = data.publicUrl;
        }

        const profileData = {
          user_id: userId,
          name: savedData.name,
          headline: savedData.headline,
          skills: savedData.skills,
          location: savedData.location,
          phone: savedData.phone,
          bio: savedData.bio,
          email: savedData.email,
          salary_min: savedData.salaryMin || null,
          salary_max: savedData.salaryMax || null,
          avatar_url: avatarUrl,
          plan: selectedPlan,
          plan_rank: getPlanRank(selectedPlan),
          payment_status: "paid",
          is_active: true,
          starts_at: new Date().toISOString(),
          expires_at: getExpiryDate(selectedPlan),
          reminder_sent: false
        };

        const { data: existingProfile, error: existingError } = await supabaseClient
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingError) throw existingError;

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

        alert("Activated ✅");
        window.location.href = "./search.html";
      } catch (err) {
        console.error(err);
        alert("Error: " + err.message);
      }
    });
  });
}

/* =========================
   Login
========================= */
const loginForm = document.getElementById("login-form");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) return alert(error.message);

    alert("Login successful ✅");
    window.location.href = "./search.html";
  });
}

/* =========================
   RUN EXPIRATION CHECK
========================= */
checkUserExpiration();
/* =========================
   Register (register.html)
========================= */
const registerForm = document.getElementById("register-form");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("✅ Register submit fired");

    const supabaseClient = window.supabaseClient;

    const name = document.getElementById("name").value.trim();
    const headline = document.getElementById("headline").value.trim();
    const skills = document.getElementById("skills").value.trim();
    const location = document.getElementById("location").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const bio = document.getElementById("bio").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // ✅ salary fields (NEW)
    const salaryMinRaw = document.getElementById("salary-min")?.value || "";
    const salaryMaxRaw = document.getElementById("salary-max")?.value || "";
    const salaryMin = salaryMinRaw ? parseInt(salaryMinRaw, 10) : null;
    const salaryMax = salaryMaxRaw ? parseInt(salaryMaxRaw, 10) : null;

    // avatar
    let avatarFile = document.getElementById("avatar")?.files?.[0] || null;

    try {
     
      // 1) Sign up
      const { data: signUpData, error: signUpError } =
        await supabaseClient.auth.signUp({ email, password });
      if (signUpError) throw signUpError;

      // 2) Make sure we have a session/user
      let userId = signUpData?.user?.id;

      if (!userId) {
        const { data: signInData, error: signInError } =
          await supabaseClient.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        userId = signInData.user.id;
      }

      // 3) Upload avatar (optional)
      let avatarUrl = null;

      if (avatarFile) {
        const fileName = `public/${userId}.jpg`;

        const { error: uploadError } = await supabaseClient
          .storage
          .from("avatars")
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabaseClient.storage
          .from("avatars")
          .getPublicUrl(fileName);

        avatarUrl = data.publicUrl;
      }

      // 4) Insert profile (WITH salary)
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
          salary_min: Number.isFinite(salaryMin) ? salaryMin : null,
          salary_max: Number.isFinite(salaryMax) ? salaryMax : null,
          avatar_url: avatarUrl,
          cv_url: null,
        }]);

      if (profileError) throw profileError;

      alert("Registration successful ✅");
      registerForm.reset();
      window.location.href = "./search.html";

    } catch (err) {
      console.error("❌ Registration error:", err);
      alert("Error: " + (err?.message || "Something went wrong"));
    }
  });
}
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
function parseJwt(token){
  try{
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g,'+').replace(/_/g,'/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }catch(e){
    return null;
  }
}

function requireAuth(){
  const isLocal =
    location.hostname === "127.0.0.1" ||
    location.hostname === "localhost";

  const token = localStorage.getItem("userToken");

  if(isLocal){
    if(!token){
      console.log("DEV MODE → Fake token created");
      const fakePayload = {
        sub: "dev-user-123",
        name:"Developer",
        email:"dev@local.dev",
        picture:"https://i.pravatar.cc/150",
        exp: Math.floor(Date.now()/1000) + (60*60*24)
      };
      const fakeToken =
        btoa(JSON.stringify({alg:"none"})) +
        "." +
        btoa(JSON.stringify(fakePayload)) +
        ".dev";
      localStorage.setItem("userToken", fakeToken);
    }
    return;
  }

  if(!token){
    window.location.href = "index.html";
    return;
  }

  const payload = parseJwt(token);

  if(!payload || payload.exp * 1000 < Date.now()){
    localStorage.removeItem("userToken");
    window.location.href = "index.html";
  }
}

function loadNavbar(){
  const navbar = document.createElement("div");
  navbar.className = "navbar";
  navbar.innerHTML = `
    <div class="logo">YavuzProgram</div>
    <div style="display:flex; gap:12px; align-items:center;">
      <button class="home-btn" id="homeBtn">Anamenü</button>
      <button class="logout-btn" id="logoutBtn">Çıkış Yap</button>
    </div>
  `;
  document.body.prepend(navbar);

  document.getElementById("homeBtn").addEventListener("click", ()=>{
    window.location.href = "anasayfa.html";
  });

  document.getElementById("logoutBtn").addEventListener("click", ()=>{
    localStorage.removeItem("userToken");
    window.location.href = "index.html";
  });
}

function getUserId(){
  const token = localStorage.getItem("userToken");
  if(!token) return null;
  const payload = parseJwt(token);
  return payload ? payload.sub : null;
}

// ✅ Global scope'a aç — module olmayan <script> tag'lerinden erişilebilsin
window.requireAuth = requireAuth;
window.loadNavbar  = loadNavbar;
window.getUserId   = getUserId;
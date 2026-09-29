// --- CANCIONES VINCULADAS A TUS ARCHIVOS LOCALES ---
const CANCIONES = [
  {
    id: 0,
    title: "PERFuMITO NUEVO",
    artist: "Bad Bunny ft. RaiNao",
    audioSrc: "./audio/perfumito-nuevo.mp3",
    coverSrc: "./covers/perfumito-nuevo.jpg",
    durationEst: "03:20"
  },
  {
    id: 1,
    title: "DALE",
    artist: "Alleh ft. Yorghaki",
    audioSrc: "./audio/dale.mp3",
    coverSrc: "./covers/dale.jpg",
    durationEst: "03:04"
  },
  {
    id: 2,
    title: "Recházame",
    artist: "Prince Royce",
    audioSrc: "./audio/rechazame.mp3",
    coverSrc: "./covers/rechazame.jpg",
    durationEst: "03:44"
  },
  {
    id: 3,
    title: "La Carretera",
    artist: "Prince Royce",
    audioSrc: "./audio/la-carretera.mp3",
    coverSrc: "./covers/la-carretera.jpg",
    durationEst: "03:58"
  },
  {
    id: 4,
    title: "En Algún Lugar",
    artist: "Duncan Dhu",
    audioSrc: "./audio/en-algun-lugar.mp3",
    coverSrc: "./covers/en-algun-lugar.jpg",
    durationEst: "03:55"
  },
  {
    id: 5,
    title: "Y Ke Pa",
    artist: "Benji Talkapone",
    audioSrc: "./audio/y-ke-pa.mp3",
    coverSrc: "./covers/y-ke-pa.jpg",
    durationEst: "02:45"
  }
];

// ==========================================
// MOTOR DE BASE DE DATOS TIPO SPOTIFY
// ==========================================
const DB_KEY = "spotify_clone_database_users";
const SESSION_KEY = "spotify_clone_active_session";

// Obtener la base de datos completa de usuarios
function obtenerBaseDatos() {
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : {};
}

// Guardar la base de datos
function guardarBaseDatos(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// Obtener usuario actualmente conectado
function obtenerUsuarioActual() {
  return localStorage.getItem(SESSION_KEY) || null;
}

// Obtener los likes específicos del usuario conectado
function obtenerLikesUsuarioActivo() {
  const user = obtenerUsuarioActual();
  if (!user) return [];
  const db = obtenerBaseDatos();
  return db[user] && db[user].meGusta ? db[user].meGusta : [];
}

// Alternar Like en la base de datos para el usuario activo
function toggleLikeCancion(cancionId) {
  const user = obtenerUsuarioActual();
  if (!user) {
    abrirModalLogin();
    mostrarErrorAuth("Debes iniciar sesión para guardar canciones en tus Me Gusta.");
    return false;
  }

  const db = obtenerBaseDatos();
  if (!db[user]) return false;

  let misLikes = db[user].meGusta || [];
  const yaTieneLike = misLikes.includes(cancionId);

  if (yaTieneLike) {
    misLikes = misLikes.filter(id => id !== cancionId);
  } else {
    misLikes.push(cancionId);
  }

  db[user].meGusta = misLikes;
  guardarBaseDatos(db);
  return !yaTieneLike;
}

// ==========================================
// ESTADO DE LA APLICACIÓN
// ==========================================
let indiceActual = 0;
let reproduciendo = false;
let modoAleatorio = false;
let modoRepetir = false;
let vistaActual = "inicio"; // "inicio" o "megusta"

// Elementos del DOM
const audio = document.getElementById("audio-engine");
const trackCover = document.getElementById("track-cover");
const trackTitle = document.getElementById("track-title");
const trackArtist = document.getElementById("track-artist");

const miniCover = document.getElementById("mini-cover");
const miniTitle = document.getElementById("mini-title");
const miniArtist = document.getElementById("mini-artist");

const trackList = document.getElementById("track-list");
const catalogTitle = document.getElementById("catalog-title");
const catalogSubtitle = document.getElementById("catalog-subtitle");

const progressBar = document.getElementById("progress-bar");
const lblCurrentTime = document.getElementById("lbl-current-time");
const lblDuration = document.getElementById("lbl-duration");

const btnPlay = document.getElementById("btn-play");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const btnShuffle = document.getElementById("btn-shuffle");
const btnRepeat = document.getElementById("btn-repeat");
const volumeSlider = document.getElementById("volume-slider");

const btnFav = document.getElementById("btn-fav");
const favCount = document.getElementById("fav-count");
const favFeedback = document.getElementById("fav-feedback");

// Vistas
const navInicio = document.getElementById("nav-inicio");
const navMeGusta = document.getElementById("nav-megusta");

// Auth / Login Modal
const modalAuth = document.getElementById("modal-auth");
const btnAbrirLogin = document.getElementById("btn-abrir-login");
const btnCloseModal = document.getElementById("btn-close-modal");
const btnSubmitAuth = document.getElementById("btn-submit-auth");
const authUsername = document.getElementById("auth-username");
const authPassword = document.getElementById("auth-password");
const authErrorMsg = document.getElementById("auth-error-msg");

const userInfoBar = document.getElementById("user-info-bar");
const lblUsername = document.getElementById("lbl-username");
const btnCambiarCuenta = document.getElementById("btn-cambiar-cuenta");
const btnLogout = document.getElementById("btn-logout");

// ==========================================
// INICIALIZACIÓN
// ==========================================
function init() {
  actualizarBarraSesion();
  cargarCancion(0, false);
  cambiarVista("inicio");
}

// Cambiar entre la vista de Inicio y Mis Me Gusta
navInicio.addEventListener("click", () => cambiarVista("inicio"));
navMeGusta.addEventListener("click", () => {
  const user = obtenerUsuarioActual();
  if (!user) {
    abrirModalLogin();
    mostrarErrorAuth("Inicia sesión para ver tu lista privada de Me Gusta.");
    return;
  }
  cambiarVista("megusta");
});

function cambiarVista(vista) {
  vistaActual = vista;
  navInicio.classList.toggle("active", vista === "inicio");
  navMeGusta.classList.toggle("active", vista === "megusta");
  renderizarCatalogo();
}

// Renderizar la lista de canciones en base a la cuenta y vista
function renderizarCatalogo() {
  trackList.innerHTML = "";
  const misLikes = obtenerLikesUsuarioActivo();
  favCount.textContent = misLikes.length;

  let listaAMostrar = CANCIONES;

  if (vistaActual === "megusta") {
    const user = obtenerUsuarioActual();
    catalogTitle.textContent = `Mis Me Gusta (@${user})`;
    catalogSubtitle.textContent = `${misLikes.length} canciones guardadas en tu perfil`;
    listaAMostrar = CANCIONES.filter(c => misLikes.includes(c.id));

    if (listaAMostrar.length === 0) {
      trackList.innerHTML = `
        <div class="empty-state">
          <p>Tu biblioteca de Me Gusta está vacía en esta cuenta.</p>
          <p style="margin-top: 6px; font-size: 12px; color: var(--color-fog);">
            Vuelve a <strong>Inicio</strong> y pulsa el corazón ❤️ en tus canciones favoritas.
          </p>
        </div>
      `;
      return;
    }
  } else {
    catalogTitle.textContent = "Todas las canciones";
    catalogSubtitle.textContent = "6 temas listos para reproducir";
  }

  listaAMostrar.forEach((c) => {
    const esLike = misLikes.includes(c.id);
    const row = document.createElement("div");
    row.className = `track-row ${c.id === CANCIONES[indiceActual].id ? "active" : ""}`;
    row.innerHTML = `
      <div class="row-left">
        <span class="row-index">${c.id + 1}</span>
        <img src="${c.coverSrc}" class="row-thumb" alt="Carátula" onerror="this.src='./covers/perfumito-nuevo.jpg'">
        <div class="row-info">
          <h4>${c.title}</h4>
          <p>${c.artist}</p>
        </div>
      </div>
      <div class="row-right">
        <button type="button" class="row-fav-btn" data-id="${c.id}" title="Me gusta">${esLike ? "❤️" : "🤍"}</button>
        <span>${c.durationEst}</span>
      </div>
    `;

    // Click en la fila -> Reproducir
    row.addEventListener("click", (e) => {
      if (e.target.classList.contains("row-fav-btn")) return;
      cargarCancion(c.id, true);
    });

    // Click en el corazón individual
    const btnHeart = row.querySelector(".row-fav-btn");
    btnHeart.addEventListener("click", (e) => {
      e.stopPropagation();
      ejecutarToggleLike(c.id);
    });

    trackList.appendChild(row);
  });
}

// ==========================================
// REPRODUCTOR DE AUDIO
// ==========================================
function cargarCancion(indice, autoPlay = true) {
  indiceActual = indice;
  const cancion = CANCIONES[indiceActual];

  audio.src = cancion.audioSrc;
  trackTitle.textContent = cancion.title;
  trackArtist.textContent = cancion.artist;
  trackCover.src = cancion.coverSrc;

  miniTitle.textContent = cancion.title;
  miniArtist.textContent = cancion.artist;
  miniCover.src = cancion.coverSrc;

  actualizarBotonFavoritoHero();
  renderizarCatalogo();

  if (autoPlay) {
    reproducirPista();
  }
}

function reproducirPista() {
  audio.play().then(() => {
    reproduciendo = true;
    btnPlay.textContent = "⏸";
  }).catch((err) => {
    console.error("Esperando interacción:", err);
    reproduciendo = false;
    btnPlay.textContent = "▶";
  });
}

function pausarPista() {
  audio.pause();
  reproduciendo = false;
  btnPlay.textContent = "▶";
}

btnPlay.addEventListener("click", () => {
  if (reproduciendo) pausarPista();
  else reproducirPista();
});

btnNext.addEventListener("click", pasarSiguiente);
btnPrev.addEventListener("click", pasarAnterior);

function pasarSiguiente() {
  if (modoAleatorio) {
    let rand;
    do {
      rand = Math.floor(Math.random() * CANCIONES.length);
    } while (rand === indiceActual && CANCIONES.length > 1);
    cargarCancion(rand, true);
  } else {
    let sig = (indiceActual + 1) % CANCIONES.length;
    cargarCancion(sig, true);
  }
}

function pasarAnterior() {
  let ant = (indiceActual - 1 + CANCIONES.length) % CANCIONES.length;
  cargarCancion(ant, true);
}

// Barra de progreso y scrubber
audio.addEventListener("timeupdate", () => {
  if (!isNaN(audio.duration) && audio.duration > 0) {
    const progreso = (audio.currentTime / audio.duration) * 100;
    progressBar.value = progreso;
    lblCurrentTime.textContent = formatearSegundos(audio.currentTime);
    lblDuration.textContent = formatearSegundos(audio.duration);
  }
});

progressBar.addEventListener("input", () => {
  if (!isNaN(audio.duration)) {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
  }
});

// Paso automático al terminar la pista
audio.addEventListener("ended", () => {
  if (modoRepetir) {
    audio.currentTime = 0;
    reproducirPista();
  } else {
    pasarSiguiente();
  }
});

// Modos auxiliares
volumeSlider.addEventListener("input", (e) => audio.volume = e.target.value);

btnShuffle.addEventListener("click", () => {
  modoAleatorio = !modoAleatorio;
  btnShuffle.classList.toggle("active", modoAleatorio);
});

btnRepeat.addEventListener("click", () => {
  modoRepetir = !modoRepetir;
  btnRepeat.classList.toggle("active", modoRepetir);
});

// ==========================================
// GESTIÓN DE LIKES (HERO & LISTA)
// ==========================================
btnFav.addEventListener("click", () => {
  ejecutarToggleLike(CANCIONES[indiceActual].id);
});

function ejecutarToggleLike(cancionId) {
  const resultado = toggleLikeCancion(cancionId);
  const user = obtenerUsuarioActual();
  if (!user) return;

  if (resultado) {
    favFeedback.textContent = "¡Guardada en tus Me Gusta! ❤️";
  } else {
    favFeedback.textContent = "Eliminada de tus Me Gusta";
  }

  actualizarBotonFavoritoHero();
  renderizarCatalogo();
  setTimeout(() => { favFeedback.textContent = ""; }, 2000);
}

function actualizarBotonFavoritoHero() {
  const misLikes = obtenerLikesUsuarioActivo();
  const esLike = misLikes.includes(CANCIONES[indiceActual].id);
  btnFav.textContent = esLike ? "❤️ Te gusta" : "🤍 Me gusta";
  btnFav.classList.toggle("active", esLike);
}

function formatearSegundos(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ==========================================
// AUTENTICACIÓN Y CAMBIO DE CUENTAS
// ==========================================
function abrirModalLogin() {
  authErrorMsg.classList.add("oculto");
  authUsername.value = "";
  authPassword.value = "";
  modalAuth.classList.remove("oculto");
  authUsername.focus();
}

function cerrarModalLogin() {
  modalAuth.classList.add("oculto");
  authErrorMsg.classList.add("oculto");
}

btnAbrirLogin.addEventListener("click", abrirModalLogin);
btnCambiarCuenta.addEventListener("click", abrirModalLogin);
btnCloseModal.addEventListener("click", cerrarModalLogin);

btnSubmitAuth.addEventListener("click", procesarAutenticacion);
authPassword.addEventListener("keydown", (e) => {
  if (e.key === "Enter") procesarAutenticacion();
});

function procesarAutenticacion() {
  const user = authUsername.value.trim().toLowerCase();
  const pass = authPassword.value.trim();

  if (!user) {
    mostrarErrorAuth("Debes escribir un nombre de usuario.");
    return;
  }
  if (!pass) {
    mostrarErrorAuth("Debes escribir una contraseña.");
    return;
  }

  const db = obtenerBaseDatos();

  // 1. Si el usuario ya existe en la BD -> Validar contraseña
  if (db[user]) {
    if (db[user].password !== pass) {
      mostrarErrorAuth(`Contraseña incorrecta para @${user}.`);
      return;
    }
  } 
  // 2. Si es usuario nuevo -> Registrar en la BD con su propia lista vacía
  else {
    db[user] = {
      password: pass,
      meGusta: [] // Colección privada de likes
    };
    guardarBaseDatos(db);
  }

  // Establecer sesión activa
  localStorage.setItem(SESSION_KEY, user);

  cerrarModalLogin();
  actualizarBarraSesion();
  actualizarBotonFavoritoHero();
  renderizarCatalogo();
}

function mostrarErrorAuth(msg) {
  authErrorMsg.textContent = msg;
  authErrorMsg.classList.remove("oculto");
}

// Cerrar sesión
btnLogout.addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  cambiarVista("inicio");
  actualizarBarraSesion();
  actualizarBotonFavoritoHero();
  renderizarCatalogo();
});

function actualizarBarraSesion() {
  const userActivo = obtenerUsuarioActual();
  if (userActivo) {
    lblUsername.textContent = `@${userActivo}`;
    userInfoBar.classList.remove("oculto");
    btnAbrirLogin.classList.add("oculto");
  } else {
    userInfoBar.classList.add("oculto");
    btnAbrirLogin.classList.remove("oculto");
  }
}

// Iniciar aplicación
init();
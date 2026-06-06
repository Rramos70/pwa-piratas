// ==========================================
// 1. CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE
// ==========================================
const firebaseConfig = {
 apiKey: "AIzaSyCVpr7XujBtSj6dB134rx3dLASgepWkJak",
 authDomain: "piratas-tenerife.firebaseapp.com", // CORREGIDO: Añadido el ID del proyecto
 databaseURL: "https://firebasedatabase.app",
 projectId: "piratas-tenerife",
 storageBucket: "piratas-tenerife.firebasestorage.app",
 messagingSenderId: "328725969132",
 appId: "1:328725969132:web:d1242cf35ed2e42b234dc9"
};

// Inicializar Firebase de forma segura
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// ==========================================
// 2. CONTROL DE ACCESO Y SESIÓN LOCAL
// ==========================================
const loguedUser = JSON.parse(localStorage.getItem('softball_logged_user'));
const currentFilename = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);

// Validar y redirigir según sesión
if (!loguedUser && currentFilename !== "login.html" && currentFilename !== "") {
  window.location.href = "login.html";
} else if (loguedUser) {
  // Inyectar de forma segura datos del jugador logueado
  const sessionUsernameElem = document.getElementById('session-username');
  const playerNameElem = document.getElementById('player-name');
  
  if (sessionUsernameElem) sessionUsernameElem.textContent = loguedUser.name;
  if (playerNameElem) playerNameElem.value = loguedUser.name;
  
  // Control de visibilidad del menú de administración según el rol
  if (loguedUser.role !== 'admin') {
    const navAdmin = document.getElementById('nav-link-admin');
    const navUsers = document.getElementById('nav-link-users');
    if (navAdmin) navAdmin.style.display = 'none';
    if (navUsers) navUsers.style.display = 'none';
  }
}

// FUNCIÓN DE SALIDA CONTROLADA
function cerrarSesion() {
  if (confirm('¿Deseas cerrar tu sesión en el equipo?')) {
    localStorage.removeItem('softball_logged_user');
    window.location.href = "login.html";
  }
}

// ID fijo del partido actual
const PROXIMO_PARTIDO_ID = "partido_actual";

// ==========================================
// 3. ENVÍO DE ASISTENCIA A LA NUBE
// ==========================================
function confirmAttendance(statusAsistencia) {
  if (!loguedUser) {
    alert("Debes iniciar sesión para registrar tu asistencia.");
    return;
  }

  db.ref(`asistencias/${PROXIMO_PARTIDO_ID}/${loguedUser.id}`).set({
    name: loguedUser.name,
    plays: statusAsistencia
  })
  .then(() => {
    alert("¡Tu asistencia ha sido registrada en tiempo real!");
  })
  .catch((error) => {
    console.error("Error al guardar en Firebase:", error);
    alert("Hubo un error al guardar tu asistencia. Inténtalo de nuevo.");
  });
}

// ==========================================
// 4. ESCUCHA ACTIVA DE ASISTENCIAS (TIEMPO REAL)
// ==========================================
const listYes = document.getElementById('list-yes');
const listNo = document.getElementById('list-no');

if (listYes && listNo) {
  db.ref(`asistencias/${PROXIMO_PARTIDO_ID}`).on('value', (snapshot) => {
    const countYes = document.getElementById('count-yes');
    const countNo = document.getElementById('count-no');

    listYes.innerHTML = "";
    listNo.innerHTML = "";
    
    let yesCounter = 0;
    let noCounter = 0;

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const asistencia = childSnapshot.val();
        const li = document.createElement('li');
        li.textContent = asistencia.name;

        if (asistencia.plays === true) {
          listYes.appendChild(li);
          yesCounter++;
        } else {
          listNo.appendChild(li);
          noCounter++;
        }
      });
    }

    if (countYes) countYes.textContent = yesCounter;
    if (countNo) countNo.textContent = noCounter;
  });
}

// ==========================================
// 5. CARGA DE LISTAS DINÁMICAS (TIEMPO REAL)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  if (currentFilename === "login.html") return;
  
  if (db) {
    // Datos del próximo partido
    db.ref('proximo_partido').on('value', (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const rival = document.getElementById('next-rival');
        const fecha = document.getElementById('next-date');
        const hora = document.getElementById('next-time');
        const estadio = document.getElementById('next-stadium');

        if (rival) rival.textContent = data.rival || '';
        if (fecha) fecha.textContent = data.fecha || '';
        if (hora) hora.textContent = data.hora || '';
        if (estadio) estadio.textContent = data.estadio || '';
      }
    });

    // Cumpleaños
    db.ref('cumpleanios').on('value', (snapshot) => {
      const bdayList = document.getElementById('birthday-list');
      if (!bdayList) return;
      bdayList.innerHTML = "";
      
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const item = child.val();
          const li = document.createElement('li');
          li.innerHTML = `🎉 <strong>${item.name}</strong> - ${item.date}`;
          bdayList.appendChild(li);
        });
      } else {
        bdayList.innerHTML = '<li style="color:#777; font-style:italic;">No hay cumpleaños registrados este mes.</li>';
      }
    });

    // Historial de partidos
    db.ref('historial_partidos').on('value', (snapshot) => {
      const historyList = document.getElementById('history-matches-list');
      if (!historyList) return;
      historyList.innerHTML = "";

      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const item = child.val();
          const li = document.createElement('li');
          li.innerHTML = `⚾ <strong>${item.rival}</strong> (${item.resultado}) - <small>${item.fecha}</small>`;
          historyList.appendChild(li);
        });
      } else {
        historyList.innerHTML = '<li style="color:#777; font-style:italic;">No hay partidos previos registrados.</li>';
      }
    });

    // Agenda de partidos futuros
    db.ref('agenda_partidos').on('value', (snapshot) => {
      const upcomingList = document.getElementById('upcoming-matches-list');
      if (!upcomingList) return;
      upcomingList.innerHTML = "";

      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const item = child.val();
          const li = document.createElement('li');
          li.innerHTML = `🗓️ <strong>${item.rival}</strong> - ${item.fecha}`;
          upcomingList.appendChild(li);
        });
      } else {
        upcomingList.innerHTML = '<li style="color:#777; font-style:italic;">No hay partidos agendados próximamente.</li>';
      }
    });
  }
});

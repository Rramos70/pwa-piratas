// ==========================================
// 1. CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE
// ==========================================
const firebaseConfig = {
 apiKey: "AIzaSyCVpr7XujBtSj6dB134rx3dLASgepWkJak",
 authDomain: "://firebaseapp.com", // CORREGIDO: ID del proyecto integrado
 databaseURL: "https://firebasedatabase.app",     // NOTA: Asegúrate de que coincida con tu consola
 projectId: "piratas-tenerife",
 storageBucket: "piratas-tenerife.firebasestorage.app",
 messagingSenderId: "328725969132",
 appId: "1:328725969132:web:d1242cf35ed2e42b234dc9"
};

// Inicializar la App de forma segura sin duplicar instancias
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// ==========================================
// 2. CONTROL DE ACCESO Y SESIÓN LOCAL
// ==========================================
const loguedUser = JSON.parse(localStorage.getItem('softball_logged_user'));
const currentFilename = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);

// Validar y redirigir si no hay sesión activa (excepto en login)
if (!loguedUser && currentFilename !== "login.html" && currentFilename !== "") {
  window.location.href = "login.html";
} else if (loguedUser) {
  // Inyectar de forma segura datos del jugador logueado si los elementos existen
  const sessionUsername = document.getElementById('session-username');
  const playerName = document.getElementById('player-name');
  
  if (sessionUsername) sessionUsername.textContent = loguedUser.name;
  if (playerName) playerName.value = loguedUser.name;
  
  // Control de visibilidad del menú de administración según el rol asignado
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

// ID fijo del partido actual para agrupar las asistencias en la base de datos
const PROXIMO_PARTIDO_ID = "partido_actual";

// ==========================================
// 3. ENVÍO DE ASISTENCIA A LA NUBE
// ==========================================
function confirmAttendance(statusAsistencia) {
  if (!loguedUser) {
    alert("Sesión no válida. Por favor, inicia sesión de nuevo.");
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
  // Evitar ejecuciones si estamos en la pantalla de login
  if (currentFilename === "login.html") return;
  
  if (db) {
    // 5.1 Datos del Próximo Partido e Inyección de nuevos campos del HTML
    db.ref('proximo_partido').on('value', (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        const rival = document.getElementById('next-rival');
        const fecha = document.getElementById('next-date');
        const hora = document.getElementById('next-time');
        const estadio = document.getElementById('next-stadium');
        
        // Elementos nuevos soportados
        const diaSemana = document.getElementById('next-day');
        const torneo = document.getElementById('next-tournament');
        const condicion = document.getElementById('next-condition');

        if (rival) rival.textContent = data.rival || '-';
        if (fecha) fecha.textContent = data.fecha || '-';
        if (hora) hora.textContent = data.hora || '-';
        if (estadio) estadio.textContent = data.estadio || '-';
        
        if (diaSemana) diaSemana.textContent = data.dia || '';
        if (torneo) torneo.textContent = data.torneo || 'Campeonato';
        
        if (condicion) {
          condicion.textContent = data.condicion || 'LOCAL';
          if (data.condicion && data.condicion.toLowerCase() === 'visitante') {
            condicion.style.backgroundColor = '#d32f2f'; // Rojo para visitante
            condicion.style.color = 'white';
          } else {
            condicion.style.backgroundColor = '#2E7D32'; // Verde para local
            condicion.style.color = 'white';
          }
        }
      }
    });

    // 5.2 Lista de Cumpleaños
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

    // 5.3 Historial de Partidos Jugados
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

    // 5.4 Calendario / Agenda de Encuentros Futuros
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

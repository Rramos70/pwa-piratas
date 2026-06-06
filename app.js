// ==========================================
// 1. CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE
// ==========================================
const firebaseConfig = {
 apiKey: "AIzaSyCVpr7XujBtSj6dB134rx3dLASgepWkJak",
 authDomain: "://firebaseapp.com",
 databaseURL: "https://firebasedatabase.app",
 projectId: "piratas-tenerife",
 storageBucket: "piratas-tenerife.firebasestorage.app",
 messagingSenderId: "328725969132",
 appId: "1:328725969132:web:d1242cf35ed2e42b234dc9"
};

// Inicializar la App en la Web
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ==========================================
// 2. CONTROL DE ACCESO Y SESIÓN LOCAL (REDIRECCIÓN DIRECTA)
// ==========================================
const loguedUser = JSON.parse(localStorage.getItem('softball_logged_user'));

if (!loguedUser) {
  // CORREGIDO: Redirección directa por ruta relativa pura para evitar páginas en blanco
  window.location.href = "login.html";
} else {
  // Inyectar datos del jugador logueado en la interfaz
  if (document.getElementById('session-username')) {
    document.getElementById('session-username').textContent = loguedUser.name;
  }
  if (document.getElementById('player-name')) {
    document.getElementById('player-name').value = loguedUser.name;
  }
  
  // Control de visibilidad del menú de administración según el rol
  if (loguedUser.role !== 'admin') {
    if (document.getElementById('nav-link-admin')) document.getElementById('nav-link-admin').style.display = 'none';
    if (document.getElementById('nav-link-users')) document.getElementById('nav-link-users').style.display = 'none';
  }
}

// FUNCIÓN DE SALIDA CONTROLADA
function cerrarSesion() {
  if (confirm('¿Deseas cerrar tu sesión en el equipo?')) {
    localStorage.removeItem('softball_logged_user');
    // CORREGIDO: Redirección directa e inmediata tras remover la sesión
    window.location.href = "login.html";
  }
}

// ID fijo del partido actual para agrupar las asistencias en la base de datos
const PROXIMO_PARTIDO_ID = "partido_actual";

// ==========================================
// 3. ENVÍO DE ASISTENCIA A LA NUBE
// ==========================================
function confirmAttendance(statusAsistencia) {
  if (!loguedUser) return;

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
db.ref(`asistencias/${PROXIMO_PARTIDO_ID}`).on('value', (snapshot) => {
  const listYes = document.getElementById('list-yes');
  const listNo = document.getElementById('list-no');
  const countYes = document.getElementById('count-yes');
  const countNo = document.getElementById('count-no');

  if (!listYes || !listNo) return;

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

// ==========================================
// 5. CARGA DE LISTAS DINÁMICAS (TIEMPO REAL)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  
  db.ref('proximo_partido').on('value', (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (document.getElementById('next-rival')) document.getElementById('next-rival').textContent = data.rival;
      if (document.getElementById('next-date')) document.getElementById('next-date').textContent = data.fecha;
      if (document.getElementById('next-time')) document.getElementById('next-time').textContent = data.hora;
      if (document.getElementById('next-stadium')) document.getElementById('next-stadium').textContent = data.estadio;
    }
  });

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
  
});

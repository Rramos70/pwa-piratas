if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.error(err));
  });
}

let partidos = [];
let partidoActivo = null;
let usuarioActual = null;

document.addEventListener('DOMContentLoaded', verificarSesion);

function verificarSesion() {
  usuarioActual = JSON.parse(localStorage.getItem('softball_logged_user'));

  if (!usuarioActual) {
    window.location.href = 'login.html';
    return;
  }

  if (!document.getElementById('match-status-title')) return;

  document.getElementById('session-username').textContent = usuarioActual.name;

  const nameInput = document.getElementById('player-name');
  if (nameInput) {
    nameInput.value = usuarioActual.name;
  }

  initApp();
}

function initApp() {
  partidos = JSON.parse(localStorage.getItem('softball_matches')) || [];
  gestionarPermisosPorRol();
  obtenerPartidoProximo();
  mostrarUltimoResultado();
  cargarCumpleanerosDelMes();
  renderizarHistorialPartidos();
  renderizarPartidosPorRealizar();
  
  if (partidoActivo) {
    cargarAsistencia();
  }
}

function gestionarPermisosPorRol() {
  const navAdmin = document.getElementById('nav-link-admin');
  const navUsers = document.getElementById('nav-link-users');
  
  if (usuarioActual.role === 'guest') {
    if (navAdmin) navAdmin.style.display = 'none';
    if (navUsers) navUsers.style.display = 'none';
  }
}

function obtenerPartidoProximo() {
  const pendientes = partidos.filter(p => p.estado === 'por realizar');
  const badgeCondicion = document.getElementById('next-condition');

  if (pendientes.length === 0) {
    document.getElementById('match-status-title').textContent = "No hay partidos";
    document.getElementById('next-tournament').textContent = "-";
    if (badgeCondicion) badgeCondicion.style.display = 'none';
    document.getElementById('match-details').innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #78909c; padding: 10px 0;">
        No hay nuevos encuentros programados por ahora.
      </div>`;
    document.getElementById('attendance-zone').style.display = 'none';
    document.getElementById('lists-card').style.display = 'none';
    return;
  }

  pendientes.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  partidoActivo = pendientes[0];

  if (badgeCondicion) {
    badgeCondicion.textContent = partidoActivo.condicion || "Local";
    const esLocal = partidoActivo.condicion === 'Local' || !partidoActivo.condicion;
    badgeCondicion.style.backgroundColor = esLocal ? '#e8f5e9' : '#eceff1';
    badgeCondicion.style.color = esLocal ? '#2E7D32' : '#37474f';
    badgeCondicion.style.display = 'inline-block';
  }

  document.getElementById('match-status-title').textContent = "Próximo Partido";
  document.getElementById('next-tournament').textContent = partidoActivo.torneo || "-";
  document.getElementById('next-rival').textContent = partidoActivo.rival || "-";
  document.getElementById('next-date').textContent = partidoActivo.fecha || "-";
  document.getElementById('next-day').textContent = partidoActivo.dia || "-";
  document.getElementById('next-time').textContent = partidoActivo.hora || "-";
  document.getElementById('next-stadium').textContent = partidoActivo.estadio || "-";
  
  document.getElementById('attendance-zone').style.display = 'block';
  document.getElementById('lists-card').style.display = 'block';
}

function mostrarUltimoResultado() {
  const realizados = partidos.filter(p => p.estado === 'realizado');

  if (realizados.length === 0) {
    document.getElementById('last-result-card').style.display = 'none';
    return;
  }

  realizados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const ultimoJuego = realizados[0];

  document.getElementById('result-tournament').textContent = ultimoJuego.torneo || "-";
  document.getElementById('result-rival-name').textContent = ultimoJuego.rival || "-";
  document.getElementById('score-us').textContent = ultimoJuego.scoreNosotros;
  document.getElementById('score-them').textContent = ultimoJuego.scoreRival;
  
  const scoreUsInt = parseInt(ultimoJuego.scoreNosotros, 10) || 0;
  const scoreThemInt = parseInt(ultimoJuego.scoreRival, 10) || 0;
  const elUs = document.getElementById('score-us');
  const elThem = document.getElementById('score-them');

  if (scoreUsInt > scoreThemInt) {
    elUs.className = "team-score score-win";
    elThem.className = "team-score";
  } else if (scoreThemInt > scoreUsInt) {
    elThem.className = "team-score score-win";
    elUs.className = "team-score";
  } else {
    elUs.className = "team-score";
    elThem.className = "team-score";
  }

  document.getElementById('last-result-card').style.display = 'block';
}
window.confirmAttendance = function(isGoing) {
  if (!partidoActivo) return;

  const playerName = usuarioActual.name;

  if (!playerName || playerName.trim() === "") {
    alert("Error de credenciales.");
    return;
  }

  let todasLasAsistencias = JSON.parse(localStorage.getItem('softball_attendance_list')) || {};
  let listadoPartido = todasLasAsistencias[partidoActivo.id] || [];

  listadoPartido = listadoPartido.filter(player => player.name.trim().toLowerCase() !== playerName.toLowerCase());
  listadoPartido.push({ name: playerName, attending: isGoing });

  todasLasAsistencias[partidoActivo.id] = listadoPartido;
  localStorage.setItem('softball_attendance_list', JSON.stringify(todasLasAsistencias));

  cargarAsistencia();
  renderizarPartidosPorRealizar(); // Recargar agenda para refrescar contadores en vivo
};

function cargarAsistencia() {
  if (!partidoActivo) return;

  const todasLasAsistencias = JSON.parse(localStorage.getItem('softball_attendance_list')) || {};
  const listadoPartido = todasLasAsistencias[partidoActivo.id] || [];
  const listaUsuarios = JSON.parse(localStorage.getItem('softball_users_list')) || [];

  const listYes = document.getElementById('list-yes');
  const listNo = document.getElementById('list-no');
  
  listYes.innerHTML = "";
  listNo.innerHTML = "";
  
  let yesCount = 0;
  let noCount = 0;

  const partesPartido = partidoActivo.fecha.split('-');
  const mesPartido = parseInt(partesPartido[1], 10);
  const diaPartido = parseInt(partesPartido[2], 10);

  listadoPartido.forEach(player => {
    const li = document.createElement('li');
    li.textContent = player.name;

    if (player.attending) {
      const datosUsuario = listaUsuarios.find(u => u.name.toLowerCase() === player.name.toLowerCase());
      
      if (datosUsuario && datosUsuario.birth) {
        const partesCumple = datosUsuario.birth.split('-');
        const mesCumple = parseInt(partesCumple[1], 10);
        const diaCumple = parseInt(partesCumple[2], 10);

        if (mesCumple === mesPartido && diaCumple === diaPartido) {
          li.innerHTML = `👑 <strong>${player.name}</strong> <span style="font-size:11px; color:#e65100; font-weight:bold;">¡Cumpleaños hoy!</span>`;
          li.style.background = '#fff3e0'; 
          li.style.borderLeft = '4px solid #ffb74d';
        }
      }

      listYes.appendChild(li);
      yesCount++;
    } else {
      listNo.appendChild(li);
      noCount++;
    }
  });

  document.getElementById('count-yes').textContent = yesCount;
  document.getElementById('count-no').textContent = noCount;
}

function cargarCumpleanerosDelMes() {
  const listaUsuarios = JSON.parse(localStorage.getItem('softball_users_list')) || [];
  const container = document.getElementById('birthday-list');
  const txtTitle = document.getElementById('birthday-title');
  if (!container) return;

  container.innerHTML = "";
  
  const ahora = new Date();
  const mesActualNumero = ahora.getMonth() + 1; 
  const nombreMes = ahora.toLocaleString('es-ES', { month: 'long' });

  if (txtTitle) {
    txtTitle.textContent = `🎂 Cumpleaños de ${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}`;
  }

  // CORRECCIÓN CRÍTICA: Se añade el índice [1] para evaluar correctamente el mes del usuario
  const cumpleaneros = listaUsuarios.filter(u => {
    if (!u.birth || u.status === 'inactivo') return false;
    const partes = u.birth.split('-');
    const mesUsuario = parseInt(partes[1], 10); 
    return mesUsuario === mesActualNumero;
  });

  if (cumpleaneros.length === 0) {
    container.innerHTML = '<li style="text-align:center; color:#78909c; font-size:13px; padding: 10px 0;">No hay cumpleaños registrados este mes 🎉</li>';
    return;
  }

  // CORRECCIÓN CRÍTICA: Se añade el índice [2] para ordenar por el día numérico real
  cumpleaneros.sort((a, b) => parseInt(a.birth.split('-')[2], 10) - parseInt(b.birth.split('-')[2], 10));

  cumpleaneros.forEach(c => {
    const li = document.createElement('li');
    li.style.background = '#f1f8ff';
    li.style.padding = '10px 12px';
    li.style.borderRadius = '6px';
    li.style.fontSize = '14px';
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    
    const diaDelCumple = parseInt(c.birth.split('-')[2], 10);

    li.innerHTML = `<span>🏃‍♂️ <strong>${c.name}</strong></span> <span style="color:#0288d1; font-weight:bold;">Día ${diaDelCumple} 🎈</span>`;
    container.appendChild(li);
  });
}

function renderizarHistorialPartidos() {
  const container = document.getElementById('history-matches-list');
  if (!container) return;

  container.innerHTML = "";

  const realizados = partidos.filter(p => p.estado === 'realizado');

  if (realizados.length === 0) {
    container.innerHTML = '<li style="text-align:center; color:#78909c; font-size:13px; padding: 10px 0;">No hay partidos en el historial 🥎</li>';
    return;
  }

  realizados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  realizados.forEach(p => {
    const li = document.createElement('li');
    const scoreUs = parseInt(p.scoreNosotros, 10) || 0;
    const scoreThem = parseInt(p.scoreRival, 10) || 0;
    
    let resultadoTexto = "Empate";
    let badgeColor = "#78909c";

    if (scoreUs > scoreThem) {
      resultadoTexto = "Ganó";
      badgeColor = "#2E7D32";
    } else if (scoreThem > scoreUs) {
      resultadoTexto = "Perdió";
      badgeColor = "#c62828";
    }

    let fechaCorta = p.fecha;
    const partes = p.fecha.split('-');
    if (partes.length === 3) {
      fechaCorta = `${partes[2]}/${partes[1]}`;
    }

    li.style.background = '#f5f5f5';
    li.style.padding = '10px 12px';
    li.style.borderRadius = '6px';
    li.style.fontSize = '14px';
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';

    li.innerHTML = `
      <div>
        <span style="color:#777; font-size:12px; font-weight:bold; margin-right:6px;">${fechaCorta}</span>
        <strong>vs ${p.rival}</strong>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-weight:bold; color:#333;">${scoreUs} - ${scoreThem}</span>
        <span style="background-color:${badgeColor}; color:white; font-size:11px; font-weight:bold; padding:2px 6px; border-radius:4px; text-transform:uppercase;">
          ${resultadoTexto}
        </span>
      </div>
    `;
    container.appendChild(li);
  });
}

function renderizarPartidosPorRealizar() {
  const container = document.getElementById('upcoming-matches-list');
  if (!container) return;

  container.innerHTML = "";

  const pendientes = partidos.filter(p => p.estado === 'por realizar');
  const todasLasAsistencias = JSON.parse(localStorage.getItem('softball_attendance_list')) || {};

  if (pendientes.length === 0) {
    container.innerHTML = '<li style="text-align:center; color:#78909c; font-size:13px; padding: 10px 0;">No hay más partidos programados 📅</li>';
    return;
  }

  pendientes.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  pendientes.forEach(p => {
    const li = document.createElement('li');
    const esLocal = p.condicion === 'Local' || !p.condicion;

    // INTEGRACIÓN NUEVA: Calcular número total de confirmados confirmados para este partido específico
    const listadoAsistencia = todasLasAsistencias[p.id] || [];
    const totalConfirmados = listadoAsistencia.filter(player => player.attending === true).length;

    let fechaCorta = p.fecha;
    const partes = p.fecha.split('-');
    if (partes.length === 3) {
      fechaCorta = `${partes[2]}/${partes[1]}`;
    }

    li.style.background = '#fafafa';
    li.style.padding = '10px 12px';
    li.style.borderRadius = '6px';
    li.style.fontSize = '14px';
    li.style.display = 'flex';
    li.style.flexDirection = 'column';
    li.style.gap = '4px';
    li.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
    li.style.borderLeft = esLocal ? '4px solid #2E7D32' : '4px solid #37474f';

    li.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="color:#2E7D32; font-size:12px; font-weight:bold; margin-right:6px;">${fechaCorta} (${p.dia || '-'})</span>
          <strong>vs ${p.rival}</strong>
        </div>
        <span style="font-size:12px; font-weight:bold; color:#555;">${p.hora || '-'} hs</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#666;">
        <span>🏆 ${p.torneo || '-'} | 🏟️ ${p.estadio || '-'}</span>
        <!-- Badge de contadores de asistencia integrada -->
        <span style="background:#e8f5e9; color:#2E7D32; padding:1px 6px; border-radius:10px; font-weight:bold; font-size:11px;">
          👍 ${totalConfirmados} Listos
        </span>
      </div>
    `;
    container.appendChild(li);
  });
}

let partidos = JSON.parse(localStorage.getItem('softball_matches')) || [];

const form = document.getElementById('match-form');
const inputFecha = document.getElementById('fecha');
const inputDia = document.getElementById('dia');
const selectEstado = document.getElementById('estado');
const scoreNosotros = document.getElementById('score-nosotros');
const scoreRival = document.getElementById('score-rival');
const btnCancel = document.getElementById('btn-cancel');

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

inputFecha.addEventListener('change', () => {
  if (inputFecha.value) {
    const dateObj = new Date(inputFecha.value + 'T00:00:00');
    inputDia.value = diasSemana[dateObj.getDay()];
  } else {
    inputDia.value = '';
  }
});

selectEstado.addEventListener('change', () => {
  if (selectEstado.value === 'realizado') {
    scoreNosotros.disabled = false;
    scoreRival.disabled = false;
    scoreNosotros.required = true;
    scoreRival.required = true;
  } else {
    scoreNosotros.disabled = true;
    scoreRival.disabled = true;
    scoreNosotros.required = false;
    scoreRival.required = false;
    scoreNosotros.value = '';
    scoreRival.value = '';
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const id = document.getElementById('match-id').value;
  const partidoData = {
    id: id || Date.now().toString(),
    torneo: document.getElementById('torneo').value.trim(),
    rival: document.getElementById('rival').value.trim(),
    fecha: inputFecha.value,
    dia: inputDia.value,
    hora: document.getElementById('hora').value,
    estadio: document.getElementById('estadio').value.trim(),
    estado: selectEstado.value,
    scoreNosotros: scoreNosotros.value || '-',
    scoreRival: scoreRival.value || '-'
  };

  if (id) {
    partidos = partidos.map(p => p.id === id ? partidoData : p);
  } else {
    partidos.push(partidoData);
  }

  localStorage.setItem('softball_matches', JSON.stringify(partidos));
  resetFormState();
  renderTable();
});

function renderTable() {
  const tbody = document.getElementById('matches-table-body');
  tbody.innerHTML = '';

  if (partidos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#78909c; padding: 20px;">No hay partidos programados.</td></tr>`;
    return;
  }

  const partidosOrdenados = [...partidos].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  partidosOrdenados.forEach(p => {
    const tr = document.createElement('tr');
    const badgeClass = p.estado === 'realizado' ? 'badge-done' : 'badge-pending';
    const scoreTexto = p.estado === 'realizado' ? `${p.scoreNosotros} - ${p.scoreRival}` : 'N/A';

    tr.innerHTML = `
      <td><strong>${p.torneo}</strong></td>
      <td>${p.rival}</td>
      <td>${p.fecha}<br><small style="color:#666">${p.dia}</small></td>
      <td>${p.hora}</td>
      <td>${p.estadio}</td>
      <td><span class="badge ${badgeClass}">${p.estado.toUpperCase()}</span></td>
      <td><strong>${scoreTexto}</strong></td>
      <td class="actions">
        <button class="btn-action btn-edit" onclick="editMatch('${p.id}')">✏️</button>
        <button class="btn-action btn-delete" onclick="deleteMatch('${p.id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.editMatch = function(id) {
  const p = partidos.find(match => match.id === id);
  if (!p) return;

  document.getElementById('match-id').value = p.id;
  document.getElementById('torneo').value = p.torneo;
  document.getElementById('rival').value = p.rival;
  inputFecha.value = p.fecha;
  inputDia.value = p.dia;
  document.getElementById('hora').value = p.hora;
  document.getElementById('estadio').value = p.estadio;
  selectEstado.value = p.estado;

  if (p.estado === 'realizado') {
    scoreNosotros.disabled = false;
    scoreRival.disabled = false;
    scoreNosotros.value = p.scoreNosotros;
    scoreRival.value = p.scoreRival;
  } else {
    scoreNosotros.disabled = true;
    scoreRival.disabled = true;
    scoreNosotros.value = '';
    scoreRival.value = '';
  }

  document.getElementById('form-title').textContent = "✏️ Editar Partido";
  document.getElementById('btn-save').textContent = "💾 Actualizar Cambios";
  btnCancel.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteMatch = function(id) {
  if (confirm('¿Deseas eliminar este partido?')) {
    partidos = partidos.filter(p => p.id !== id);
    localStorage.setItem('softball_matches', JSON.stringify(partidos));
    renderTable();
    if (document.getElementById('match-id').value === id) {
      resetFormState();
    }
  }
};

btnCancel.addEventListener('click', resetFormState);

function resetFormState() {
  form.reset();
  document.getElementById('match-id').value = '';
  document.getElementById('form-title').textContent = "Programar Nuevo Partido";
  document.getElementById('btn-save').textContent = "💾 Guardar Partido";
  btnCancel.style.display = 'none';
  scoreNosotros.disabled = true;
  scoreRival.disabled = true;
  inputDia.value = '';
}

renderTable();

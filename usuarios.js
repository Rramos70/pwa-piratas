// Arreglo global de usuarios sincronizado con LocalStorage
let usuarios = JSON.parse(localStorage.getItem('softball_users')) || [];

// Elementos de la interfaz de usuario
const userForm = document.getElementById('user-form');
const btnUserCancel = document.getElementById('btn-user-cancel');
const userFormTitle = document.getElementById('user-form-title');
const btnUserSave = document.getElementById('btn-user-save');
const inputPassword = document.getElementById('user-password');

// 1. Procesar el envío del formulario (Crear o Editar)
userForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const id = document.getElementById('user-id').value;
  const usuarioData = {
    id: id || Date.now().toString(),
    nombre: document.getElementById('user-name').value.trim(),
    telefono: document.getElementById('user-phone').value.trim(),
    correo: document.getElementById('user-email').value.trim(),
    password: inputPassword.value, // Captura de la contraseña para el futuro login
    rol: document.getElementById('user-role').value
  };

  if (id) {
    // Modo Edición: Reemplazar elemento existente
    usuarios = usuarios.map(u => u.id === id ? usuarioData : u);
  } else {
    // Modo Creación: Añadir a la lista
    usuarios.push(usuarioData);
  }

  // Guardar datos actualizados en LocalStorage
  localStorage.setItem('softball_users', JSON.stringify(usuarios));
  
  resetUserForm();
  renderUsersTable();
});

// 2. Dibujar dinámicamente la tabla de usuarios registrados
function renderUsersTable() {
  const tbody = document.getElementById('users-table-body');
  tbody.innerHTML = '';

  if (usuarios.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#78909c; padding: 20px;">No hay miembros registrados.</td></tr>`;
    return;
  }

  // Ordenar alfabéticamente por nombre
  const usuariosOrdenados = [...usuarios].sort((a, b) => a.nombre.localeCompare(b.nombre));

  usuariosOrdenados.forEach(u => {
    const tr = document.createElement('tr');
    const isAdmin = u.rol === 'administrador' || u.role === 'administrador';
    const badgeClass = isAdmin ? 'badge-pending' : 'badge-done';
    const rolTexto = isAdmin ? 'ADMIN' : 'INVITADO';

    tr.innerHTML = `
      <td><strong>${u.nombre}</strong></td>
      <td><a href="tel:${u.telefono}" style="color: inherit; text-decoration: none;">📞 ${u.telefono}</a></td>
      <td>${u.correo}</td>
      <td><span class="badge ${badgeClass}">${rolTexto}</span></td>
      <td class="actions">
        <button class="btn-action btn-edit" onclick="editUser('${u.id}')">✏️</button>
        <button class="btn-action btn-delete" onclick="deleteUser('${u.id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 3. Cargar datos del usuario seleccionado al formulario para editar
window.editUser = function(id) {
  const u = usuarios.find(user => user.id === id);
  if (!u) return;

  document.getElementById('user-id').value = u.id;
  document.getElementById('user-name').value = u.nombre;
  document.getElementById('user-phone').value = u.telefono;
  document.getElementById('user-email').value = u.correo;
  inputPassword.value = u.password || ''; // Carga la contraseña guardada

  // Al editar, la contraseña se puede visualizar o modificar de ser necesario
  document.getElementById('user-role').value = u.rol || u.role;

  // Cambiar visualmente los textos del panel
  userFormTitle.textContent = "✏️ Editar Miembro";
  btnUserSave.textContent = "💾 Actualizar Cambios";
  btnUserCancel.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 4. Eliminar permanentemente un usuario de la lista
window.deleteUser = function(id) {
  if (confirm('¿Estás seguro de que deseas eliminar a este miembro del equipo?')) {
    usuarios = usuarios.filter(u => u.id !== id);
    localStorage.setItem('softball_users', JSON.stringify(usuarios));
    renderUsersTable();
    
    if (document.getElementById('user-id').value === id) {
      resetUserForm();
    }
  }
};

// 5. Cancelar modo edición y reestablecer interfaz por defecto
btnUserCancel.addEventListener('click', resetUserForm);

function resetUserForm() {
  userForm.reset();
  document.getElementById('user-id').value = '';
  userFormTitle.textContent = "Registrar Nuevo Miembro";
  btnUserSave.textContent = "💾 Guardar Miembro";
  btnUserCancel.style.display = 'none';
}

// Inicialización de la tabla al cargar la ventana
renderUsersTable();

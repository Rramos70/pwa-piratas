document.getElementById('login-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const emailInput = document.getElementById('login-email').value.trim().toLowerCase();
  const passwordInput = document.getElementById('login-password').value;
  const errorBanner = document.getElementById('error-message');

  // Ocultar banner de error anterior
  errorBanner.style.display = 'none';
  errorBanner.textContent = '';

  // 1. Recuperar la lista de usuarios creados desde el LocalStorage
  const usuarios = JSON.parse(localStorage.getItem('softball_users')) || [];

  // 2. Buscar si existe un usuario registrado con ese correo electrónico
  const usuarioEncontrado = usuarios.find(user => user.correo.toLowerCase() === emailInput);

  if (!usuarioEncontrado) {
    mostrarError("El correo electrónico no está registrado en el equipo.");
    return;
  }

  // 3. Validar si la contraseña ingresada coincide con la guardada
  if (usuarioEncontrado.password !== passwordInput) {
    mostrarError("Contraseña incorrecta. Inténtalo de nuevo.");
    return;
  }

  // 4. INICIO DE SESIÓN EXITOSO: Guardar los datos de sesión activa en la app
  const sesionUsuario = {
    id: usuarioEncontrado.id,
    nombre: usuarioEncontrado.nombre,
    rol: usuarioEncontrado.rol || usuarioEncontrado.role // Guarda 'administrador' o 'invitado'
  };

  localStorage.setItem('softball_logged_user', JSON.stringify(sesionUsuario));

  // 5. Redirigir a la pantalla de inicio del jugador
  window.location.href = 'index.html';
});

function mostrarError(mensaje) {
  const errorBanner = document.getElementById('error-message');
  errorBanner.textContent = mensaje;
  errorBanner.style.display = 'block';
}

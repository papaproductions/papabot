var permisos = [
    "Crear invitación",
    "Expulsar miembros",
    "Banear miembros",
    "Administrador",
    "Gestionar canales",
    "Gestionar servidor",
    "Añadir reacciones",
    "Ver registro de auditoría",
    "Prioridad de palabra",
    "Vídeo",
    "Leer canales de texto y ver canales de voz",
    "Enviar mensajes",
    "Enviar mensajes de texto a voz",
    "Gestionar mensajes",
    "Insertar enlaces",
    "Adjuntar archivos",
    "Leer el historial de mensajes",
    "Mencionar @everyone, @here y todos los roles",
    "Usar emojis externos",
    "Ver información del servidor",
    "Conectar",
    "Hablar",
    "Silenciar miembros",
    "Ensordecer miembros",
    "Mover miembros",
    "Usar actividad de voz",
    "Cambiar apodo",
    "Gestionar apodos",
    "Gestionar roles",
    "Gestionar webhooks",
    "Gestionar emojis"
];

/**
 * @param {int} numero
 */
function convertirPermisos(numero) {
    var salida = [];
    for(var i = 0; i < permisos.length; i++) {
        var numeroPermiso = 1 << i;
        if((numeroPermiso & numero) == numeroPermiso) {
        salida.push(permisos[i]);
        }
    }
    return salida;
}

module.exports = convertirPermisos;
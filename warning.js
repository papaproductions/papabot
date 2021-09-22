class Warning {
	/**
	 * Crea un nuevo objeto `Warning`
	 * @param {String} usuarioID 
	 * @param {String} razon 
	 * @param {Number} fecha
	 * @param {String} moderador
	 * @param {String} id
	 * @param {String} castigo
	 * @param {number} caso
	 */
	constructor(usuarioID, razon, fecha, moderador, id, castigo, caso) {
		this.usuarioID = usuarioID;
		this.razon = razon;
		this.fecha = fecha;
		this.moderador = moderador;
		this.id = id;
		this.castigo = castigo;
		this.caso = caso;
	}

	/**
	 * Conseguir las warnings de un usuario.
	 * @param {String} usuarioID
	 * @param {Warning[]} lista
	 * @returns {Warning[]} Las warnings del usuario.
	 */
	static conseguirWarningsDeUnUsuario(usuarioID, lista) {
		var salida = [];
		for(var i = 0; i < lista.length; i++) {
			try {
				if(lista[i].usuarioID == usuarioID) {
					salida.push(lista[i]);
				}
			}
			catch(err) {
				console.log("\x1b[31m%s\x1b[0m", "No se pudo cargar una warn!");
			}
		}
		return salida;
	}
}

module.exports = Warning;
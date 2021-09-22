/**
 * Registra algo en la salida (`process.stdout`) con bonitos colores :)
 * @param {String} tipo tipo de registro. `"correcto", "error", "procesando", "info"`
 * @param {String} datos Qué deseas poner en la salida.
 */
function registrar(tipo, datos) {
    const tipos = {
        "correcto": "32",
        "error": "31",
        "procesando": "33",
        "info": "0"
    };
    const separado = datos.toString().split("\n");
    separado.forEach((linea) => console.log(`\x1b[34m[ ${new Date()} ] \x1b[${tipos[tipo]}m${linea}\x1b[0m`));
}

module.exports = registrar;
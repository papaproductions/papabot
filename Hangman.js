const Discord = require("discord.js");

class Hangman {
    constructor(palabra) {
        this.palabraElegida = palabra;
        this.palabra = this.palabraElegida.split(" ").map((value) => "_".repeat(value.length)).join(" ");
        this.letrasAdivinadas = [];
        this.letrasFallidas = [];
        this.embed = new Discord.MessageEmbed();
        this.embed.setTitle("Es hora de jugar ahorcado!");
        this.embed.setDescription(`Palabra: \`${this.palabra}\``);
        this.embed.setImage("http://www.papaproductions.cc/imagenes/ahorcados/0.png");
        this.embed.setFooter(`Usa el comando letter para adivinar una letra.`);
        this.mensajeAhorcados = undefined;
    }
    adivinar(letra) {
        var instancias = getIndicesOf(letra, this.palabraElegida, false);
        for(var i = 0; i < instancias.length; i++) {
            this.palabra = reemplazarEn(this.palabra, letra, instancias[i]);
        }
        this.letrasAdivinadas.push(letra);
        return instancias;
    }
}

/**
 * 
 * @param {string} string 
 * @param {string} reemplazo 
 * @param {number} index 
 */
function reemplazarEn(string, reemplazo, index) {
	return string.substring(0, index) + reemplazo + string.substring(index + 1);
}

/**
 * 
 * @param {string} searchStr 
 * @param {string} str 
 * @param {boolean} caseSensitive 
 */
function getIndicesOf(searchStr, str, caseSensitive) {
    var searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
        return [];
    }
    var startIndex = 0, index, indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

module.exports = Hangman;
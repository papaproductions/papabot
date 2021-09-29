#!/usr/bin/env node

const crypto = require("crypto");
const Discord = require("discord.js");
const readline = require("readline");
const gTTS = require("gtts");
const Warning = require("./warning");
const Hangman = require("./Hangman");
var juegos = {};
const registrar = require("./registrar");
const convertirPermisos = require("./convertirPermisos");
const child_process = require("child_process");
const papaProductions = "443568221577019402";
const interfaz = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
const sistemas = {
    "win32": "Windows",
    "darwin": "Mac OS",
    "linux": "Linux",
    "freebsd": "FreeBSD",
    "openbsd": "OpenBSD"
}
const nDatos = [
    {
        minimo: Math.pow(1024, 3),
        terminacion: "GiB"
    },
    {
        minimo: Math.pow(1024, 2),
        terminacion: "MiB"
    },
    {
        minimo: 1024,
        terminacion: "KiB"
    },
    {
        minimo: 1,
        terminacion: "bytes"
    }
]
const fs = require("fs");
const os = require("os");
const alias = {
	"m": "mute",
	"w": "warn",
	"k": "kick",
	"b": "ban",
	"sb": "softban",
	"hammer": "ban",
	"shut": "mute",
	"yeet": "kick",
	"speak": "unmute",
	"del": "delwarn",
	"bye": "shutdown",
	"rps": "rockpaperscissors"
}
const cliente = new Discord.Client();
var objetivoSpam = "";
var vecesSpam = {};
var miembroSpam;
//No leas esto pls :/
const blacklist = ["blacklistwordstest", "puta", "puto", "mierda", "putito", "pendejo", "pendeja", "verga", "shit"];
const caracteresEspeciales = ["*", "_", "?", "¿", "!", "¡", "á", "é", "í", "ó", "ú"];
const remplazos = ["", "", "", "", "", "", "a", "e", "i", "o", "u", ""];
const max = 5;
var palabraElegida = "";
var palabras = fs.readFileSync("hangman.txt").toString().split("\n");
var letrasAdivinadas = [];
var mensajeAhorcados;
var jugando = null;
var veces = {};
var config = {};
const iniciadoDesde = new Date();
var letrasFallidas = [];
var palabra = "";
const respuestas = {
	normales : {
		"hola" : "👋",
		"que haces" : "👀",
		"adios" : "👋",
		"destruyete" : "💣",
		"como estas" : "👌",
		"quiero pizza" : "🍕",
		"papa" : "🥔",
		"papabot es genial": "<:papabot_aproves:802961232197845032>",
		"distraeme": "<a:distraccion:802961197560233994>"
	},
	inicioComandoMod: "Tus deseos son órdenes, ",
	tipoDeFaltaInvalido : "Tipo de falta inválido.",
	yaJugando: "Ya estás jugando.",
	apagar : new Discord.MessageEmbed({
		title: "Apagado solicitado.",
		description: "Apagando..."
	}),
	reiniciar: "¡Ya vuelvo!",
	razonBaneoOExpulsion : "Rompiste las reglas, niño necio.",
	comandoDesconocido: new Discord.MessageEmbed({
		title: "<:papabot_hmmm:774748972954550304> hmmm",
		description: "Comando desconocido :(",
		color: "#f04947"
	})
};

cliente.on("guildCreate", async (guild) => {
	try {
		await configurarGuild(guild);
	}
	catch(err) {
	}
});

cliente.on("guildDelete", () => {
	cargarEstado();
});

/**
 * Configura un guild nuevo.
 * @param {Discord.Guild} guild 
 */
async function configurarGuild(guild) {
	try {
		var c;
		try {
			c = JSON.parse(fs.readFileSync(`config/${guild.id}`).toString())
		}catch { c = {}}
		const canales = guild.channels.cache.array();
		var rolMuteado;
		try {
			/*rolMuteado = await guild.roles.create({
				data: {
					name: "Muteado",
					permissions: 0,
					color: "#666666"
				}
			});*/
		}
		catch(err) {

		}
		try {
			await cargarEstado();
			if(veces[guild.id] == undefined) veces[guild.id] = [];
			actualizarWarnings(guild);
			if(config[guild.id] == undefined) {
				config[guild.id] = {
					rolMuteado: undefined,
					autoMod: {
						malasPalabras: false,
						inundacion: false,
						repeticionMensajes: false
					},
					prevencionRangos: true,
					mods: [],
					prefijo: "$"
				};
			}
			//guild.channels.cache.forEach(canal => configurarRolMuteado(canal).catch((err) => registrar("error", "Algo fallo al configurar un servidor :(")));
			registrar("procesando", "Guardando nuevos archivos...");
			guardarConfig(guild);
			registrar("correcto", "Listo!");
			registrar("info", "He sido invitado a un server!!!1 😮");
			for(var canal of canales) {
				if(canal.isText() && canal.viewable && canal.permissionsFor(cliente.user).has("SEND_MESSAGES")) {
					await canal.send(`Hola a todos en ${guild.name}! Mi nombre es PapaBot, si quieres saber todos mis comandos usa \`${config[guild.id].prefijo}help\`. Fui creado por Papa productions#0001, gracias por usar a PapaBot!`);
					break;
				}
			}
			
		}
		catch(err) {
			registrar("error", err.stack);
		}
		guardarConfig(guild);
	}
	catch {}
}

cliente.on("ready", listo);

/**
 * Este m&eacute;todo se llama cuando PapaBot est&aacute; listo.
 */
async function listo() {
	//Escribe en la salida de Node.js que PapaBot se inició.
	registrar("correcto", `¡Listo! PapaBot entró correctamente con el nombre de usuario \"${cliente.user.username}\".`);

	await cliente.user.setPresence({
		status: "idle",
		activity: {
			name: "Cargando...",
			type: "WATCHING"
		}
	});

	//Lee todas las warnings.
	fs.readdirSync(`warnings`).forEach((archivo) => {
		try {
			registrar("procesando", `Leyendo warnings de ${archivo}...`);
			var archivoLeido = fs.readFileSync(`warnings/${archivo}`).toString();
			veces[archivo] = JSON.parse(archivoLeido);
			registrar("correcto", `Se leyó un total de ${veces[archivo].length} warnings.`);
		}
		catch(err) {
			registrar("error", "No se pudo cargar NADA!");
		}
	});

	fs.readdirSync("config").forEach((archivo) => {
		try {
			registrar("procesando", `Cargando configuración de ${archivo}...`);
			config[archivo] = JSON.parse(fs.readFileSync(`config/${archivo}`));
			registrar("correcto", "Listo!");
		}
		catch(err) {
			registrar("error", "No se pudo cargar NADA!");
		}
	});
	
	cargarEstado();
	//Inicia la función del mensaje manual
	//mensajeManual();
}

/**
 * Obtiene el webhook de registros de un guild (si existe).
 * @param {Discord.Guild} guild El guild del webhook
 * @returns {Promise<Discord.Webhook>} El webhook
 */
async function obtenerWebhookRegistros(guild) {
	try {
		var canalRegistros = guild.channels.cache.get(config[guild.id].canalRegistros);
		var webhookRegistros;
		if(canalRegistros.isText()) {
			webhookRegistros = (await canalRegistros.fetchWebhooks()).get(config[guild.id].webhookRegistros);
		}
		return webhookRegistros;
	}
	catch(err) {
		return;
	}
}

cliente.on("messageDeleteBulk", async (mensajes) => {
	var webhookRegistros = await obtenerWebhookRegistros(mensajes.first().guild);
	if(webhookRegistros != undefined) {
		webhookRegistros.send(new Discord.MessageEmbed({
			title: `${mensajes.size} mensajes eliminados en #${mensajes.first().channel.name}`
		}));
	}
});

cliente.on("messageDelete", async (mensaje) => {
	var webhookRegistros = await obtenerWebhookRegistros(mensaje.guild);
	var desc = `${mensaje.author.tag}: ${mensaje.content}`;
	if(webhookRegistros != undefined) {
		webhookRegistros.send(new Discord.MessageEmbed({
			author: {
				iconURL: mensaje.author.avatarURL(),
				name: mensaje.author.tag
			},
			title: `Un mensaje en #${mensaje.channel.name} fue eliminado.`,
			description: desc.length > 1024 ? `${desc.slice(0, 1021)}...` : desc
		}));
	}
});

cliente.on("guildMemberRemove", async (miembro) => {
	var webhookRegistros = await obtenerWebhookRegistros(miembro.guild);
	if(webhookRegistros != undefined) {
		webhookRegistros.send(new Discord.MessageEmbed({
			title: "Un miembro se fue",
			description: miembro.user.tag,
			author: {
				iconURL: miembro.user.avatarURL(),
				name: miembro.user.tag
			},
			thumbnail: {
				url: miembro.user.avatarURL()
			}
		}));
	}
});

cliente.on("guildMemberAdd", async (miembro) => {
	var webhookRegistros = await obtenerWebhookRegistros(miembro.guild);
	if(webhookRegistros != undefined) {
		await webhookRegistros.send(new Discord.MessageEmbed({
			title: "Un nuevo miembro entró",
			thumbnail: {
				url: miembro.user.avatarURL()
			},
			author: {
				iconURL: miembro.user.avatarURL(),
				name: miembro.user.tag
			},
			fields: [
				{
					name: "Información de cuenta:",
					value: `Discord Tag: ${miembro.user.tag}\n`
						 + `Creación de cuenta: ${new Date(miembro.user.createdTimestamp)}\n`
						 + `ID: ${miembro.id}`
				},
			]
		}));
	}
	if(config[miembro.guild.id].modoEmergencia) {
		await miembro.kick("Modo de emergencia habilitado.");
	}
});

cliente.on("channelDelete", async canal => {
	var webhookRegistros = await obtenerWebhookRegistros(canal.guild);
	if(webhookRegistros != undefined) {
		webhookRegistros.send(new Discord.MessageEmbed({
			author: {
				iconURL: canal.guild.iconURL(),
				name: canal.guild.name
			},
			title: "Canal eliminado",
			description: `Canal: \`#${canal.name}\``
		}));
	}
});

cliente.on("inviteDelete", async invite => {
	var webhookRegistros = await obtenerWebhookRegistros(invite.guild);
	if(webhookRegistros != undefined) {
		webhookRegistros.send(new Discord.MessageEmbed({
			title: "Invite eliminado",
			fields: [
				{
					name: "Código del invite:",
					value: invite.code
				}
			]
		}));
	}
});

cliente.on("inviteCreate", async invite => {
	var webhookRegistros = await obtenerWebhookRegistros(invite.guild);
	if(webhookRegistros != undefined) {
		webhookRegistros.send(new Discord.MessageEmbed({
			title: "Invite creado",
			author: {
				name: invite.inviter == null ? null : invite.inviter.tag,
				iconURL: invite.inviter == null ? null : invite.inviter.avatarURL()
			},
			fields: [
				{
					name: "URL del invite:",
					value: invite.url
				},
				{
					name: "Creado por:",
					value: invite.inviter == null ? "Desconocido" : invite.inviter.tag
				},
				{
					name: "Expira en:",
					value: invite.expiresAt
				},
				{
					name: "Máximo de gente que puede entrar con este invite:",
					value: invite.maxUses == 0 ? "No hay límite" : invite.maxUses
				},
				{
					name: "Membresía temporal:",
					value: invite.temporary ? "Sí" : "No"
				},
				{
					name: "Código:",
					value: invite.code
				}
			],
			footer: {
				text: "Creado en"
			},
			timestamp: invite.createdTimestamp
		}));
	}
});

cliente.on("channelCreate", async canal => {
	configurarRolMuteado(canal);
	var webhookRegistros = await obtenerWebhookRegistros(canal.guild);
	if(webhookRegistros != undefined) {
		webhookRegistros.send(new Discord.MessageEmbed({
			author: {
				iconURL: canal.guild.iconURL(),
				name: canal.guild.name
			},
			title: "Canal creado",
			description: `Canal: ${canal} (\`#${canal.name}\`)`
		}));
	}
});

function obtenerReactionRole(reaction) {
	if(!config[reaction.guild_id].rolesDeReaccion) {
		return;
	}
	var mensaje = config[reaction.guild_id].rolesDeReaccion[reaction.message_id];
	//console.log(config[reaction.guild_id].rolesDeReaccion[reaction.message_id]);
	if(mensaje) {
		var emoji = mensaje.find(r => {
			if(r.emoji.length > 5) {
				var idEmoji = r.emoji.split(":")[2].replace(">", "");
				return reaction.emoji.id === idEmoji;
			}
			else {
				return reaction.emoji.name === r.emoji;
			}
		});
	}
	return emoji;
}

cliente.on("raw", paquete => {
	if(!["MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE"].includes(paquete.t)) return;
	var emoji = obtenerReactionRole(paquete.d);
	if(!emoji) return;
	var guild = cliente.guilds.cache.get(paquete.d.guild_id);
	if(cliente.users.cache.get(paquete.d.user_id).bot) return;
	if(paquete.t === "MESSAGE_REACTION_ADD") {
		guild.members.cache.get(paquete.d.user_id).roles.add(emoji.rol.id).catch(err => {
			console.error(err);
		});
	}
	else {
		guild.members.cache.get(paquete.d.user_id).roles.remove(emoji.rol.id).catch(err => {
			console.error(err);
		});
	}
});

cliente.on("roleCreate", async rol => {
	var webhookRegistros = await obtenerWebhookRegistros(rol.guild);
	if(webhookRegistros != undefined) {
		webhookRegistros.send(new Discord.MessageEmbed({
			author: {
				iconURL: rol.guild.iconURL(),
				name: rol.guild.name
			},
			title: "Rol creado",
			description: `Rol: ${rol} (\`@${rol.name}\`)`
		}));
	}
});

cliente.on("roleDelete", async rol => {
	var webhookRegistros = await obtenerWebhookRegistros(rol.guild);
	if(webhookRegistros != undefined) {
		webhookRegistros.send(new Discord.MessageEmbed({
			author: {
				iconURL: rol.guild.iconURL(),
				name: rol.guild.name
			},
			title: "Rol eliminado",
			description: `Rol: \`@${rol.name}\``
		}));
	}
});

cliente.on("roleUpdate", async (rolAnterior, rol) => {
	var webhookRegistros = await obtenerWebhookRegistros(rol.guild);
	if(rolAnterior.name == rol.name && rolAnterior.permissions.bitfield == rol.permissions.bitfield && rolAnterior.hexColor == rol.hexColor && rolAnterior.mentionable == rol.mentionable && rolAnterior.hoist == rol.hoist) return;
	if(webhookRegistros != undefined) {
		webhookRegistros.send(new Discord.MessageEmbed({
			author: {
				iconURL: rol.guild.iconURL(),
				name: rol.guild.name
			},
			title: "Rol editado",
			description: rol.toString(),
			color: rol.hexColor,
			fields: [
				{
					name: `Nombre:`,
					value: rolAnterior.name == rol.name ? "No modificado" : `${rolAnterior.name} -> ${rol.name}`
				},
				{
					name: `Permisos:`,
					value: rolAnterior.permissions.bitfield == rol.permissions.bitfield ? "No modificado" : `**Antes:**\n${convertirPermisos(rolAnterior.permissions).join(", ")}\n**Después:**\n${convertirPermisos(rol.permissions).join(", ")}`
				},
				{
					name: "Color:",
					value: rolAnterior.hexColor == rol.hexColor ? "No modificado" : `${rolAnterior.hexColor} -> ${rol.hexColor}`
				},
				{
					name: "Mencionable:",
					value: rolAnterior.mentionable == rol.mentionable ? "No modificado" : `${rolAnterior.mentionable ? "Sí" : "No"} -> ${rol.mentionable ? "Sí" : "No"}`
				},
				{
					name: "Mostrar separado en la lista de miembros:",
					value: rolAnterior.hoist == rol.hoist ? "No modificado" : `${rolAnterior.hoist ? "Sí" : "No"} -> ${rol.hoist ? "Sí" : "No"}`
				}
			]
		}));
	}
});

cliente.on("message", alRecibirMensaje);
cliente.on("messageUpdate", async (oldMessage, newMessage) => {
	if(oldMessage.content == newMessage.content) return;
	alRecibirMensaje(newMessage);
	var webhookRegistros = await obtenerWebhookRegistros(newMessage.guild);
	var desc = `${oldMessage.author.tag}: ${oldMessage.content}`;
	var desc2 = `${newMessage.author.tag}: ${newMessage.content}`;
	if(webhookRegistros != undefined) {
		webhookRegistros.send(new Discord.MessageEmbed({
			title: `Mensaje editado en #${newMessage.channel.name}.`,
			author: {
				name: newMessage.author.tag,
				iconURL: newMessage.author.avatarURL()
			},
			description: `[Ir al mensaje](${newMessage.url})`,
			fields: [
				{
					name: "Mensaje original:",
					value: desc.length > 1024 ? `${desc.slice(0, 1021)}...` : desc
				},
				{
					name: "Mensaje nuevo:",
					value: desc2.length > 1024 ? `${desc2.slice(0, 1021)}...` : desc2
				}
			]
		}));
	}
});

async function cargarEstado() {
	//Poner estado
	await cliente.user.setPresence({
		status: 'online',
		activity: {
			name: `${cliente.guilds.cache.size} servidores | $help`,
			type: 'WATCHING',
		}
	});
}

/**
 * Es todo lo que se har&aacute; al recibir un mensaje.
 * @param {Discord.Message} message 
 */
async function alRecibirMensaje (message) {
	if(message.guild == null) {
		/*if(message.author.id != cliente.user.id) {
			message.reply("Em... por qué le escribes a un bot? en serio no tienes amigos? F por vos :(");
		}*/
		return;
	}
	else if(message.author.bot) {
		return;
	}
	else if(config[message.guild.id] == undefined) {
		await configurarGuild(message.guild);
	}
	else {
		veces[message.guild.id] = JSON.parse(fs.readFileSync(`warnings/${message.guild.id}`).toString());
		config[message.guild.id] = JSON.parse(fs.readFileSync(`config/${message.guild.id}`).toString());
	}
	
	try {
		//registrar("info", `Se recibió el mensaje \"${message.content}\" (${message.id}) en el canal #${message.channel.name}servidor ${message.guild.name} (${message.guild.id}) por el usuario ${message.author.tag} (${message.author.id}).`);
		//registrar("procesando", "Cambiando todas las letras a minúsculas...");
		//El mensaje final, modificado.
		var mensajeFinal = message.content.toLowerCase();

		//El mensaje, sin modificaciones.
		var mensajeAnterior = message.content;

		//Respuesta al mensaje recibido, pero sin definir.
		var respuesta = "";

		//Fecha de hoy
		var fecha = new Date();
		//registrar("procesando", "Remplazando caracteres especiales...");
		//Remplazar caracteres especiales
		for(var i = 0; i < caracteresEspeciales.length; i++) {
			while(mensajeFinal.indexOf(caracteresEspeciales[i]) != -1) {
				mensajeFinal = mensajeFinal.replace(caracteresEspeciales[i], remplazos[i]);
			}
		}
		
		//registrar("procesando", "Quitando espacios inecesarios...");
		//Quitar espacios inecesarios en el mensaje, como por ejemplo: "  hola " queda como "hola".
		mensajeFinal = mensajeFinal.trim();

		//registrar("procesando", "Buscando entre las respuestas...");
		//Buscar en las respuestas normales el mensaje que PapaBot recibió.
		respuesta = respuestas.normales[mensajeFinal];

		if(!(message.author.bot || message.channel.nsfw || message.member.permissions.has("ADMINISTRATOR"))) {
			//registrar("procesando", "Detectado spam...");
			//Detector de spam.
			if(config[message.guild.id].autoMod.repeticionMensajes || config[message.guild.id].modoEmergencia) {
				if(miembroSpam != undefined && mensajeFinal == objetivoSpam && message.author.id == miembroSpam.id && message.guild == miembroSpam.guild) {
					if(vecesSpam[message.author.id] == undefined) {
						vecesSpam[message.author.id] = 1;
					}
					else {
						vecesSpam[message.author.id]++;
					}
				}
				else {
					vecesSpam[message.author.id] = 1;
				}

				//Advertir si se detecta demasiado spam.
				if(vecesSpam[message.author.id] >= max) {
					//registrar("procesando", "¡¡¡SPAM DETECTADO!!!");
					//registrar("procesando", "Registrando...");
					vecesSpam[message.author.id] = 0;
					await sancionar("warn", message.author.id, "AutoMod: Mensaje repetido", message, "", cliente.user.id, false, true);
					message.reply("No repitas mensajes!");
					revisarFaltas(message.member, message);
					if(config[message.guild.id].modoEmergencia) {
						let mensajeExtra = await message.channel.send("Modo de emergencia activado, cerrando canal...");
						cerrarCanal(message.channel.id, mensajeExtra);
						sancionar("mute", message.author.id, "Spam durante modo de emergencia", mensajeExtra, "", cliente.user.id, false, true);
					}
					//registrar("procesando", "Muteando...");
				}
				objetivoSpam = mensajeFinal;
				miembroSpam = message.member;
			}

			if(config[message.guild.id].autoMod.inundacion) {
				//registrar("procesando", "Revisando inundación de chat....");
				if(mensajeAnterior.length > 1000) {
					message.reply("No llenes el chat!");
					await sancionar("warn", message.author.id, "AutoMod: Mensaje muy largo", message, "", cliente.user.id, false, true);
					revisarFaltas(message.member, message);
					if(!message.deleted) message.delete();
					//registrar("correcto", "INUNDACION DE CHAT DETECTADA!");
				}
			}
			if(!config[message.guild.id].blacklist) {
				config[message.guild.id].blacklist = [];
				guardarConfig(message.guild);
			}
			if(config[message.guild.id].autoMod.malasPalabras) {
				//registrar("procesando", "Revisando malas palabras...");
				//Si encuentra una de las palabras que está en la blacklist, eliminará el mensaje.
				for(var i = 0; i < config[message.guild.id].blacklist.length; i++) {
					if(mensajeFinal.search(config[message.guild.id].blacklist[i]) != -1) {
						//registrar("correcto", "¡¡¡MALA PALABRA DETECTADA!!!");
						//registrar("procesando", "Registrando...");
						//registrar("procesando", "Advirtiendo...");
						message.reply("No digas eso!");
						await sancionar("warn", message.author.id, "AutoMod: Mensaje inapropiado", message, "", cliente.user.id, false, true);
						revisarFaltas(message.member, message);
						//registrar("procesando", "Eliminando mensaje...");
						if(!message.deleted) message.delete({reason: "Este mensaje era inapropiado."});
						break;
					}
				}
			}
		}

		//registrar("procesando", "Respondiendo...");
		//Si la respuesta definida anterior mente no es igual a undefined (que no existe) o el mensaje no es del mismo PapaBot, responderá al mensaje recibido.
		if(respuesta != undefined && message.author.id != cliente.user.id) {
			//registrar("correcto", `Respuesta encontrada: \"${respuesta}\"`);
			//Responder
			message.react(respuesta);
		}
		else if(mensajeAnterior.startsWith(config[message.guild.id].prefijo)) {
			var argumentos = mensajeAnterior.split(" ");
			var comando = argumentos.shift().replace(config[message.guild.id].prefijo, "").replaceAll("-", "").toLowerCase();
			var id;
			var sancion = "";
			var esUnMod = false;
			var des = false;
			try {
				id = message.mentions.users.first().id;
			}
			catch {
				try {
					id = argumentos[0];
				}
				catch(err) {
					id = "";
				}
			}
			for(var rol of config[message.guild.id].mods) {
				if(message.member.roles.cache.has(rol)) {
					esUnMod = true;
					break;
				}
			}
			var razon;
			try {
				razon = argumentos.slice(isNaN(parseInt(argumentos[1].substring(0, argumentos[1].length - 1))) ? 1 : 2, argumentos.length).join(" ");
			}
			catch(err) {
				razon = ""
			}
			if(alias[comando]) comando = alias[comando];
			var permisos = {
				"emergencymode": {
					permisos: 0,
					soloMods: false,
					soloOwners: false,
					soloOwnerGuild: true
				},
				"flag": {
					permisos: 0,
					soloMods: false,
					soloOwners: false
				},
				"coin": {
					permisos: 0,
					soloMods: false,
					soloOwners: false
				},
				"gtts": {
					permisos: 0,
					soloMods: false,
					soloOwners: false
				},
				"hangman": {
					permisos: 0,
					soloMods: false,
					soloOwners: false
				},
				"stophangman": {
					permisos: 0,
					soloMods: false,
					soloOwners: false
				},
				"letter": {
					permisos: 0,
					soloMods: false,
					soloOwners: false
				},
				"say": {
					permisos: 0,
					soloMods: false,
					soloOwners: false
				},
				"help": {
					permisos: 0,
					soloMods: false,
					soloOwners: false
				},
				"info": {
					permisos: 0,
					soloMods: false,
					soloOwners: false
				},
				"ping": {
					permisos: 0,
					soloMods: false,
					soloOwners: false
				},
				"invite": {
					permisos: 0,
					soloMods: false,
					soloOwners: false
				},
				"warn": {
					permisos: 32,
					soloMods: true,
					soloOwners: false
				},
				"digest": {
					permisos: 0,
					soloMods: false,
					soloOwners: false
				},
				"mute": {
					permisos: 268435456,
					soloMods: true,
					soloOwners: false
				},
				"kick": {
					permisos: 2,
					soloMods: true,
					soloOwners: false
				},
				"ban": {
					permisos: 4,
					soloMods: true,
					soloOwners: false
				},
				"unmute": {
					permisos: 268435456,
					soloMods: true,
					soloOwners: false
				},
				"unban": {
					permisos: 4,
					soloMods: true,
					soloOwners: false
				},
				"softban": {
					permisos: 4,
					soloMods: true,
					soloOwners: false
				},
				"slowmode": {
					permisos: 16,
					soloMods: true,
					soloOwners: false
				},
				"setlogchannel": {
					permisos: 32,
					soloMods: false,
					soloOwners: false
				},
				"history": {
					permisos: 0,
					soloMods: false,
					soloOwners: false
				},
				"addmod": {
					permisos: 32,
					soloMods: false,
					soloOwners: false
				},
				"removemod": {
					permisos: 32,
					soloMods: false,
					soloOwners: false
				},
				"lockchannel": {
					permisos: 16,
					soloMods: true,
					soloOwners: false
				},
				"unlockchannel": {
					permisos: 16,
					soloMods: true,
					soloOwners: false
				},
				"delallwarnings": {
					permisos: 32,
					soloMods: true,
					soloOwners: false
				},
				"bam": {
					permisos: 0,
					soloMods: false,
					soloOwners: false
				},
				"prefix": {
					permisos: 32,
					soloMods: false,
					soloOwners: false
				},
				"delwarn": {
					permisos: 32,
					soloMods: true,
					soloOwners: false
				},
				"eval": {
					permisos: 0,
					soloOwners: true,
					soloMods: false
				},
				"shutdown": {
					permisos: 0,
					soloOwners: true,
					soloMods: false
				},
				"bashcommand": {
					permisos: 0,
					soloOwners: true,
					soloMods: false
				},
				"userinfo": {
					permisos: 0,
					soloOwners: false,
					soloMods: false
				},
				"editwarningreason": {
					permisos: 32,
					soloOwners: false,
					soloMods: true
				},
				"systeminfo": {
					permisos: 0,
					soloOwners: true,
					soloMods: false
				},
				"showpunishmentembed": {
					permisos: 32,
					soloOwners: false,
					soloMods: false
				},
				"reloadwarnings": {
					permisos: 32,
					soloOwners: false,
					soloMods: true
				},
				"addpunishmentshortcut": {
					permisos: 32,
					soloOwners: false,
					soloMods: false
				},
				"setcustomstatus": {
					permisos: 0,
					soloOwners: true,
					soloMods: false
				},
				"rickroll": {
					permisos: 0,
					soloOwners: false,
					soloMods: false
				},
				"lockserver": {
					permisos: 16,
					soloOwners: false,
					soloMods: true
				},
				"unlockserver": {
					permisos: 16,
					soloOwners: false,
					soloMods: true
				},
				"mutedrole": {
					permisos: 268435456,
					soloOwners: false,
					soloMods: false
				},
				"format": {
					permisos: 0,
					soloOwners: false,
					soloMods: false
				},
				"rangepunishmentrestriction": {
					permisos: 32,
					soloOwners: false,
					soloOwnerGuild: true,
					soloMods: false
				},
				"purge" : {
					permisos: 8192,
					soloMods: true,
					soloOwners: false
				},
				"embed": {
					permisos: 32,
					soloMods: true,
					soloOwners: false
				},
				"nick": {
					permisos: 134217728,
					soloMods: true,
					soloOwners: false
				},
				"rockpaperscissors": {
					permisos: 0,
					soloMods: false,
					soloOwners: false
				},
				"reactionroles": {
					permisos: "MANAGE_ROLES",
					soloMods: false,
					soloOwners: false
				}
			};
			if(permisos[comando]) {
				if((message.member.hasPermission(permisos[comando].permisos) || (permisos[comando].soloMods && esUnMod)) && (!permisos[comando].soloOwners || cliente.guilds.cache.get("443568779205804044").members.cache.get(message.author.id).roles.cache.has("888858750771933265")) && (!permisos[comando].soloOwnerGuild || message.member.id == message.guild.ownerID)) {
					//registrar(`El comando ${config[message.guild.id].prefijo}${comando} con los argumentos ${argumentos.join(" ")}.`)
					switch(comando) {
						case "reloadwarnings":
							veces[message.guild.id] = JSON.parse(fs.readFileSync(`warnings/${message.guild.id}`).toString());
							message.reply(new Discord.MessageEmbed({
								title: "<:papabot_correcto:816027708050899005> Todas las advertencias en este guild han sido actualizadas.",
								color: "#43b581"
							}));
						break;
						case "reactionroles" :
							var pasos = [
								{
									nombre: "canal",
									descripcion: "En que canal deseas poner el mensaje? Puedes poner su id o mencionarlo.",
									metodo: respuesta => message.guild.channels.cache.get(respuesta.replace("<#", "").replace(">", ""))
								},
								{
									nombre: "titulo",
									descripcion: "Ok, entonces, qué titulo tendrá tu mensaje?"
								},
								{
									nombre: "descripcion",
									descripcion: "Interesante. Ahora, necesitamos una descripción. Nota que el placeholder `${roles}` es cambiado por los autoroles establecidos."
								},
								{
									nombre: "roles",
									descripcion: "Ahora si viene lo chido. Ahora especifica los roles así: `:emoji: @rol`. Nota: Tienes que ponerlo todo en un solo mensaje en diferentes líneas.",
									metodo: respuesta => {
										var roles = respuesta.split("\n");
										var salida = [];
										for(var r of roles) {
											var separado = r.split(" ");
											var rol = message.guild.roles.cache.get(separado[1].replace("<@&", "").replace(">", ""));
											if(separado.length < 2 && !rol) {
												salida = null;
												break;
											}
											salida.push({
												emoji: separado[0],
												rol: rol
											});
										};
										return salida;
									}
								}
							];
							var respuestasComando = {};
							var guia = await message.channel.send("Cargando...");
							for(var i = 0; i < pasos.length; i++) {
								var paso = pasos[i];
								await guia.edit(new Discord.MessageEmbed({
									title: `Paso #${i + 1}`,
									description: paso.descripcion
								}));
								var respuesta = (await esperarRespuesta(message.member, message.channel)).content;
								if(paso.metodo) {
									respuesta = paso.metodo(respuesta);
								}
								if(!respuesta) {
									message.channel.send("Eso es incorrecto. Intenta escribir el comando de nuevo.");
									break;
								}
								respuestasComando[paso.nombre] = respuesta;
							}
							if(Object.keys(respuestasComando).length === 4) {
								var mensajeRoles = await respuestasComando.canal.send(new Discord.MessageEmbed({
									title: respuestasComando.titulo,
									description: respuestasComando.descripcion.replaceAll("${roles}", respuestasComando.roles.map(r => `${r.emoji} ${r.rol}`).join("\n"))
								}));
								console.log(respuestasComando);
								for(var rolDeReaccion of respuestasComando.roles) {
									await mensajeRoles.react(rolDeReaccion.emoji.length > 5 ? rolDeReaccion.emoji.split(":")[2].replace(">", "") : rolDeReaccion.emoji);
								}
								if(!config[message.guild.id].rolesDeReaccion) {
									config[message.guild.id].rolesDeReaccion = {};
								}
								config[message.guild.id].rolesDeReaccion[mensajeRoles.id] = respuestasComando.roles;
								guardarConfig(message.guild);
							}
						break;
						case "rockpaperscissors" :
							var opciones = ["rock", "paper", "scissors"];
							var opcionesE = ["✊ Piedra", "✋ Papel", "✌ Tijera"];
							var opcionCliente = Math.floor(Math.random() * 3);
							var opcionUsuario = opciones.indexOf(argumentos[0]);
							var final = "";

							if(opcionCliente == opcionUsuario) {
								final = "Empate :/";
							}
							else if((opcionCliente == 0 && opcionUsuario == 1) || (opcionCliente == 1 && opcionUsuario == 2) || (opcionCliente == 2 && opcionUsuario == 0)) {
								final = "Ah! Perdí :(";
							}
							else if((opcionUsuario == 0 && opcionCliente == 1) || (opcionUsuario == 1 && opcionCliente == 2) || (opcionUsuario == 2 && opcionCliente == 0)) {
								final = "Gané! >:)";
							}
							message.reply(new Discord.MessageEmbed({
								title: "Piedra, papel o tijera!",
								fields: [
									{
										name: final,
										value: `Yo elegí: ${opcionesE[opcionCliente]}\n`
											 + `Tú elegiste: ${opcionesE[opcionUsuario]}`
									}
								]
							}));
						break;
						case "digest" :
							var hashes = crypto.getHashes();
							var texto = argumentos.slice(1).join(" ");
							if(hashes.indexOf(argumentos[0]) === -1) {
								message.channel.send("Eso ni siquiera es un hash.");
							}
							else {
								var digerido = crypto.createHash(argumentos[0]).update(texto).digest("hex");
								message.channel.send(new Discord.MessageEmbed({
									title: "Digerir texto",
									fields: [
										{
											name: "Texto original",
											value: `\`\`\`${texto}\`\`\``
										},
										{
											name: `Texto digerido usando algoritmo ${argumentos[0]}`,
											value: `\`\`\`${digerido}\`\`\``
										}
									],
									color: "#43b581"
								}))
							}
						break;
						case "userinfo":
							var usuario = cliente.users.cache.get(id);
							var nitros = ["No tiene Nitro", "Nitro Classic", "Nitro"];
							var flags = ["Empleado de Discord", "Dueño de servidor socio", "Eventos de HypeSquad", "Bug Hunter Nivel 1", "", "", "Bravery de HypeSquad", "Brilliance de HypeSquad", "Balance de HypeSquad", "Usuario del Equipo", "", "Sistema", "", "Bug Hunter Nivel 2", "", "Bot Verificado", "Desarrollador"];
							var flagsUsuario = [];
							var flagsString = flagsUsuario.map(f => `- ${f}`).join("\n");
							flags.forEach((flag, i) => {
								var flagInt = 1 << i;
								if((usuario.flags.bitfield & flagInt) == flagInt) {
									flagsUsuario.push(flags[i]);
								}
							});
							message.reply(new Discord.MessageEmbed({
								author: {
									name: `Info de ${usuario.tag}`,
									iconURL: usuario.avatarURL()
								},
								fields: [
									{
										name: "Fecha de creación de cuenta",
										value: usuario.createdAt
									},
									{
										name: "Insignias",
										value: flagsString.length == 0 ? "Ninguna F" : flagsString
									},
									{
										name: "Tipo de usuario",
										value: usuario.bot ? "Bot" : "Usuario normal"
									}
								]
							}));
						break;
						case "flag" :
							message.reply("Esta es la bandera que quieres:");
							message.channel.send(`:flag_${argumentos[0]}:`);
						break;
						case "coin" :
							var embed = new Discord.MessageEmbed();
							embed.setImage(`http://www.papaproductions.cc/imagenes/papaneda_${Math.round(Math.random()) == 1 ? "adelante" : "atras"}.png`);
							message.reply(embed);
						break;
						case "gtts" :
							if(message.member.voice.channel) {
								const conexion = await message.member.voice.channel.join();
								const gtts = new gTTS(argumentos.join(" "), "es");
								gtts.save("tts.mp3", (err, result) => {
									if(err) throw err;
									const dispatcher = conexion.play("tts.mp3");
									dispatcher.on("finish", () => conexion.disconnect());
								});
							}
							else {
								message.reply("Conéctate a un canal primero!!!");
							}
						break;
						case "hangman" :
							var embed = new Discord.MessageEmbed();
							if(juego == undefined) {
								juegos[message.author.id] = new Hangman(palabras[Math.floor(Math.random() * palabras.length)])
								var juego = juegos[message.author.id];
								if(argumentos[0] != "nohint") {
									juego.adivinar(palabraElegida.charAt(0));
								}
								juego.mensajeAhorcados = await message.reply(juego.embed);
							}
							else {
								message.reply(respuestas.yaJugando);
							}
						break;
						case "stophangman" :
							var embed = new Discord.MessageEmbed();
							if(juegos[message.author.id] != undefined) {
								delete juegos[message.author.id];
								embed.setTitle("Terminaste tu juego de hangman.");
							}
							else {
								embed.setTitle("No estás jugando...");
							}
							message.reply(embed);
						break;
						case "letter":
							var juego = juegos[message.author.id];
							if(juego != undefined) {
								argumentos[0] = argumentos[0].toLowerCase();
								if(argumentos[0].length > 1) {
									juego.setTitle("Error!");
									juego.embed.setColor("#f04947");
									juego.embed.setFooter("No puedes poner más de una letra al mismo tiempo!");
								}
								else if(juego.letrasAdivinadas.indexOf(argumentos[0]) != -1 || juego.letrasFallidas.indexOf(argumentos[0]) != -1) {
									//letrasFallidas++;
									juego.embed.setColor("#FF6600");
									juego.embed.setTitle("Ya dijiste esa letra...");
								}
								else if(juego.palabraElegida.indexOf(argumentos[0]) == -1) {
									juego.letrasFallidas.push(argumentos[0]);
									juego.embed.setColor("#f04947");
									juego.embed.setTitle("No!");
								}
								else {
									juego.embed.setColor("#43b581");
									juego.embed.setTitle(`Correcto! Adivinaste ${juego.adivinar(argumentos[0]).length}!`);
								}
								if(juego.letrasFallidas.length >= 8) {
									juego.embed.setColor("#f04947");
									juego.embed.setTitle("Perdiste!");
									juego.palabra = juego.palabraElegida;
									delete juegos[message.author.id];
								}
								else if(juego.palabra == juego.palabraElegida) {
									juego.embed.setColor("#43b581");
									juego.embed.setTitle("Ganaste!");
									//Por que puse eso lptm
									//palabra = palabraElegida;
									delete juegos[message.author.id];
								}
								juego.embed.setDescription(`Palabra: \`${juego.palabra}\``
												+ (juego.letrasFallidas.length == 0 ? "" : `\n~~\`${juego.letrasFallidas.join("`~~ ~~`")}\`~~`));
								juego.embed.setImage(`http://www.papaproductions.cc/imagenes/ahorcados/${juego.letrasFallidas.length}.png`);
								message.delete({reason: "Evitar demasiada basura en el chat."});
								juego.mensajeAhorcados.edit(juego.embed);
							}
							else {
								message.reply("No estás jugando...");
							}
						break;
						case "say" :
							await message.channel.send(argumentos.join(" "));
							await message.delete();
						break;
						case "help" :
							var embed = new Discord.MessageEmbed();
							embed.setTitle("Comandos de PapaBot:");
							embed.setDescription("Lista de comandos de PapaBot. Muchos de estos comandos están basados en los comandos de Dyno.");
							var ayuda = fs.readFileSync("ayuda.txt").toString().split("\n\n");
							ayuda.splice(0, (argumentos[0] - 1) * 25);
							if(ayuda.length === 0) {
								message.channel.send(`Desde mi conocimiento no hay una tal "Página ${argumentos[0]}".`);
							}
							else {
								for(var i = 0; i < ayuda.length; i++) {
									var elementoAyuda = ayuda[i].split("\n");
									embed.addField(config[message.guild.id].prefijo + elementoAyuda[0], elementoAyuda[1] + (elementoAyuda[2] == undefined ? "" : `\nEjemplo: \`${config[message.guild.id].prefijo}${elementoAyuda[2]}\``), true);
								}
								message.reply(embed);
							}
						break;
						case "info" :
							var embed = new Discord.MessageEmbed();
							message.reply(embed.addFields([
								{
									name: "Iniciado desde",
									value: iniciadoDesde,
									inline: true
								},
								{
									name: "Servidores",
									value: `${cliente.guilds.cache.size} servidores.`,
									inline: true
								},
								{
									name: "Usuarios",
									value: `${cliente.users.cache.size} usuarios.`,
									inline: true
								},
								{
									name: "Creador",
									value: (await cliente.users.fetch("443568221577019402")).tag,
									inline: true
								}
							]));
						break;
						case "ping" :
							var fecha = new Date();
							var mensajePing = await message.reply("pong.");
							mensajePing.edit(`${mensajePing.content} Eso tardó \`${Date.now() - fecha.getTime()} ms\`.`);
						break;
						case "invite" :
							message.reply("http://www.papaproductions.cc/invitar_a_papabot.php");
						break;
						case "warn" :
							sancion = "warn";
						break;
						case "ban" :
							sancion = "ban";
						break;
						case "kick" :
							sancion = "kick";
						break;
						case "mute" :
							sancion = "mute";
						break;
						case "unmute" :
							sancion = "mute";
							des = true;
						break;
						case "unban" :
							sancion = "ban";
							des = true;
						break;
						case "softban" :
							sancion = "softban";
						break;
						case "slowmode" :
							var tiempo = aMilisegundos(argumentos[0]) / 1000;
							if(tiempo > 6 * 60 * 60) {
								message.reply("No puedes poner más de 6 horas de modo pausado.");
							}
							else {
								await message.channel.setRateLimitPerUser(tiempo, razon);
								await message.reply(`Cambié el modo pausado a \`${argumentos[0]}\`.`);
							}
						break;
						case "setlogchannel" :
							var canalRegistros = message.guild.channels.cache.get(argumentos[0].replace("<#", "").replace(">", ""));
							var embed = new Discord.MessageEmbed();
							if(canalRegistros.isText()) {
								var webhookRegistros = await canalRegistros.createWebhook("PapaBot", {
									avatar: cliente.user.avatarURL()
								});
								config[message.guild.id].webhookRegistros = webhookRegistros.id;
								config[message.guild.id].canalRegistros = canalRegistros.id;
								guardarConfig(message.guild);
								webhookRegistros.send(new Discord.MessageEmbed({
									title: "<:papabot_correcto:816027708050899005> Este es el canal de registros.",
									description: "Aquí verás info de lo que pasa en el servidor."
								}));
								embed.setTitle("<:papabot_correcto:816027708050899005> Cambié el canal de registros.");
							}
							else {
								embed.setTitle("<:papabot_error:816027785796649051> Este canal no es de texto");
							}
							message.reply(embed);
						break;
						case "history" :
							var usuarioComando = cliente.users.cache.get(id);
							var embed = new Discord.MessageEmbed();
							if(usuarioComando == undefined) {
								embed.setTitle("<:papabot_error:816027785796649051> No encontré a ese usuario.");
								embed.setColor("#f04947");
								message.reply(embed);
							}
							else {
								var warnings = Warning.conseguirWarningsDeUnUsuario(usuarioComando.id, veces[message.guild.id]);
								var avisado = false;
								warnings.forEach(w => {
									if(!w.castigo) { 
										if(!avisado) {
											message.channel.send("Bueno hay unos problemas con los registros, espera un segundo...");
											avisado = true;
										}
										veces[message.guild.id][veces[message.guild.id].indexOf(w)].castigo = "warn";
										actualizarWarnings(message.guild);
									}
								})
								var warningsDes = warnings.filter(s => s.castigo.startsWith("un"));
								warnings = Warning.conseguirWarningsDeUnUsuario(usuarioComando.id, veces[message.guild.id]);
								embed.setTitle(`Historial del usuario ${usuarioComando.tag}:`);
								embed.setDescription(`${warnings.length - warningsDes.length} son sanciones, ${warningsDes.length} son removiciones de sanciones.`)
								//var meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
								if(warnings.length > 0) {
									for(var i = 0; i < warnings.length; i++) {
										var hora = fecha.getHours() % 12;
										var razonWarning = "Error :(";
										var moderadorWarning = "DESCONOCIDO";
										var fechaWarning = new Date();
										try {
											razonWarning = warnings[i].razon;
										}
										catch(err) {
					
										}
										try {
											moderadorWarning = warnings[i].moderador;
										}
										catch(err) {
					
										}
										try {
											fechaWarning = new Date(warnings[i].fecha)
										}
										catch(err) {
											fechaWarning = new Date();
										}
										embed.addField(`Sanción #${i + 1}: `, `Razón: ${razonWarning}\n`
																			+ `Id: ${warnings[i].id}\n`
																			+ `Moderador: ${moderadorWarning}\n`
																			+ `Fecha: ${fechaWarning}\n`
																			+ `Caso: ${warnings[i].caso}\n`
																			+ `Sanción: \`${warnings[i].castigo}\`\n`);
									}
								}
								else {
									embed.setDescription("<:papabot_hmmm:802981944807391273> que vacío...");
								}
								embed.setColor("#43b581");
								await message.reply(embed);
							}
						break;
						case "systeminfo" :
							message.channel.send(new Discord.MessageEmbed({
								title: "Información del sistema",
								fields: [
									{
										name: "Procesador",
										value: `${os.cpus()[0].model} (${os.cpus().length})`
									},
									{
										name: "Sistema Operativo",
										value: sistemas[process.platform]
									},
									{
										name: "RAM",
										value: `${abreviar(os.freemem())} disponible de ${abreviar(os.totalmem())} (${Math.round(10000 * os.freemem() / os.totalmem()) / 100}% disponible)`
									}
								]
							}));
						break;
						case "setcustomstatus" :
							cliente.user.setPresence({
								activity: {
									type: argumentos[0],
									name: argumentos.slice(2).join(" ")
								},
								status: argumentos[1]
							})
						break;
						case "addmod" :
							var embed = new Discord.MessageEmbed();
							var rol = message.guild.roles.cache.get(argumentos[0].replace("<@&", "").replace(">", ""));
							if(rol == undefined) {
								embed.setTitle("<:papabot_error:816027785796649051> Esto no es un rol.");
								embed.setColor("#f04947");
							}
							else {
								embed.setColor("#43b581");
								embed.setTitle("<:papabot_correcto:816027708050899005> Ahora los usuarios con este rol tienen permisos de moderador.");
								config[message.guild.id].mods.push(rol.id);
								guardarConfig(message.guild);
							}
							message.reply(embed);
						break;
						case "removemod" :
							var embed = new Discord.MessageEmbed();
							var rol = message.guild.roles.cache.get(argumentos[0].replace("<@&", "").replace(">", ""));
							if(rol == undefined) {
								embed.setTitle("<:papabot_error:816027785796649051> Esto no es un rol.");
								embed.setColor("#f04947");
							}
							else {
								embed.setColor("#43b581");
								embed.setTitle("<:papabot_correcto:816027708050899005> Ahora los usuarios con este rol ya no tienen permisos de moderador.");
								config[message.guild.id].mods.splice(config[message.guild.id].mods.indexOf(rol.id), 1);
								registrar("info", config[message.guild.id].mods.indexOf(rol.id));
								guardarConfig(message.guild);
							}
							message.reply(embed);
						break;
						case "rickroll":
							var canalMencionado = message.guild.channels.cache.get(argumentos[0].replace("<#", "").replace(">", ""));
							if(!canalMencionado) {
								message.channel.send("Menciona... un canal :/");
							}
							else if(canalMencionado.type != "voice") {
								message.channel.send("No puedo unirme a un canal de texto...");
							}
							else {
								var conexionCanal = await canalMencionado.join();
								var dispatcher = conexionCanal.play("rickrollxd.mp3");
								dispatcher.on('finish', () => {
									canalMencionado.leave();
								});
							}
						break;
						case "embed" :
							var embed = new Discord.MessageEmbed({
								title: "<:papabot_error:816027785796649051> JSON incorrecto.",
								color: "#f04947"
							});
							try {
								embed = new Discord.MessageEmbed(JSON.parse(argumentos.join(" ")));
							}
							catch(err) {

							}
							await message.channel.send(embed);
							await message.delete();
						break;
						case "purge" :
							var limite = parseInt(argumentos[0]);
							var eliminado = 0;
							if(limite > 100) {
								await message.reply("No puedes eliminar más de 100 mensajes en masa.");
							}
							else {
								await message.delete();
								var eliminado = (await message.channel.bulkDelete(limite)).size;
								var mensaje = await message.channel.send(`<:papabot_correcto:816027708050899005> ${eliminado} mensajes eliminados.`);
								await mensaje.delete({
									timeout: 5000
								});
							}
						break;
						case "lockchannel" :
							var canalEscrito = argumentos[0] == undefined ? message.channel.id : argumentos[0];
							var canal = message.guild.channels.cache.get(canalEscrito.replace("<#", "").replace(">", ""));
							var embed = new Discord.MessageEmbed();
							if(canal.isText()) {
								await cerrarCanal(canalEscrito, message);
								embed.setTitle(`<:papabot_correcto:816027708050899005> Se cerró el canal #${canal.name}.`);
								embed.setColor("#43b581");
							}
							else {
								embed.setTitle("<:papabot_error:816027785796649051> Este no es un canal de texto.")
								embed.setColor("#f04947");
							}
							message.reply(embed);
						break;
						case "lockserver" :
							message.reply("Cerrando todos los canales del servidor...");
							var embed = new Discord.MessageEmbed();
							for(var canal of message.guild.channels.cache.array()) {
								//if(canal.permissionsFor(message.guild.roles.everyone).has("SEND_MESSAGES")) {
									//await canal.m(`<a:sirena:822901050419707964> El servidor está en cierre. Ve a ${message.channel} para más información.`);
								//}
								await cerrarCanal(canal.id, message);
							}
							embed.setTitle(`<:papabot_correcto:816027708050899005> Se cerró ${message.guild.name}.`);
							embed.setColor("#43b581");
							message.reply(embed);
						break;
						case "unlockserver" :
							message.reply("Abriendo todos los canales del servidor...");
							var embed = new Discord.MessageEmbed();
							for(var canal of message.guild.channels.cache.array()) {
								await abrirCanal(canal.id, message);
							}
							embed.setTitle(`<:papabot_correcto:816027708050899005> Se abrió el ${message.guild.name}.`);
							embed.setColor("#43b581");
							message.reply(embed);
						break;
						case "unlockchannel" :
							var canalEscrito = argumentos[0] == undefined ? message.channel.id : argumentos[0];
							var canal = message.guild.channels.cache.get(canalEscrito.replace("<#", "").replace(">", ""));
							var embed = new Discord.MessageEmbed();
							if(canal.isText()) {
								abrirCanal(canalEscrito, message)
								embed.setTitle(`<:papabot_correcto:816027708050899005> Se volvió a abrir el canal #${canal.name}.`);
								//embed.setFooter("Nota: Puede ser que tengas que cambiar ciertas cosas en los permisos manualmente.");
								embed.setColor("#43b581");
							}
							else {
								embed.setTitle("<:papabot_error:816027785796649051> Este no es un canal de voz.")
								embed.setColor("#f04947");
							}
							message.reply(embed);
						break;
						case "delallwarnings" :
							var warnings = Warning.conseguirWarningsDeUnUsuario(id, veces[message.guild.id]);
							var embed = new Discord.MessageEmbed();
							if(warnings.length == 0) {
								embed.setTitle("<:papabot_error:816027785796649051> Este usuario no tiene advertencias");
								embed.setColor("#f04947");
							}
							else {
								warnings.forEach(warning => {
									veces[message.guild.id].splice(veces[message.guild.id].indexOf(warning), 1);
								});
								embed.setTitle("<:papabot_correcto:816027708050899005> Este usuario ya no tiene advertencias");
								embed.setColor("#43b581");
							}
							actualizarWarnings(message.guild);
							message.reply(embed);
						break;
						case "bam" :
							message.channel.send(`${message.guild.members.cache.get(id).user.tag} ha sido bameado!`);
						break;
						case "prefix" :
							var embed = new Discord.MessageEmbed;
							if(argumentos[0] == undefined) {
								embed.setTitle(`...qué prefijo?`);
							}
							else {
								config[message.guild.id].prefijo = argumentos[0];
								guardarConfig(message.guild);
								embed.setTitle(`Se cambió el prefijo a \`${argumentos[0]}\``);
							}
							message.reply(embed);
						break;
						case "delwarn" :
							var embed = new Discord.MessageEmbed();
							var warning = veces[message.guild.id].splice(veces[message.guild.id].indexOf(veces[message.guild.id].find((warningActual) => warningActual.id == argumentos[0])), 1)[0];
							embed.setTitle(`<:papabot_correcto:816027708050899005> Se eliminó una advertencia del usuario ${message.guild.members.cache.get(warning.usuarioID).user.tag}.`);
							embed.setDescription(`Razón: ${warning.razon}\n`
											+ `Id: ${argumentos[0]}`);
							embed.setColor("#43b581");
							actualizarWarnings(message.guild);
							message.reply(embed);
						break;
						case "eval" :
							if(argumentos.join(" ").indexOf("cliente.token") !== -1) {
								throw new Error("Posible vulnerabilidad de seguridad detectada.");
							}
							var salida = eval(argumentos.join(" "));
							try {
								salida = JSON.stringify(salida);
							}
							catch(err) {
					
							}
							await message.reply(new Discord.MessageEmbed({
								author: {
									iconURL: "http://www.papaproductions.cc/imagenes/js.png",
									name: "Evaluación de código JavaScript"
								},
								fields: [
									{
										name: "Ejecutaste:",
										value: "\`\`\`JavaScript\n"
											+  `${argumentos.join(" ")}\n\`\`\``
									},
									{
										name: "Salida:",
										value: "\`\`\`JavaScript\n"
											+  `${salida}\n\`\`\``
									}
								]
							}));
						break;
						case "rangepunishmentrestriction" :
							var b;
							switch(argumentos[0]) {
								case "no":
									b = false;
									message.reply(new Discord.MessageEmbed({
										title: "<:papabot_correcto:816027708050899005> Ahora ya no importan los roles en los comandos de sanción.",
										description: "(te apuesto 50000 monedas de Dank Memer que te vas a arrepentir en 10 segundos)",
										color: "#43b581"
									}));
								break;
								case "yes":
									b = true;
									message.reply(new Discord.MessageEmbed({
										title: "<:papabot_correcto:816027708050899005> Ahora importan los roles en los comandos de sanción.",
										color: "#43b581"
									}));
								break;
								default:
									message.channel.send("Esa opción no es válida idiota");
									b = config[message.guild.id].prevencionRangos;
								break;
							}
							config[message.guild.id].prevencionRangos = b;
							guardarConfig(message.guild);
						break;
						case "showpunishmentembed" :
							var b;
							switch(argumentos[0]) {
								case "yes":
									b = true;
									message.reply(new Discord.MessageEmbed({
										title: "<:papabot_correcto:816027708050899005> Ahora mostraré un embed con información en los comandos de sanción.",
										color: "#43b581"
									}));
								break;
								case "no":
									b = false;
									message.reply(new Discord.MessageEmbed({
										title: "<:papabot_correcto:816027708050899005> Ahora no mostraré un embed con información en los comandos de sanción.",
										color: "#43b581"
									}));
								break;
								default:
									message.channel.send("Esa opción no es válida idiota");
									b = config[message.guild.id].embedSanciones;
								break;
							}
							config[message.guild.id].embedSanciones = b;
							guardarConfig(message.guild);
						break;
						case "mutedrole" :
							var rolMuteado;
							var embed = new Discord.MessageEmbed({
								color: "#43b581"
							});
							switch(argumentos[0]) {
								case "set" :
									embed.setTitle("<:papabot_correcto:816027708050899005> El rol Muteado ha sido actualizado.");
									rolMuteado = message.guild.roles.cache.get(argumentos[1].replace("<@&", "").replace(">", ""));
								break;
								case "create" :
									rolMuteado = (await message.guild.roles.create({
										data: {
											name: "Muteado",
											permissions: 0,
											color: "#666666"
										},
										reason: "No hay un rol Muteado."
									}));
									embed.setTitle("<:papabot_correcto:816027708050899005> El rol Muteado ha sido creado.");
								break;
								
							}
							if(rolMuteado) {
								config[message.guild.id].rolMuteado = rolMuteado.id;
								guardarConfig(message.guild);
								var canales = message.guild.channels.cache.array();
								for(var canal of canales) {
									configurarRolMuteado(canal);
								}
								message.reply(embed);
							}
							else {
								message.channel.send("Eso no es un rol idiota")
							}
						break;
						case "shutdown" :
							var webhookRegistros = await obtenerWebhookRegistros(message.guild);
							await message.channel.send("Ok pendejo ya me apago");
							if(webhookRegistros != undefined) {
								await webhookRegistros.send(new Discord.MessageEmbed({
									title: "Se está apagando el bot.",
									description: "adios lol"
								}));
							}
							await cliente.destroy();
							process.exit();
						case "bashcommand" :
							child_process.exec(argumentos.join(" "), (error, stdout, stderr) => {
								if(error) {
									message.channel.send("<:papabot_error:816027785796649051> Algo falló.");
									registrar("error", error.stack);
								}
								else {
									if(stdout.length > 0) {
										for(var i = 0; i < Math.ceil(stdout.length / 2000); i++) {
											var final = (i + 1) * 2000;
											message.channel.send(stdout.substring(i * 2000, final > stdout.length ? stdout.length : final));
										}
									}
									else if(stderr.length > 0) {
										for(var i = 0; i < Math.ceil(stderr.length / 2000); i++) {
											var final = (i + 1) * 2000;
											message.channel.send(stderr.substring(i * 2000, final > stderr.length ? stderr.length : final));
										}
									}
								}
							});
						break;
						case "emergencymode" :
							if(config[message.guild.id].modoEmergencia) {
								await message.channel.send("Deshabilitando modo de emergencia...");
								config[message.guild.id].modoEmergencia = false;
								guardarConfig(message.guild);
								await message.channel.send("Modo de emergencia ha sido deshabilitado.");
								return;
							}
							let mensajeEmergencia = await message.channel.send(new Discord.MessageEmbed({
								title: "Modo de emergencia",
								description: `Estás a punto de poner tu servidor en modo de emergencia. Esto signfica que:
- El mínimo spam causará que el canal se cierre, y se mutee indefinidamente a la persona.
- No se permitirá que alguien entre al servidor.
- Para regresar a la normalidad, ejecuta este comando de nuevo.

Estás seguro de esto?`
							}));
							await mensajeEmergencia.react("✅");
							await mensajeEmergencia.react("❌");
							cliente.on("messageReactionAdd", handlerEmergencia);
							function handlerEmergencia(r, u) {
								if(mensajeEmergencia.id !== r.message.id) return;
								if(u.id !== r.message.guild.ownerID) {
									try {
										u.send("quien te pregunto");
									} catch(err) {}
									return;
								}
								if(r.emoji.name === "✅") {
									mensajeEmergencia.channel.send("Entrando en modo de emergencia...");
									config[message.guild.id].modoEmergencia = true;
									guardarConfig(mensajeEmergencia.guild);
								}
								else {
									mensajeEmergencia.channel.send("Cancelado.")
								}
								cliente.off("messageReactionAdd", handlerEmergencia);
							}
						break;
						case "editwarningreason" :
							var embed = new Discord.MessageEmbed();
							var warn = veces[message.guild.id].find(w => w.id == argumentos[0]);
							if(warn == undefined) {
								embed.setTitle("<:papabot_error:816027785796649051> Advertencia no encontrada.");
								embed.setColor("#f04947");
							}
							else {
								warn.razon = argumentos.slice(1).join(" ");
								actualizarWarnings(message.guild);
								embed.setTitle("<:papabot_correcto:816027708050899005> Se actualizó la razón de esta advertencia.");
								embed.setColor("#43b581");
							}
							message.reply(embed);
						break;
						case "nick" :
							var miembro = message.guild.members.cache.get(id);
							var nombre = argumentos.slice(1).join(" ").trim();
							if(nombre == "") {
								await miembro.setNickname(null);
								message.channel.send(`<:papabot_correcto:816027708050899005> Apodo de ${miembro} restablecido.`);
							}
							else {
								await miembro.setNickname(nombre);
								message.channel.send(`<:papabot_correcto:816027708050899005> Apodo de ${miembro} establecido a **${nombre}**.`);
							}
						break;
						case "format" :
							message.channel.send(new Discord.MessageEmbed({
								title: "Texto con formato ➡ Texto sin formato",
								description: `\`\`\`${argumentos.join(" ")}\`\`\``
							})); 
						break;
						case "addpunishmentshortcut" :
							if(!config[message.guild.id].atajos) config[message.guild.id].atajos = {};
							var sancion = argumentos[0];
							var tiempo = argumentos[1];
							var razonSeparada = razon.split(" ");
							razonSeparada.shift();
							config[message.guild.id].atajos[argumentos[2]] = {
								sancion: sancion,
								razon: razonSeparada.join(" "),
								tiempo: tiempo
							};
							guardarConfig(message.guild);
							message.reply(new Discord.MessageEmbed({
								title: "<:papabot_correcto:816027708050899005> Atajo de sanción añadido.",
								color: "#43b581"
							}))
						break;
					}
					if(sancion != "") {
						if(message.mentions.roles.size > 0) {
							var rol = message.mentions.roles.first();
							for(var miembro of rol.members.array()) {
								await sancionar(sancion, miembro.id, razon, message, argumentos[1], message.author.id, des, true);
							}
							
						}
						else {
							await sancionar(sancion, id, razon, message, argumentos[1], message.author.id, des);
						}
					}
				}
				else {
					message.reply(new Discord.MessageEmbed({
						title: "<:papabot_error:816027785796649051> No... wtf",
						description: (permisos[comando].soloOwners ? `- Solo los desarrolladores puede usar este comando.\n` : "")
								+ (permisos[comando].soloMods ? "- Solo moderadores pueden usar este comando.\n" : "")
								+ (permisos[comando].permisos > 0 ? `- Necesitas los siguientes permisos:\n${convertirPermisos(permisos[comando].permisos).join(", ")}\n` : "")
								+ (permisos[comando].soloOwnerGuild ? `- Este comando sólo puede ser ejecutado por el owner del servidor, ${message.guild.owner.user.tag}` : ""),
						color: "#f04947"
					}));
				}
			}
			/*else {
				if(config[message.guild.id].atajos) {
					var atajo = config[message.guild.id].atajos[comando];
					if(atajo) {
						sancionar(atajo.sancion, id, atajo.razon, message, atajo.tiempo, message.author.id);
						return;
					}
				}
				else {
					config[message.guild.id].atajos = {};
					guardarConfig(message.guild);
				}
			}*/
		}
		else if(message.content == `<@${cliente.user.id}>` || message.content == `<@!${cliente.user.id}>`) {
			message.channel.send(`Hola ${message.author}! Mi prefijo es \`${config[message.guild.id].prefijo}\`. Lo puedes cambiar con \`${config[message.guild.id].prefijo}prefix\`.`)
		}
		else {
			//registrar("error", "Error: Respuesta no encontrada <:papabot_error:816027785796649051>");
		}
		//¡Fin!
		//registrar("correcto", "Fin, ya terminé todo <:papabot_correcto:816027708050899005>");
	}
	catch(err) {
		message.reply(new Discord.MessageEmbed({
			title: `🚫 Error \`${err.name}\`.`,
			description: `\`\`\`${err.message}\`\`\``,
			color: "#f04947"
		}));
		registrar("error", err.stack);
	}
}

/**
 * Espera la respuesta de un usuario.
 * @param {Discord.GuildMember} por El usuario que esperamos.
 * @param {Discord.GuildChannel} canal El canal.
 * @returns {Promise<Discord.Message} El mensaje.
 */
async function esperarRespuesta(por, canal) {
	return new Promise((resolve, reject) => {
		cliente.on("message", handler);

		/**
		 * 
		 * @param {Discord.Message} message 
		 */
		function handler(message) {
			if(message.member.id === por.id && message.channel.id === canal.id) {
				cliente.off("message", handler);
				resolve(message);
			}
		}
	});
}

/**
 * 
 * @param {string} canalEscrito 
 * @param {Discord.Message} message 
 */
async function cerrarCanal(canalEscrito, message) {
	var canal = message.guild.channels.cache.get(canalEscrito.replace("<#", "").replace(">", ""));
	if(!config[message.guild.id].overwrites) config[message.guild.id].overwrites = {};
	config[message.guild.id].overwrites[canal.id] = canal.permissionOverwrites;
	guardarConfig(message.guild);
	await canal.permissionOverwrites.forEach((cancelacion, rol) => {
		canal.updateOverwrite(rol, {
			SEND_MESSAGES: false,
		}, `Cierre de canal accionado por ${message.author.tag}`);
	});
	await canal.updateOverwrite(message.guild.roles.everyone, {
		SEND_MESSAGES: false,
	}, `Cierre de canal accionado por ${message.author.tag}`);
	await canal.updateOverwrite(cliente.user.id, {
		SEND_MESSAGES: true,
	}, `Cierre de canal accionado por ${message.author.tag}`);
}
/**
 * 
 * @param {string} canalEscrito 
 * @param {Discord.Message} message 
 */
async function abrirCanal(canalEscrito, message) {
	var canal = message.guild.channels.cache.get(canalEscrito.replace("<#", "").replace(">", ""));
	if(!config[message.guild.id].overwrites) config[message.guild.id].overwrites = {};
	await canal.overwritePermissions(config[message.guild.id].overwrites[canal.id], `Cierre de canal terminado por ${message.author.tag}`);
	await canal.updateOverwrite(cliente.user.id, {
		SEND_MESSAGES: true
	});
}

/**
 * 
 * @param {Discord.GuildMember} usuario 
 * @param {Discord.Message} mensaje
 */

function revisarFaltas(usuario, mensaje) {
	var cantidadWarnings = Warning.conseguirWarningsDeUnUsuario(usuario.id, veces[mensaje.guild.id]).filter(w => w.castigo == "warn").length;
	if(cantidadWarnings == max) {
		sancionar("mute", usuario.id, "Muchos warns", mensaje, "6h", cliente.user.id, false, true);
		mensaje.channel.send(`${usuario.user.tag} ha sido muteado por demasiadas advertencias.`);
	}
	else if(cantidadWarnings == max * 2) {
		sancionar("kick", usuario.id, "Muchos warns", mensaje, "", cliente.user.id, false, true);
		mensaje.channel.send(`${usuario.user.tag} ha sido expulsado por demasiadas advertencias.`);
	}
	else if(cantidadWarnings == max * 3) {
		sancionar("ban", usuario.id, "Muchos warns", mensaje, "", cliente.user.id, false, true);
		mensaje.channel.send(`${usuario.user.tag} ha sido baneado por demasiadas advertencias.`);
	}
}

function mensajeManual() {
	interfaz.question("", answer => {
		cliente.channels.cache.get("770835432375713832").send(answer);
		mensajeManual();
	});
}

/**
 * 
 * @param {String} sancion 
 * @param {String} id
 * @param {String} razon
 * @param {Discord.Message} mensaje
 * @param {String} tiempo
 * @param {String} moderadorID
 * @param {Boolean} des
 * @param {Boolean} suprimirmensaje
 */
async function sancionar(sancion, id, razon, mensaje, tiempo, moderadorID, des=false, suprimirmensaje=false) {
	var miembro = mensaje.guild.members.cache.get(id);
	var usuario = cliente.users.cache.get(id);
	var embed = new Discord.MessageEmbed();
	var idW = "";
	var moderador = cliente.users.cache.get(moderadorID);
	var { v4 } = require("uuid");
	var warn;
	var repetido = true;
	var wAnterior;
	while(repetido) {
		idW = v4();
		repetido = veces[mensaje.guild.id].find((warning) => warning.id == idW) != undefined;
	}
	
	var tiempoConvertido = NaN;
	try {
		tiempoConvertido = aMilisegundos(tiempo);
	}
	catch(err) {
		
	}
	var emojis = {
		"warn": "⚠",
		"mute": "🗨",
		"kick": "🦵",
		"ban": "🔨",
		"softban": "🔨"
	}
	var permisos = {
		"warn": 0,
		"mute": 268435456,
		"kick": 2,
		"ban": 4,
		"softban": 4
	}
	var miembro = mensaje.guild.members.cache.get(id);
	var usuario = cliente.users.cache.get(id);
	var temporal = !isNaN(tiempoConvertido) && sancion != "warn";
	var verbo = {
		"warn": "advertido",
		"mute": "muteado",
		"ban": "baneado",
		"kick": "expulsado",
		"softban": "softbaneado"
	}
	var parrafos = {
		"warn": "Has recibido una advertencia. Todavía puedes interactuar en el servidor, pero esto será registrado en la base de datos de PapaBot.",
		"mute": "Fuiste muteado. Puedes ver el servidor pero ya no puedes interactuar en este.",
		"ban": "Fuiste baneado. Ya no puedes regresar a menos que tu ban sea temporal o seas desbaneado.",
		"kick": "Fuiste expulsado. Ya no formas parte del servidor, pero puedes regresar de nuevo.",
		"softban": "Fuiste softbaneado. Tus últimos mensajes fueron eliminados. Ya no formas parte del servidor, pero puedes regresar de nuevo."
	}
	var dmFallo = false;

	if(id == cliente.user.id) {
		mensaje.channel.send("no.");
		return;
	}
	else if(miembro == undefined && sancion != "ban" && !des) {
		embed.setTitle("<:papabot_error:816027785796649051> No encontré a ese usuario.");
		embed.setColor("#f04947");
		mensaje.reply(embed);
		return;
	}
	else if(id == moderadorID) {
		mensaje.channel.send("Ok, pero por qué te lastimas a tí mismo?");
		return;
	}
	else if(!des && mensaje.guild.ownerID == id && config[mensaje.guild.id].prevencionRangos) {
		embed.setTitle("<:papabot_error:816027785796649051> QUÉ ESTÁS HACIENDO???");
		embed.setColor("#f04947");
		embed.setDescription("Si voy a totalmente poner una sanción AL OWNER DEL SERVIDOR, naciste ayer idiota?");
		mensaje.reply(embed);
		return;
	}
	else if(!des && miembro.roles.highest.position >= mensaje.guild.members.cache.get(moderadorID).roles.highest.position && mensaje.guild.ownerID != moderadorID && config[mensaje.guild.id].prevencionRangos) {
		mensaje.channel.send("Oye respeta a tus mayores :/");
		return;
	}
	else if(!des && !miembro.bannable && sancion == "ban") {
		embed.setTitle("<:papabot_error:816027785796649051> Este usuario es imune a bans.");
		embed.setColor("#f04947");
		mensaje.reply(embed);
		return;
	}
	else if(!des && !miembro.kickable && sancion == "kick") {
		embed.setTitle("<:papabot_error:816027785796649051> Este usuario es imune a expulsiones.");
		embed.setColor("#f04947");
		mensaje.reply(embed);
		return;
	}
	else if(!mensaje.guild.members.cache.get(cliente.user.id).hasPermission(permisos[sancion])) {
		embed.setTitle("<:papabot_error:816027785796649051> Me faltan permisos");
		embed.setColor("#f04947");
		mensaje.reply(embed);
		return;
	}

	try {
		await cliente.users.cache.get(id).send(new Discord.MessageEmbed({
			title: `Fuiste ${des ? "des" : ""}${verbo[sancion]}`,
			description: `${des ? "" : `${parrafos[sancion]}\n\n`}Servidor: ${mensaje.guild.name}\n`
					   + `Razón: ${razon}\n`
					   + `Moderador: ${moderador.tag}`
					   + (temporal ? `\nDuración: ${tiempo}` : ""),
			color: "#FF5500"
		}));
	}
	catch {
		dmFallo = true;
	}

	if(des) {
		switch(sancion) {
			case "mute" :
				await miembro.roles.remove(config[mensaje.guild.id].rolMuteado, razon);
			break;
			case "ban" :
				await mensaje.guild.members.unban(id, razon);
			break;
			default: return;
		}
	}
	else {
		switch(sancion) {
			case "ban" :
				await miembro.ban({reason: razon, days: 1});
			break;
			case "kick" :
				await miembro.kick(razon);
			break;
			case "mute" :
				if(mensaje.guild.roles.cache.get(config[mensaje.guild.id].rolMuteado) == undefined) {
					mensaje.channel.send(`Hm. No hay rol muteado. Elije un rol muteado con el comando \`${config[mensaje.guild.id].prefijo}muted-role\`.`);
					return;
				}
				if(config[mensaje.guild.id].muteados == undefined) {
					config[mensaje.guild.id].muteados = {};
				}
				config[mensaje.guild.id].muteados[id] = {
					duracion: tiempoConvertido,
					razon: razon,
					fecha: temporal ? Date.now() : undefined
				};
				guardarConfig(mensaje.guild);
				await miembro.roles.add(config[mensaje.guild.id].rolMuteado, razon);
			break;
			case "softban" :
				await miembro.ban({reason: razon, days: 1});
				await mensaje.guild.members.unban(id, "Un softban consiste en banear y desbanear a alguien, entonces...");
			break;
			case "warn" :
				//xd
			break;
			default: return;
		}
	}
	if(des) {
		miembro = mensaje.guild.members.cache.get(id);
		usuario = cliente.users.cache.get(id);
	}
	veces[mensaje.guild.id].forEach((w, i) => {
		if(isNaN(w.caso) || !w.caso) {
			if(i == 0) {
				w.caso = 1;
			}
			else {
				w.caso = wAnterior.caso + 1;
			}
		}
		wAnterior = w;
	});
	veces[mensaje.guild.id].push(warn = new Warning(id, razon, Date.now(), moderador.tag, idW, (des ? "un" : "") + sancion, veces[mensaje.guild.id].length == 0 ? 1 : veces[mensaje.guild.id][veces[mensaje.guild.id].length - 1].caso + 1));
	actualizarWarnings(mensaje.guild);
	var webhookRegistros = await obtenerWebhookRegistros(mensaje.guild);
	if(webhookRegistros != undefined) {
		webhookRegistros.send(new Discord.MessageEmbed({
			author: {
				iconURL: moderador == undefined ? "" : moderador.avatarURL(),
				name: moderador == undefined ? id : moderador.tag
			},
			title: "Comando de moderación ejecutado",
			description: `[Ir al mensaje](${mensaje.url})\n`
					   + `Usuario: ${usuario == undefined ? id : usuario.tag}\n`
					   + `Sanción: \`${des ? "un" : ""}${sancion}\`\n`
					   + `Moderador: ${moderador.tag}\n`
					   + `Razón: ${razon}`
					   + `\nID: ${idW}`
					   + (temporal ? `\nDuración: ${tiempo}` : ""),
			timestamp: Date.now()
		}));
	}
	/*embed.setTitle(`<:papabot_correcto:816027708050899005> ${usuario == undefined ? `El usuario id ${id}` : usuario.tag} ha sido ${des ? "des": ""}${verbo[sancion]}${dmFallo ? ", pero fui incapaz de escribirle." : "."}`);
	embed.setDescription(`Razón: ${razon}`);
	embed.setColor("#43b581");*/
	embed.setTitle(`${emojis[sancion]} Usuario ${des ? "des" : ""}${verbo[sancion]}`);
	embed.setDescription(`Usuario: ${usuario == undefined ? id : usuario.tag}\n`
					   + `Sanción: \`${des ? "un" : ""}${sancion}\`\n`
					   + `Moderador: ${moderador.tag}\n`
					   + `Razón: ${razon}`
					   + `\nID: ${idW}`
					   + (temporal ? `\nDuración: ${tiempo}` : ""));
	embed.setColor("#43b581");
	if(temporal) {
		setTimeout(sancionar, tiempoConvertido, sancion, id, "Pasó el tiempo de la sanción.", mensaje, "", cliente.user.id, true, true);
	}
	if(!suprimirmensaje) await mensaje.channel.send({
		content: `<:papabot_correcto:816027708050899005> \`Caso #${warn.caso}\`: ${usuario.tag} ha sido ${des ? "des-" : ""}${verbo[sancion]}${dmFallo ? ", pero no pude escribirle al usuario." : "."} Esta sanción fue guardada con id \`${idW}\``,
		embed: config[mensaje.guild.id].embedSanciones ? embed : undefined
	});
}

function actualizarWarnings(guild) {
	fs.writeFileSync(`warnings/${guild.id}`, JSON.stringify(veces[guild.id] == undefined ? [] : veces[guild.id]));
}

function guardarConfig(guild) {
	fs.writeFileSync(`config/${guild.id}`, JSON.stringify(config[guild.id] == undefined ? [] : config[guild.id]));
}

/**
 * 
 * @param {number} tiempo 
 */
function aMilisegundos(tiempo) {
	var multiplicadores = {
		"s": 1,
		"m": 60,
		"h": 3600,
		"d": 86400
	}
	return tiempo.substring(0, tiempo.length - 1) * 1000 * multiplicadores[tiempo.substring(tiempo.length - 1)];
}

function adivinar(letra) {
	var instancias = getIndicesOf(letra, palabraElegida, false);
	for(var i = 0; i < instancias.length; i++) {
		palabra = reemplazarEn(palabra, letra, instancias[i]);
	}
	letrasAdivinadas.push(letra);
	return instancias;
}

/**
 * Configura un canal para el rol muteado.
 * @param {Discord.GuildChannel} canal Un canal.
 */
async function configurarRolMuteado(canal) {
	try {
		switch(canal.type) {
			case "text" :
				await canal.updateOverwrite(config[canal.guild.id].rolMuteado, {
					SEND_MESSAGES: false,
					ADD_REACTIONS: false
				});
			break;
			case "category" :
				await canal.updateOverwrite(config[canal.guild.id].rolMuteado, {
					SEND_MESSAGES: false,
					ADD_REACTIONS: false,
					SPEAK: false
				});
			break;
			case "voice" :
				await canal.updateOverwrite(config[canal.guild.id].rolMuteado, {
					SPEAK: false
				});
			break;
		}
	}
	catch(err) {
		
	}
}

function abreviar(numero) {
    var organizado = nDatos.sort((a, b) => b - a);
    for(var d of organizado) {
        if(numero > d.minimo) {
            return `${Math.round(numero / d.minimo * 100) / 100} ${d.terminacion}`
        }
    }
}

//Iniciar sesión con el token de la cuenta de PapaBot.
cliente.login(fs.readFileSync("token.txt").toString().trim());
registrar("info", "-- PapaBot para Discord --\n"
			  + "(C) 2020-2021 Papa productions\n\n"
			  + "Colores");
registrar("info", "██ Color predeterminado = Información.");
registrar("correcto", "██ Verde = Operación completada.");
registrar("procesando", "██ Amarillo = Procesando...");
registrar("error", "██ Rojo = Error.\n");
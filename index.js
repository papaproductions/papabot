const child_process = require("child_process");
let papabot;

iniciar();

function iniciar() {
    papabot = child_process.fork("bot.js", {
        silent: true
    });
    papabot.stdout.on("data", chunk => {
        process.stdout.write(`[${new Date()} - bot stdout] ${chunk}`);
    })
    
    papabot.stderr.on("data", chunk => {
        process.stderr.write(`[${new Date()} - bot stderr] ${chunk}`);
    })
    
    papabot.on("message", message => {
        switch(message) {
            case "reiniciar" :
                console.log(`[${new Date()} - main] PapaBot ha enviado una señal de reinicio.`);
                console.log(papabot.kill(0));
                iniciar();
            break;
        }
    });
    
    papabot.on("close", (code, signal) => {
        console.log(`[${new Date()} - main] PapaBot murío con código ${code}.`);
    })
}
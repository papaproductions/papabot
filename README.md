# PapaBot
PapaBot es un bot para discord de moderación.

# Sirve con discord.js v13?
No por ahora, aunque quizás en el futuro.

# Como lo hosteo?
Para hostearlo, primero:
1. Instala node.js
2. Clona este repositorio
3. Instala discord.js (Solo funciona v12 por ahora), @discordjs/opus, gtts y uuid con npm
4. Crea dos directorios: config y warnings
5. Crea una aplicación en https://discord.com/developers, crea un bot y copia el token a un archivo llamado "token.txt"
6. Si deseas usar `$hangman`, crea un archivo hangman.txt y añade varias palabras separadas por line breaks, y si deseas usar `$rickroll`, pon algun audio (preferiblemente un rickroll xd) y renombralo a "rickrollxd.mp3".
7. Haz `node .`

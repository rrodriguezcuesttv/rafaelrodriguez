# Príncipe Aventurero — juego HTML5

Juego de plataformas inspirado en la interfaz visual de la referencia proporcionada.

## Cómo usar
1. Descomprime la carpeta.
2. Abre `index.html` en Chrome, Edge o Firefox.
3. No requiere servidor ni internet.

## Controles
- Flechas / A-D: mover
- Flecha arriba / W / Espacio: saltar
- X o Enter: atacar
- Esc: pausa
- También incluye controles táctiles en pantalla.

## Estructura
- `index.html`: interfaz principal
- `css/style.css`: apariencia y HUD
- `js/game.js`: motor, físicas, colisiones, enemigos, monedas y misión
- `assets/img/`: reservada para imágenes adicionales
- `assets/audio/`: reservada para sonidos y música

## Personalización rápida
En `js/game.js` puedes modificar:
- cantidad/posición de monedas (`coins`)
- enemigos (`enemies`)
- plataformas (`platforms`)
- meta (`goal`)
- velocidad y salto del personaje (`player.speed`, `player.jumpPower`)

En `css/style.css` puedes cambiar tamaños, colores, botones y paneles.

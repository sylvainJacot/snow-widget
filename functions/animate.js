// Fonction utilitaire pour dessiner un flocon
const drawFlake = (flake, yOffset, ctx, offscreenCanvas, config) => {
    ctx.fillStyle = flake.color;
    if (config.flakeShape === 'default') {
        ctx.beginPath();
        ctx.arc(flake.x, yOffset, flake.rayon, 0, Math.PI * 2);
        ctx.fill();
    } else if (config.flakeShape === 'custom') {
        ctx.drawImage(offscreenCanvas, flake.x - flake.rayon, yOffset - flake.rayon, flake.rayon * 2, flake.rayon * 2);
    }
};

// Création d'un canvas hors écran pour les emojis (une seule fois)
const createOffscreenCanvas = (config) => {
    const offscreenCanvas = document.createElement('canvas');
    const size = 30;
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.font = `${size}px Arial`;
    offscreenCtx.fillText(config.emojiCharacter, 0, size - 5);
    return offscreenCanvas;
};

// Variables globales
let offscreenCanvas = null;
let currentEmojiCharacter = '❄️'; // Initialisé avec la valeur par défaut


export function animer(flocons, accumulatedSnow, config, verifierCollision, recycleFlocon, positionnementStrategique, ctx, canvas, windOffset, h1Elements, documentHeight) {
    // Vérifier si l'emojiCharacter a changé ou si le canvas n'existe pas encore
    if (config.flakeShape === 'custom' && (offscreenCanvas === null || config.emojiCharacter !== currentEmojiCharacter)) {
        offscreenCanvas = createOffscreenCanvas(config);
        currentEmojiCharacter = config.emojiCharacter; // Mettre à jour la valeur actuelle
    }

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = config.opacity;

    // Précalculer les constantes
    const viewTop = window.scrollY;
    const viewBottom = viewTop + window.innerHeight;
    const visibleRange = { top: viewTop - 100, bottom: viewBottom + 100 };
    const maxHorizontalOffset = config.maxHorizontalSpeed * 2;

    // Limiter la taille de accumulatedSnow
    const maxAccumulated = 1000;
    while (accumulatedSnow.length > maxAccumulated) {
        accumulatedSnow.shift();
    }

    // Filtrer les flocons accumulés visibles
    const accumulatedFlakes = accumulatedSnow.filter(snow => snow.y >= visibleRange.top && snow.y <= visibleRange.bottom);

    // Mettre à jour et collecter les flocons en mouvement
    const movingFlakes = [];
    for (let i = 0; i < flocons.length; i++) {
        const flocon = flocons[i];
        if (flocon.active && !flocon.accumule) {
            flocon.lastY = flocon.y;
            flocon.x += flocon.vX * windOffset;
            flocon.y += flocon.vY;

            if (flocon.y > documentHeight || flocon.x < -maxHorizontalOffset || flocon.x > canvas.width + maxHorizontalOffset) {
                recycleFlocon(config, flocon, positionnementStrategique, accumulatedSnow);
            } else {
                if (flocon.y >= visibleRange.top && flocon.y <= visibleRange.bottom) {
                    movingFlakes.push(flocon);
                }

                if (config.meltEffects && Math.random() > 0.998) {
                    flocon.meltFrame = 1;
                }
                if (flocon.meltFrame > 0) {
                    flocon.rayon -= 0.2;
                    flocon.meltFrame++;
                    if (flocon.rayon <= 0) {
                        recycleFlocon(config, flocon, positionnementStrategique, accumulatedSnow);
                    }
                }
            }
        }
    }

    // Dessiner les flocons en mouvement
    for (let i = 0; i < movingFlakes.length; i++) {
        drawFlake(movingFlakes[i], movingFlakes[i].y - viewTop, ctx, offscreenCanvas, config);
    }

    // Dessiner les flocons accumulés
    for (let i = 0; i < accumulatedFlakes.length; i++) {
        drawFlake(accumulatedFlakes[i], accumulatedFlakes[i].y - viewTop, ctx, offscreenCanvas, config);
    }

    // Boucle d'animation
    animationFrameId = requestAnimationFrame(() =>
        animer(
            flocons,
            accumulatedSnow,
            config,
            verifierCollision,
            recycleFlocon,
            positionnementStrategique,
            ctx,
            canvas,
            windOffset,
            h1Elements,
            documentHeight
        )
    );
}
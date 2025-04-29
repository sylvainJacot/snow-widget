export function animer(flocons, accumulatedSnow, config, verifierCollision, recycleFlocon, positionnementStrategique, ctx, canvas, windOffset, h1Elements, documentHeight) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = config.opacity;
    const viewTop = window.scrollY;
    const viewBottom = viewTop + window.innerHeight;

    // Regrouper les flocons pour un rendu efficace
    const movingFlakes = [];
    const twinklingFlakes = [];
    const accumulatedFlakes = accumulatedSnow.filter(snow => snow.y >= viewTop - 100 && snow.y <= viewBottom + 100);

    flocons.forEach(flocon => {
        if (flocon.active && !flocon.accumule) {
            // Mise à jour de la position
            flocon.lastY = flocon.y;
            flocon.x += flocon.vX * windOffset;
            flocon.y += flocon.vY;

            // Recycler si hors limites
            if (flocon.y > documentHeight || flocon.x < -50 || flocon.x > canvas.width + 50) {
                recycleFlocon(config, flocon, positionnementStrategique, accumulatedSnow);
            } else {
                // Vérifier collision à intervalles
                if (config.stickyEffect && Math.abs(flocon.y - flocon.lastY) >= config.pixelCheckInterval) {
                    verifierCollision(flocon);
                }

                // Ajouter au rendu si dans la vue
                if (flocon.y >= viewTop - 100 && flocon.y <= viewBottom + 100) {
                    if (config.twinkleEffect) {
                        twinklingFlakes.push(flocon);
                    } else {
                        movingFlakes.push(flocon);
                    }
                }
            }

            // Effet de fonte
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
    });

    // Dessiner les flocons en mouvement (sans scintillement)
    movingFlakes.forEach(flocon => {
        ctx.fillStyle = flocon.color;
        if (config.flakeShape === 'circle') {
            ctx.beginPath();
            ctx.arc(flocon.x, flocon.y - viewTop, flocon.rayon, 0, Math.PI * 2);
            ctx.fill();
        } else if (config.flakeShape === 'emojiCharacter') {
            ctx.font = `${flocon.rayon * 2}px Arial`;
            ctx.fillText(config.emojiCharacter, flocon.x - flocon.rayon, flocon.y - viewTop);
        }
    });

    // Dessiner les flocons avec scintillement
    twinklingFlakes.forEach(flocon => {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(flocon.twinkleFrame * Math.PI / 10);
        flocon.twinkleFrame = (flocon.twinkleFrame + 1) % 20;
        ctx.fillStyle = flocon.color;
        if (config.flakeShape === 'circle') {
            ctx.beginPath();
            ctx.arc(flocon.x, flocon.y - viewTop, flocon.rayon, 0, Math.PI * 2);
            ctx.fill();
        } else if (config.flakeShape === 'emojiCharacter') {
            ctx.font = `${flocon.rayon * 2}px Arial`;
            ctx.fillText(config.emojiCharacter, flocon.x - flocon.rayon, flocon.y - viewTop);
        }
    });
    ctx.globalAlpha = config.opacity; // Réinitialiser

    // Dessiner les flocons accumulés
    accumulatedFlakes.forEach(snow => {
        ctx.fillStyle = snow.color;
        if (config.flakeShape === 'circle') {
            ctx.beginPath();
            ctx.arc(snow.x, snow.y - viewTop, snow.rayon, 0, Math.PI * 2);
            ctx.fill();
        } else if (config.flakeShape === 'emojiCharacter') {
            ctx.font = `${snow.rayon * 2}px Arial`;
            ctx.fillText(config.emojiCharacter, snow.x - snow.rayon, snow.y - viewTop);
        }
    });

    requestAnimationFrame(() => animer(flocons, accumulatedSnow, config, verifierCollision, recycleFlocon, positionnementStrategique, ctx, canvas, windOffset, h1Elements, documentHeight));
}
export function animer(flocons, accumulatedSnow, config, verifierCollision, recycleFlocon, positionnementStrategique, ctx, canvas, windOffset, h1Elements, documentHeight) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = config.opacity;

    const viewTop = window.scrollY;
    const viewBottom = viewTop + window.innerHeight;
    const visibleRange = { top: viewTop - 100, bottom: viewBottom + 100 };

    // Filtrer les flocons accumulés visibles
    const accumulatedFlakes = accumulatedSnow.filter(snow => snow.y >= visibleRange.top && snow.y <= visibleRange.bottom);

    // Fonction utilitaire pour dessiner un flocon
    const drawFlake = (flake, yOffset) => {
        ctx.fillStyle = flake.color;
        if (config.flakeShape === 'default') {
            ctx.beginPath();
            ctx.arc(flake.x, yOffset, flake.rayon, 0, Math.PI * 2);
            ctx.fill();
        } else if (config.flakeShape === 'custom') {
            ctx.font = `${flake.rayon * 2}px Arial`;
            ctx.fillText(config.emojiCharacter, flake.x - flake.rayon, yOffset);
        }
    };

    // Mise à jour et rendu des flocons en mouvement
    const movingFlakes = [];
    flocons.forEach(flocon => {
        if (flocon.active && !flocon.accumule) {
            flocon.lastY = flocon.y;
            flocon.x += flocon.vX * windOffset;
            flocon.y += flocon.vY;

            if (flocon.y > documentHeight || flocon.x < -50 || flocon.x > canvas.width + 50) {
                recycleFlocon(config, flocon, positionnementStrategique, accumulatedSnow);
            } else {
                if (config.stickyEffect && Math.abs(flocon.y - flocon.lastY) >= 2) {
                    verifierCollision(flocon);
                }

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
    });

    // Dessiner les flocons en mouvement
    movingFlakes.forEach(flocon => drawFlake(flocon, flocon.y - viewTop));

    // Dessiner les flocons accumulés
    accumulatedFlakes.forEach(snow => drawFlake(snow, snow.y - viewTop));

    // Boucle d'animation
    requestAnimationFrame(() => animer(flocons, accumulatedSnow, config, verifierCollision, recycleFlocon, positionnementStrategique, ctx, canvas, windOffset, h1Elements, documentHeight));
}
export function animer(flocons, accumulatedSnow, config, verifierCollision, recycleFlocon, positionnementStrategique, ctx, canvas, windOffset, h1Elements, documentHeight) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = config.opacity;
    const viewTop = window.scrollY;
    const viewBottom = viewTop + window.innerHeight;

    flocons.forEach(flocon => {
        // Mise à jour de la position des flocons
        if (flocon.active && !flocon.accumule) {
            flocon.lastY = flocon.y;
            flocon.x += flocon.vX * windOffset;
            flocon.y += flocon.vY;

            // Vérifier la collision à intervalles réguliers
            if (config.stickyEffect && Math.abs(flocon.y - flocon.lastY) >= config.pixelCheckInterval) {
                verifierCollision(flocon);
                flocon.lastY = flocon.y;
            }

            // Recycler si le flocon sort des limites
            if (flocon.y > documentHeight || flocon.x < -50 || flocon.x > canvas.width + 50) {
                recycleFlocon(config, flocon, positionnementStrategique, accumulatedSnow);
            }
        }

        // Effet de scintillement (placé avant le dessin pour fonctionner)
        if (config.twinkleEffect && flocon.active && !flocon.accumule) {
            ctx.globalAlpha = 0.5 + 0.5 * Math.sin(flocon.twinkleFrame * Math.PI / 10);
            flocon.twinkleFrame = (flocon.twinkleFrame + 1) % 20;
        } else {
            ctx.globalAlpha = 1;
        }

        // Dessin des flocons selon leur forme
        if (flocon.active && !flocon.accumule &&
            flocon.y >= viewTop - 100 && flocon.y <= viewBottom + 100) {
            if (config.flakeShape === 'circle') {
                ctx.beginPath();
                ctx.arc(flocon.x, flocon.y - viewTop, flocon.rayon, 0, Math.PI * 2);
                ctx.fillStyle = flocon.color;
                ctx.fill();
            } else if (config.flakeShape === 'emojiCharacter') {
                ctx.font = `${flocon.rayon * 2}px Arial`; //! est-ce qu'on mettre inherit ou non?
                ctx.fillStyle = flocon.color;
                ctx.fillText(config.emojiCharacter, flocon.x - flocon.rayon, flocon.y - viewTop);
            }
        }

        // Effet de fonte
        if (config.meltEffects && flocon.active && Math.random() > 0.998) {
            flocon.meltFrame = 1;
        }
        if (flocon.meltFrame > 0) {
            flocon.rayon -= 0.2;
            flocon.meltFrame++;
            if (flocon.rayon <= 0) {
                if (flocon.accumule) {
                    const index = accumulatedSnow.indexOf(flocon);
                    if (index !== -1) accumulatedSnow.splice(index, 1);
                }
                recycleFlocon(config, flocon, positionnementStrategique, accumulatedSnow);
            }
        }

        if (config.stickyEffect && Math.abs(flocon.y - flocon.lastY) >= config.pixelCheckInterval) {
            verifierCollision(flocon);
            flocon.lastY = flocon.y;
        }

    });

    // Dessin des flocons accumulés
    accumulatedSnow.forEach(flocon => {
        if (flocon.h1Cible >= h1Elements.length) return;
        const h1 = h1Elements[flocon.h1Cible];
        const rect = h1.getBoundingClientRect();
        const snowX = rect.left + flocon.offsetX;
        const snowY = rect.top + flocon.offsetY;

        if (snowY >= -flocon.rayon * 2 && snowY <= canvas.height + flocon.rayon * 2) {
            if (config.flakeShape === 'circle') {
                ctx.beginPath();
                ctx.arc(snowX, snowY, flocon.rayon, 0, Math.PI * 2);
                ctx.fillStyle = flocon.color;
                ctx.fill();
            } else if (config.flakeShape === 'emojiCharacter') {
                ctx.font = `${flocon.rayon * 2}px Arial`; //! est-ce qu'on mettre inherit ou non?
                ctx.fillStyle = flocon.color;
                ctx.fillText(config.emojiCharacter, snowX - flocon.rayon, snowY);
            }
        }
    });

    // Ajout de nouveaux flocons
    const activeCount = flocons.filter(f => f.active && !f.accumule).length;
    if (activeCount < config.maxFlakes) {
        const newFlakesToAdd = Math.min(
            config.maxFlakes - activeCount,
            Math.floor(Math.random() * 5) + 1
        );

        for (let i = 0; i < newFlakesToAdd; i++) {
            if (flocons.length < config.maxFlakes) {
                flocons.push(createFlocon(h1Elements, config, canvas));
            } else {
                const inactiveFlakes = flocons.filter(f => !f.active);
                if (inactiveFlakes.length > 0) {
                    const randomIndex = Math.floor(Math.random() * inactiveFlakes.length);
                    recycleFlocon(config, inactiveFlakes[randomIndex], positionnementStrategique, accumulatedSnow);
                    inactiveFlakes[randomIndex].active = true;
                }
            }
        }
    }

    animationFrameId = requestAnimationFrame(() =>
        animer(flocons, accumulatedSnow, config, verifierCollision, recycleFlocon, positionnementStrategique, ctx, canvas, windOffset, h1Elements, documentHeight)
    );
}
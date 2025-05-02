export function createFlocon(h1Elements, config, canvas) {
    const h1Index = Math.floor(Math.random() * h1Elements.length);
    let startX = Math.random() * canvas.width;
    let startY = -config.flakeSize;

    if (h1Elements.length > 0 && Math.random() < 0.3) {
        const targetH1 = h1Elements[h1Index];
        const rect = targetH1.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;

        if (absoluteTop > window.scrollY + window.innerHeight) {
            startX = rect.left + Math.random() * rect.width;
            startY = Math.max(window.scrollY - config.flakeSize, absoluteTop - Math.random() * 200 - 50);
        }
    }

    return {
        x: startX,
        y: startY,
        vX: (Math.random() - 0.5) * config.maxHorizontalSpeed,
        vY: Math.random() * config.maxVerticalSpeed,
        active: true,
        accumule: false,
        meltFrame: 0,
        twinkleFrame: 0,
        h1Cible: h1Index,
        offsetX: 0,
        offsetY: 0,
        lastY: startY,
        color: config.flakeColors[Math.floor(Math.random() * config.flakeColors.length)],
        rayon: config.flakeSize * (1 + (Math.random() - 0.5) * config.sizeVariation),
    };
}

export function recycleFlocon(config, flocon, positionnementStrategique, accumulatedSnow) {
    if (flocon.accumule) {
        const index = accumulatedSnow.indexOf(flocon);
        if (index !== -1) accumulatedSnow.splice(index, 1);
        flocon.accumule = false;
    }

    const newPos = positionnementStrategique();
    Object.assign(flocon, {
        x: newPos.x,
        y: newPos.y,
        vX: (Math.random() - 0.5) * config.maxHorizontalSpeed,
        vY: Math.random() * config.maxVerticalSpeed + 1,
        rayon: config.flakeSize * (1 + (Math.random() - 0.5) * config.sizeVariation),
        active: true,
        meltFrame: 0,
        twinkleFrame: 0,
        h1Cible: newPos.h1Index,
        lastY: newPos.y,
        color: config.flakeColors[Math.floor(Math.random() * config.flakeColors.length)]
    });
}
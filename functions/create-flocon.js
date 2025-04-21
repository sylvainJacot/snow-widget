export function createFlocon(h1Elements, config, canvas) {
    const h1Index = Math.floor(Math.random() * h1Elements.length);
    let startX = Math.random() * canvas.width;
    let startY = -config.flakeSize;

    if (Math.random() < 0.3 && h1Elements.length > 0) {
        const targetH1 = h1Elements[h1Index];
        const rect = targetH1.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;

        if (absoluteTop > window.scrollY + window.innerHeight) {
            startX = rect.left + Math.random() * rect.width;
            startY = absoluteTop - Math.random() * 200 - 50;
            if (startY < window.scrollY + window.innerHeight) {
                startY = window.scrollY - config.flakeSize;
            }
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
        flocon.x = newPos.x;
        flocon.y = newPos.y;
        flocon.vX = (Math.random() - 0.5) * config.maxHorizontalSpeed;
        flocon.vY = Math.random() * config.maxVerticalSpeed + 1;
        flocon.rayon = config.flakeSize * (1 + (Math.random() - 0.5) * config.sizeVariation);
        flocon.active = true;
        flocon.meltFrame = 0;
        flocon.twinkleFrame = 0;
        flocon.h1Cible = newPos.h1Index;
        flocon.lastY = newPos.y;
        flocon.color = config.flakeColors[Math.floor(Math.random() * config.flakeColors.length)];
    }
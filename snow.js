import { loadConfig } from './functions/load-script';
import { createCanvas, canvas, ctx } from './functions/create-canvas';
import { createFlocon, recycleFlocon } from './functions/create-flocon'
import { animer } from './functions/animate';
import { isWithinLifetime } from './functions/lifetime';

window.snowStorm = (function (window, document) {
    // Configuration par défaut
    const defaultConfig = {
        opacity: 1,
        maxFlakes: 200,
        flakeColors: ['#fff', '#ececf2', '#7792a7', '#e7eaef', '#bfcbd3'],
        flakeShape: 'default',
        emojiCharacter: '❄️',
        flakeSize: 2,
        sizeVariation: 1,
        autoStart: true,
        maxHorizontalSpeed: 1.5,
        maxVerticalSpeed: 1.5,
        mouseInteraction: false,
        stickyEffect: false,
        meltEffects: true,
        startDate: null,
        endDate: null,
        disableOnMobile: true,
        useGPU: true,
        allowedDomain: null,
        zIndex: 9999
    };

    let config = { ...defaultConfig };
    let flocons = [], animationFrameId;
    let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let windOffset = 1;
    let h1Elements = [];
    let accumulatedSnow = [];
    let documentHeight = 0;

    function checkShouldStart(configParam) {
        const withinLifetime = isWithinLifetime(configParam);

        const shouldAutoStart = configParam.autoStart === true;
        const notDisabledOnMobile = !configParam.disableOnMobile || !isMobile;
        return withinLifetime && shouldAutoStart && notDisabledOnMobile;
    }

    (async function () {
        config = await loadConfig(defaultConfig);

        if (checkShouldStart(config)) {
            start();
        }
    })();

    function updateH1Elements() {
        h1Elements = Array.from(document.querySelectorAll("h1"));
        documentHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight
        );
    }

    function verifierCollision(flocon) {
        return false; // Désactivé
    }

    function positionnementStrategique() {
        const chance = Math.random();
        if (chance < 0.7 || h1Elements.length === 0) {
            return {
                x: Math.random() * canvas.width,
                y: -config.flakeSize,
                h1Index: Math.floor(Math.random() * Math.max(1, h1Elements.length))
            };
        } else {
            const h1Index = Math.floor(Math.random() * h1Elements.length);
            const h1 = h1Elements[h1Index];
            const rect = h1.getBoundingClientRect();
            const absoluteTop = rect.top + window.scrollY;
            return {
                x: rect.left + Math.random() * rect.width,
                y: Math.max(-config.flakeSize, absoluteTop - Math.random() * 200 - 50),
                h1Index: h1Index
            };
        }
    }

    function initFlocons() {
        updateH1Elements();
        flocons = [];
        accumulatedSnow = [];
        for (let i = 0; i < config.maxFlakes; i++) {
            const newFlake = createFlocon(h1Elements, config, canvas);
            if (i < config.maxFlakes / 3) {
                newFlake.y = Math.random() * documentHeight;
            }
            flocons.push(newFlake);
        }
    }

    function updateFlakes() {
        flocons.forEach(flocon => {
            flocon.size = config.flakeSize + Math.random() * config.sizeVariation;
            flocon.color = config.flakeColors[Math.floor(Math.random() * config.flakeColors.length)];
            flocon.vX = Math.random() * config.maxHorizontalSpeed * 2 - config.maxHorizontalSpeed;
            flocon.vY = Math.random() * config.maxVerticalSpeed + 0.5;
        });
    }

    function adjustFlakeCount() {
        const currentFlakeCount = flocons.length;
        if (config.maxFlakes > currentFlakeCount) {
            for (let i = currentFlakeCount; i < config.maxFlakes; i++) {
                const newFlake = createFlocon(h1Elements, config, canvas);
                flocons.push(newFlake);
            }
        } else if (config.maxFlakes < currentFlakeCount) {
            flocons = flocons.slice(0, config.maxFlakes);
        }
    }

    function handleResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        updateH1Elements();
    }

    function handleMouseMove(e) {
        if (config.mouseInteraction) {
            flocons.forEach(flocon => {
                if (flocon.active && !flocon.accumule) {
                    const dx = e.clientX - flocon.x;
                    flocon.vX += dx * 0.01;
                    flocon.vX = Math.max(-config.maxHorizontalSpeed, Math.min(config.maxHorizontalSpeed, flocon.vX));
                }
            });
        }
    }

    function start() {
        if (config.disableOnMobile && isMobile) return;
        if (animationFrameId) return;
        if (!canvas) {
            createCanvas(config);
        } else {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        updateH1Elements();
        initFlocons();
        animer(flocons, accumulatedSnow, config, verifierCollision, recycleFlocon, positionnementStrategique, ctx, canvas, windOffset, h1Elements, documentHeight);

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', updateH1Elements);
        if (config.mouseInteraction) {
            window.addEventListener('mousemove', handleMouseMove);
        }
    }

    function stop() {
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', updateH1Elements);
        if (config.mouseInteraction) {
            window.removeEventListener('mousemove', handleMouseMove);
        }
    }

    function restart() {
        stop();
        start();
    }

    function updateConfig(newConfig) {
        const oldConfig = { ...config };
        config = { ...config, ...newConfig };

        const shouldStartNow = checkShouldStart(config);
        const wasRunning = !!animationFrameId;
        if (!shouldStartNow) { stop(); return; }
        if (!wasRunning) { start(); return; }
        // Mise à jour sans arrêter l'animation si elle était déjà en cours
        updateFlakes();
        if (config.maxFlakes !== oldConfig.maxFlakes) {
            adjustFlakeCount();
        }
        if (config.mouseInteraction !== oldConfig.mouseInteraction) {
            if (config.mouseInteraction) {
                window.addEventListener('mousemove', handleMouseMove);
            } else {
                window.removeEventListener('mousemove', handleMouseMove);
            }
        }
    }

    return {
        start,
        stop,
        restart,
        updateConfig,
        get config() { return config; }
    };
})(window, document);
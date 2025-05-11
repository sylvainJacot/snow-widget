import { loadConfig } from './functions/load-script';
import { createCanvas, canvas, ctx } from './functions/create-canvas';
import { createFlocon, recycleFlocon } from './functions/create-flocon'
import { animer } from './functions/animate';
import { isWithinLifetime } from './functions/lifetime';

window.snowStorm = (function (window, document) {
    // Configuration par défaut
    const defaultConfig = {

        // ❄️ Flocons & Apparence
        opacity: 1,
        maxFlakes: 200, // Nombre maximum de flocons simultanés
        flakeColors: ['#fff', '#ececf2', '#7792a7', '#e7eaef', '#bfcbd3'],
        flakeShape: 'default', // Options : 'default', 'custom'
        emojiCharacter: '❄️',        // Emoji par défaut si flakeShape est 'emojiCharacter'
        flakeSize: 2,
        sizeVariation: 1,

        // 🌬️ Mouvement & Comportement
        autoStart: true,   // Lance automatiquement l’effet à l'arrivée sur la page
        maxHorizontalSpeed: 1.5,
        maxVerticalSpeed: 1.5,
        mouseInteraction: false,

        // ✨ Effets spéciaux
        stickyEffect: false,
        meltEffects: true,

        // 📱 Compatibilité & Contrôle
        startDate: null, // Format : 'YYYY-MM-DDTHH:MM:SS'
        endDate: null,   // Format : 'YYYY-MM-DDTHH:MM:SS'
        disableOnMobile: true,
        useGPU: true,
        zIndex: 9999
    };

    // Variable pour stocker la configuration dynamique
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


    // Initialisation asynchrone de la configuration
    (async function () {
        config = await loadConfig(defaultConfig);
        console.group('%c loadConfig', 'color: white; background-color:rgb(164, 27, 27); font-size: 15px');
        console.log({
            IS_WITHIN_LIFETIME: isWithinLifetime(config),
            AUTO_START: config.autoStart,
            DISABLE_ON_MOBILE: config.disableOnMobile,
            IS_MOBILE: isMobile,
            SHOULD_START: checkShouldStart(config),
        });
        console.groupEnd();

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


    // Fonction désactivée - stickyEffect
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
                    flocon.vX += dx * 0.01; // Attraction vers la souris
                    flocon.vX = Math.max(-config.maxHorizontalSpeed, Math.min(config.maxHorizontalSpeed, flocon.vX));
                }
            });
        }
    }

    function start() {
        if (config.disableOnMobile && isMobile) return;
        if (animationFrameId) return; // Ne pas relancer si une animation est déjà active
        createCanvas(config);
        updateH1Elements();
        initFlocons();
        animer(flocons, accumulatedSnow, config, verifierCollision, recycleFlocon, positionnementStrategique, ctx, canvas, windOffset, h1Elements, documentHeight);

        window.removeEventListener('resize', handleResize);
        window.addEventListener('resize', handleResize);

        window.removeEventListener('scroll', updateH1Elements);
        window.addEventListener('scroll', updateH1Elements);

        if (config.mouseInteraction) {
            window.removeEventListener('mousemove', handleMouseMove);
            window.addEventListener('mousemove', handleMouseMove);
        }
    }

    function stop() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;

        // Supprimer les écouteurs d'événements
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', updateH1Elements);
        if (config.mouseInteraction) {
            window.removeEventListener('mousemove', handleMouseMove);
        }
    }

    function restart() {
        stop();  // Arrête l’animation
        start(); // Redémarre l’animation
    }

    // Nouvelle fonction pour mettre à jour la configuration dynamiquement
    function updateConfig(newConfig) {
        // Fusionner avec les nouveaux paramètres
        config = { ...config, ...newConfig };

        // Arrêter l'animation dans tous les cas
        stop();

        // Redémarrer uniquement si les conditions sont remplies
        if (checkShouldStart(config)) {
            console.log('Restart animation...');
            start();
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
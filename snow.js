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
        flakeShape: 'circle', // Options : 'circle', 'emojiCharacter', 'character'
        emojiCharacter: '❄️',        // Emoji par défaut si flakeShape est 'emojiCharacter'
        flakeSize: 2,
        sizeVariation: 1,

        // 🌬️ Mouvement & Comportement
        autoStart: true,   // Lance automatiquement l’effet à l'arrivée sur la page
        maxHorizontalSpeed: 1.5,
        maxVerticalSpeed: 1.5,
        mouseInteraction: false,

        // ✨ Effets spéciaux
        stickyEffect: true,
        meltEffects: true,
        twinkleEffect: false,

        // 📱 Compatibilité & Contrôle
        startDate: null, // Format : 'YYYY-MM-DDTHH:MM:SS'
        endDate: null,   // Format : 'YYYY-MM-DDTHH:MM:SS'
        disableOnMobile: true,
        useGPU: true,
        zIndex: 9999,
        pixelCheckInterval: 2,
    };

    // Variable pour stocker la configuration dynamique
    let config = { ...defaultConfig };

    let flocons = [], animationFrameId;
    let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let windOffset = 1;
    let h1Elements = [];
    let accumulatedSnow = [];
    let documentHeight = 0;


    // Initialisation asynchrone de la configuration
    (async function () {
        config = await loadConfig(defaultConfig);
        if (isWithinLifetime(config) && config.autoStart && (!config.disableOnMobile || !isMobile)) {
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
        for (let i = 0; i < h1Elements.length; i++) {
            const h1 = h1Elements[i];
            const rect = h1.getBoundingClientRect();
            const absoluteRect = {
                left: rect.left,
                right: rect.right,
                top: rect.top + window.scrollY,
                bottom: rect.bottom + window.scrollY
            };

            if (flocon.x >= absoluteRect.left && flocon.x <= absoluteRect.right) {
                if (flocon.y >= absoluteRect.top && flocon.lastY < absoluteRect.top) {
                    flocon.h1Cible = i;
                    flocon.accumule = true;
                    flocon.offsetX = flocon.x - rect.left;
                    flocon.offsetY = 0;
                    accumulatedSnow.push(flocon);
                    return true;
                }
            }
        }
        return false;
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
            if (i >= config.maxFlakes) newFlake.active = false;
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
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;

        // Supprimer les écouteurs d'événements
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', updateH1Elements);
        if (config.mouseInteraction) {
            window.removeEventListener('mousemove', handleMouseMove);
        }
    }

    // Nouvelle fonction pour mettre à jour la configuration dynamiquement
    function updateConfig(newConfig) {
        config = { ...config, ...newConfig }; // Fusionner avec les nouveaux paramètres
        initFlocons(); // Réinitialiser les flocons avec la nouvelle configuration
        stop(); // Arrêter l’animation
        start(); // Redémarrer avec la nouvelle config
    }

    return {
        start,
        stop,
        updateConfig, // Exposer la fonction updateConfig
        get config() { return config; }
    };
})(window, document);
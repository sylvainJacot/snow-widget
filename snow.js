window.snowStorm = (function (window, document) {
    // Configuration par défaut
    const defaultConfig = {
        version: 1,
        autoStart: true,
        excludeMobile: true,
        flakesMax: 200,
        useGPU: true,
        snowColor: '#fff',
        snowStick: true,
        useMeltEffect: false,
        // useTwinkleEffect: false, // À implémenter plus tard
        // followMouse: false, // À implémenter plus tard
        // freezeOnBlur: false, // À implémenter plus tard
        flakeSize: 3,
        vMaxX: 2,
        vMaxY: 2,
        zIndex: 9999,
        checkForHitEveryPixel: 2
    };

    // Variable pour stocker la configuration dynamique
    let config = { ...defaultConfig };

    let canvas, ctx, flocons = [], animationFrameId;
    let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let windOffset = 1;
    let h1Elements = [];
    let accumulatedSnow = [];
    let documentHeight = 0;

    // Récupérer les paramètres de l’URL du script
    function getUrlParams() {
        const params = {};
        const script = document.currentScript;
        if (script && script.src) {
            const url = new URL(script.src);
            url.searchParams.forEach((value, key) => {
                params[key] = value;
            });
        }
        return params;
    }

    // Récupérer la configuration depuis Supabase
    async function fetchConfig(token) {
        const response = await fetch(
            `https://ijgyqpqtsauyluefxvvb.supabase.co/functions/v1/get-config?token=${token}`,
            {
                headers: {
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZ3lxcHF0c2F1eWx1ZWZ4dnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMDMyMTcsImV4cCI6MjA1ODY3OTIxN30.fn6Uc1EWGeMbGufBQWQzCLHFSI_ElmA8-ZjOMJL2raM'
                }
            }
        );
        if (!response.ok) {
            console.error('Réponse API non valide :', response.status, response.statusText);
            throw new Error('Failed to fetch configuration');
        }
        const data = await response.json();
        console.log('Données API :', data); // Ajoutez ce log
        return data;
    }

    // Charger la configuration dynamiquement
    async function loadConfig() {
        const params = getUrlParams();
        let userConfig;
    
        if (params.preview === 'true' && params.config) {
            // Mode preview : configuration encodée dans l’URL
            userConfig = JSON.parse(decodeURIComponent(params.config));
        } else if (params.token) {
            // Mode live : récupération depuis Supabase
            try {
                userConfig = await fetchConfig(params.token);
            } catch (error) {
                console.error('Erreur lors de la récupération de la configuration :', error);
                return defaultConfig;
            }
        } else {
            console.error('Aucun token ou configuration preview fourni');
            return defaultConfig;
        }
    
        // Fusionner avec la configuration par défaut
        return { ...defaultConfig, ...userConfig };
    }

    // Initialisation asynchrone de la configuration
    (async function () {
        config = await loadConfig();
        if (config.autoStart && (!config.excludeMobile || !isMobile)) {
            start();
        }
    })();

    function createCanvas() {
        canvas = document.getElementById("snowCanvas") || null;
        if (!canvas) {
            canvas = document.createElement("canvas");
            canvas.id = "snowCanvas";
            canvas.style.position = "fixed";
            canvas.style.top = "0";
            canvas.style.left = "0";
            canvas.style.pointerEvents = "none";
            canvas.style.zIndex = config.zIndex;
            document.body.appendChild(canvas);
        }
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx = canvas.getContext("2d", { alpha: true });
    }

    function updateH1Elements() {
        h1Elements = Array.from(document.querySelectorAll("h1"));
        documentHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight
        );
    }

    function createFlocon() {
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
            vX: (Math.random() - 0.5) * config.vMaxX,
            vY: Math.random() * config.vMaxY,
            rayon: Math.random() * config.flakeSize,
            active: true,
            accumule: false,
            meltFrame: 0,
            twinkleFrame: 0,
            h1Cible: h1Index,
            offsetX: 0,
            offsetY: 0,
            lastY: startY
        };
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

    function animer() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const viewTop = window.scrollY;
        const viewBottom = viewTop + window.innerHeight;

        flocons.forEach(flocon => {
            if (flocon.active && !flocon.accumule) {
                flocon.lastY = flocon.y;
                flocon.x += flocon.vX * windOffset;
                flocon.y += flocon.vY;

                if (config.snowStick && (Math.floor(flocon.y) % config.checkForHitEveryPixel === 0)) {
                    verifierCollision(flocon);
                }

                if (flocon.y > documentHeight || flocon.x < -50 || flocon.x > canvas.width + 50) {
                    recycleFlocon(flocon);
                }
            }

            if (config.useMeltEffect && flocon.active && Math.random() > 0.998) {
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
                    recycleFlocon(flocon);
                }
            }

            if (flocon.active && !flocon.accumule &&
                flocon.y >= viewTop - 100 && flocon.y <= viewBottom + 100) {
                ctx.beginPath();
                ctx.arc(flocon.x, flocon.y - viewTop, flocon.rayon, 0, Math.PI * 2);
                ctx.fillStyle = config.snowColor;
                ctx.fill();
            }
        });

        accumulatedSnow.forEach(flocon => {
            if (flocon.h1Cible >= h1Elements.length) return;
            const h1 = h1Elements[flocon.h1Cible];
            const rect = h1.getBoundingClientRect();
            const snowX = rect.left + flocon.offsetX;
            const snowY = rect.top + flocon.offsetY;

            if (snowY >= -flocon.rayon * 2 && snowY <= canvas.height + flocon.rayon * 2) {
                ctx.beginPath();
                ctx.arc(snowX, snowY, flocon.rayon, 0, Math.PI * 2);
                ctx.fillStyle = config.snowColor;
                ctx.fill();
            }
        });

        const activeCount = flocons.filter(f => f.active && !f.accumule).length;
        if (activeCount < config.flakesMax) {
            const newFlakesToAdd = Math.min(
                config.flakesMax - activeCount,
                Math.floor(Math.random() * 5) + 1
            );

            for (let i = 0; i < newFlakesToAdd; i++) {
                if (flocons.length < config.flakesMax) {
                    flocons.push(createFlocon());
                } else {
                    const inactiveFlakes = flocons.filter(f => !f.active);
                    if (inactiveFlakes.length > 0) {
                        const randomIndex = Math.floor(Math.random() * inactiveFlakes.length);
                        recycleFlocon(inactiveFlakes[randomIndex]);
                        inactiveFlakes[randomIndex].active = true;
                    }
                }
            }
        }

        animationFrameId = requestAnimationFrame(animer);
    }

    function recycleFlocon(flocon) {
        if (flocon.accumule) {
            const index = accumulatedSnow.indexOf(flocon);
            if (index !== -1) accumulatedSnow.splice(index, 1);
            flocon.accumule = false;
        }

        const newPos = positionnementStrategique();
        flocon.x = newPos.x;
        flocon.y = newPos.y;
        flocon.vX = (Math.random() - 0.5) * config.vMaxX;
        flocon.vY = Math.random() * config.vMaxY + 1;
        flocon.rayon = Math.random() * config.flakeSize;
        flocon.active = true;
        flocon.meltFrame = 0;
        flocon.twinkleFrame = 0;
        flocon.h1Cible = newPos.h1Index;
        flocon.lastY = newPos.y;
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

        for (let i = 0; i < config.flakesMax; i++) {
            const newFlake = createFlocon();
            if (i < config.flakesMax / 3) {
                newFlake.y = Math.random() * documentHeight;
            }
            flocons.push(newFlake);
            if (i >= config.flakesMax) newFlake.active = false;
        }
    }

    function handleResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        updateH1Elements();
    }

    function handleMouseMove(e) {
        if (!config.followMouse) return;
        const x = e.clientX;
        const mid = canvas.width / 2;
        windOffset = x < mid ? -1 + (x / mid) : (x - mid) / mid;
    }

    function start() {
        if (config.excludeMobile && isMobile) return;
        createCanvas();
        updateH1Elements();
        initFlocons();
        animer();

        window.removeEventListener('resize', handleResize);
        window.addEventListener('resize', handleResize);

        window.removeEventListener('scroll', updateH1Elements);
        window.addEventListener('scroll', updateH1Elements);

        if (config.followMouse) {
            window.removeEventListener('mousemove', handleMouseMove);
            window.addEventListener('mousemove', handleMouseMove);
        }
    }

    function stop() {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // Nouvelle fonction pour mettre à jour la configuration dynamiquement
    function updateConfig(newConfig) {
        const oldFlakesMax = config.flakesMax;
        config = { ...config, ...newConfig }; // Fusionner avec les nouveaux paramètres

        // Si flakesMax a changé, réinitialiser les flocons
        if (config.flakesMax !== oldFlakesMax) {
            initFlocons();
        }

        // Redémarrer l'animation avec la nouvelle configuration
        stop();
        start();
    }

    return {
        start,
        stop,
        updateConfig, // Exposer la fonction updateConfig
        get config() { return config; }
    };
})(window, document);
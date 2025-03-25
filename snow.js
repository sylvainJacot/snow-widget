const snowStorm = (function (window, document) {
    // Configuration par défaut
    const config = {
        autoStart: true,
        excludeMobile: true,
        flakesMax: 200,         // Plus de flocons pour plus de chances d'accumulation
        flakesMaxActive: 150,    // Plus de flocons actifs
        useGPU: true,
        snowColor: '#fff',
        snowCharacter: '•',
        snowStick: true,
        useMeltEffect: true,
        useTwinkleEffect: false,
        followMouse: false,
        freezeOnBlur: true,
        flakeWidth: 8,
        flakeHeight: 8,
        vMaxX: 5,
        vMaxY: 4,
        zIndex: 9999,
        checkForHitEveryPixel: 2   // Vérifier collision tous les X pixels de chute
    };

    // Variables globales
    let canvas, ctx, flocons = [], animationFrameId;
    let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let windOffset = 1;
    let h1Elements = [];
    let accumulatedSnow = [];
    let documentHeight = 0;

    // Créer le canvas
    function createCanvas() {
        canvas = document.createElement("canvas");
        document.body.appendChild(canvas);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx = canvas.getContext("2d");
    }

    // Mettre à jour les positions des <h1> et la hauteur du document
    function updateH1Elements() {
        h1Elements = Array.from(document.querySelectorAll("h1"));
        
        // Calculer la hauteur totale du document pour générer des flocons à différentes hauteurs
        documentHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight
        );
    }

    // Créer un flocon avec position intelligente
    function createFlocon() {
        const h1Index = Math.floor(Math.random() * h1Elements.length);
        
        // Déterminer si ce flocon sera généré dans la vue ou à une position stratégique
        let startX = Math.random() * canvas.width;
        let startY = -config.flakeHeight;
        
        // Pour certains flocons, les positionner stratégiquement au-dessus des h1 non visibles
        // afin de créer des chances d'accumulation sur les h1 hors écran
        if (Math.random() < 0.3 && h1Elements.length > 0) {  // 30% des flocons
            const targetH1 = h1Elements[h1Index];
            const rect = targetH1.getBoundingClientRect();
            const absoluteTop = rect.top + window.scrollY;
            
            // Si le h1 est en dessous de la vue actuelle
            if (absoluteTop > window.scrollY + window.innerHeight) {
                startX = rect.left + Math.random() * rect.width;
                // Positionner le flocon pas trop loin au-dessus du h1 cible
                startY = absoluteTop - Math.random() * 200 - 50;
                
                // Si le flocon serait visible à l'écran, le placer juste au-dessus de la vue
                if (startY < window.scrollY + window.innerHeight) {
                    startY = window.scrollY - config.flakeHeight;
                }
            }
        }
        
        return {
            x: startX,
            y: startY,
            vX: (Math.random() - 0.5) * config.vMaxX,
            vY: Math.random() * config.vMaxY + 1,
            rayon: Math.random() * 3 + 2,
            active: true,
            accumule: false,
            meltFrame: 0,
            twinkleFrame: 0,
            h1Cible: h1Index,
            offsetX: 0,
            offsetY: 0,
            lastY: startY  // Pour suivre la dernière position Y pour vérification de collision
        };
    }

    // Vérifier si le flocon touche un élément h1
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
            
            // Vérifier si le flocon est dans les limites horizontales du h1
            if (flocon.x >= absoluteRect.left && flocon.x <= absoluteRect.right) {
                // Si le flocon vient de traverser le bord supérieur du h1
                if (flocon.y >= absoluteRect.top && flocon.lastY < absoluteRect.top) {
                    flocon.h1Cible = i;  // Affecter ce h1 comme cible
                    flocon.accumule = true;
                    flocon.offsetX = flocon.x - rect.left;
                    flocon.offsetY = 0; // Au sommet du h1
                    accumulatedSnow.push(flocon);
                    return true;
                }
            }
        }
        return false;
    }

    // Animer les flocons
    function animer() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Récupérer la vue actuelle
        const viewTop = window.scrollY;
        const viewBottom = viewTop + window.innerHeight;

        // Traiter les flocons actifs
        flocons.forEach(flocon => {
            if (flocon.active && !flocon.accumule) {
                // Sauvegarder la position Y précédente pour la détection de collision
                flocon.lastY = flocon.y;
                
                // Mouvement
                flocon.x += flocon.vX * windOffset;
                flocon.y += flocon.vY;
                
                // Vérifier collision avec h1 tous les X pixels
                if (config.snowStick && (Math.floor(flocon.y) % config.checkForHitEveryPixel === 0)) {
                    verifierCollision(flocon);
                }

                // Réinitialiser si hors écran (bas)
                if (flocon.y > documentHeight) {
                    recycleFlocon(flocon);
                }
                
                // Réinitialiser si hors écran (côtés)
                if (flocon.x < -50 || flocon.x > canvas.width + 50) {
                    recycleFlocon(flocon);
                }
            }

            // Effet de fonte
            if (config.useMeltEffect && flocon.active && Math.random() > 0.998) {
                flocon.meltFrame = 1;
            }
            if (flocon.meltFrame > 0) {
                flocon.rayon -= 0.2;
                flocon.meltFrame++;
                if (flocon.rayon <= 0) {
                    // Retirer de la liste des flocons accumulés si nécessaire
                    if (flocon.accumule) {
                        const index = accumulatedSnow.indexOf(flocon);
                        if (index !== -1) accumulatedSnow.splice(index, 1);
                    }
                    recycleFlocon(flocon);
                }
            }

            // Effet de scintillement
            if (config.useTwinkleEffect) {
                if (flocon.twinkleFrame > 0) {
                    flocon.twinkleFrame--;
                } else if (Math.random() > 0.97) {
                    flocon.twinkleFrame = Math.floor(Math.random() * 8);
                }
            }

            // Dessiner le flocon en mouvement (seulement s'il est dans la vue)
            if (flocon.active && !flocon.accumule && 
                flocon.y >= viewTop - 100 && flocon.y <= viewBottom + 100) {
                ctx.beginPath();
                ctx.arc(flocon.x, flocon.y - viewTop, flocon.rayon, 0, Math.PI * 2);
                ctx.fillStyle = config.snowColor;
                ctx.globalAlpha = flocon.twinkleFrame % 2 === 0 ? 0.5 : 1;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        });
        
        // Dessiner les flocons accumulés
        accumulatedSnow.forEach(flocon => {
            if (flocon.h1Cible >= h1Elements.length) return;
            
            const h1 = h1Elements[flocon.h1Cible];
            const rect = h1.getBoundingClientRect();
            
            // Position actuelle basée sur la position du h1 plus le décalage relatif
            const snowX = rect.left + flocon.offsetX;
            const snowY = rect.top + flocon.offsetY;
            
            // Vérifier si le flocon est visible dans la fenêtre
            if (snowY >= -flocon.rayon * 2 && snowY <= canvas.height + flocon.rayon * 2) {
                // Dessiner le flocon accumulé
                ctx.beginPath();
                ctx.arc(snowX, snowY, flocon.rayon, 0, Math.PI * 2);
                ctx.fillStyle = config.snowColor;
                ctx.globalAlpha = flocon.twinkleFrame % 2 === 0 ? 0.5 : 1;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        });

        // Vérifier s'il y a assez de flocons en mouvement
        const activeCount = flocons.filter(f => f.active && !f.accumule).length;
        if (activeCount < config.flakesMaxActive) {
            // Ajouter de nouveaux flocons pour maintenir une quantité constante
            const newFlakesToAdd = Math.min(
                config.flakesMaxActive - activeCount, 
                Math.floor(Math.random() * 5) + 1  // Ajouter 1-5 flocons à la fois
            );
            
            for (let i = 0; i < newFlakesToAdd; i++) {
                if (flocons.length < config.flakesMax) {
                    flocons.push(createFlocon());
                } else {
                    // Réactiver un flocon inactif
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

    // Recycler un flocon
    function recycleFlocon(flocon) {
        // Si c'était un flocon accumulé, on le retire de la liste
        if (flocon.accumule) {
            const index = accumulatedSnow.indexOf(flocon);
            if (index !== -1) {
                accumulatedSnow.splice(index, 1);
            }
            flocon.accumule = false;
        }
        
        // Nouvelle position stratégique
        const newPos = positionnementStrategique();
        
        flocon.x = newPos.x;
        flocon.y = newPos.y;
        flocon.vX = (Math.random() - 0.5) * config.vMaxX;
        flocon.vY = Math.random() * config.vMaxY + 1;
        flocon.rayon = Math.random() * 3 + 2;
        flocon.active = true;
        flocon.meltFrame = 0;
        flocon.twinkleFrame = 0;
        flocon.h1Cible = newPos.h1Index;
        flocon.lastY = newPos.y;
    }
    
    // Calcule une position stratégique pour un nouveau flocon
    function positionnementStrategique() {
        // Déterminer où générer le flocon par rapport aux éléments h1
        const chance = Math.random();
        
        // 70% normal, 30% stratégique
        if (chance < 0.7 || h1Elements.length === 0) {
            // Position standard au-dessus de l'écran
            return {
                x: Math.random() * canvas.width,
                y: -config.flakeHeight,
                h1Index: Math.floor(Math.random() * Math.max(1, h1Elements.length))
            };
        } else {
            // Choisir un h1 aléatoire
            const h1Index = Math.floor(Math.random() * h1Elements.length);
            const h1 = h1Elements[h1Index];
            const rect = h1.getBoundingClientRect();
            const absoluteTop = rect.top + window.scrollY;
            
            // Position au-dessus du h1 choisi
            return {
                x: rect.left + Math.random() * rect.width,
                y: Math.max(-config.flakeHeight, absoluteTop - Math.random() * 200 - 50),
                h1Index: h1Index
            };
        }
    }

    // Initialiser les flocons
    function initFlocons() {
        updateH1Elements();
        
        // Créer les flocons initiaux
        for (let i = 0; i < config.flakesMax; i++) {
            const newFlake = createFlocon();
            
            // Distribuer certains flocons sur toute la hauteur de la page pour démarrer
            if (i < config.flakesMax / 3) {
                newFlake.y = Math.random() * documentHeight;
            }
            
            flocons.push(newFlake);
            if (i >= config.flakesMaxActive) newFlake.active = false;
        }
    }

    // Gérer le redimensionnement
    function handleResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        updateH1Elements();
    }

    // Gérer le mouvement de la souris
    function handleMouseMove(e) {
        if (!config.followMouse) return;
        const x = e.clientX;
        const mid = canvas.width / 2;
        windOffset = x < mid ? -1 + (x / mid) : (x - mid) / mid;
    }

    // Démarrer l'effet
    function start() {
        if (config.excludeMobile && isMobile) return;
        createCanvas();
        updateH1Elements();
        initFlocons();
        animer();
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', function() {
            // Recalculer les positions lors du défilement
            updateH1Elements();
        });
        if (config.followMouse) window.addEventListener('mousemove', handleMouseMove);
        if (config.freezeOnBlur) {
            window.addEventListener('blur', stop);
            window.addEventListener('focus', resume);
        }
    }

    // Arrêter l'effet
    function stop() {
        cancelAnimationFrame(animationFrameId);
    }

    // Reprendre l'effet
    function resume() {
        if (!animationFrameId) animer();
    }

    // Démarrage automatique
    if (config.autoStart) {
        window.addEventListener('load', start);
    }

    // Méthodes publiques
    return {
        start,
        stop,
        config
    };
})(window, document);
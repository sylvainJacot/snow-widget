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
            if (response.status === 403) {
                console.error('Abonnement inactif ou expiré. Veuillez renouveler votre abonnement.');
                return null; // Retourne null pour indiquer une erreur spécifique
            }
            console.error('Réponse API non valide :', response.status, response.statusText);
            throw new Error('Failed to fetch configuration');
        }

        const data = await response.json();
        console.log('Données API :', data);
        return data;
    }

    // Charger la configuration dynamiquement
    export async function loadConfig(defaultConfig) {
        const params = getUrlParams();
        let userConfig;

        if (params.preview === 'true' && params.config) {
            // Mode preview : configuration encodée dans l’URL
            userConfig = JSON.parse(decodeURIComponent(params.config));
        } else if (params.token) {
            // Mode live : récupération depuis Supabase
            try {
                userConfig = await fetchConfig(params.token);
                if (!userConfig) {
                    console.error('Impossible de charger la configuration : abonnement invalide.');
                    return defaultConfig; // Utilise la config par défaut
                }
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

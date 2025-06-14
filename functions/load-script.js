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
        `https://ijgyqpqtsauyluefxvvb.supabase.co/functions/v1/get-config?token=${token}`
    );

    if (!response.ok) {
        if (response.status === 403) {
            return null;
        }
        throw new Error('Failed to fetch configuration');
    }

    const data = await response.json();

    // Check if the domain is authorized
    const currentDomain = window.location.hostname;

    // Si allowedDomain est défini (même vide), vérifier l'autorisation du domaine
    if (data.hasOwnProperty('allowedDomain')) {
        // Autoriser localhost et 127.0.0.1 pour le dev
        if (currentDomain !== 'localhost' && currentDomain !== '127.0.0.1') {
            // Si allowedDomain est vide ou ne correspond pas au domaine actuel
            if (!data.allowedDomain || currentDomain !== data.allowedDomain) {
                throw new Error('Domain not authorized');
            }
        }
    }
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
                throw new Error('Configuration not found');
            }
        } catch (error) {
            throw error;
        }
    } else {
        throw new Error('No token or preview config provided');
    }

    // Fusionner avec la configuration par défaut
    return { ...defaultConfig, ...userConfig };
}

// Gestion du panneau de contrôle (simplifié avec flakeSize)
document.addEventListener("DOMContentLoaded", function () {
    const controls = {
        flakeSize: document.getElementById("flakeSize"),
        flakesMax: document.getElementById("flakesMax"),
        snowColor: document.getElementById("snowColor"),
        VitesseValue: document.getElementById("Vitesse"),
        snowStick: document.getElementById("snowStick"),
        followMouse: document.getElementById("followMouse"),
        useMeltEffect: document.getElementById("useMeltEffect"),
    };
    const displayValues = {
        flakeSize: document.getElementById("flakeSizeValue"),
        flakesMax: document.getElementById("flakesMaxValue"),
        VitesseValue: document.getElementById("VitesseValue"),
        snowStick: document.getElementById("snowStick"),
        followMouse: document.getElementById("followMouse"),
        useMeltEffect: document.getElementById("useMeltEffect"),
    };

    function updateConfig() {
        // Taille des flocons
        snowStorm.config.flakeWidth = parseInt(controls.flakeSize.value, 10);
        snowStorm.config.flakeHeight = parseInt(controls.flakeSize.value, 10);
        displayValues.flakeSize.textContent = controls.flakeSize.value;

        // Couleur
        snowStorm.config.snowColor = controls.snowColor.value;

        // Quantité max
        snowStorm.config.flakesMax = parseInt(controls.flakesMax.value, 10);
        displayValues.flakesMax.textContent = controls.flakesMax.value;

        // Vitesse max X
        snowStorm.config.vMaxX = parseInt(controls.VitesseValue.value, 10);
        displayValues.VitesseValue.textContent = controls.VitesseValue.value;

        // Vitesse max Y
        snowStorm.config.vMaxY = parseInt(controls.VitesseValue.value, 10);
        displayValues.VitesseValue.textContent = controls.VitesseValue.value;

        // Snow Stick
        snowStorm.config.snowStick = controls.snowStick.checked;
        displayValues.snowStick.textContent = controls.snowStick.checked

        // Follow Mouse
        snowStorm.config.followMouse = controls.followMouse.checked;
        displayValues.followMouse.textContent = controls.followMouse.checked

        // Fonte
        snowStorm.config.useMeltEffect = controls.useMeltEffect.checked;
        displayValues.useMeltEffect.textContent = controls.useMeltEffect.checked

        snowStorm.stop();
        snowStorm.start();
    }

    // Écouteurs pour chaque input
    Object.keys(controls).forEach((key) => {
        controls[key].addEventListener("input", updateConfig);
    });
    updateConfig();
});
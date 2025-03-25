document.addEventListener("DOMContentLoaded", function () {
    const controls = {
        flakeSize: document.getElementById("flakeSize"),
        // flakesMax: document.getElementById("flakesMax"),
        // snowColor: document.getElementById("snowColor"),
        // vMaxX: document.getElementById("vMaxX"),
        // vMaxY: document.getElementById("vMaxY"),
        // snowStick: document.getElementById("snowStick"),
        // useMeltEffect: document.getElementById("useMeltEffect"),
    };

    const displayValues = {
        flakeSize: document.getElementById("flakeSizeValue"),
        // flakesMax: document.getElementById("flakesMaxValue"),
        // vMaxX: document.getElementById("vMaxXValue"),
        // vMaxY: document.getElementById("vMaxYValue"),
    };

    function updateConfig() {
        // snowStorm.flakesMax = parseInt(controls.flakesMax.value, 10);
        // snowStorm.flakeWidth = snowStorm.flakeHeight = parseInt(controls.flakeSize.value, 10);
        // snowStorm.snowColor = controls.snowColor.value;
        // snowStorm.vMaxX = parseInt(controls.vMaxX.value, 10);
        // snowStorm.vMaxY = parseInt(controls.vMaxY.value, 10);
        // snowStorm.snowStick = controls.snowStick.checked;
        // snowStorm.useMeltEffect = controls.useMeltEffect.checked;

        // Met à jour les valeurs affichées
        displayValues.flakeSize.textContent = controls.flakeSize.value;
        // displayValues.flakesMax.textContent = controls.flakesMax.value;
        // displayValues.vMaxX.textContent = controls.vMaxX.value;
        // displayValues.vMaxY.textContent = controls.vMaxY.value;

        // Relancer la neige pour appliquer les changements
        snowStorm.stop();
        snowStorm.start();
    }

    // Écouteurs pour chaque input
    Object.keys(controls).forEach((key) => {
        controls[key].addEventListener("input", updateConfig);
    });

    // Initialisation avec les valeurs actuelles
    updateConfig();
});
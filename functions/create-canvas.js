export let canvas;
export let ctx;

export function createCanvas(config) {
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
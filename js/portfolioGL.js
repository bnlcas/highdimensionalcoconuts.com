var canvas = document.getElementById("glslCanvas");
var sandbox = new GlslCanvas(canvas);
canvas.style.width = '100%';
canvas.style.height = '100%';


sandbox.setUniform("u_tex", "Assets/Orange_Edges.jpg")

let scropDist = 0.0;
function Update()
{
    scropDist = window.pageYOffset;
    let brightness = 2.0 + Math.pow( Math.sin(scropDist / 100.0), 2);
    sandbox.setUniform("u_brightness", brightness)
    window.requestAnimationFrame(Update);
}
window.requestAnimationFrame(Update);
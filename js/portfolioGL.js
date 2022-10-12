var canvas = document.getElementById("glslCanvas");
var sandbox = new GlslCanvas(canvas);
canvas.style.width = '100%';
canvas.style.height = '100%';


sandbox.setUniform("u_tex", "Assets/Orange_Edges.jpg")

let scrollDist = 4.0;
let vertexDistortion = 4.0;
sandbox.setUniform("u_offset", vertexDistortion);

function Update()
{
    scrollDist = window.pageYOffset;
    let brightness = 2.0 + Math.pow( Math.sin(scrollDist / 100.0), 2);
    let vertexDistortion = 4 + Math.pow( scrollDist / 100, 1.2);
    sandbox.setUniform("u_brightness", brightness);
    sandbox.setUniform("u_intensity", vertexDistortion);

    sandbox.setUniform("u_offset", vertexDistortion);
    window.requestAnimationFrame(Update);
}
window.requestAnimationFrame(Update);
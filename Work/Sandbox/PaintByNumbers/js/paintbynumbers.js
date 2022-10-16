var canvas = document.getElementById("glslCanvas");
var sandbox = new GlslCanvas(canvas);
canvas.style.width = '100%';
canvas.style.height = '100%';

sandbox.setUniform("u_baseTex", "./images/base_image.jpg");
//sandbox.setUniform("u_tex", "360Photos/R0010105.JPG");

function Update()
{
    scrollDist = window.pageYOffset;
    let brightness = 2.0 + Math.pow( Math.sin(scrollDist / 100.0), 2);
    let vertexDistortion = 4 + Math.pow( scrollDist / 100, 1.2);
    sandbox.setUniform("u_resolution",3000,2000);
    canvas.style.width = '99.9%';

    window.requestAnimationFrame(Update);
}
window.requestAnimationFrame(Update);


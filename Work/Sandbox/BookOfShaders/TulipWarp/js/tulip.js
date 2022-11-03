var canvas = document.getElementById("glslCanvas");
var sandbox = new GlslCanvas(canvas);
canvas.style.width = '100%';
canvas.style.height = '100%';

sandbox.setUniform("u_baseTex", "./images/tulip.jpg");
//sandbox.setUniform("u_tex", "360Photos/R0010105.JPG");

function Update()
{
    scrollDist = window.pageYOffset;

    sandbox.setUniform("u_resolution",3000,2000);
    canvas.style.width = '99.9%';

    window.requestAnimationFrame(Update);
}


window.requestAnimationFrame(Update);


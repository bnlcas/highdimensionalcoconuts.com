var canvas = document.getElementById("glslCanvas");
var sandbox = new GlslCanvas(canvas);
canvas.style.width = '100%';
canvas.style.height = '100%';


//sandbox.setUniform("u_tex", "/corona_heights.jpg");
sandbox.setUniform("u_tex", "360Photos/R0010105.JPG");
sandbox.setUniform("u_resolution",3000,2000);


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


//sandbox.setUniform("u_intensity")
/*
let scrollDist = 0.25
sandbox.setUniform("u_intensity", scrollDist);

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

*/



/*function basicVertexShader() {
    return `
    varying vec2 vUv;
  
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1);
    }
        `
  }

  function AzimuthalProjectionVertexShader() {
    return `
  
    varying vec2 vUv;
    
    void main() {
        float rho = 0.9;
        float x = rho * (0.5 * (1.0 + sin(3.14*(uv.x + 0.4))));
        float y = rho * (cos(3.14 * (1.0-uv.y) * 0.5));
        vec2 uvDistorted = vec2(x,y);
        vUv = uvDistorted;
        

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1);
    }
        `
  }
  
  function fragmentUnlitShader() {
    return `
    uniform sampler2D colorTexture;
    varying vec2 vUv;
    void main() {
    
      vec4 tcolor = texture2D( colorTexture, vUv );
      
      gl_FragColor = tcolor;
    }
    `
  }

  function createMaterials(tex) {      
    const shader = new THREE.ShaderMaterial({
      uniforms: {
          colorTexture: { value: tex }
      },
      vertexShader: basicVertexShader(),
      //  vertexShader: AzimuthalProjectionVertexShader(),

      fragmentShader: fragmentUnlitShader()
    });
  
    return {
        shader
    }
  }

const Clamp = (x, min_val, max_val) => { return Math.max(Math.min(x, max_val), min_val); }
var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1,100);
var cameraDistance = 1;
camera.position.set(0, 0, cameraDistance);
camera.up = new THREE.Vector3(0,1,0);
camera.lookAt(new THREE.Vector3(0,0,0));

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//var geometry = new THREE.SphereGeometry(0.5, 128, 128);
//const geometry = new THREE.BoxGeometry(1, 1, 1);
//const geometry = new THREE.IcosahedronGeometry(0.5);
const geometry = new THREE.PlaneGeometry( 2, 2, 1024, 1024 )

const texture = new THREE.TextureLoader().load('./Test2.JPG');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set( 2, 2 );
texture.offset = new THREE.Vector2(0.5,0);
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;

var material = new THREE.MeshBasicMaterial( { map: texture } );
var orb = new THREE.Mesh(geometry, material);

var material = createMaterials(texture);
var orb = new THREE.Mesh(geometry, material.shader);
scene.add(orb);

//Lighting:
const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
directionalLight.position.set(-0.5,1,0);
scene.add(directionalLight);



//Controls

const xAmp = 0.01;
const yAmp = 0.006;
var engaged = false;
var xRotation0 = 0;
var yRotation0 = 0;
var initialX = 0;
var initialY = 0;

function StartTouch(e){
    engaged = true;
    xRotation0 = orb.rotation.x;
    yRotation0 = orb.rotation.y;
    initialX = e.clientX;
    initialY = e.clientY;
}

function DragRotation(e)
{
    if(engaged)
    {
      let y = yRotation0 + xAmp * (e.clientX - initialX);
      let x = Clamp(xRotation0 + yAmp * (e.clientY - initialY), -Math.PI*0.4, Math.PI*0.4);
      orb.rotation.set(x,y,0);
    }
}

document.addEventListener("mousedown", StartTouch);
document.addEventListener("touchdown", StartTouch);
document.addEventListener("mouseup",  () => {engaged = false;});
document.addEventListener("touchup",  () => {engaged = false;});
document.addEventListener("mousemove", DragRotation);
document.addEventListener("touchmove", DragRotation);


renderer.render(scene, camera);

function animate()
{
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
*/

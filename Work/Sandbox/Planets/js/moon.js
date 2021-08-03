var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(15, window.innerWidth/window.innerHeight, 0.1,100);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var orbital_radius = 25;
var orb_radius = 2.2;

var geometry = new THREE.SphereGeometry(orb_radius, 128, 128);
const moonTexture = new THREE.TextureLoader().load( './textures/2k_moon.jpg' );
var material = new THREE.MeshLambertMaterial();
material.map = moonTexture;
material.reflectivity = 0.1;

var orb = new THREE.Mesh(geometry, material);
orb.rotation.set(0.1*Math.PI,1.5*Math.PI,-0.1*Math.PI);
orb.up = new THREE.Vector3(0,1,0)
orb.lookAt(new THREE.Vector3(-0.6,0.1,0.1));
scene.add(orb);

//Lighting:
var sun_color = 0xfafae3;//0xf2f2c2;

var light_distance = 25;
var sun = new THREE.DirectionalLight(sun_color, 1.5);
sun.position.set(0 ,0,light_distance);
scene.add(sun);

function RotateLight(cycle_angle)
{
  sun.position.set(orbital_radius * Math.sin(cycle_angle),
  0.0,
  orbital_radius * Math.cos(cycle_angle));
}

var cycle_increment = 0.001;
var cycle_angle = 0.0;
RotateLight(cycle_angle);
camera.position.set(orbital_radius * Math.sin(cycle_angle),0.0, 
orbital_radius * Math.cos(cycle_angle));
camera.up = new THREE.Vector3(0,1,0);
camera.lookAt(new THREE.Vector3(0,0,0));

function animate()
{
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  cycle_angle += cycle_increment;
  RotateLight(cycle_angle);
}
animate();

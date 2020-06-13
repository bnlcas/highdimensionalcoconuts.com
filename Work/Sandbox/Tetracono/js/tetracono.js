//System Parameters:
//var time_scaling = 2 * Math.PI / 1000; // Munari Setting;
var time_scaling = 2 * Math.PI / 100; // Faster

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1,100);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var cone_radius = 0.0748;
var cone_height = 0.0749;
var cones = [];
for(var i = 0; i < 4; i ++)
{
  var geometry = new THREE.ConeGeometry(cone_radius, cone_height, 50, 10);
  var texture = new THREE.TextureLoader().load('../Textures/Tetracono.png');
  var material = new THREE.MeshLambertMaterial( { map: texture } );
  var cone = new THREE.Mesh( geometry, material );
  cones.push(cone);
  scene.add(cone);
}
cones[0].position.set(0, -cone_height/2, 0);
//cones[0].rotate.set()
cones[1].position.set(0, cone_height/2, 0);
cones[1].rotation.set(Math.PI,0,0);
cones[2].position.set(cone_height/2, 0, 0);
cones[2].rotation.set(0,0,Math.PI/2);
cones[3].position.set(-cone_height/2, 0, 0);
cones[3].rotation.set(0,0,3*Math.PI/2);

//Box:
var boxfaces = [];
var box_width = 0.08;// 0.076;
var box_thickness = 0.005;
for(var i = 0; i < 4; i ++)
{
  var geometry = new THREE.BoxGeometry(box_thickness,box_thickness + box_width*2, box_thickness + box_width*2);
  var material = new THREE.MeshLambertMaterial();
  var wall = new THREE.Mesh(geometry, material);
  scene.add(wall);
  boxfaces.push(wall);
}
boxfaces[0].position.set(-box_width, 0,0);
boxfaces[1].position.set(box_width,0,0);

boxfaces[2].position.set(0, box_width,0);
boxfaces[2].rotation.set(0,0,Math.PI/2);
boxfaces[3].position.set(0,-box_width,0);
boxfaces[3].rotation.set(0,0,-Math.PI/2);

//Lighting:
var light_color = [0xFFFFBC]
var light_distance = 5;
var light = new THREE.DirectionalLight(light_color, 0.2);
//scene.add(light);

light = new THREE.PointLight(light_color, 0.8, 100);
light.position.set(-0.04, 0.1,0.4);

scene.add(light);


var rotation_periods = [90, 60, 108, 72];
function RotateCones(delta_time)
{
  cones[0].rotateY(delta_time * time_scaling / rotation_periods[0]);
  cones[1].rotateY(delta_time * time_scaling / rotation_periods[1]);
  cones[2].rotateY(delta_time * time_scaling / rotation_periods[2]);
  cones[3].rotateY(delta_time * time_scaling / rotation_periods[3]);
}

camera.position.set(0,0,0.3);
camera.up = new THREE.Vector3(0,1,0);
camera.lookAt(new THREE.Vector3(0,0,0));


//Timing:
var startingTime;
var lastTime;
var totalElapsedTime;
var elapsedSinceLastLoop;

function animate(currentTime)
{
  if(currentTime)
  {
    //In Milliseconds
    if(!startingTime){startingTime=currentTime;}
    if(!lastTime){lastTime=currentTime;}
    totalElapsedTime=(currentTime-startingTime);
    elapsedSinceLastLoop=(currentTime-lastTime);
    lastTime=currentTime;
    RotateCones(elapsedSinceLastLoop);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();


//Configuration:
function UpdateRotationRate(scaling = 10)
{
  var default_rate = 2 * Math.PI / 1000;
  time_scaling = default_rate * scaling;
}

function UpdateTexture(texture_file)
{
  cones.forEach(
    cone => (cone.material.map = new THREE.TextureLoader().load(texture_file))
  );
}

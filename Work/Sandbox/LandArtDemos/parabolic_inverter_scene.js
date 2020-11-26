let scene, camera, renderer;
function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55,window.innerWidth/window.innerHeight,45,30000);
  camera.position.set(10,10,-100);
  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(window.innerWidth,window.innerHeight);
  document.body.appendChild(renderer.domElement);
  let controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', renderer);
  controls.minDistance = 120;
  controls.maxDistance = 1500;
  controls.maxPolarAngle = Math.PI/2;


  let materialArray = [];
  let texture_ft = new THREE.TextureLoader().load( 'Assets/yonder_ft.jpg');
  let texture_bk = new THREE.TextureLoader().load( 'Assets/yonder_bk.jpg');
  let texture_up = new THREE.TextureLoader().load( 'Assets/yonder_up.jpg');
  let texture_dn = new THREE.TextureLoader().load( 'Assets/black.jpg');
  let texture_rt = new THREE.TextureLoader().load( 'Assets/yonder_rt.jpg');
  let texture_lf = new THREE.TextureLoader().load( 'Assets/yonder_lf.jpg');

  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_ft }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_bk }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_up }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_dn }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_rt }));
  materialArray.push(new THREE.MeshBasicMaterial( { map: texture_lf }));

  for (let i = 0; i < 6; i++)
     materialArray[i].side = THREE.BackSide;
  let skyboxGeo = new THREE.BoxGeometry( 10000, 10000, 10000);
  let skybox = new THREE.Mesh( skyboxGeo, materialArray );
  skybox.position.set(0,0,0);
  scene.add( skybox );

  //Ground:
  var groundTexture = new THREE.TextureLoader().load( 'Assets/dry_lake_bed2.jpg' );
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set( 100, 100 );
  groundTexture.anisotropy = 16;
  groundTexture.encoding = THREE.sRGBEncoding;
  var groundMaterial = new THREE.MeshStandardMaterial( { map: groundTexture, transparent : false  } );
  var groundMesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 10000, 10000 ), groundMaterial );
	groundMesh.position.y = -26;
	groundMesh.rotation.x = - Math.PI / 2;
  groundMesh.receiveShadow = true;
  scene.add( groundMesh );

  const ambient_light = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient_light);

  const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8);
  directionalLight.position.set(0,-100, -100);
  directionalLight.target.position.set(0,0,-10);//ffff99
  scene.add( directionalLight );
  scene.add( directionalLight.target)
  // Paraboloids:
  const width = 50;
  const height = 16;
  const nPts = 40;
  var parabolid_points = [];
  for ( let i = 0; i < nPts; i ++ ) {
    var x = 2*(i/nPts)*width - width;
    var y = (height/Math.pow(width,2)) * (x - width) * (x + width);
	   parabolid_points.push( new THREE.Vector2( x,y));
   }
   for ( let i = nPts; i > 0; i -- ) {
     var x = 2*(i/nPts)*width - width;
     var y = -(height/Math.pow(width,2)) * (x - width) * (x + width);
     parabolid_points.push( new THREE.Vector2( x,y));
    }
   const geometry = new THREE.LatheGeometry( parabolid_points, 64 );
   const material = new THREE.MeshStandardMaterial(
     {
       color: 0x686868,
       roughness: 0.1,
       metalness: 0.8,
     } );
   const paraboloid_mesh = new THREE.Mesh( geometry, material );
   scene.add( paraboloid_mesh );

   //Pyramid:
   const pyramid_geometry = new THREE.ConeGeometry( 20 , 20, 4 );
   const pyramid_material = new THREE.MeshStandardMaterial(
     {
       color: 0xF5F5F5,
       roughness: 0.2,
       metalness: 0.8,
     } );
   const pyramid = new THREE.Mesh( pyramid_geometry, pyramid_material );
   scene.add( pyramid );
   pyramid.rotation.set(Math.PI, 0,0);
   pyramid.position.set(0,26,0);
  animate();
}
function animate() {
  renderer.render(scene,camera);
  requestAnimationFrame(animate);
}
init();

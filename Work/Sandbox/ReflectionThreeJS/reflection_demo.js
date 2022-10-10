let scene, camera, renderer, mirrorPyramid, mirrorCamera, cubeRenderTarget;


function init()
{
  var cameraFoV = 55;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(cameraFoV,window.innerWidth/window.innerHeight,45,30000);
  camera.position.set(10,10,-100);
  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(window.innerWidth,window.innerHeight);
  document.body.appendChild(renderer.domElement);
  let controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', renderer);
  controls.minDistance = 120;
  controls.maxDistance = 1500;
  controls.maxPolarAngle = 0.6 * Math.PI;

  //Sky Box & Light...
  let materialArray = [];
  
  let texture_ft = new THREE.TextureLoader().load( 'Assets/yonder_ft.jpg');
  let texture_bk = new THREE.TextureLoader().load( 'Assets/yonder_bk.jpg');
  let texture_up = new THREE.TextureLoader().load( 'Assets/yonder_up.jpg');
  let texture_dn = new THREE.TextureLoader().load( 'Assets/yonder_dn.jpg');
  let texture_rt = new THREE.TextureLoader().load( 'Assets/yonder_rt.jpg');
  let texture_lf = new THREE.TextureLoader().load( 'Assets/yonder_lf.jpg');
  /*
  //Citation : https://jaxry.github.io/panorama-to-cubemap/
  let texture_ft = new THREE.TextureLoader().load( 'Assets/px.jpg');
  let texture_bk = new THREE.TextureLoader().load( 'Assets/nx.jpg');
  let texture_up = new THREE.TextureLoader().load( 'Assets/py.jpg');
  let texture_dn = new THREE.TextureLoader().load( 'Assets/ny.jpg');
  let texture_rt = new THREE.TextureLoader().load( 'Assets/pz.jpg');
  let texture_lf = new THREE.TextureLoader().load( 'Assets/nz.jpg');
*/
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

  const ambient_light = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient_light);

  const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8);
  directionalLight.position.set(0,100, -100);
  directionalLight.target.position.set(0,0,-10);//ffff99
  scene.add( directionalLight );
  scene.add( directionalLight.target)


  //Reflective Pyramid:
  const pyramid_geometry = new THREE.ConeGeometry( 60 , 60, 4 );
  
  cubeRenderTarget = new THREE.WebGLRenderTargetCube( 512, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter } );

  mirrorCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget)
  scene.add( mirrorCamera );

	const mirrorCubeMaterial = new THREE.MeshBasicMaterial( { envMap: mirrorCamera.renderTarget } );

  mirrorPyramid = new THREE.Mesh( pyramid_geometry, mirrorCubeMaterial );
  scene.add( mirrorPyramid );
  mirrorPyramid.position.set(0,-20,0);
  mirrorCamera.position.set(0,200,0);

  const pyramid2 = new THREE.Mesh( pyramid_geometry );
  scene.add( pyramid2 );
  pyramid2.position.set(100,0,0);

  animate();
}

function animate()
{
  mirrorPyramid.visible = false;
	mirrorCamera.update( renderer, scene );
	mirrorPyramid.visible = true;

  renderer.render(scene,camera);


  requestAnimationFrame(animate);
}


init();

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ARButton } from 'https://unpkg.com/three@0.126.0/examples/jsm/webxr/ARButton.js';

let scene, camera, renderer, reticle;

init();
animate();

async function init() {
  // Criação da cena, câmera e renderer
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
  
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  
  // Configuração da realidade aumentada (AR)
  renderer.xr.enabled = true;
  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));
  
  // Adiciona iluminação à cena
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);
  
  // Inicializa a retícula (para indicação de hit-test)
  addReticleToScene();
  
  // Carrega o modelo 3D ao iniciar
  const modelName = 'Full_Car_F3.gltf';
  await loadModel(modelName);
  
  // Evento de redimensionamento da janela
  window.addEventListener('resize', onWindowResize);
}

function addReticleToScene() {
  const geometry = new THREE.RingBufferGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
  const material = new THREE.MeshBasicMaterial();
  
  reticle = new THREE.Mesh(geometry, material);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);
}

async function loadModel(url) {
  try {
    const loader = new GLTFLoader();
    const fullURL = `models/${url}`;
    const gltf = await loader.loadAsync(fullURL);

    const model = gltf.scene;
    scene.add(model);

    console.log('Modelo carregado com sucesso:', url);
  } catch (error) {
    console.error('Erro ao carregar modelo 3D:', error);
  }
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
  if (frame) {
    const session = renderer.xr.getSession();
    const hitTestSource = frame.hitTestSource;
    
    if (hitTestSource) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(session.inputSources[0].targetRaySpace);
        
        reticle.visible = true;
        reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
    
    renderer.render(scene, camera);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

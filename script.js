
      import { ARButton } from "https://unpkg.com/three@0.126.0/examples/jsm/webxr/ARButton.js";
      let container;
      let camera, scene, renderer;
      let reticle;
      let controller;
      init();
      animate();
      function init() {
        container = document.createElement("div");
        document.body.appendChild(container);
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(
          70,
          window.innerWidth / window.innerHeight,
          0.01,
          20
        );
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;
        container.appendChild(renderer.domElement);
        var light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        light.position.set(0.5, 1, 0.25);
        scene.add(light);
        controller = renderer.xr.getController(0);
        controller.addEventListener('select', onSelect);
        scene.add(controller);
        addReticleToScene();
        const button = ARButton.createButton(renderer, {
          requiredFeatures: ["hit-test"] // notice a new required feature
        });
        document.body.appendChild(button);
        renderer.domElement.style.display = "none";
        window.addEventListener("resize", onWindowResize, false);
      }
      function addReticleToScene() {
        const geometry = new THREE.RingBufferGeometry(0.15, 0.2, 32).rotateX(
          -Math.PI / 2
        );
        const material = new THREE.MeshBasicMaterial();
        reticle = new THREE.Mesh(geometry, material);
        reticle.matrixAutoUpdate = false;
        reticle.visible = false;
        scene.add(reticle);
      }
      //carregar um modelo GLTF/GLB
      async function loadModel(url) {
        return new Promise((resolve, reject) => {
          const loader = new THREE.GLTFLoader();
          loader.load(
            url,
            (gltf) => {
              resolve(gltf.scene); // Retorna apenas a cena do modelo carregado
            },
            undefined,
            (error) => {
              console.error('Erro ao carregar modelo 3D', error);
              reject(error);
            }
          );
        });
      }
      async function onSelect() {
        if (reticle.visible) {
          try {
            const model = await loadModel('models/Full_Car_F3.gltf'); // Carrega o modelo GLTF
            model.position.copy(reticle.position); // Define a posição do modelo na posição do retículo
      
            // Ajuste a escala do modelo conforme necessário
            model.scale.set(0.5, 0.5, 0.5);
      
            scene.add(model); // Adiciona o modelo à cena
          } catch (error) {
            console.error('Erro ao carregar modelo 3D', error);
          }
        }
      }
      function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
      function animate() {
        renderer.setAnimationLoop(render);
      }
      let hitTestSource = null;
      let localSpace = null;
      let hitTestSourceInitialized = false;
      async function initializeHitTestSource() {
        const session = renderer.xr.getSession(); // XRSession
        const viewerSpace = await session.requestReferenceSpace("viewer");
        hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
        localSpace = await session.requestReferenceSpace("local");
        hitTestSourceInitialized = true;
        session.addEventListener("end", () => {
          hitTestSourceInitialized = false;
          hitTestSource = null;
        });
      }
      function render(timestamp, frame) {
        if (frame) {
          if (!hitTestSourceInitialized) {
            initializeHitTestSource();
          }
          if (hitTestSourceInitialized) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
              const hit = hitTestResults[0];
              const pose = hit.getPose(localSpace);
              reticle.visible = true;
              reticle.matrix.fromArray(pose.transform.matrix);
            } else {
              reticle.visible = false;
            }
          }
          renderer.render(scene, camera);
        }
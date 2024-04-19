// In this example you should be able to place a cone on top of a surface (like a floor or table)
      // On your phone, you have to tap the screen to place a phone where the circle shows up
      // On the desktop emulator you have to "right-click" to simulate a tap
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
        // we will calculate the position and rotation of this reticle every frame manually
        // in the render() function so matrixAutoUpdate is set to false
        reticle.matrixAutoUpdate = false;
        reticle.visible = false; // we start with the reticle not visible
        scene.add(reticle);
        // optional axis helper you can add to an object
        // reticle.add(new THREE.AxesHelper(1));
      }
      //carregar um modelo GLTF/GLB
      async function loadModel(url) {
        return new Promise((resolve, reject) => {
          const loader = new THREE.GLTFLoader();
          const fullURL = 'models/' + url; // Caminho completo para o arquivo de modelo
          loader.load(
            fullURL,
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
      /*
      async function onSelect() {
        if (reticle.visible) {
          try {
            // Carrega o modelo GLTF/GLB. Substitua 'seu_modelo.glb' pelo caminho do seu modelo.
            const geometry = new THREE.CylinderBufferGeometry(0, 0.05, 0.2, 32);
            const model = await loadModel('seu_modelo.glb');
            // Posiciona o modelo na posição do reticle
            model.position.copy(reticle.position);
            // Adiciona o modelo à cena
            scene.add(model);
          } catch (error) {
            console.error('Erro ao adicionar modelo 3D', error);
          }
        }
      }
      */
      async function onSelect() {
  if (reticle.visible) {
    try {
      const modelName = 'Full_Car_F3.gltf'; // Nome do seu arquivo de modelo
      const model = await loadModel(modelName); // Carrega o modelo

      // Posiciona o modelo na posição do reticle
      model.position.copy(reticle.position);

      // Adiciona o modelo à cena
      scene.add(model);

      console.log('Modelo carregado e adicionado à cena com sucesso!');
    } catch (error) {
      console.error('Erro ao carregar e adicionar modelo à cena:', error);
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
      // read more about hit testing here:
      // https://github.com/immersive-web/hit-test/blob/master/hit-testing-explainer.md
      // https://web.dev/ar-hit-test/
      // hit testing provides the position and orientation of the intersection point, but nothing about the surfaces themselves.
      let hitTestSource = null;
      let localSpace = null;
      let hitTestSourceInitialized = false;
      // This function gets called just once to initialize a hitTestSource
      // The purpose of this function is to get a) a hit test source and b) a reference space
      async function initializeHitTestSource() {
        const session = renderer.xr.getSession(); // XRSession
        // Reference spaces express relationships between an origin and the world.
        // For hit testing, we use the "viewer" reference space,
        // which is based on the device's pose at the time of the hit test.
        const viewerSpace = await session.requestReferenceSpace("viewer");
        hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
        // We're going to use the reference space of "local" for drawing things.
        // which gives us stability in terms of the environment.
        // read more here: https://developer.mozilla.org/en-US/docs/Web/API/XRReferenceSpace
        localSpace = await session.requestReferenceSpace("local");
        // set this to true so we don't request another hit source for the rest of the session
        hitTestSourceInitialized = true;
        // In case we close the AR session by hitting the button "End AR"
        session.addEventListener("end", () => {
          hitTestSourceInitialized = false;
          hitTestSource = null;
        });
      }
      // the callback from 'setAnimationLoop' can also return a timestamp
      // and an XRFrame, which provides access to the information needed in
      // order to render a single frame of animation for an XRSession describing
      // a VR or AR sccene.
      function render(timestamp, frame) {
        if (frame) {
          // 1. create a hit test source once and keep it for all the frames
          // this gets called only once
          if (!hitTestSourceInitialized) {
            initializeHitTestSource();
          }
          // 2. get hit test results
          if (hitTestSourceInitialized) {
            // we get the hit test results for a particular frame
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            // XRHitTestResults The hit test may find multiple surfaces. The first one in the array is the one closest to the camera.
            if (hitTestResults.length > 0) {
              const hit = hitTestResults[0];
              // Get a pose from the hit test result. The pose represents the pose of a point on a surface.
              const pose = hit.getPose(localSpace);
              reticle.visible = true;
              // Transform/move the reticle image to the hit test position
              reticle.matrix.fromArray(pose.transform.matrix);
            } else {
              reticle.visible = false;
            }
          }
          renderer.render(scene, camera);
        }
      }
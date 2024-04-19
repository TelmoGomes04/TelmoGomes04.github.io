import * as BABYLON from 'babylonjs';
import '@babylonjs/loaders';
import { artoolkit } from 'jsartoolkit5';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);

    // Criar uma cena Babylon.js
    const scene = new BABYLON.Scene(engine);

    // Criar uma câmera para realidade aumentada
    const camera = new BABYLON.WebXRDefaultExperience(scene).baseExperience.camera;

    // Carregar um modelo 3D
    BABYLON.SceneLoader.ImportMesh('', 'path/to/your/3d/model/', 'model.gltf', scene, (meshes) => {
        // Posicionar o modelo em frente à câmera
        meshes.forEach(mesh => {
            mesh.position = new BABYLON.Vector3(0, 0, -1); // Ajuste a posição conforme necessário
        });
    });

    // Iniciar renderização da cena
    engine.runRenderLoop(() => {
        scene.render();
    });

    // Resposta ao redimensionamento da janela
    window.addEventListener('resize', () => {
        engine.resize();
    });
});
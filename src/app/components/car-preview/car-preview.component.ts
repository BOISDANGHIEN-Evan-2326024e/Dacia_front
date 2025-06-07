// src/app/car-preview/car-preview.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import * as THREE from 'three';
import { Group, Material, MeshStandardMaterial, BoxGeometry, CylinderGeometry, SphereGeometry, Mesh, PlaneGeometry, PointLight, Object3D, BufferGeometry, Float32BufferAttribute, PointsMaterial, Points, PerspectiveCamera, WebGLRenderer, Scene, AmbientLight, DirectionalLight, CanvasTexture, MeshBasicMaterial, Color } from 'three';

@Component({
  selector: 'app-car-preview',
  templateUrl: './car-preview.component.html',
  styleUrls: ['./car-preview.component.scss']
})
export class CarPreviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef;

  speed = 0;
  speedColor = new THREE.Color(1, 0, 0);

  // Références Three.js
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private carGroup!: Group;
  private trailMesh!: THREE.Mesh;
  private buildings: THREE.Object3D[] = [];
  private lampposts: THREE.Object3D[] = [];
  private roadMesh!: THREE.Mesh;
  private starField!: THREE.Points;

  private animationId: any;
  private speedIntervalId: any;

  constructor() {}

  ngOnInit(): void {
    this.startSpeedSimulation();
  }

  ngAfterViewInit(): void {
    // Vérifier que le conteneur a une taille avant d'initialiser
    if (this.canvasContainer.nativeElement.clientWidth > 0 &&
      this.canvasContainer.nativeElement.clientHeight > 0) {
      this.initThree();
      this.animateThree();
    } else {
      setTimeout(() => this.ngAfterViewInit(), 100);
    }
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationId);
    clearInterval(this.speedIntervalId);
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  /** Initialisation globale Three.js */
  private initThree(): void {
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scène
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 2. Caméra (position plus proche)
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 2, 5); // Position plus basse et plus proche
    this.camera.lookAt(0, 1, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true // Fond transparent
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limiter pour les écrans HD

    container.appendChild(this.renderer.domElement);

    // 4. Lumières (plus fortes)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);

    // 5. Créer les éléments dans l'ordre de profondeur
    this.createStarField();
    this.createRoad();
    this.createBuildingsAndLampPosts();
    this.createCarWithTrail();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  /** Boucle d'animation */
  private animateThree(): void {
    this.animationId = requestAnimationFrame(() => this.animateThree());
    this.updateSceneMovement();

    // Léger mouvement de la voiture
    this.carGroup.rotation.y = Math.sin(performance.now() * 0.001) * 0.02;

    this.renderer.render(this.scene, this.camera);
  }

  /** Ciel étoilé simplifié */
  private createStarField(): void {
    const starCount = 500; // Réduit pour performance
    const vertices: number[] = [];

    for (let i = 0; i < starCount; i++) {
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      vertices.push(x, y, z);
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      sizeAttenuation: true
    });

    this.starField = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.starField);
  }

  /** Route avec texture simplifiée */
  private createRoad(): void {
    const geometry = new THREE.PlaneGeometry(6, 500);
    const material = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.9,
      metalness: 0.1
    });

    this.roadMesh = new THREE.Mesh(geometry, material);
    this.roadMesh.rotation.x = -Math.PI / 2;
    this.roadMesh.position.y = 0.01; // Légèrement au-dessus du sol
    this.roadMesh.position.z = -50; // Position initiale plus proche
    this.scene.add(this.roadMesh);

    // Ajouter des lignes centrales
    this.addRoadMarkings();
  }

  private addRoadMarkings(): void {
    const markingGeometry = new THREE.BoxGeometry(0.5, 0.01, 2);
    const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let z = -250; z < 50; z += 10) {
      const marking = new THREE.Mesh(markingGeometry, markingMaterial);
      marking.position.set(0, 0.02, z);
      this.scene.add(marking);
    }
  }

  /** Immeubles et lampadaires optimisés */
  private createBuildingsAndLampPosts(): void {
    // Réduire le nombre d'objets
    for (let z = -200; z < 50; z += 40) {
      // Bâtiment gauche
      const buildingLeft = this.createSimpleBuilding();
      buildingLeft.position.set(-15, 0, z);
      this.scene.add(buildingLeft);
      this.buildings.push(buildingLeft);

      // Bâtiment droit
      const buildingRight = buildingLeft.clone();
      buildingRight.position.set(15, 0, z);
      this.scene.add(buildingRight);
      this.buildings.push(buildingRight);

      // Lampadaire gauche
      if (z % 80 === 0) {
        const lampLeft = this.createSimpleLampPost();
        lampLeft.position.set(-5, 0, z + 15);
        this.scene.add(lampLeft);
        this.lampposts.push(lampLeft);

        const lampRight = lampLeft.clone();
        lampRight.position.set(5, 0, z + 15);
        this.scene.add(lampRight);
        this.lampposts.push(lampRight);
      }
    }
  }

  private createSimpleBuilding(): THREE.Mesh {
    const width = 10 + Math.random() * 15;
    const height = 20 + Math.random() * 30;
    const depth = 10;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3a506b,
      roughness: 0.8
    });

    const building = new THREE.Mesh(geometry, material);
    building.position.y = height / 2;
    return building;
  }

  private createSimpleLampPost(): THREE.Object3D {
    const group = new THREE.Group();

    // Poteau
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 2.5;
    group.add(pole);

    // Lumière
    const light = new THREE.PointLight(0xffffcc, 1, 15);
    light.position.set(0, 5, 0);
    group.add(light);

    return group;
  }

  /** Voiture simplifiée pour une meilleure performance */
  private createCarWithTrail(): void {
    this.carGroup = new THREE.Group();
    this.carGroup.position.y = 1;

    // Carrosserie principale
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x004aad,
      metalness: 0.4,
      roughness: 0.5
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    this.carGroup.add(body);

    // Toit
    const roofGeometry = new THREE.BoxGeometry(1.8, 0.8, 2.5);
    const roof = new THREE.Mesh(roofGeometry, bodyMaterial);
    roof.position.set(0, 1.1, -0.3);
    this.carGroup.add(roof);

    // Roues
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    wheelGeometry.rotateZ(Math.PI/2);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });

    const wheelPositions = [
      { x: -1, y: 0.3, z: 1.2 },
      { x: 1, y: 0.3, z: 1.2 },
      { x: -1, y: 0.3, z: -1.5 },
      { x: 1, y: 0.3, z: -1.5 }
    ];

    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(pos.x, pos.y, pos.z);
      this.carGroup.add(wheel);
    });

    // Traînée
    const trailGeometry = new THREE.ConeGeometry(0.6, 2, 8);
    trailGeometry.translate(0, -1, 0);
    const trailMaterial = new THREE.MeshBasicMaterial({
      color: this.speedColor.getHex(),
      transparent: true,
      opacity: 0.7
    });

    this.trailMesh = new THREE.Mesh(trailGeometry, trailMaterial);
    this.trailMesh.position.set(0, 0.3, -2.2);
    this.trailMesh.rotation.x = Math.PI / 2;
    this.carGroup.add(this.trailMesh);

    this.scene.add(this.carGroup);
    this.carGroup.position.z = -2; // Position initiale de la voiture
  }

  /** Simulation de vitesse */
  private startSpeedSimulation(): void {
    this.speed = 40; // Valeur initiale

    this.speedIntervalId = setInterval(() => {
      this.speed = Math.floor(40 + Math.random() * 80);

      if (this.speed < 60) {
        this.speedColor.set(0, 1, 0); // Vert
      } else if (this.speed < 90) {
        this.speedColor.set(1, 0.647, 0); // Orange
      } else {
        this.speedColor.set(1, 0, 0); // Rouge
      }

      if (this.trailMesh) {
        (this.trailMesh.material as THREE.MeshBasicMaterial).color.set(this.speedColor);
      }
    }, 1000);
  }

  /** Animation du défilement */
  private updateSceneMovement(): void {
    const deltaZ = (this.speed / 80) * 0.3; // Vitesse réduite pour une meilleure visibilité

    // Route
    if (this.roadMesh) {
      this.roadMesh.position.z += deltaZ;
      if (this.roadMesh.position.z > 50) {
        this.roadMesh.position.z = -200;
      }
    }

    // Immeubles
    this.buildings.forEach(b => {
      b.position.z += deltaZ;
      if (b.position.z > 50) {
        b.position.z = -250;
      }
    });

    // Lampadaires
    this.lampposts.forEach(lmp => {
      lmp.position.z += deltaZ;
      if (lmp.position.z > 50) {
        lmp.position.z = -250;
      }
    });

    // Rotation lente du ciel étoilé
    if (this.starField) {
      this.starField.rotation.y += 0.0002;
    }
  }

  /** Redimensionnement */
  private onWindowResize(): void {
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

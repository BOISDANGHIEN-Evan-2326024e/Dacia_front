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
import {Group, Material} from 'three';

@Component({
  selector: 'app-car-preview',
  templateUrl: './car-preview.component.html',
  styleUrls: ['./car-preview.component.scss']
})
export class CarPreviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef;

  speed = 0; // affiché dans le template
  speedColor = new THREE.Color(1, 0, 0); // rouge par défaut

  // Références Three.js
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private carGroup!: Group;      // groupe contenant la voiture + traînée
  private trailMesh!: THREE.Mesh; // le “nuage” derrière la voiture
  private buildings: THREE.Mesh[] = []; // immeubles
  private lampposts: THREE.Group[] = []; // lampadaires
  private roadMesh!: THREE.Mesh;     // la route (plan texturé)
  private starField!: THREE.Points;  // ciel étoilé

  private animationId: any;
  private speedIntervalId: any;

  constructor() {}

  ngOnInit(): void {
    // Démarrer la simulation de la vitesse
    this.startSpeedSimulation();
  }

  ngAfterViewInit(): void {
    // Initialiser Three.js après que la vue soit prête
    this.initThree();
    this.animateThree();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationId);
    clearInterval(this.speedIntervalId);
    this.renderer.dispose();
  }

  /** 1) Initialisation globale Three.js */
  private initThree(): void {
    const width = this.canvasContainer.nativeElement.clientWidth;
    const height = this.canvasContainer.nativeElement.clientHeight;

    // 1.a) Scène et Fond noir (on y ajoute un ciel étoilé plus bas)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 1.b) Caméra
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 4, 8);
    this.camera.lookAt(0, 1, 0);

    // 1.c) Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Ajouter le canvas au DOM
    this.canvasContainer.nativeElement.appendChild(this.renderer.domElement);

    // 1.d) Lumières
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);

    // 1.e) Construire la scène : ciel étoilé, route, immeubles, lampadaires, voiture
    this.createStarField();
    this.createRoad();
    this.createBuildingsAndLampPosts();
    this.createCarWithTrail();

    // 1.f) Window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /** 2) Boucle d’animation Three.js */
  private animateThree(): void {
    this.animationId = requestAnimationFrame(() => this.animateThree());

    // Faire défiler la route, immeubles, lampadaires
    this.updateSceneMovement();

    // Optionnel : faire tourner légèrement la voiture sur son axe Y pour un effet “léger balancement”
    this.carGroup.rotation.y = Math.sin(performance.now() * 0.001) * 0.02;

    // Rendu
    this.renderer.render(this.scene, this.camera);
  }

  /** 3) Générer un ciel étoilé (nuage de points dans une sphère inversée) */
  private createStarField(): void {
    const starCount = 1000;
    const vertices: number[] = [];

    for (let i = 0; i < starCount; i++) {
      // Générer des points aléatoires dans une sphère de rayon 100
      const theta = THREE.MathUtils.randFloatSpread(360);
      const phi = THREE.MathUtils.randFloatSpread(360);
      const radius = 100;

      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(theta);

      vertices.push(x, y, z);
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      sizeAttenuation: true
    });

    this.starField = new THREE.Points(starGeometry, starMaterial);
    // On inverse la face (pour que la sphère soit vue de l’intérieur)
    if (this.starField.material instanceof Material) {
      this.starField.material.side = THREE.DoubleSide;
    }
    this.scene.add(this.starField);
  }

  /** 4) Créer la route “réaliste” au sol, avec un motif central */
  private createRoad(): void {
    // Générer une texture de route via Canvas pour avoir des bandes blanches
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Fond gris foncé
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lignes blanches au centre
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 20;
    ctx.setLineDash([100, 200]); // segment 100px, espace 200px
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    const roadTexture = new THREE.CanvasTexture(canvas);
    roadTexture.wrapS = THREE.RepeatWrapping;
    roadTexture.wrapT = THREE.RepeatWrapping;
    roadTexture.repeat.set(1, 50); // répète verticalement pour la longueur

    const geometry = new THREE.PlaneGeometry(6, 500, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      map: roadTexture,
      side: THREE.DoubleSide
    });

    this.roadMesh = new THREE.Mesh(geometry, material);
    this.roadMesh.rotation.x = -Math.PI / 2; // couché à plat
    this.roadMesh.position.y = 0;
    this.roadMesh.position.z = -200; // commence loin devant
    this.scene.add(this.roadMesh);
  }

  /** 5) Immeubles sur les côtés + lampadaires */
  private createBuildingsAndLampPosts(): void {
    // Matériaux pour les immeubles (façades + fenêtres éclairées)
    const façadeMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xffffcc }); // fenêtres légèrement jaunes

    // Géométrie de base pour chaque immeuble
    const buildingGeom = new THREE.BoxGeometry(4, 10, 4);

    for (let i = 0; i < 10; i++) {
      // Position Z variable pour créer du “profondeur”
      const zPos = -i * 50;

      // À gauche
      const bLeft = new THREE.Mesh(buildingGeom, façadeMat.clone());
      bLeft.position.set(-6, 5, zPos);
      // Ajouter des “fenêtres” sous forme de petits rectangles lumineux
      this.addWindowsToBuilding(bLeft, windowMat);
      this.scene.add(bLeft);
      this.buildings.push(bLeft);

      // À droite
      const bRight = new THREE.Mesh(buildingGeom, façadeMat.clone());
      bRight.position.set(6, 5, zPos);
      this.addWindowsToBuilding(bRight, windowMat);
      this.scene.add(bRight);
      this.buildings.push(bRight);

      // Lampadaire à gauche de la route
      const lampLeft = this.createLampPost();
      lampLeft.position.set(-3, 0, zPos + 10);
      this.scene.add(lampLeft);
      this.lampposts.push(lampLeft);

      // Lampadaire à droite de la route
      const lampRight = this.createLampPost();
      lampRight.position.set(3, 0, zPos + 10);
      this.scene.add(lampRight);
      this.lampposts.push(lampRight);
    }
  }

  /** 5.a) Ajouter des fenêtres éclairées au bâtiment */
  private addWindowsToBuilding(building: THREE.Mesh, windowMat: THREE.Material) {
    // On place quelques fenêtres : 2 colonnes × 3 lignes par façade
    const winGeom = new THREE.PlaneGeometry(1, 1);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const w = new THREE.Mesh(winGeom, windowMat);
        // Calcule la position relative sur la façade avant (axe Z négatif du bâtiment)
        w.position.set(
          (col === 0 ? -1 : 1),   // décalage en X pour deux colonnes
          5 - row * 3,            // 5 = mi-hauteur, on descend de 3 unités
          -2.01                    // légèrement devant la face
        );
        building.add(w);

        // Copie pour la façade arrière (Z positif)
        const w2 = w.clone();
        w2.position.set(w.position.x, w.position.y, +2.01);
        building.add(w2);
      }
    }
  }

  /** 5.b) Création d’un lampadaire (poteau + lumière) */
  private createLampPost(): THREE.Group {
    const lampGroup = new THREE.Group();

    // Poteau du lampadaire : cylindre gris foncé
    const poleGeom = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.y = 2.5; // la base à y = 0, donc le haut à y = 5
    lampGroup.add(pole);

    // Lanterne : petite sphère lumineuse
    const bulbGeom = new THREE.SphereGeometry(0.2, 12, 12);
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffe0, emissive: 0xffffe0, emissiveIntensity: 1 });
    const bulb = new THREE.Mesh(bulbGeom, bulbMat);
    bulb.position.set(0, 5.2, 0); // juste au sommet du poteau
    lampGroup.add(bulb);

    // Lumière ponctuelle sous la lanterne
    const pointLight = new THREE.PointLight(0xffffe0, 1, 10, 2);
    pointLight.position.set(0, 5.2, 0);
    lampGroup.add(pointLight);

    return lampGroup;
  }

  /** 6) Construire la voiture Dacia Sandero en géométries primitives */
  private createCarWithTrail(): void {
    this.carGroup = new THREE.Group();

    // 6.a) Carrosserie : base Box + extrusions pour ailes
    const bodyGeom = new THREE.BoxGeometry(2.5, 0.7, 5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x004aad, flatShading: true });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 1; // au-dessus du sol
    this.carGroup.add(body);

    // 6.b) Toit (un “chapeau” légèrement surélevé)
    const roofGeom = new THREE.BoxGeometry(1.8, 0.4, 2);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x00307a });
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(0, 1.5, -0.3);
    this.carGroup.add(roof);

    // 6.c) Vitres (transparentes)
    const windowGeom = new THREE.BoxGeometry(1.7, 0.3, 1.2);
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x89cff0,
      transparent: true,
      opacity: 0.5
    });
    const frontWindshield = new THREE.Mesh(windowGeom, windowMat);
    frontWindshield.rotation.x = Math.PI / 8;
    frontWindshield.position.set(0, 1.4, 1.2);
    this.carGroup.add(frontWindshield);

    const backWindow = new THREE.Mesh(windowGeom, windowMat);
    backWindow.rotation.x = -Math.PI / 8;
    backWindow.position.set(0, 1.4, -2.4);
    this.carGroup.add(backWindow);

    // 6.d) Roues : 4 cylindres noirs
    const wheelGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5 });
    const wheelPositions = [
      { x: -0.9, y: 0.5, z: 2 },
      { x:  0.9, y: 0.5, z: 2 },
      { x: -0.9, y: 0.5, z: -2 },
      { x:  0.9, y: 0.5, z: -2 }
    ];
    wheelPositions.forEach(pos => {
      const w = new THREE.Mesh(wheelGeom, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(pos.x, pos.y, pos.z);
      this.carGroup.add(w);
    });

    // 6.e) Traînée colorée (plan semi-transparent derrière la voiture)
    const trailGeom = new THREE.PlaneGeometry(0.3, 4);
    const trailMat = new THREE.MeshBasicMaterial({
      color: this.speedColor.getHex(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.trailMesh = new THREE.Mesh(trailGeom, trailMat);
    this.trailMesh.position.set(0, 1, 3.5);
    this.trailMesh.rotation.x = -Math.PI / 12;
    this.carGroup.add(this.trailMesh);

    // Positionner la voiture un peu au-dessus de la route
    this.carGroup.position.set(0, 0, 0);
    this.scene.add(this.carGroup);
  }

  /** 7) Simulation de la vitesse (aléatoire) et mise à jour de la traînée */
  private startSpeedSimulation(): void {
    this.speedIntervalId = setInterval(() => {
      this.speed = Math.floor(40 + Math.random() * 80);

      if (this.speed < 60) {
        this.speedColor.set(0, 1, 0);       // vert
      } else if (this.speed < 90) {
        this.speedColor.set(1, 0.647, 0);   // orange
      } else {
        this.speedColor.set(1, 0, 0);       // rouge
      }

      // Appliquer la couleur à la traînée
      (this.trailMesh.material as THREE.MeshBasicMaterial).color.set(this.speedColor);
    }, 1000);
  }

  /** 8) Mise à jour du défilement de la route, immeubles, lampadaires */
  private updateSceneMovement(): void {
    // La vitesse définit la distance parcourue en Z
    const deltaZ = (this.speed / 80) * 0.5;

    // Déplacer la route vers la caméra
    this.roadMesh.position.z += deltaZ;
    if (this.roadMesh.position.z > 50) {
      this.roadMesh.position.z = -250;
    }

    // Déplacer chaque immeuble ; s’il est trop proche, on le replace en arrière
    this.buildings.forEach(b => {
      b.position.z += deltaZ;
      if (b.position.z > 10) {
        b.position.z = -450; // on le remet loin
      }
    });

    // Déplacer chaque lampadaire
    this.lampposts.forEach(lmp => {
      lmp.position.z += deltaZ;
      if (lmp.position.z > 10) {
        lmp.position.z = -450;
      }
    });

    // Faire défiler le ciel étoilé lentement pour donner un léger effet de rotation
    this.starField.rotation.y += 0.0001;
  }

  /** 9) Gestion du resizing de la fenêtre */
  private onWindowResize(): void {
    const width = this.canvasContainer.nativeElement.clientWidth;
    const height = this.canvasContainer.nativeElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

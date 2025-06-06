// accueil.component.ts
import { Component } from '@angular/core';
import {NavbarComponent} from '../navbar/navbar.component';
import {HorlogePreviewComponent} from '../horloge-preview/horloge-preview.component';
import {CartePreviewComponent} from '../carte-preview/carte-preview.component';
import {SpotifyPreviewComponent} from '../spotify-preview/spotify-preview.component';
import {CarPreviewComponent} from '../car-preview/car-preview.component';

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  standalone: true,
  imports: [
    NavbarComponent,
    HorlogePreviewComponent,
    CartePreviewComponent,
    SpotifyPreviewComponent,
    CarPreviewComponent
  ],
  styleUrls: ['./accueil.component.scss']
})
export class AccueilComponent {

    constructor() {
        // Initialization logic can go here if needed
    }
}

import { Component } from '@angular/core';
import {NavbarComponent} from '../../navbar/navbar.component';

@Component({
  selector: 'app-spotify-accueil',
  templateUrl: './spotify-accueil.component.html',
  styleUrls: ['./spotify-accueil.component.scss'],
  imports: [
    NavbarComponent,
  ],
  standalone: true
})
export class SpotifyAccueilComponent {}

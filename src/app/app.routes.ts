import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SpotifyAccueilComponent } from './components/Spotify/spotify-accueil/spotify-accueil.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'accueil', loadComponent: () => import('./components/Accueil/accueil.component').then(m => m.AccueilComponent) },
  { path: 'spotify', component: SpotifyAccueilComponent },
  { path: '**', redirectTo: 'login' }
];

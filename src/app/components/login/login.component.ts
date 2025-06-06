// src/app/components/login/login.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import {FormsModule} from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule
  ],
  standalone: true,
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = '';
  password = '';
  message = '';



  constructor(private auth: AuthService, private router : Router) {}

  onSubmit() {
    this.auth.login(this.email, this.password).subscribe({
      next: (user) => {
        this.message = 'Connexion réussie : ' + JSON.stringify(user);
        this.router.navigate(['/accueil']).then(r => {
          // Optionally, you can add any additional logic after navigation
          console.log('Navigation to accueil successful');
        }).catch(error => {
          console.error('Navigation error:', error);
          this.message = 'Erreur lors de la navigation vers l\'accueil';
        });
      },
      error: () => {
        this.message = 'Identifiants invalides';
      }
    });
  }
}

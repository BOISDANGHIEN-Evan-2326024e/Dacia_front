// src/app/components/login/login.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule
  ],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = '';
  password = '';
  message = '';

  constructor(private auth: AuthService) {}

  onSubmit() {
    this.auth.login(this.email, this.password).subscribe({
      next: (user) => {
        this.message = 'Connexion réussie : ' + JSON.stringify(user);
      },
      error: () => {
        this.message = 'Identifiants invalides';
      }
    });
  }
}

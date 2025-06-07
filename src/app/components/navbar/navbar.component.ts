// src/app/navbar/navbar.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  activeIcon: string = 'home';

  constructor(private router : Router) {
  }

  setActive(icon: string): void {
    this.activeIcon = icon;
    if (icon === 'music') {
      this.router.navigate(['/spotify']);
    } else if (icon === 'home') {
      this.router.navigate(['/']);
    }
  }

  isActive(icon: string): boolean {
    return this.activeIcon === icon;
  }
}

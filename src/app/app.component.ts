import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,                  // important
  imports: [RouterOutlet],           // déclarer le router outlet ici
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {}

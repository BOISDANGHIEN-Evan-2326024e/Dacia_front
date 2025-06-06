import { Component } from '@angular/core';

@Component({
  selector: 'app-horloge-preview',
  templateUrl: './horloge-preview.component.html',
  standalone: true,
  styleUrls: ['./horloge-preview.component.scss']
})
export class HorlogePreviewComponent {
  time: string = new Date().toLocaleTimeString();

  constructor() {
    setInterval(() => {
      this.time = new Date().toLocaleTimeString();
    }, 1000);
  }
}

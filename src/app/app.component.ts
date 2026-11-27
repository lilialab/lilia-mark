import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppToastHost } from '@/app/shared/ui/app-toast-host';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppToastHost],
  template: `
    <router-outlet />
    <app-toast-host />
  `,
})
export class AppComponent {}

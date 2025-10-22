import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterModule],
	template: `
    <div>
      <router-outlet />
    </div>
  `
})
export class AppComponent {
}

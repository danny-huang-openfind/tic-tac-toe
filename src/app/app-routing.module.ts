import { Injectable, NgModule } from '@angular/core';
import {
  TitleStrategy,
  RouterModule,
  RouterStateSnapshot,
  Route,
} from '@angular/router';
import { Title } from '@angular/platform-browser';

import { HomeComponent } from './views/home';

const routes: Route[] = [
  { path: '', title: '井字遊戲', component: HomeComponent },
];

@Injectable({ providedIn: 'root' })
export class TemplatePageTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot) {
    const title = this.buildTitle(routerState);
    if (title !== undefined) {
      this.title.setTitle(title);
    }
  }
}

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [{ provide: TitleStrategy, useClass: TemplatePageTitleStrategy }],
})
export class AppRoutingModule {}

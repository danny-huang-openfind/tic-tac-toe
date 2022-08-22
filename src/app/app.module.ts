import { NgModule } from '@angular/core';
import { BrowserModule, Meta } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './views/home/home.component';
import { ActionBarComponent } from './components/action-bar';
import { GamepadComponent } from './components/gamepad';
import { InformationsComponent } from './components/informations';
import { TestComponent } from './test/test.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ActionBarComponent,
    GamepadComponent,
    InformationsComponent,
    TestComponent,
  ],
  imports: [BrowserModule, AppRoutingModule],
  providers: [Meta],
  bootstrap: [AppComponent],
})
export class AppModule {}

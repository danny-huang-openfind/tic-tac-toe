import { NgModule } from '@angular/core';
import { BrowserModule, Meta } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './views/home/home.component';
import { ActionBarComponent } from './components/action-bar';
import { GamepadComponent } from './components/gamepad';
import { InformationsComponent } from './components/informations';
import { TestComponent } from './test/test.component';
import { SecondPipe } from './pipes/second/second.pipe';

const components = [
  AppComponent,
  HomeComponent,
  ActionBarComponent,
  GamepadComponent,
  InformationsComponent,
  TestComponent,
];

const pipes = [SecondPipe];

@NgModule({
  declarations: [...components, ...pipes],
  imports: [BrowserModule, AppRoutingModule],
  providers: [Meta],
  bootstrap: [AppComponent],
})
export class AppModule {}

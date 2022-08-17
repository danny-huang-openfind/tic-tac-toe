import { Component, OnInit } from '@angular/core';

import { STATE, StateService } from '@services/state';

@Component({
  selector: 'ttt-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  constructor(private stateService: StateService) {}

  ngOnInit(): void {}

  onStateChange($event: { state: STATE }) {
    this.stateService.setState($event.state);
  }
}

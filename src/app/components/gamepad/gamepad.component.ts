import * as _ from 'lodash';
import { Component, OnInit, Output, ViewChild } from '@angular/core';
import { Observable, from, Subject } from 'rxjs';
import { map, filter, switchMap } from 'rxjs/operators';

import { StateService } from '@services/state';

@Component({
  selector: 'ttt-gamepad',
  templateUrl: './gamepad.component.html',
  styleUrls: ['./gamepad.component.css'],
})
export class GamepadComponent implements OnInit {
  public BOARD_SIZE = 3;
  public storage = _.times<number>(this.BOARD_SIZE ** 2, _.constant(0));
  private LINE_LENGTH = 3;
  private processor$: Subject<{
    index: number;
    player: number;
  }> = new Subject();

  /* Render works will be done by css */
  // private renderer$: Observable<T>

  constructor(private stateService: StateService) {}

  ngOnInit(): void {
    this.stateService
      .getState()
      .pipe(filter((state) => _.eq('READY', state)))
      .subscribe(() => {
        this.storage = _.times<number>(this.BOARD_SIZE ** 2, _.constant(0));
      });

    this.processor$
      .pipe(filter(({ index, player }) => !_.eq(this.storage[index], player)))
      .subscribe(({ index, player }) => {
        this.storage[index] = player;
      });
  }

  onGamepadClick($event: Event, index: number) {
    console.log(index);
  }
}

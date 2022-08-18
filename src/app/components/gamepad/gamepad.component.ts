import * as _ from 'lodash';
import { Component, OnInit, Output, ViewChild } from '@angular/core';
import { Observable, from, Subject } from 'rxjs';
import { map, filter, switchMap, tap } from 'rxjs/operators';

import { StateService } from '@services/state';

import { Direction } from './gamepad.type';

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
      .pipe(filter(({ state }) => _.eq('READY', state)))
      .subscribe(() => {
        this.storage = _.times<number>(this.BOARD_SIZE ** 2, _.constant(0));
      });

    this.processor$
      .pipe(filter(({ index, player }) => !_.eq(this.storage[index], player)))
      .subscribe(({ index, player }) => {
        this.storage[index] = player;
      });
  }

  onGamepadClick($event: Event) {
    const target = $event.target as HTMLElement;
    if (!_.includes(target.classList, 'box')) {
      return;
    }

    const box = target.closest('div');
    const index = _.indexOf(target.parentElement?.children, box);
    const player = this.stateService.getPlayer().value.player;

    this.setPiece(index, player);
    const { finished, winner } = this.checkResult(index, player);
    finished ? alert('勝利！') : this.switchPlayer(player);
  }

  private setPiece(index: number, player: number) {
    this.storage[index] = player;
  }

  private switchPlayer(now: number) {
    const nextPlayer = 3 - now;
    this.stateService.setPlayer(nextPlayer);
  }

  private checkResult(index: number, player: number) {
    const directions: Direction[] = [
      [0, 1],
      [1, 1],
      [1, 0],
      [1, -1],
    ];
    const full = _.every(this.storage, (piece) => !!piece);

    let result = null;
    _.each(directions, (direction) => {
      result = this.trace(index, direction);

      return !result;
    });

    return {
      finished: !!(result || full),
      winner: result ? player : undefined,
    };
  }

  private trace(
    index: number,
    direction: Direction,
    count: number = 0
  ): boolean {
    const player = this.stateService.getPlayer().value.player;

    if (this.checkLine(index, direction, player)) {
      return true;
    }
    const position: [number, number] = [
      Math.trunc(index / this.BOARD_SIZE),
      index % this.BOARD_SIZE,
    ];

    let next_position = _.map(
      position,
      (element, index) => element + (count <= 0 ? -1 : 1) * direction[index]!
    ) as [number, number];

    let next_index = next_position[0] * this.BOARD_SIZE + next_position[1];

    if (
      _.some(next_position, (coord) => _.includes([-1, this.BOARD_SIZE], coord))
    ) {
      if (_.eq(count, 0)) {
        next_position = _.map(
          position,
          (element, index) => element + direction[index]!
        ) as [number, number];
        next_index = next_position[0] * this.BOARD_SIZE + next_position[1];
        return this.trace(next_index, direction, ++count);
      } else if (Math.abs(count) >= this.BOARD_SIZE - 1) {
        return false;
      } else {
        next_position = _.map(
          position,
          (element, index) => element + (-count + 1) * direction[index]!
        ) as [number, number];
        next_index = next_position[0] * this.BOARD_SIZE + next_position[1];
        return this.trace(next_index, direction, -count + 1);
      }
    } else {
      return this.trace(next_index, direction, count <= 0 ? --count : ++count);
    }
  }

  private checkLine(index: number, direction: Direction, player: number) {
    let count = 0;
    while (_.inRange(count, this.LINE_LENGTH)) {
      if (!_.isEqual(this.storage[index], player)) {
        return false;
      }
      ++count;
      index += direction[0] * this.BOARD_SIZE + direction[1];
    }
    return true;
  }
}

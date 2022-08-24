import {
  Component,
  EventEmitter,
  AfterViewInit,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostBinding,
} from '@angular/core';
import * as _ from 'lodash-es';

import { StateService } from '@services/state';

import { Direction } from '@type/direction.type';
import { State } from '@type/state.type';

type Result =
  | { finished: true; winner: number | undefined }
  | { finished: false; winner: undefined };

@Component({
  selector: 'ttt-gamepad',
  templateUrl: './gamepad.component.html',
  styleUrls: ['./gamepad.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamepadComponent implements AfterViewInit {
  @Output() stateChange = new EventEmitter<{
    state: State;
    data?: { player: number };
  }>();

  @HostBinding('attr.data-state') private _state: string | null = null;
  private readonly BOARD_SIZE = 3;
  private readonly LINE_LENGTH = 3;
  public storage = _.fill<number>(Array(this.BOARD_SIZE ** 2), 0);

  /* Storage data change don't have to be reactive */
  // private processor$: Subject<T>

  /* Render works will be done by css */
  // private renderer$: Observable<T>

  constructor(
    private stateService: StateService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.stateService.getState().subscribe(({ state }) => {
      this._state = state;
      if (_.eq('READY', state)) {
        this.storage = _.fill<number>(Array(this.BOARD_SIZE ** 2), 0);
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  onGamepadBoxClick($event: Event) {
    const target = ($event.target as HTMLElement)!;
    if (!_.includes(target.classList, 'box')) {
      return;
    }

    const index = _.toNumber(target.dataset['index']);
    const player = this.stateService.getCurrentPlayer().value.player;

    this.setPiece(index, player);
    const { finished, winner } = this.checkResult(index, player);
    finished ? this.declareWinner(winner!) : this.switchPlayer(player);
  }

  private setPiece(index: number, player: number) {
    this.storage[index] = player;
  }

  private switchPlayer(now: number) {
    const nextPlayer = 3 - now;
    this.stateService.setCurrentPlayer(nextPlayer);
  }

  private checkResult(index: number, player: number): Result {
    const directions: Direction[] = [
      [0, 1],
      [1, 1],
      [1, 0],
      [1, -1],
    ];
    const full = _.every(this.storage);

    let result = null;
    _.each(directions, (direction) => {
      result = this.trace(index, direction);

      return !result;
    });

    if (result || full) {
      return {
        finished: true,
        winner: result ? player : undefined,
      };
    } else {
      return {
        finished: false,
        winner: undefined,
      };
    }
  }

  private trace(
    index: number,
    direction: Direction,
    count: number = 0
  ): boolean {
    const player = this.stateService.getCurrentPlayer().value.player;

    const position: [number, number] = [
      Math.trunc(index / this.BOARD_SIZE),
      index % this.BOARD_SIZE,
    ];

    console.log(position);

    if (this.checkLine(position, direction, player)) {
      return true;
    }

    let next_position = _.map(
      position,
      (element, index) => element + (count <= 0 ? -1 : 1) * direction[index]!
    ) as [number, number];

    let next_index = next_position[0] * this.BOARD_SIZE + next_position[1];

    if (Math.abs(count) >= this.BOARD_SIZE - 1) {
      return false;
    }

    if (
      _.every(
        next_position,
        (coord) => !_.includes([-1, this.BOARD_SIZE], coord)
      )
    ) {
      return this.trace(
        next_index,
        direction,
        count <= 0 ? count - 1 : count + 1
      );
    }

    next_position = _.map(
      position,
      (element, index) => element + (-count + 1) * direction[index]
    ) as [number, number];
    next_index = next_position[0] * this.BOARD_SIZE + next_position[1];
    return this.trace(next_index, direction, -count + 1);
  }

  private checkLine(
    position: [number, number],
    direction: Direction,
    player: number
  ) {
    let count = 0;
    let index = position[0] * this.BOARD_SIZE + position[1];
    while (_.inRange(count, this.LINE_LENGTH)) {
      if (_.some(position, (coord) => !_.inRange(coord, 0, this.BOARD_SIZE))) {
        return false;
      }
      if (!_.isEqual(this.storage[index], player)) {
        return false;
      }
      ++count;
      position = _.map(
        position,
        (element, index) => element! + direction[index]!
      ) as [number, number];
      index = position[0] * this.BOARD_SIZE + position[1];
    }
    return true;
  }

  private declareWinner(player: number) {
    this.stateChange.emit({ state: 'FINISHED', data: { player } });
  }
}

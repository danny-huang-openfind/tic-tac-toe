import * as _ from 'lodash-es';
import {
  Component,
  ElementRef,
  EventEmitter,
  AfterViewInit,
  Output,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostBinding,
} from '@angular/core';
import { StateService } from '@services/state';

import { Direction } from '@type/direction.type';
import { STATE } from '@type/state.type';

@Component({
  selector: 'ttt-gamepad',
  templateUrl: './gamepad.component.html',
  styleUrls: ['./gamepad.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamepadComponent implements AfterViewInit {
  @HostBinding('attr.data-state') get state() {
    return this._state;
  }
  @Output() stateChange = new EventEmitter<{
    state: STATE;
    data?: { player: number };
  }>();
  @ViewChild('self') self!: ElementRef;

  public BOARD_SIZE = 3;
  public storage = _.times<number>(this.BOARD_SIZE ** 2, _.constant(0));
  private LINE_LENGTH = 3;
  private _state: string | null = null;

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
        this.storage = _.times<number>(this.BOARD_SIZE ** 2, _.constant(0));
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  onGamepadBoxClick($event: Event) {
    const target = ($event.target as HTMLElement)!;
    if (!_.includes(target.classList, 'box')) {
      return;
    }

    const box = target.closest('div');
    const index = _.indexOf(target.parentElement?.children, box);
    const player = this.stateService.getPlayer().value.player;

    this.setPiece(index, player);
    const { finished, winner } = this.checkResult(index, player);
    finished ? this.declareWinner(winner!) : this.switchPlayer(player);
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

    const position: [number, number] = [
      Math.trunc(index / this.BOARD_SIZE),
      index % this.BOARD_SIZE,
    ];

    if (this.checkLine(position, direction, player)) {
      return true;
    }

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

  private checkLine(
    position: [number, number],
    direction: Direction,
    player: number
  ) {
    let count = 0;
    let index = position[0] * this.BOARD_SIZE + position[1];
    while (_.inRange(count, this.LINE_LENGTH)) {
      if (
        _.some(position, (coord) => coord <= -1 || coord >= this.BOARD_SIZE)
      ) {
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

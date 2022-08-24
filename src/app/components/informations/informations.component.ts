import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { animationFrames, Subject } from 'rxjs';
import {
  filter,
  pairwise,
  takeUntil,
  concatMap,
  map,
  tap,
} from 'rxjs/operators';
import * as _ from 'lodash-es';

import { StateService } from '@services/state';
import { State } from '@type/state.type';

@Component({
  selector: 'ttt-informations',
  templateUrl: './informations.component.html',
  styleUrls: ['./informations.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InformationsComponent implements OnInit {
  @Output() stateChange = new EventEmitter<{
    state: State;
    data?: { player: number };
  }>();

  players: string[] = [];
  current_player: string = '';
  timer: number[] = [];
  private readonly MILLI_PER_SECOND: number = 1000;
  private readonly MAX_TIME = 60 * this.MILLI_PER_SECOND;

  private destroyer$: Subject<void> = new Subject();
  private processor$ = animationFrames().pipe(
    filter(() => _.eq(this.stateService.getState().value.state, 'PLAYING')),
    pairwise(),
    map((pair) => pair[1].timestamp - pair[0].timestamp),
    takeUntil(this.destroyer$)
  );
  constructor(
    private stateService: StateService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.players = _.map([1, 2], (index) =>
      this.stateService.getPlayerView(index)
    );

    this.timer = new Array(3);
    _.fill(this.timer, this.MAX_TIME);

    this.stateService
      .getState()
      .pipe(
        filter(({ state }) => _.includes(['READY', 'PLAYING'], state)),
        tap(({ state }) => {
          if (state == 'READY') {
            this.destroyer$.next();
            _.fill(this.timer, this.MAX_TIME);
          }
        }),
        concatMap(() => this.processor$)
      )
      .subscribe((elapsed) => {
        this.timerUpdateAndCheck(elapsed);
        this.changeDetectorRef.markForCheck();
      });

    this.stateService.getCurrentPlayer().subscribe(({ player }) => {
      this.current_player = this.stateService.getPlayerView(player);
    });
  }

  private timerUpdateAndCheck(elapsed: number) {
    const currentPlayerIndex =
      this.stateService.getCurrentPlayer().value.player;
    this.setTimer(currentPlayerIndex, this.timer[currentPlayerIndex] - elapsed);
    if (this.timer[currentPlayerIndex] == 0) {
      const opponentIndex = 3 - currentPlayerIndex;
      this.stateChange.emit({
        state: 'FINISHED',
        data: { player: opponentIndex },
      });
    }
  }
  private setTimer(player: number, time: number) {
    const valid_time = Math.max(time, 0);
    this.timer[player] = valid_time;
  }
}

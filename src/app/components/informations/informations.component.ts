import * as _ from 'lodash-es';
import { animationFrames, Subject } from 'rxjs';
import { filter, pairwise, takeUntil, map } from 'rxjs/operators';
import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';

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
  MILLI_PER_SECOND: number = 1000;
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

    this.timer = _.fill(Array(3), this.MAX_TIME);

    this.stateService
      .getState()
      .pipe(filter(({ state }) => _.includes(['READY', 'PLAYING'], state)))
      .subscribe(({ state }) => {
        switch (state) {
          case 'READY':
            this.destroyer$.next();
            this.timer = _.fill(this.timer, this.MAX_TIME);
            break;
          case 'PLAYING':
            this.processor$.subscribe((elapsed) => {
              this.timerUpdateAndCheck(elapsed);
              this.changeDetectorRef.markForCheck();
              // console.log(elapsed);
            });
            break;
        }
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
      const opponentIndex = !!currentPlayerIndex ? 0 : 1;
      this.stateChange.emit({
        state: 'FINISHED',
        data: { player: opponentIndex + 1 },
      });
    }
  }
  private setTimer(player: number, time: number) {
    const valid_time = Math.max(time, 0);
    this.timer[player] = valid_time;
  }
}

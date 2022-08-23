import * as _ from 'lodash-es';
import { animationFrames, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';

import { StateService } from '@services/state';
import { STATE } from '@type/state.type';

@Component({
  selector: 'ttt-informations',
  templateUrl: './informations.component.html',
  styleUrls: ['./informations.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InformationsComponent implements OnInit {
  @Output() stateChange = new EventEmitter<{
    state: STATE;
    data?: { player: number };
  }>();

  players: string[] = [];
  current_player: string = '';
  timer: number[] = [];
  MILLI_PER_SECOND: number = 1000;
  private readonly MAX_TIME = 60 * this.MILLI_PER_SECOND;
  private ticker: number | null = null;

  private destroyer$: Subject<null> = new Subject();
  private processor$ = animationFrames().pipe(
    filter(() => _.eq(this.stateService.getState().value.state, 'PLAYING')),
    takeUntil(this.destroyer$)
  );
  constructor(
    private stateService: StateService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    _.forEach([1, 2], (index) => {
      this.players.push(this.stateService.getPlayerView(index));
      this.timer.push(this.MAX_TIME);
    });

    this.stateService
      .getState()
      .pipe(filter(({ state }) => _.includes(['READY', 'PLAYING'], state)))
      .subscribe(({ state }) => {
        switch (state) {
          case 'READY':
            this.destroyer$.next(null);
            this.timer = _.map(this.timer, () => this.MAX_TIME);
            this.ticker = null;
            break;
          case 'PLAYING':
            this.processor$.subscribe((now) => {
              this.timerUpdateAndCheck(now.timestamp);
              this.changeDetectorRef.markForCheck();
            });
            break;
        }
      });

    this.stateService.getPlayer().subscribe(({ player }) => {
      this.current_player = this.stateService.getPlayerView(player);
    });
  }

  private timerUpdateAndCheck(now: number) {
    const currentPlayerIndex = this.stateService.getPlayer().value.player - 1;
    if (this.ticker) {
      this.setTimer(
        currentPlayerIndex,
        this.timer[currentPlayerIndex] - (now - this.ticker)
      );
    }
    if (this.timer[currentPlayerIndex] == 0) {
      const opponentIndex = !!currentPlayerIndex ? 0 : 1;
      this.stateChange.emit({
        state: 'FINISHED',
        data: { player: opponentIndex + 1 },
      });
    }
    this.ticker = now;
  }
  private setTimer(player: number, time: number) {
    const valid_time = _.max([time, 0]);
    this.timer[player] = valid_time!;
  }
}

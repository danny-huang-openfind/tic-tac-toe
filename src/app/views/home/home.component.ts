import {
  Component,
  OnInit,
  ApplicationRef,
  ChangeDetectionStrategy,
} from '@angular/core';

import { StateService } from '@services/state';
import { State } from '@type/state.type';
import * as _ from 'lodash-es';

@Component({
  selector: 'ttt-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  constructor(
    private stateService: StateService,
    private app: ApplicationRef
  ) {}

  ngOnInit(): void {
    const PLAYERS = { none: '', A: 'circle', B: 'cross' };
    const PLAYERS_VIEW = ['', 'Ｏ', 'Ｘ'];
    const root = this.app.components[0].location.nativeElement;
    _.forOwn(PLAYERS, (value, key) => {
      root.style.setProperty(
        `--player-${key}`,
        _.isEqual(key, 'none') ? `"${value}"` : `var(--svg-${value})`
      );
    });
    _.each(PLAYERS_VIEW, (view, index) => {
      this.stateService.setPlayerView(index, view);
    });

    this.stateService.getCurrentPlayer().subscribe(({ player }) => {
      if (!!player) {
        root.style.setProperty(
          '--player-now',
          `var( --player-${this.indexToLiteral(player)} )`
        );
      } else {
        root.style.removeProperty('--player-now');
      }
    });
  }

  onStateChange($event: { state: State; data?: { player: number } }) {
    this.stateService.setState($event.state);
    requestAnimationFrame(() => {
      setTimeout(() => {
        if ($event.data) {
          const message = !!$event.data.player
            ? `贏家是${this.stateService.getPlayerView($event.data.player)}`
            : '平手';
          alert(message);
        }
      });
    });
  }

  private indexToLiteral(index: number) {
    // shift number to alphabet
    if (index <= 0) {
      return;
    }
    const [NUMBER_COUNT, ALPHABET_COUNT] = [10, 26];
    return (index + NUMBER_COUNT - 1)
      .toString(NUMBER_COUNT + ALPHABET_COUNT)
      .toUpperCase();
  }
}

import * as _ from 'lodash-es';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { STATE } from './state.type';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  // For type check
  private readonly player_count = 2;
  private defaults: { state: STATE; player: number } = {
    state: 'READY',
    player: 0,
  };
  private playerViews: string[] = [];
  private currentState$: BehaviorSubject<{ state: STATE }> =
    new BehaviorSubject({ state: this.defaults.state });
  private currentPlayer$: BehaviorSubject<{ player: number }> =
    new BehaviorSubject({ player: this.defaults.player });

  getState() {
    return this.currentState$;
  }

  setState(state: STATE) {
    this.currentState$.next({ state });
    if (_.eq(state, 'READY')) {
      this.currentPlayer$.next({ player: 0 });
    } else if (_.eq(state, 'PLAYING')) {
      this.currentPlayer$.next({ player: this.randomPlayer() });
    } else {
      return;
    }
  }

  getPlayer() {
    return this.currentPlayer$;
  }

  setPlayer(player: number) {
    this.currentPlayer$.next({ player });
  }

  setPlayerView(index: number, view: string) {
    this.playerViews[index] = view;
  }

  getPlayerView(index: number) {
    return this.playerViews?.[index];
  }

  private randomPlayer(): number {
    return _.random(0, this.player_count - 1) + 1;
  }
}

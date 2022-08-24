import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'lodash-es';

import { State } from '@type/state.type';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  // For type check
  private readonly player_count = 2;
  private defaults: { state: State; player: number } = {
    state: 'READY',
    player: 0,
  };
  private playerViews: string[] = [];
  private currentState$: BehaviorSubject<{ state: State }> =
    new BehaviorSubject({ state: this.defaults.state });
  private currentPlayer$: BehaviorSubject<{ player: number }> =
    new BehaviorSubject({ player: this.defaults.player });

  getState() {
    return this.currentState$;
  }

  setState(state: State) {
    this.currentState$.next({ state });
    if (_.eq(state, 'READY')) {
      this.currentPlayer$.next({ player: 0 });
    } else if (_.eq(state, 'PLAYING')) {
      this.currentPlayer$.next({ player: this.randomPlayer() });
    } else {
      return;
    }
  }

  setCurrentPlayer(player: number) {
    this.currentPlayer$.next({ player });
  }

  getCurrentPlayer() {
    return this.currentPlayer$;
  }

  setPlayerView(index: number, view: string) {
    this.playerViews[index] = view;
  }

  getPlayerView(index: number) {
    return this.playerViews?.[index];
  }

  private randomPlayer(): number {
    return _.random(1, this.player_count);
  }
}

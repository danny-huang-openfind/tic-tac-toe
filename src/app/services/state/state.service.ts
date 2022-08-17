import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { STATE } from './state.type';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  private current: STATE = 'READY';
  private currentState$: BehaviorSubject<{ state: STATE }> =
    new BehaviorSubject({ state: this.current });

  getState() {
    return this.currentState$;
  }

  setState(state: STATE) {
    this.currentState$.next({ state });
  }
}

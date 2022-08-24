import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'lodash-es';

import { StateService } from '@services/state';
import { State } from '@type/state.type';

@Component({
  selector: 'ttt-action-bar',
  templateUrl: './action-bar.component.html',
  styleUrls: ['./action-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionBarComponent implements OnInit {
  @Output() stateChange = new EventEmitter<{
    state: State;
    data?: { player: number };
  }>();

  private renderer$: Observable<{ start: boolean; reset: boolean }> =
    this.stateService.getState().pipe(
      map(({ state }) => ({
        start: !_.eq('READY', state),
        reset: !_.includes(['PLAYING', 'FINISHED'], state),
      }))
    );
  /* No need for data processing */
  // private processor: Observable<T>

  constructor(private stateService: StateService) {}

  ngOnInit(): void {}

  onStartButtonClick() {
    this.stateChange.emit({ state: 'PLAYING' });
  }

  onResetButtonClick() {
    this.stateChange.emit({ state: 'READY' });
  }

  getRenderer() {
    return this.renderer$;
  }
}

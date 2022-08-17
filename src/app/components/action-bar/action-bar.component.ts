import * as _ from 'lodash-es';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { StateService } from '@services/state';

@Component({
  selector: 'ttt-action-bar',
  templateUrl: './action-bar.component.html',
  styleUrls: ['./action-bar.component.css'],
})
export class ActionBarComponent implements OnInit {
  @Output() stateChange = new EventEmitter();

  isDisabled: { start: boolean; reset: boolean } = {
    start: false,
    reset: true,
  };
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

  ngOnInit(): void {
    this.renderer$.subscribe((visiabilty) => {
      _.assign(this.isDisabled, visiabilty);
    });
  }

  onStartButtonClick() {
    this.stateChange.emit({ state: 'PLAYING' });
  }

  onResetButtonClick() {
    this.stateChange.emit({ state: 'READY' });
  }
}

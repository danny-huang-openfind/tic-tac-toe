import * as _ from 'lodash-es';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'second',
})
export class SecondPipe implements PipeTransform {
  private MILLI_PER_SECOND = 1000;

  transform(value: number, digit: number = 0): string {
    return (value / this.MILLI_PER_SECOND).toFixed(digit);
  }
}

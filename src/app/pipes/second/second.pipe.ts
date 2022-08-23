import * as _ from 'lodash-es';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'second',
})
export class SecondPipe implements PipeTransform {
  private MILLI_PER_SECOND = 1000;

  transform(value: string | number, digit: number = 0): string {
    return (_.toNumber(value) / this.MILLI_PER_SECOND).toFixed(digit);
  }
}

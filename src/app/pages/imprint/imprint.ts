import { Component } from '@angular/core';

import { legalEntity } from '../../legal.data';

@Component({
  templateUrl: './imprint.html',
})
export class ImprintPage {
  readonly legalEntity = legalEntity;
}

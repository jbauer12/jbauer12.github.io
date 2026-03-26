import { Component } from '@angular/core';

import { legalEntity } from '../../legal.data';

@Component({
  templateUrl: './privacy.html',
})
export class PrivacyPage {
  readonly legalEntity = legalEntity;
}

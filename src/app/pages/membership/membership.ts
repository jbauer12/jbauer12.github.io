import { Component } from '@angular/core';

import { membershipReasons, membershipSteps } from '../../site-data';

@Component({
  templateUrl: './membership.html',
})
export class MembershipPage {
  readonly membershipReasons = membershipReasons;
  readonly membershipSteps = membershipSteps;
}

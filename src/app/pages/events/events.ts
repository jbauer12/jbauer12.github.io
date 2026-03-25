import { Component } from '@angular/core';

import { eventFormats } from '../../site-data';

@Component({
  templateUrl: './events.html',
})
export class EventsPage {
  readonly eventFormats = eventFormats;
}

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { homeHighlights } from '../../site-data';

@Component({
  imports: [RouterLink],
  templateUrl: './home.html',
})
export class HomePage {
  readonly highlights = homeHighlights;
}

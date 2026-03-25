import { Component } from '@angular/core';

import { faqItems } from '../../site-data';

@Component({
  templateUrl: './faq.html',
})
export class FaqPage {
  readonly faqItems = faqItems;
}

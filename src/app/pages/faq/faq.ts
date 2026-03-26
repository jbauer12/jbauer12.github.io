import { Component } from '@angular/core';

import { EditableTextComponent } from '../../shared/editable-text/editable-text';
import { faqItems } from '../../site-data';

@Component({
  imports: [EditableTextComponent],
  templateUrl: './faq.html',
})
export class FaqPage {
  readonly faqItems = faqItems;
}

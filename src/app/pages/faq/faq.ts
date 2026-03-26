import { Component, inject } from '@angular/core';

import { EditableTextComponent } from '../../shared/editable-text/editable-text';
import { FaqStore } from '../../faq.store';

@Component({
  imports: [EditableTextComponent],
  templateUrl: './faq.html',
})
export class FaqPage {
  private readonly faqStore = inject(FaqStore);

  readonly faqItems = this.faqStore.items;
  readonly isLoading = this.faqStore.isLoading;
  readonly errorMessage = this.faqStore.loadError;
}

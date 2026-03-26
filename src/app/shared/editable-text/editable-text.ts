import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SiteContentStore } from '../../site-content.store';

type EditableTag = 'span' | 'p' | 'h1' | 'h2' | 'h3';

@Component({
  selector: 'app-editable-text',
  imports: [FormsModule],
  templateUrl: './editable-text.html',
  styleUrl: './editable-text.scss',
  host: {
    class: 'editable-text-host',
    '[class.editable-text-host--inline]': 'tag() === "span"',
  },
})
export class EditableTextComponent {
  private readonly siteContentStore = inject(SiteContentStore);

  readonly contentKey = input.required<string>();
  readonly fallback = input.required<string>();
  readonly tag = input<EditableTag>('span');
  readonly className = input('');
  readonly multiline = input(true);
  readonly showTrigger = input(true);

  readonly isEditing = signal(false);
  readonly draftValue = signal('');
  readonly canEdit = this.siteContentStore.canEdit;
  readonly isSaving = this.siteContentStore.isSaving;
  readonly value = computed(() =>
    this.siteContentStore.value(this.contentKey(), this.fallback()),
  );

  startEditing(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.draftValue.set(this.value());
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    await this.siteContentStore.saveContent(this.contentKey(), this.draftValue());
    this.isEditing.set(false);
  }
}

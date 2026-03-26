import { Component } from '@angular/core';

import { EditableTextComponent } from '../../shared/editable-text/editable-text';
import { galleryItems } from '../../site-data';

@Component({
  imports: [EditableTextComponent],
  templateUrl: './gallery.html',
})
export class GalleryPage {
  readonly galleryItems = galleryItems;
}

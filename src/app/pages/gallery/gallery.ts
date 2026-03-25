import { Component } from '@angular/core';

import { galleryItems } from '../../site-data';

@Component({
  templateUrl: './gallery.html',
})
export class GalleryPage {
  readonly galleryItems = galleryItems;
}

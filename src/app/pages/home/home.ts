import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EditableTextComponent } from '../../shared/editable-text/editable-text';

@Component({
  imports: [RouterLink, EditableTextComponent],
  templateUrl: './home.html',
})
export class HomePage {}

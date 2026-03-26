import { Component, signal } from '@angular/core';

import { membershipTracks } from '../../site-data';

@Component({
  templateUrl: './membership.html',
  styleUrl: './membership.scss',
})
export class MembershipPage {
  readonly membershipTracks = membershipTracks;
  readonly contactEmail = 'info@vaidaisnotdead.de';
  readonly selectedMembershipType = signal('');

  setMembershipType(type: string): void {
    this.selectedMembershipType.set(type);
  }

  sendMembershipMail(
    membershipType: string,
    name: string,
    email: string,
    phone: string,
    focus: string,
    message: string,
  ): void {
    const trimmedMembershipType = membershipType.trim();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedFocus = focus.trim();
    const trimmedMessage = message.trim();

    const subject = trimmedName && trimmedMembershipType
      ? `${trimmedMembershipType}: Anfrage von ${trimmedName}`
      : trimmedName
        ? `Mitgliedsanfrage von ${trimmedName}`
      : 'Mitgliedsanfrage über die Website';

    const bodyLines = [
      'Servus vaida is not dead,',
      '',
      'ich möchte mich für eine Mitgliedschaft bzw. Mitarbeit melden.',
      '',
      `Mitgliedschaftsart: ${trimmedMembershipType || '-'}`,
      `Name: ${trimmedName || '-'}`,
      `E-Mail: ${trimmedEmail || '-'}`,
      `Telefon: ${trimmedPhone || '-'}`,
      `Beitrag / Bereich / Interesse: ${trimmedFocus || '-'}`,
      '',
      'Nachricht:',
      trimmedMessage || '-',
      '',
      'Viele Grüße',
      trimmedName || '',
    ];

    const mailtoUrl = `mailto:${this.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

    window.location.href = mailtoUrl;
  }
}

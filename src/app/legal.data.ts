export const contactEmail = 'info@vaidaisnotdead.de';

export const legalLinks = [
  { label: 'Impressum', path: '/impressum' },
  { label: 'Datenschutz', path: '/datenschutz' },
] as const;

export const legalEntity = {
  name: 'Vaida is not dead e.V.',
  street: 'Straße und Hausnummer ergänzen',
  postalCodeCity: 'PLZ und Ort ergänzen',
  country: 'Deutschland',
  email: contactEmail,
  phone: 'Telefonnummer ergänzen',
  representatives: 'Vertretungsberechtigte Person(en) ergänzen',
  registerCourt: 'Registergericht ergänzen',
  registerNumber: 'Vereinsregisternummer ergänzen',
  vatId: 'Steuernummer oder Umsatzsteuer-ID ergänzen, falls vorhanden',
  contentResponsible: 'Inhaltlich verantwortliche Person ergänzen',
  hostingProvider: 'Hosting-Anbieter ergänzen',
  hostingDetails: 'Bitte Anschrift, Standort und AV-Vertrag des Hostings ergänzen.',
  lastUpdated: '26. März 2026',
} as const;

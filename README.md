# BasicWebsite

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the p
To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```
roject run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Event JSON Generator

The repository now includes a small Python generator that turns a list of event source URLs into a normalized JSON file for the website.

Run it with:

```bash
python3 scripts/generate_event_data.py
```

By default it reads:

```text
data/event-sources.json
```

and writes:

```text
public/events.generated.json
```

You can override both paths:

```bash
python3 scripts/generate_event_data.py --input data/event-sources.json --output public/events.generated.json
```

### Source format

The smallest supported format is just a list of event URLs. For Facebook event pages, that is enough:

```json
{
  "events": [
    "https://www.facebook.com/events/1663914447906226"
  ]
}
```

If you want more control, you can still use the extended object format:

```json
{
  "events": [
    {
      "url": "https://www.facebook.com/events/1663914447906226",
      "slug": "nettis-birthday-bash",
      "tags": ["concert", "viechtach"],
      "overrides": {
        "status": "scheduled"
      }
    }
  ]
}
```

The script now has a dedicated parser for public Facebook event pages and tries to extract:

- `title`
- `startsAt`
- `venue`
- `address`
- `city`
- `description`
- `imageUrl`
- `organizer`

It still falls back to Open Graph, JSON-LD, visible HTML content, and a text-proxy fallback for difficult pages. Explicit values in `overrides` always win.

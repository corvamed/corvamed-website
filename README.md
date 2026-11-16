# corvamed.com

Source of the [Corvamed](https://corvamed.com) website, in English, German and Ukrainian.

Corvamed is an AI service in development that helps patients find clinical trials they may qualify for and helps research teams reach the right participants. The service is not live yet; this website explains the plan and lets people get in touch.

## Technology

- Static HTML, CSS and plain JavaScript. No framework, no build step and no server code.
- Fonts, images and icons are served from the website itself. No third-party scripts or embeds.
- No cookies, no analytics, no tracking.
- The language choice is saved in the browser's local storage so the site opens in the same language next time. It stays on the device.
- The contact form does not send anything by itself. It prepares an email in the visitor's own mail app.

## Structure

```
/                   English (main language)
/de/                German
/uk/                Ukrainian
  index.html        Home
  how-it-works/     How Corvamed will work
  technology/       AI and privacy by design
  research-teams/   For sponsors, CROs and research sites
  investors/        For investors and grant programmes
  about/            About Corvamed and the founder
  video/            Corvamed in one minute
  contact/          Contact form (opens the mail app)
  privacy/          Privacy notice
  legal/            Legal notice and terms
404.html            Page not found
assets/
  brand/            Logos and app icons
  css/              Styles (tokens, fonts, base, site)
  fonts/            Self-hosted web fonts (Jost, Commissioner)
  js/site.js        Language switch, navigation and contact form
  media/            Founder photo and video poster
  og/               Link preview images for each page and language
manifest.webmanifest, robots.txt, sitemap.xml, favicon.ico
```

The video file `assets/media/corvamed-film-60s-en.mp4` is not included in this repository. The video page and the download link need it to work.

## Run it locally

```bash
git clone https://github.com/corvamed/corvamed-website.git
cd corvamed-website
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

## Licence

All rights reserved. The texts, images, video, the Corvamed name and the logo are protected. See [LICENSE](LICENSE).

The fonts in `assets/fonts/` are third-party works with their own licence: **Jost** and **Commissioner** are published under the [SIL Open Font License 1.1](https://openfontlicense.org).

## Contact

[info@corvamed.com](mailto:info@corvamed.com) · Personal data: [privacy@corvamed.com](mailto:privacy@corvamed.com) · [LinkedIn](https://linkedin.com/company/corvamed) · [X](https://x.com/corvamedcompany)

To report a security issue, follow the [security policy](https://github.com/corvamed/.github/blob/main/SECURITY.md).

# FillHarbor – Smart Form Filler

**FillHarbor** is a free Chrome extension that automatically fills and bulk-submits Google Forms and web surveys with realistic, localised response profiles.

Built for researchers, students, and developers who need to quickly populate survey data for testing or academic purposes.

---

## Features

- **Universal form support** — works on Google Forms and standard HTML5 forms
- **9 respondent personas** — Medical, Student, Academic, Tech, Consumer, Corporate, Balanced, Agreeable, Critical
- **7 origin regions** — India, USA, UK, Canada, Australia, Germany, Global
- **Realistic data generation** — localised names, emails, phone numbers, institutions, and cities
- **Multi-page form navigation** — automatically clicks Next and Submit across form sections
- **Smart option selection** — persona-weighted answers for Likert scales and frequency questions
- **Fill Once mode** — preview a single fill before running bulk submission
- **Configurable pace** — Fast (~1s), Normal (~2s), Safe (~4s) between submissions
- **Required field retry** — detects validation errors and re-fills automatically

---

## Installation

### Google Chrome & Chromium (Brave, Edge, Opera)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the cloned `fillharbor` repository folder

### Mozilla Firefox
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Select the `manifest.json` file inside the cloned `fillharbor` repository folder

---

## Usage

1. Open a Google Form or any web form in the active tab
2. Click the FillHarbor icon in the Chrome toolbar
3. Select your **Origin Country** and **Respondent Profile**
4. Set the number of **Responses** and submission **Pace**
5. Click **Fill Once** to preview, or **Auto Submit** to begin bulk submission
6. Monitor progress in the live progress bar; click **Stop** at any time

---

## Permissions

| Permission | Reason |
|---|---|
| `activeTab` | Read and interact with the currently open form tab |
| `storage` | Save your selected settings between sessions |
| Host access (`https://docs.google.com/forms/*`) | Required to fill and submit Google Forms |

---

## Privacy

FillHarbor **does not collect, transmit, or store any personal data**. All processing happens locally in your browser. No analytics, no tracking, no external servers.

---

## Limitations

- Forms with **"Limit to 1 response (requires sign-in)"** cannot be submitted multiple times — this is enforced server-side by Google and cannot be bypassed
- CAPTCHAs will interrupt the automation loop
- File upload questions are not supported

---

## License

MIT License — free to use, modify, and distribute.

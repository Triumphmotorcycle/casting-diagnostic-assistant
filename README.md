# Precious-Metal Casting Diagnostic Assistant

An interactive decision-support tool for professional precious-metal jewellery casting operations. It helps operatives record casting conditions, explore plausible defect mechanisms, plan controlled trials and prepare a report for specialist review.

> **Diagnose before adjusting.** The application organises evidence and ranks plausible hypotheses; the responsible technical specialist remains accountable for approving process changes.

## Features

- Guided case capture for site, machine, alloy, investment, tree geometry and defect details.
- Investment liquid ratio and split between water and expansion fluid.
- Explainable diagnostic hypotheses with supporting, conflicting and missing evidence.
- Controlled trial planning with baseline, variables held constant, expected result and outcome.
- Process alignment overview across thermal, investment, alloy, flow/tree, measurement and evidence.
- Measurement safeguards and a print-ready report for remote review.

## Run locally

Install a current Node.js LTS release, then run:

```bash
npm install
npm run dev
```

Vite prints a local URL to open in your browser. To make a production build:

```bash
npm run build
npm run preview
```

## Publish online

See [docs/PUBLISHING.md](docs/PUBLISHING.md). The included GitHub Actions workflow builds the app and deploys it to GitHub Pages. In the repository's **Settings → Pages**, choose **GitHub Actions** as the deployment source.

## Data and privacy

The app runs in the browser and has no backend or external API calls. The case store uses the current browser's local storage; cases are not automatically synchronised between users or devices. Do not enter sensitive or confidential information into a public deployment unless you have assessed the privacy implications.

## Safety and scope

This is a decision-support system, not an autonomous controller. It does not replace equipment documentation, supplier guidance, validated measurement methods, site-approved process limits or the judgement of a responsible technical specialist. Experimental changes must be evaluated through controlled trials and approved before production use.

## Licence

MIT. See [LICENSE](LICENSE).

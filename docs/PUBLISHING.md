# Publishing on GitHub Pages

This is a Vite + React + TypeScript application. GitHub Pages publishes the built static site; it does not run the source files directly.

## 1. Create the repository

1. Sign in to GitHub and create a new repository.
2. For a public website, choose **Public**.
3. You can include the README already supplied in this project, or create an empty repository and upload all files from this folder.
4. Make sure the files are at the repository root: `package.json`, `index.html`, `vite.config.ts`, `src/`, and `.github/workflows/deploy.yml`.

## 2. Upload the project

Use **Add file → Upload files** on GitHub, or Git on your computer. Upload the contents of this project folder, not the ZIP file itself. Commit the files to the `main` branch.

## 3. Enable Pages

In the repository, open **Settings → Pages**. Under **Build and deployment → Source**, select **GitHub Actions**.

## 4. Wait for deployment

Open the **Actions** tab. The “Build and deploy” workflow installs dependencies, builds the application and publishes the `dist` folder. Wait for the workflow to finish successfully. The deployment job shows the published website URL.

Because Vite uses a relative base path (`./`), the built assets work at a normal GitHub project-page URL as well as at a root URL.

## 5. Test the live application

Open the published URL and test each workflow step, especially the diagnosis, controlled trials and report/print view. The app stores the current case in that browser's local storage; it does not provide shared accounts or central server storage. Clearing browser data or changing browser/device may remove or hide locally saved cases.

## Important

This is a decision-support tool, not an autonomous controller. Verify the diagnostic rules and all recommendations against equipment documentation, alloy/investment supplier guidance and site-approved procedures before using it for production decisions. Do not enter confidential customer or commercially sensitive information into a public deployment unless you have assessed the privacy implications.

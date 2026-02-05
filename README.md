# Portfolio (static, deploy free)

This is a fast, professional portfolio site built with plain HTML/CSS/JS so it can be deployed for free on GitHub Pages without installing Node.

## Edit content

- Profile / experience / education / skills: `data/profile.json`
- Projects (manual): `data/projects.json`

## Run locally

Option A (VS Code / Cursor):
- Install the **Live Server** extension and open `index.html`.

Option B (Python):
```bash
python -m http.server 5173
```
Then open `http://localhost:5173/`.

## Deploy for free (GitHub Pages)

1. Create a GitHub repo (example: `portfolio`).
2. Upload these files (or push via git).
3. In GitHub: **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: `main` / `/root`
4. Your site will be live at:
   - `https://<username>.github.io/<repo>/`

## Add projects later (easy mode)

- Add a new object in `data/projects.json` with `name`, `description`, `tags`, and optional `liveUrl` / `repoUrl`.


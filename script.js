/* eslint-disable no-console */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function readJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function renderExperience(items) {
  const root = $("#experience-list");
  if (!root) return;

  root.innerHTML = items
    .map((role) => {
      const bullets = (role.bullets || [])
        .map((b) => `<li>${escapeHtml(b)}</li>`)
        .join("");

      return `
        <article class="role">
          <div class="role-top">
            <h3 class="role-title">${escapeHtml(role.title)} · ${escapeHtml(role.company)}</h3>
            <div class="role-meta">${escapeHtml(role.location)} · ${escapeHtml(role.dates)}</div>
          </div>
          <ul>${bullets}</ul>
        </article>
      `;
    })
    .join("");
}

function renderEducation(items) {
  const root = $("#education-grid");
  if (!root) return;

  root.innerHTML = items
    .map((e) => {
      return `
        <article class="edu">
          <h3>${escapeHtml(e.school)}</h3>
          <p>${escapeHtml(e.degree)}</p>
          <p class="muted">${escapeHtml(e.location)} · ${escapeHtml(e.dates)} · ${escapeHtml(e.cgpa)}</p>
        </article>
      `;
    })
    .join("");
}

function renderSkills(skills) {
  const root = $("#skills-grid");
  if (!root) return;

  root.innerHTML = skills
    .map((group) => {
      const tags = (group.items || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
      return `
        <article class="skill-card">
          <h3>${escapeHtml(group.name)}</h3>
          <div class="tags">${tags}</div>
        </article>
      `;
    })
    .join("");
}

function renderCerts(certs) {
  const root = $("#certifications");
  if (!root) return;
  root.innerHTML = (certs || []).map((c) => `<span class="cert">${escapeHtml(c)}</span>`).join("");
}

function projectCard(p) {
  const tags = (p.tags || []).map((t) => `<span class="pill">${escapeHtml(t)}</span>`).join("");
  const links = [
    p.liveUrl ? `<a href="${escapeHtml(p.liveUrl)}" target="_blank" rel="noreferrer">Live</a>` : "",
    p.repoUrl ? `<a href="${escapeHtml(p.repoUrl)}" target="_blank" rel="noreferrer">Code</a>` : "",
  ]
    .filter(Boolean)
    .join("");

  return `
    <article class="project">
      <h3>${escapeHtml(p.name)}</h3>
      <p>${escapeHtml(p.description || "")}</p>
      <div class="meta">${tags}</div>
      <div class="links">${links}</div>
    </article>
  `;
}

function renderProjects(projects) {
  const root = $("#projects-grid");
  if (!root) return;

  if (!projects?.length) {
    root.innerHTML = `<div class="project"><h3>No projects found</h3><p>Add items in <code>data/projects.json</code> or load from GitHub.</p></div>`;
    return;
  }
  root.innerHTML = projects.map(projectCard).join("");
}

async function loadProjectsManual() {
  const data = await readJson("data/projects.json");
  renderProjects(data.projects || []);
}

function normalizeGithubRepo(repo) {
  const topics = Array.isArray(repo.topics) ? repo.topics.slice(0, 6) : [];
  const lang = repo.language ? [repo.language] : [];
  const tags = [...lang, ...topics].filter(Boolean);

  return {
    name: repo.name,
    description: repo.description || "Repository on GitHub.",
    tags,
    liveUrl: repo.homepage || "",
    repoUrl: repo.html_url,
    stars: repo.stargazers_count || 0,
    pushedAt: repo.pushed_at || "",
    pinnedHint: false,
  };
}

async function fetchGithubRepos(username) {
  // Note: GitHub unauthenticated API has rate limits, but fine for a portfolio.
  const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

async function loadProjectsFromGithub(username) {
  const root = $("#projects-grid");
  if (root) root.innerHTML = `<div class="project"><h3>Loading…</h3><p>Fetching public repositories from GitHub.</p></div>`;

  const repos = await fetchGithubRepos(username);
  const filtered = repos
    .filter((r) => !r.fork)
    .map(normalizeGithubRepo)
    .sort((a, b) => (b.stars - a.stars) || (b.pushedAt.localeCompare(a.pushedAt)));

  // Limit to reduce noise; recommend pinning on GitHub for curation.
  renderProjects(filtered.slice(0, 9));
}

async function init() {
  $("#year").textContent = String(new Date().getFullYear());

  const profile = await readJson("data/profile.json");

  // Experience / Education / Skills
  renderExperience(profile.experience || []);
  renderEducation(profile.education || []);
  renderSkills(profile.skills || []);
  renderCerts(profile.certifications || []);

  // Projects
  const toggle = $("#toggle-github");
  const usernameInput = $("#github-username");
  const reloadBtn = $("#reload-projects");

  usernameInput.value = profile.githubUsername || "ayanava99";

  async function refreshProjects() {
    const useGithub = Boolean(toggle.checked);
    const username = (usernameInput.value || "").trim();
    if (useGithub && username) {
      try {
        await loadProjectsFromGithub(username);
      } catch (e) {
        console.warn(e);
        await loadProjectsManual();
      }
    } else {
      await loadProjectsManual();
    }
  }

  toggle.addEventListener("change", refreshProjects);
  reloadBtn.addEventListener("click", refreshProjects);

  await refreshProjects();
}

init().catch((e) => {
  console.error(e);
  const root = $("#projects-grid");
  if (root) root.innerHTML = `<div class="project"><h3>Something went wrong</h3><p>Open the console for details.</p></div>`;
});

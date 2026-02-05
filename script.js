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

function normalizeUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (raw.startsWith("#")) return raw;
  if (raw.startsWith("mailto:") || raw.startsWith("tel:")) return raw;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  // Common case: user pastes "youtube.com/..." or "github.com/..."
  return `https://${raw.replace(/^\/+/, "")}`;
}

function setLink(sel, href, { showText } = {}) {
  const el = $(sel);
  if (!el) return;
  const normalized = normalizeUrl(href);
  if (!normalized) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  el.setAttribute("href", normalized);
  if (showText) el.textContent = showText;
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
  const liveUrl = normalizeUrl(p.liveUrl);
  const repoUrl = normalizeUrl(p.repoUrl);
  const links = [
    liveUrl ? `<a href="${escapeHtml(liveUrl)}" target="_blank" rel="noreferrer" onclick="event.stopPropagation()">Live</a>` : "",
  ].filter(Boolean).join("");

  // Make the whole card clickable (prefer repo, else live).
  const primary = repoUrl || liveUrl;
  const wrapperStart = primary
    ? `<a class="project project-link" href="${escapeHtml(primary)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(p.name)}">`
    : `<article class="project">`;
  const wrapperEnd = primary ? `</a>` : `</article>`;

  return `
    ${wrapperStart}
      <h3>${escapeHtml(p.name)}</h3>
      <p>${escapeHtml(p.description || "")}</p>
      <div class="meta">${tags}</div>
      <div class="links">${links}</div>
    ${wrapperEnd}
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

async function init() {
  $("#year").textContent = String(new Date().getFullYear());

  const profile = await readJson("data/profile.json");

  // Top links (normalize so "youtube.com/..." works)
  setLink("#link-github", profile.githubUrl || "https://github.com/ayanava99", { showText: "GitHub" });
  setLink("#link-linkedin", profile.linkedinUrl || "https://www.linkedin.com/in/ayanava-99", { showText: "LinkedIn" });
  setLink("#link-email", `mailto:${profile.email || "ayanava1999@gmail.com"}`, { showText: profile.email || "Email" });

  // Optional YouTube
  const yt = normalizeUrl(profile.youtubeUrl || "");
  const dotYt = $("#dot-youtube");
  if (yt) {
    if (dotYt) dotYt.hidden = false;
    setLink("#link-youtube", yt, { showText: "YouTube" });
  } else {
    if (dotYt) dotYt.hidden = true;
    const ytEl = $("#link-youtube");
    if (ytEl) ytEl.hidden = true;
  }

  // Experience / Education / Skills
  renderExperience(profile.experience || []);
  renderEducation(profile.education || []);
  renderSkills(profile.skills || []);
  renderCerts(profile.certifications || []);

  // Projects (single source of truth: data/projects.json)
  await loadProjectsManual();
}

init().catch((e) => {
  console.error(e);
  const root = $("#projects-grid");
  if (root) root.innerHTML = `<div class="project"><h3>Something went wrong</h3><p>Open the console for details.</p></div>`;
});

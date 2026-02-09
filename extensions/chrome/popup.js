// Memento Clipper — popup orchestration
// No dependencies, pure vanilla JS

const $ = (id) => document.getElementById(id);

// ── State ──────────────────────────────────────────────────────────

let appUrl = "";
let supabaseUrl = "";
let supabaseAnonKey = "";
let accessToken = "";
let refreshToken = "";
let tokenExp = 0;
let selectedInstance = null; // { id, name, slug }

// ── Views ──────────────────────────────────────────────────────────

function showView(name) {
  document.querySelectorAll(".view").forEach((v) => (v.hidden = true));
  $(`view-${name}`).hidden = false;
}

// ── JWT helpers ────────────────────────────────────────────────────

function parseJwtExp(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp || 0;
  } catch {
    return 0;
  }
}

function isTokenExpired() {
  // Refresh 60s before actual expiry
  return Date.now() / 1000 > tokenExp - 60;
}

// ── Storage ────────────────────────────────────────────────────────

async function loadStorage() {
  const data = await chrome.storage.local.get([
    "appUrl",
    "supabaseUrl",
    "supabaseAnonKey",
    "accessToken",
    "refreshToken",
    "selectedInstance",
  ]);
  appUrl = data.appUrl || "";
  supabaseUrl = data.supabaseUrl || "";
  supabaseAnonKey = data.supabaseAnonKey || "";
  accessToken = data.accessToken || "";
  refreshToken = data.refreshToken || "";
  selectedInstance = data.selectedInstance || null;
  tokenExp = accessToken ? parseJwtExp(accessToken) : 0;
}

async function saveTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  tokenExp = parseJwtExp(access);
  await chrome.storage.local.set({ accessToken: access, refreshToken: refresh });
}

async function saveConfig(url, sbUrl, sbKey) {
  appUrl = url;
  supabaseUrl = sbUrl;
  supabaseAnonKey = sbKey;
  await chrome.storage.local.set({
    appUrl: url,
    supabaseUrl: sbUrl,
    supabaseAnonKey: sbKey,
  });
}

async function saveSelectedInstance(instance) {
  selectedInstance = instance;
  await chrome.storage.local.set({ selectedInstance: instance });
}

async function clearSelectedInstance() {
  selectedInstance = null;
  await chrome.storage.local.remove(["selectedInstance"]);
}

async function clearAuth() {
  accessToken = "";
  refreshToken = "";
  tokenExp = 0;
  selectedInstance = null;
  await chrome.storage.local.remove([
    "accessToken",
    "refreshToken",
    "selectedInstance",
  ]);
}

// ── Auth ───────────────────────────────────────────────────────────

async function fetchConfig(baseUrl) {
  const res = await fetch(`${baseUrl}/api/config`);
  if (!res.ok) throw new Error("Could not fetch config from Memento");
  return res.json();
}

async function login(email, password) {
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error_description || data.msg || "Login failed");
  }

  const data = await res.json();
  await saveTokens(data.access_token, data.refresh_token);
}

async function refreshAuth() {
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    await clearAuth();
    throw new Error("Session expired. Please log in again.");
  }

  const data = await res.json();
  await saveTokens(data.access_token, data.refresh_token);
}

async function ensureValidToken() {
  if (isTokenExpired() && refreshToken) {
    await refreshAuth();
  }
}

// ── Instances ──────────────────────────────────────────────────────

async function fetchInstances() {
  await ensureValidToken();

  const res = await fetch(`${appUrl}/api/articles/instances`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) {
    await clearAuth();
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) throw new Error("Failed to fetch workspaces");

  const data = await res.json();
  return data.instances || [];
}

function renderInstancePicker(instances) {
  const list = $("instances-list");
  list.innerHTML = "";

  for (const inst of instances) {
    const btn = document.createElement("button");
    btn.className = "instance-btn";
    btn.innerHTML = `
      <span class="instance-name">${escapeHtml(inst.name)}</span>
      <span class="instance-role">${inst.role}</span>
    `;
    btn.addEventListener("click", async () => {
      await saveSelectedInstance({ id: inst.id, name: inst.name, slug: inst.slug });
      startClipFlow();
    });
    list.appendChild(btn);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function showInstancePicker() {
  showView("instances");
  const list = $("instances-list");
  list.innerHTML = '<div class="spinner"></div>';

  try {
    const instances = await fetchInstances();

    if (instances.length === 0) {
      list.innerHTML = '<p class="subtitle">No workspaces found.</p>';
      return;
    }

    // Auto-select if only one instance
    if (instances.length === 1) {
      await saveSelectedInstance({
        id: instances[0].id,
        name: instances[0].name,
        slug: instances[0].slug,
      });
      startClipFlow();
      return;
    }

    renderInstancePicker(instances);
  } catch (err) {
    if (!accessToken) {
      showView("login");
    } else {
      list.innerHTML = `<p class="error-text">${escapeHtml(err.message)}</p>`;
    }
  }
}

// ── Clip ───────────────────────────────────────────────────────────

async function extractPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab");

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"],
  });

  if (!results?.[0]?.result) {
    throw new Error("Could not extract page content");
  }

  return { tabUrl: tab.url, ...results[0].result };
}

async function clipArticle(tabUrl, html, meta) {
  await ensureValidToken();

  const payload = { url: tabUrl, html, meta };
  if (selectedInstance) {
    payload.instance_id = selectedInstance.id;
  }

  const res = await fetch(`${appUrl}/api/articles/clip`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 401) {
    await clearAuth();
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to save article");
  }

  return res.json();
}

// ── Flow ───────────────────────────────────────────────────────────

function instanceLabel() {
  return selectedInstance ? selectedInstance.name : "";
}

async function startClipFlow() {
  showView("clipping");

  try {
    const { tabUrl, html, meta } = await extractPage();
    $("clipping-title").textContent = meta.title || tabUrl;

    const result = await clipArticle(tabUrl, html, meta);
    const slug = selectedInstance?.slug || "";
    const articleBase = slug ? `${appUrl}/i/${slug}/articles` : `${appUrl}/i`;

    if (result.existing) {
      $("duplicate-title").textContent = result.title || tabUrl;
      $("duplicate-instance").textContent = instanceLabel();
      $("duplicate-link").href = slug
        ? `${articleBase}/${result.existing}`
        : articleBase;
      showView("duplicate");
    } else {
      $("success-title").textContent = result.title || tabUrl;
      $("success-instance").textContent = instanceLabel();
      $("success-link").href = slug
        ? `${articleBase}/${result.id}`
        : articleBase;
      showView("success");
    }
  } catch (err) {
    if (!accessToken) {
      showView("login");
    } else {
      $("error-message").textContent = err.message;
      showView("error");
    }
  }
}

// ── Init ───────────────────────────────────────────────────────────

async function init() {
  await loadStorage();

  if (!appUrl || !supabaseUrl) {
    showView("setup");
    return;
  }

  if (!accessToken) {
    showView("login");
    return;
  }

  if (!selectedInstance) {
    showInstancePicker();
    return;
  }

  startClipFlow();
}

// ── Event Listeners ────────────────────────────────────────────────

$("form-setup").addEventListener("submit", async (e) => {
  e.preventDefault();
  const url = $("input-app-url").value.replace(/\/+$/, "");
  const btn = e.target.querySelector("button");

  try {
    btn.disabled = true;
    btn.textContent = "Connecting...";

    const config = await fetchConfig(url);
    await saveConfig(url, config.supabaseUrl, config.supabaseAnonKey);
    showView("login");
  } catch (err) {
    btn.disabled = false;
    btn.textContent = "Save";
    alert(err.message);
  }
});

$("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("input-email").value;
  const password = $("input-password").value;
  const btn = $("btn-login");
  const errorEl = $("login-error");

  errorEl.hidden = true;
  btn.disabled = true;
  btn.textContent = "Logging in...";

  try {
    await login(email, password);
    // After login, always pick instance
    showInstancePicker();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.hidden = false;
    btn.disabled = false;
    btn.textContent = "Log In";
  }
});

$("btn-change-url").addEventListener("click", async () => {
  await chrome.storage.local.remove(["appUrl", "supabaseUrl", "supabaseAnonKey"]);
  appUrl = "";
  supabaseUrl = "";
  supabaseAnonKey = "";
  $("input-app-url").value = "";
  showView("setup");
});

$("btn-retry").addEventListener("click", () => startClipFlow());

// Change workspace buttons
$("btn-change-instance").addEventListener("click", async () => {
  await clearSelectedInstance();
  showInstancePicker();
});

$("btn-change-instance-dup").addEventListener("click", async () => {
  await clearSelectedInstance();
  showInstancePicker();
});

$("btn-change-instance-err").addEventListener("click", async () => {
  await clearSelectedInstance();
  showInstancePicker();
});

// Logout buttons
$("btn-logout").addEventListener("click", async () => {
  await clearAuth();
  showView("login");
});

$("btn-logout-dup").addEventListener("click", async () => {
  await clearAuth();
  showView("login");
});

$("btn-logout-err").addEventListener("click", async () => {
  await clearAuth();
  showView("login");
});

$("btn-logout-inst").addEventListener("click", async () => {
  await clearAuth();
  showView("login");
});

// Start
init();

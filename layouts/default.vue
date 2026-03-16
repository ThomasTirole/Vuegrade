<template>
  <div class="app-shell">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-icon">▲</span>
        <div class="logo-text">
          <span class="logo-main">VueGrade</span>
          <span class="logo-sub">Module 294</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <span class="nav-label">Navigation</span>

        <NuxtLink to="/" class="nav-item" active-class="nav-item--active" exact>
          <UIcon name="i-heroicons-squares-2x2" />
          <span>Dashboard</span>
        </NuxtLink>

        <NuxtLink to="/students" class="nav-item" active-class="nav-item--active">
          <UIcon name="i-heroicons-users" />
          <span>Élèves</span>
        </NuxtLink>

        <NuxtLink to="/questions" class="nav-item" active-class="nav-item--active">
          <UIcon name="i-heroicons-chat-bubble-left-right" />
          <span>Questions</span>
        </NuxtLink>

        <NuxtLink to="/oral" class="nav-item" active-class="nav-item--active">
          <UIcon name="i-heroicons-microphone" />
          <span>Passage oral</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-footer">
        <NuxtLink to="/settings" class="nav-item" active-class="nav-item--active">
          <UIcon name="i-heroicons-cog-6-tooth" />
          <span>Paramètres</span>
        </NuxtLink>
        <div class="version-tag">v1.0.0 — M294</div>
      </div>
    </aside>

    <!-- Main content -->
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  background: var(--c-bg);
}

/* ---- Sidebar ---- */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--c-bg-soft);
  border-right: 1px solid var(--c-border);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1.25rem 1.5rem;
  border-bottom: 1px solid var(--c-border-soft);
  margin-bottom: 1.5rem;
}

.logo-icon {
  font-size: 1.4rem;
  color: var(--c-nuxt);
  text-shadow: 0 0 16px rgba(0, 220, 130, 0.5);
  line-height: 1;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.logo-main {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--c-text);
  letter-spacing: -0.02em;
}

.logo-sub {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--c-text-muted);
  letter-spacing: 0.05em;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 0.75rem;
}

.nav-label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--c-text-muted);
  padding: 0 0.5rem 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  color: var(--c-text-soft);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.nav-item:hover {
  background: var(--c-bg-hover);
  color: var(--c-text);
}

.nav-item--active {
  background: color-mix(in srgb, var(--c-nuxt) 10%, transparent);
  color: var(--c-nuxt);
  border-color: color-mix(in srgb, var(--c-nuxt) 25%, transparent);
}

.sidebar-footer {
  padding: 0.75rem;
  border-top: 1px solid var(--c-border-soft);
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.version-tag {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--c-text-muted);
  padding: 0.25rem 0.5rem;
  text-align: center;
}

/* ---- Main ---- */
.main-content {
  flex: 1;
  min-width: 0;
  overflow-x: hidden;
}
</style>

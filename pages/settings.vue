<script setup lang="ts">
import type { Expert } from '~/types'

const db = useDB()
const experts = ref<Expert[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    experts.value = await db.experts.getAll()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">Paramètres</h1>
      <p class="page-subtitle mono">Configuration de VueGrade</p>
    </header>

    <div class="settings-grid">
      <!-- Experts -->
      <section class="settings-section">
        <h2 class="section-title">
          <UIcon name="i-heroicons-user-group" />
          Experts
        </h2>
        <p class="section-desc">Les experts participent à la notation orale. Leurs initiales sont utilisées dans les grilles de notation.</p>

        <div v-if="loading" class="loading-state">
          <UIcon name="i-heroicons-arrow-path" class="spin" />
        </div>
        <div v-else class="experts-list">
          <div v-for="expert in experts" :key="expert.id" class="expert-row">
            <div class="expert-avatar mono">{{ expert.initials }}</div>
            <div class="expert-info">
              <span class="expert-name">{{ expert.name }}</span>
              <span class="expert-role mono" :class="`role--${expert.role}`">{{ expert.role }}</span>
            </div>
          </div>
        </div>
        <p class="setting-note">
          <UIcon name="i-heroicons-information-circle" />
          Les experts sont configurés directement en base Supabase (table <code class="mono">experts</code>).
        </p>
      </section>

      <!-- GitHub config -->
      <section class="settings-section">
        <h2 class="section-title">
          <UIcon name="i-simple-icons-github" />
          GitHub
        </h2>
        <p class="section-desc">Configuration de l'intégration GitHub pour le Gitflow.</p>
        <div class="config-item">
          <span class="config-key mono">GITHUB_ORG</span>
          <span class="config-val mono">{{ $config.public.githubOrg || '(non configuré)' }}</span>
        </div>
        <p class="setting-note">
          <UIcon name="i-heroicons-information-circle" />
          Configurer via les variables d'environnement (<code class="mono">.env</code>).
          Le token GitHub reste côté serveur.
        </p>
      </section>

      <!-- Stack info -->
      <section class="settings-section">
        <h2 class="section-title">
          <UIcon name="i-heroicons-cube" />
          Stack technique
        </h2>
        <div class="stack-list">
          <div class="stack-item">
            <span class="stack-dot" style="background: #00DC82" />
            <span class="mono">Nuxt 3</span>
            <span class="stack-role">Framework</span>
          </div>
          <div class="stack-item">
            <span class="stack-dot" style="background: #41b883" />
            <span class="mono">Vue 3</span>
            <span class="stack-role">UI</span>
          </div>
          <div class="stack-item">
            <span class="stack-dot" style="background: #3ecf8e" />
            <span class="mono">Supabase</span>
            <span class="stack-role">Base de données</span>
          </div>
          <div class="stack-item">
            <span class="stack-dot" style="background: #3b82f6" />
            <span class="mono">Nuxt UI</span>
            <span class="stack-role">Composants</span>
          </div>
          <div class="stack-item">
            <span class="stack-dot" style="background: #f6821f" />
            <span class="mono">GitHub API</span>
            <span class="stack-role">Gitflow</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 2rem 2.5rem; max-width: 900px; }
.page-header { margin-bottom: 2rem; }
.page-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.03em; margin: 0 0 0.25rem; }
.page-subtitle { font-family: var(--font-mono); font-size: 0.8rem; color: var(--c-text-muted); margin: 0; }

.settings-grid { display: flex; flex-direction: column; gap: 1.5rem; }

.settings-section {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex; flex-direction: column; gap: 1rem;
}

.section-title {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 1rem; font-weight: 600; margin: 0;
}

.section-desc { font-size: 0.85rem; color: var(--c-text-soft); margin: 0; }

/* Experts */
.experts-list { display: flex; flex-direction: column; gap: 0.5rem; }
.expert-row {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--c-bg); border: 1px solid var(--c-border-soft);
  border-radius: 8px;
}
.expert-avatar {
  width: 32px; height: 32px; border-radius: 8px;
  background: color-mix(in srgb, var(--c-nuxt) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-nuxt) 25%, transparent);
  color: var(--c-nuxt); font-size: 0.7rem; font-weight: 500;
  display: flex; align-items: center; justify-content: center;
}
.expert-info { display: flex; align-items: center; gap: 0.6rem; }
.expert-name { font-size: 0.875rem; font-weight: 500; }
.expert-role {
  font-size: 0.65rem; padding: 1px 6px;
  border-radius: 4px; text-transform: uppercase;
}
.role--teacher {
  background: color-mix(in srgb, var(--c-nuxt) 12%, transparent);
  color: var(--c-nuxt);
}
.role--expert {
  background: color-mix(in srgb, var(--c-info) 12%, transparent);
  color: var(--c-info);
}

/* GitHub */
.config-item {
  display: flex; align-items: center; gap: 1rem;
  padding: 0.5rem 0.75rem;
  background: var(--c-bg); border: 1px solid var(--c-border-soft);
  border-radius: 8px;
}
.config-key { font-size: 0.78rem; color: var(--c-text-muted); min-width: 140px; }
.config-val { font-size: 0.78rem; color: var(--c-text); }

.setting-note {
  display: flex; align-items: flex-start; gap: 0.4rem;
  font-size: 0.78rem; color: var(--c-text-muted); margin: 0;
  line-height: 1.5;
}

/* Stack */
.stack-list { display: flex; flex-direction: column; gap: 0.4rem; }
.stack-item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.4rem 0;
  font-size: 0.85rem;
}
.stack-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.stack-role { color: var(--c-text-muted); font-size: 0.78rem; margin-left: auto; }

.loading-state { display: flex; justify-content: center; padding: 1rem; color: var(--c-text-muted); }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>

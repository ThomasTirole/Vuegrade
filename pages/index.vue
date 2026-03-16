<script setup lang="ts">
import { calculateFinalScore } from '~/types'

const studentsStore = useStudentsStore()
const { students, loading } = storeToRefs(studentsStore)

onMounted(() => studentsStore.fetchAll())

// Stats globales
const stats = computed(() => {
  const total = students.value.length
  const withRepo = students.value.filter(s => s.repoUrl).length
  const withDeploy = students.value.filter(s => s.deployUrl).length
  return { total, withRepo, withDeploy }
})
</script>

<template>
  <div class="page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-top">
        <div>
          <h1 class="page-title">
            <span class="nuxt-accent">▲</span> Dashboard
          </h1>
          <p class="page-subtitle">Projets Vue.js — Module 294 · Évaluation orale</p>
        </div>
        <div class="header-actions">
          <UButton
            to="/students/new"
            icon="i-heroicons-plus"
            color="primary"
            size="sm"
          >
            Ajouter un élève
          </UButton>
        </div>
      </div>

      <!-- Stats rapides -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-value mono">{{ stats.total }}</span>
          <span class="stat-label">Élèves</span>
        </div>
        <div class="stat-card">
          <span class="stat-value mono">{{ stats.withRepo }}</span>
          <span class="stat-label">Repos GitHub</span>
        </div>
        <div class="stat-card">
          <span class="stat-value mono nuxt-accent">{{ stats.withDeploy }}</span>
          <span class="stat-label">Sites déployés</span>
        </div>
      </div>
    </header>

    <!-- Grid des projets -->
    <section class="students-grid" v-if="!loading">
      <StudentCard
        v-for="student in students"
        :key="student.id"
        :student="student"
      />

      <!-- Empty state -->
      <div v-if="students.length === 0" class="empty-state">
        <UIcon name="i-heroicons-user-group" class="empty-icon" />
        <p>Aucun élève pour le moment</p>
        <UButton to="/students/new" size="sm" variant="outline">
          Ajouter le premier élève
        </UButton>
      </div>
    </section>

    <!-- Loading -->
    <div v-else class="loading-state">
      <UIcon name="i-heroicons-arrow-path" class="spin" />
      <span>Chargement des projets…</span>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 2rem 2.5rem;
  max-width: 1400px;
}

.page-header {
  margin-bottom: 2.5rem;
}

.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin: 0 0 0.25rem;
  line-height: 1.2;
}

.page-subtitle {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--c-text-muted);
  margin: 0;
}

.stats-row {
  display: flex;
  gap: 1rem;
}

.stat-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  padding: 0.75rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--c-text-muted);
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.25rem;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: var(--c-text-muted);
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.3;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--c-text-muted);
  padding: 3rem;
  font-family: var(--font-mono);
  font-size: 0.875rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
.spin { animation: spin 1s linear infinite; }
</style>

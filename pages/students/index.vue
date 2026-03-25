<!-- pages/students/index.vue — Liste des élèves -->
<script setup lang="ts">
const studentsStore = useStudentsStore()
const { students, loading } = storeToRefs(studentsStore)

onMounted(() => studentsStore.fetchAll())

const search = ref('')
const sortBy = ref<'name' | 'passageOrder'>('passageOrder')

const filteredStudents = computed(() => {
  let result = [...students.value]

  // Filtre par recherche
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    result = result.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.githubUsername.toLowerCase().includes(q) ||
      s.projectDescription?.toLowerCase().includes(q)
    )
  }

  // Tri
  if (sortBy.value === 'name') {
    result.sort((a, b) => a.name.localeCompare(b.name))
  } else {
    result.sort((a, b) => (a.passageOrder ?? 999) - (b.passageOrder ?? 999))
  }

  return result
})
</script>

<template>
  <div class="page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-top">
        <div>
          <h1 class="page-title">Élèves</h1>
          <p class="page-subtitle mono">{{ students.length }} élève{{ students.length > 1 ? 's' : '' }} inscrits</p>
        </div>
        <UButton
          to="/students/new"
          icon="i-heroicons-plus"
          color="primary"
          size="sm"
        >
          Nouvel élève
        </UButton>
      </div>

      <!-- Filtres -->
      <div class="filters">
        <UInput
          v-model="search"
          placeholder="Rechercher un élève..."
          icon="i-heroicons-magnifying-glass"
          class="search-input"
        />
        <USelect
          v-model="sortBy"
          :options="[
            { label: 'Ordre de passage', value: 'passageOrder' },
            { label: 'Nom', value: 'name' }
          ]"
          option-attribute="label"
          value-attribute="value"
          class="sort-select"
        />
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <UIcon name="i-heroicons-arrow-path" class="spin" />
      Chargement…
    </div>

    <!-- Liste -->
    <div v-else-if="filteredStudents.length > 0" class="students-list">
      <NuxtLink
        v-for="student in filteredStudents"
        :key="student.id"
        :to="`/students/${student.id}`"
        class="student-row"
      >
        <div class="student-order">
          <span v-if="student.passageOrder" class="order-badge">{{ student.passageOrder }}</span>
          <span v-else class="order-badge order-badge--empty">—</span>
        </div>
        <div class="student-info">
          <span class="student-name">{{ student.name }}</span>
          <span class="student-project mono">{{ student.projectDescription }}</span>
        </div>
        <div class="student-meta">
          <span class="meta-item mono">
            <UIcon name="i-heroicons-clock" />
            {{ student.passageTime || '—' }}
          </span>
          <span class="meta-item mono">
            <UIcon name="i-simple-icons-github" />
            {{ student.githubUsername }}
          </span>
        </div>
        <UIcon name="i-heroicons-chevron-right" class="row-arrow" />
      </NuxtLink>
    </div>

    <!-- Empty -->
    <div v-else class="empty-state">
      <template v-if="search">
        <p>Aucun élève trouvé pour "{{ search }}"</p>
        <UButton size="sm" variant="outline" @click="search = ''">Effacer la recherche</UButton>
      </template>
      <template v-else>
        <p>Aucun élève inscrit pour le moment.</p>
        <UButton to="/students/new" size="sm" icon="i-heroicons-plus">Ajouter un élève</UButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 2rem 2.5rem;
  max-width: 900px;
}

.page-header { margin-bottom: 1.5rem; }

.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin: 0 0 0.25rem;
}

.page-subtitle {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--c-text-muted);
  margin: 0;
}

.filters {
  display: flex;
  gap: 0.75rem;
}

.search-input { flex: 1; max-width: 320px; }
.sort-select { width: 180px; }

.students-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--c-border);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  overflow: hidden;
}

.student-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--c-bg-card);
  text-decoration: none;
  color: inherit;
  transition: background 0.15s;
}

.student-row:hover {
  background: var(--c-bg-hover);
}

.student-order {
  flex-shrink: 0;
}

.order-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--c-nuxt);
  color: var(--c-bg);
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 600;
}

.order-badge--empty {
  background: var(--c-bg-hover);
  color: var(--c-text-muted);
}

.student-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.student-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.student-project {
  font-size: 0.8rem;
  color: var(--c-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-meta {
  display: flex;
  gap: 1rem;
  flex-shrink: 0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--c-text-soft);
}

.row-arrow {
  color: var(--c-text-muted);
  flex-shrink: 0;
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: var(--c-text-muted);
  text-align: center;
  background: var(--c-bg-card);
  border: 1px dashed var(--c-border);
  border-radius: 12px;
}

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }

.mono { font-family: var(--font-mono); }
</style>

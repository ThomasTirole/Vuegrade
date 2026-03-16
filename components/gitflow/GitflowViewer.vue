<script setup lang="ts">
import type { GitflowData } from '~/types'

const props = defineProps<{ data: GitflowData }>()

// Palette de couleurs pour les branches (déterministe par index)
const BRANCH_COLORS = [
  '#00DC82', // vert Nuxt (branche principale)
  '#3b82f6', // bleu
  '#f59e0b', // amber
  '#a855f7', // violet
  '#ef4444', // rouge
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
]

const branchColorMap = computed(() => {
  const map: Record<string, string> = {}
  props.data.branches.forEach((b, i) => {
    map[b.name] = BRANCH_COLORS[i % BRANCH_COLORS.length]
  })
  return map
})

// Filtre / recherche
const search = ref('')
const selectedBranch = ref<string | null>(null)

const filteredCommits = computed(() => {
  let commits = props.data.commits
  if (selectedBranch.value) {
    commits = commits.filter(c =>
      props.data.commitBranchMap[c.sha]?.includes(selectedBranch.value!)
    )
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    commits = commits.filter(c =>
      c.message.toLowerCase().includes(q) ||
      c.author.toLowerCase().includes(q) ||
      c.shortSha.includes(q)
    )
  }
  return commits
})

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-CH', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function getBranchesForCommit(sha: string): string[] {
  return props.data.commitBranchMap[sha] ?? []
}
</script>

<template>
  <div class="gitflow">
    <!-- Stats bar -->
    <div class="git-stats">
      <div class="git-stat">
        <span class="mono stat-n">{{ data.totalCommits }}</span>
        <span class="stat-l">commits</span>
      </div>
      <div class="git-stat">
        <span class="mono stat-n">{{ data.branches.length }}</span>
        <span class="stat-l">branches</span>
      </div>
      <div class="git-stat" v-if="data.lastActivity">
        <span class="mono stat-n">{{ formatDate(data.lastActivity) }}</span>
        <span class="stat-l">dernière activité</span>
      </div>
    </div>

    <!-- Branches -->
    <div class="branches-row">
      <button
        class="branch-chip"
        :class="{ 'branch-chip--active': selectedBranch === null }"
        @click="selectedBranch = null"
      >
        <UIcon name="i-heroicons-squares-2x2" />
        Toutes
      </button>
      <button
        v-for="branch in data.branches"
        :key="branch.name"
        class="branch-chip"
        :class="{ 'branch-chip--active': selectedBranch === branch.name }"
        :style="selectedBranch === branch.name ? `border-color: ${branchColorMap[branch.name]}; color: ${branchColorMap[branch.name]};` : ''"
        @click="selectedBranch = branch.name"
      >
        <span
          class="branch-dot"
          :style="`background: ${branchColorMap[branch.name]}`"
        />
        <span class="mono">{{ branch.name }}</span>
        <span v-if="branch.isDefault" class="default-badge">default</span>
      </button>
    </div>

    <!-- Search -->
    <div class="search-bar">
      <UIcon name="i-heroicons-magnifying-glass" class="search-icon" />
      <input
        v-model="search"
        class="search-input mono"
        placeholder="Filtrer par message, auteur ou SHA…"
      />
    </div>

    <!-- Commit list -->
    <div class="commit-list">
      <div
        v-for="(commit, idx) in filteredCommits"
        :key="commit.sha"
        class="commit-row"
      >
        <!-- Timeline visual -->
        <div class="commit-line">
          <div
            class="commit-dot"
            :style="`background: ${branchColorMap[getBranchesForCommit(commit.sha)[0]] ?? '#545d78'}`"
          />
          <div class="commit-thread" v-if="idx < filteredCommits.length - 1" />
        </div>

        <!-- Content -->
        <div class="commit-content">
          <div class="commit-header">
            <span class="commit-sha mono">{{ commit.shortSha }}</span>
            <span class="commit-message">{{ commit.message }}</span>
            <div class="commit-branches">
              <span
                v-for="b in getBranchesForCommit(commit.sha).slice(0, 2)"
                :key="b"
                class="commit-branch-tag mono"
                :style="`background: ${branchColorMap[b]}22; color: ${branchColorMap[b]}; border: 1px solid ${branchColorMap[b]}44`"
              >
                {{ b }}
              </span>
              <span
                v-if="getBranchesForCommit(commit.sha).length > 2"
                class="commit-branch-tag mono"
              >
                +{{ getBranchesForCommit(commit.sha).length - 2 }}
              </span>
            </div>
          </div>
          <div class="commit-meta">
            <img
              v-if="commit.authorAvatar"
              :src="commit.authorAvatar"
              class="author-avatar"
              :alt="commit.author"
            />
            <span class="commit-author mono">{{ commit.author }}</span>
            <span class="commit-date mono">{{ formatDate(commit.date) }}</span>
          </div>
        </div>
      </div>

      <div v-if="filteredCommits.length === 0" class="no-commits">
        Aucun commit correspondant.
      </div>
    </div>
  </div>
</template>

<style scoped>
.gitflow { display: flex; flex-direction: column; gap: 1rem; }

/* Stats */
.git-stats {
  display: flex;
  gap: 1.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 10px;
}

.git-stat { display: flex; align-items: baseline; gap: 0.4rem; }
.stat-n { font-size: 1.1rem; font-weight: 500; color: var(--c-text); }
.stat-l { font-size: 0.75rem; color: var(--c-text-muted); }

/* Branches */
.branches-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.branch-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.7rem;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 20px;
  color: var(--c-text-soft);
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s;
}

.branch-chip:hover { border-color: var(--c-text-muted); color: var(--c-text); }

.branch-chip--active {
  background: color-mix(in srgb, var(--c-nuxt) 8%, transparent);
}

.branch-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.default-badge {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  padding: 1px 5px;
  background: color-mix(in srgb, var(--c-nuxt) 12%, transparent);
  color: var(--c-nuxt);
  border-radius: 4px;
}

/* Search */
.search-bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
}

.search-icon { color: var(--c-text-muted); font-size: 0.9rem; flex-shrink: 0; }

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--c-text);
  font-size: 0.8rem;
  font-family: var(--font-mono);
}

.search-input::placeholder { color: var(--c-text-muted); }

/* Commit list */
.commit-list {
  display: flex;
  flex-direction: column;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  overflow: hidden;
}

.commit-row {
  display: flex;
  align-items: flex-start;
  gap: 0;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--c-border-soft);
  transition: background 0.12s;
}

.commit-row:last-child { border-bottom: none; }
.commit-row:hover { background: var(--c-bg-hover); }

/* Timeline */
.commit-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 28px;
  flex-shrink: 0;
  padding-top: 5px;
}

.commit-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 6px currentColor;
}

.commit-thread {
  width: 2px;
  flex: 1;
  min-height: 24px;
  background: var(--c-border);
  margin-top: 4px;
}

/* Content */
.commit-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.commit-header {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.commit-sha {
  font-size: 0.7rem;
  color: var(--c-nuxt);
  background: color-mix(in srgb, var(--c-nuxt) 10%, transparent);
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.commit-message {
  font-size: 0.83rem;
  color: var(--c-text);
  line-height: 1.4;
  word-break: break-word;
}

.commit-branches { display: flex; gap: 0.3rem; flex-wrap: wrap; }

.commit-branch-tag {
  font-size: 0.62rem;
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.commit-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-avatar {
  width: 16px; height: 16px;
  border-radius: 50%;
}

.commit-author {
  font-size: 0.72rem;
  color: var(--c-text-soft);
}

.commit-date {
  font-size: 0.68rem;
  color: var(--c-text-muted);
}

.no-commits {
  padding: 2rem;
  text-align: center;
  color: var(--c-text-muted);
  font-size: 0.85rem;
}
</style>

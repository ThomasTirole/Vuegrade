<script setup lang="ts">
import type { Student } from '~/types'

const props = defineProps<{ student: Student }>()

const initials = computed(() =>
  props.student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
)
</script>

<template>
  <NuxtLink :to="`/students/${student.id}`" class="student-card">
    <!-- Glow accent top -->
    <div class="card-accent" />

    <div class="card-header">
      <div class="student-avatar">{{ initials }}</div>
      <div class="student-meta">
        <span class="student-name">{{ student.name }}</span>
        <span class="student-time mono" v-if="student.passageTime">
          {{ student.passageTime }}
        </span>
      </div>
      <div class="card-badges">
        <span v-if="student.deployUrl" class="badge badge--live" title="Site déployé">
          ● live
        </span>
      </div>
    </div>

    <div class="card-project">
      <p class="project-desc">{{ student.projectDescription }}</p>
    </div>

    <div class="card-footer">
      <div class="api-tag">
        <UIcon name="i-heroicons-bolt" class="api-icon" />
        <span class="mono">{{ student.apiName }}</span>
      </div>
      <div class="card-links">
        <a
          v-if="student.repoUrl"
          :href="student.repoUrl"
          target="_blank"
          class="link-btn"
          @click.stop
          title="Repo GitHub"
        >
          <UIcon name="i-simple-icons-github" />
        </a>
        <a
          v-if="student.deployUrl"
          :href="student.deployUrl"
          target="_blank"
          class="link-btn link-btn--nuxt"
          @click.stop
          title="Site déployé"
        >
          <UIcon name="i-heroicons-arrow-top-right-on-square" />
        </a>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.student-card {
  position: relative;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  padding: 1.25rem;
  text-decoration: none;
  color: var(--c-text);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;
  transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s;
  cursor: pointer;
}

.student-card:hover {
  border-color: color-mix(in srgb, var(--c-nuxt) 40%, transparent);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px color-mix(in srgb, var(--c-nuxt) 15%, transparent);
}

.card-accent {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--c-nuxt), transparent);
  opacity: 0;
  transition: opacity 0.2s;
}

.student-card:hover .card-accent {
  opacity: 1;
}

/* Header */
.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.student-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--c-nuxt) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-nuxt) 25%, transparent);
  color: var(--c-nuxt);
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.student-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.student-name {
  font-weight: 600;
  font-size: 0.9rem;
  line-height: 1.3;
}

.student-time {
  font-size: 0.7rem;
  color: var(--c-text-muted);
}

.badge {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge--live {
  color: var(--c-nuxt);
  background: color-mix(in srgb, var(--c-nuxt) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-nuxt) 25%, transparent);
}

/* Description */
.card-project {
  flex: 1;
}

.project-desc {
  font-size: 0.825rem;
  color: var(--c-text-soft);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Footer */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.5rem;
  border-top: 1px solid var(--c-border-soft);
}

.api-tag {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--c-text-muted);
  font-size: 0.75rem;
}

.api-icon {
  color: var(--c-vue);
  font-size: 0.8rem;
}

.card-links {
  display: flex;
  gap: 0.35rem;
}

.link-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: var(--c-bg-hover);
  color: var(--c-text-soft);
  border: 1px solid var(--c-border-soft);
  font-size: 0.8rem;
  transition: all 0.15s;
}

.link-btn:hover {
  color: var(--c-text);
  border-color: var(--c-border);
}

.link-btn--nuxt:hover {
  color: var(--c-nuxt);
  border-color: color-mix(in srgb, var(--c-nuxt) 40%, transparent);
}
</style>

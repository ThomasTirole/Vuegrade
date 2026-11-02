<script setup lang="ts">
// Vérifie l'accès au repo GitHub d'un élève (public, privé accessible, inaccessible)
// Les repos sont désormais personnels (plus de GitHub Classroom) : on contrôle qu'on peut les lire

import { parseRepoUrl } from '~/composables/useGitHub'

interface RepoInfo {
  fullName: string
  visibility: 'public' | 'private' | 'internal'
  lastPushAt: string
  defaultBranch: string
}

type CheckState = 'idle' | 'loading' | 'public' | 'private' | 'not-found' | 'rate-limit' | 'invalid' | 'error'

const props = withDefaults(defineProps<{
  repoUrl: string
  /** Lance la vérification au montage */
  auto?: boolean
}>(), { auto: false })

const { getRepoInfo } = useGitHub()

const state = ref<CheckState>('idle')
const info = ref<RepoInfo | null>(null)

const isValidUrl = computed(() => {
  try {
    parseRepoUrl(props.repoUrl)
    return true
  } catch {
    return false
  }
})

const lastPush = computed(() =>
  info.value?.lastPushAt
    ? new Date(info.value.lastPushAt).toLocaleString('fr-CH', { dateStyle: 'short', timeStyle: 'short' })
    : null
)

// Une nouvelle URL invalide le résultat précédent
watch(() => props.repoUrl, () => {
  state.value = 'idle'
  info.value = null
})

onMounted(() => {
  if (props.auto && isValidUrl.value) check()
})

async function check() {
  if (!isValidUrl.value) {
    state.value = 'invalid'
    return
  }
  state.value = 'loading'
  try {
    info.value = await getRepoInfo(props.repoUrl) as RepoInfo
    state.value = info.value.visibility === 'public' ? 'public' : 'private'
  } catch (err: any) {
    const status = err?.statusCode ?? err?.status
    // 404 = repo inexistant OU privé sans accès (GitHub ne distingue pas)
    state.value = status === 404 ? 'not-found' : status === 403 ? 'rate-limit' : 'error'
  }
}
</script>

<template>
  <div class="repo-check" :class="`repo-check--${state}`">
    <UButton
      size="xs"
      variant="soft"
      color="gray"
      icon="i-heroicons-shield-check"
      :loading="state === 'loading'"
      :disabled="!repoUrl"
      @click="check"
    >
      Vérifier l'accès
    </UButton>

    <span v-if="state === 'public'" class="check-msg">
      <UIcon name="i-heroicons-check-circle" /> Repo public accessible
      <span v-if="lastPush" class="mono muted">· dernier push {{ lastPush }}</span>
    </span>
    <span v-else-if="state === 'private'" class="check-msg">
      <UIcon name="i-heroicons-lock-closed" /> Repo privé accessible avec votre token
      <span v-if="lastPush" class="mono muted">· dernier push {{ lastPush }}</span>
    </span>
    <span v-else-if="state === 'not-found'" class="check-msg">
      <UIcon name="i-heroicons-x-circle" /> Introuvable : URL erronée, ou repo privé sans accès
      (l'élève doit vous ajouter comme collaborateur + token « classic » avec scope repo dans votre profil)
    </span>
    <span v-else-if="state === 'rate-limit'" class="check-msg">
      <UIcon name="i-heroicons-exclamation-triangle" /> Limite GitHub atteinte ou token invalide
    </span>
    <span v-else-if="state === 'invalid'" class="check-msg">
      <UIcon name="i-heroicons-exclamation-triangle" /> URL invalide (attendu : https://github.com/utilisateur/repo)
    </span>
    <span v-else-if="state === 'error'" class="check-msg">
      <UIcon name="i-heroicons-exclamation-triangle" /> Erreur lors de la vérification
    </span>
  </div>
</template>

<style scoped>
/* ── Conteneur ─────────────────────────────── */
.repo-check {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.78rem;
}

.check-msg {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.muted { color: var(--c-text-muted); }
.mono { font-family: var(--font-mono); }

/* ── États ─────────────────────────────────── */
.repo-check--public .check-msg,
.repo-check--private .check-msg { color: var(--c-vue); }

.repo-check--not-found .check-msg,
.repo-check--invalid .check-msg,
.repo-check--error .check-msg { color: var(--c-error); }

.repo-check--rate-limit .check-msg { color: var(--c-warn); }
</style>

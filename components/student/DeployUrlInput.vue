<script setup lang="ts">
// Champ URL de déploiement (Vercel) avec bouton de détection automatique depuis le repo GitHub

const props = defineProps<{
  repoUrl: string
}>()

const deployUrl = defineModel<string>({ required: true })

const { detectDeployUrl } = useGitHub()

const detecting = ref(false)
const notFound = ref(false)

async function detect() {
  detecting.value = true
  notFound.value = false
  try {
    const url = await detectDeployUrl(props.repoUrl.trim())
    if (url) deployUrl.value = url
    else notFound.value = true
  } catch {
    // URL de repo invalide
    notFound.value = true
  } finally {
    detecting.value = false
  }
}
</script>

<template>
  <div class="deploy-input">
    <div class="input-row">
      <UInput
        v-model="deployUrl"
        placeholder="https://mon-projet.vercel.app"
        icon="i-heroicons-globe-alt"
        class="flex-1"
      />
      <UButton
        variant="soft"
        color="gray"
        icon="i-heroicons-magnifying-glass"
        :loading="detecting"
        :disabled="!repoUrl.trim()"
        @click="detect"
      >
        Détecter
      </UButton>
    </div>
    <p v-if="notFound" class="detect-msg">
      Aucun site trouvé (champ « Website » du repo vide et &lt;repo&gt;.vercel.app ne répond pas) — saisir l'URL à la main.
    </p>
  </div>
</template>

<style scoped>
/* ── Champ + bouton ────────────────────────── */
.input-row {
  display: flex;
  gap: 0.5rem;
}

.flex-1 { flex: 1; }

/* ── Message ───────────────────────────────── */
.detect-msg {
  margin: 0.4rem 0 0;
  font-size: 0.75rem;
  color: var(--c-warn);
}
</style>

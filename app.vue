<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
/* ============================================================
   VuGrade — Design System Global
   Direction artistique : éditorial technique, dark IDE
   Polices : Sora (titres) + DM Mono (code/données)
   Accent : #00DC82 (vert Nuxt)
   ============================================================ */

:root {
  --font-display: 'Sora', sans-serif;
  --font-mono: 'DM Mono', monospace;

  /* Palette principale */
  --c-bg:          #0d0f14;
  --c-bg-soft:     #13161e;
  --c-bg-card:     #171b24;
  --c-bg-hover:    #1c2130;
  --c-border:      #252a38;
  --c-border-soft: #1e2330;

  /* Texte */
  --c-text:        #e8eaf2;
  --c-text-soft:   #8890a8;
  --c-text-muted:  #545d78;

  /* Accents */
  --c-nuxt:        #00DC82;
  --c-nuxt-dim:    #00b86d;
  --c-vue:         #41b883;
  --c-warn:        #f59e0b;
  --c-error:       #ef4444;
  --c-info:        #3b82f6;

  /* Scores (dégradé 1–6) */
  --score-1: #ef4444;
  --score-2: #f97316;
  --score-3: #f59e0b;
  --score-4: #84cc16;
  --score-5: #22c55e;
  --score-6: #00DC82;
}

*, *::before, *::after { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--c-bg);
  color: var(--c-text);
  font-family: var(--font-display);
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* Scrollbar custom */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--c-bg); }
::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--c-text-muted); }

/* Typographie */
h1, h2, h3, h4 { font-family: var(--font-display); font-weight: 600; }
code, pre, .mono { font-family: var(--font-mono); }

/* Accent glow pour les éléments Nuxt */
.nuxt-accent {
  color: var(--c-nuxt);
  text-shadow: 0 0 20px rgba(0, 220, 130, 0.3);
}

/* Badge score coloré */
.score-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 0.9rem;
}
.score-1 { background: color-mix(in srgb, var(--score-1) 15%, transparent); color: var(--score-1); border: 1px solid var(--score-1); }
.score-2 { background: color-mix(in srgb, var(--score-2) 15%, transparent); color: var(--score-2); border: 1px solid var(--score-2); }
.score-3 { background: color-mix(in srgb, var(--score-3) 15%, transparent); color: var(--score-3); border: 1px solid var(--score-3); }
.score-4 { background: color-mix(in srgb, var(--score-4) 15%, transparent); color: var(--score-4); border: 1px solid var(--score-4); }
.score-5 { background: color-mix(in srgb, var(--score-5) 15%, transparent); color: var(--score-5); border: 1px solid var(--score-5); }
.score-6 { background: color-mix(in srgb, var(--score-6) 15%, transparent); color: var(--score-6); border: 1px solid var(--score-6); }

/* Transition globale */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

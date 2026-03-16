# 001-stack.md — Décision stack technique

**Date** : 2026-03-16
**Statut** : ✅ Validée

---

## Contexte

Outil interne enseignant pour gérer les oraux du module M294 (Vue.js apprentis 2e année).
L'enseignant connaît Vue.js et veut un outil dans l'écosystème qu'il enseigne.

## Décision

**Nuxt 3 + Nuxt UI + Pinia + Supabase**

## Alternatives considérées

| Option | Avantages | Inconvénients | Décision |
|---|---|---|---|
| Vue 3 standalone | Plus simple | Pas de SSR, routing manuel | ❌ |
| Nuxt 3 | SSR, routing file-based, modules | Légèrement plus complexe | ✅ |
| Vuetify 3 | Connu de l'enseignant | Design moins distinctif, lourd | ❌ |
| **Nuxt UI** | Pro, dark mode natif, Tailwind | Nouveau pour l'enseignant | ✅ |
| Firebase | Temps réel natif | Vendor lock-in, payant | ❌ |
| **Supabase** | PostgreSQL, Realtime, gratuit | Config initiale | ✅ |

## Conséquences

- L'enseignant devra apprendre Nuxt UI (proche de Vuetify conceptuellement)
- Supabase nécessite une configuration initiale (schéma SQL)
- Le MCP Supabase permet à Claude Code d'interagir directement avec la BDD

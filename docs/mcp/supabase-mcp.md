# docs/mcp/supabase-mcp.md — Guide MCP Supabase

> Instructions pour configurer et utiliser le MCP Supabase avec Claude Code sur VueGrade.

---

## 1. Installation du MCP Supabase

### Via Claude Code settings

Dans le fichier de config Claude Code (`~/.claude/claude_desktop_config.json` ou équivalent) :

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--supabase-url", "https://VOTRE_PROJECT_ID.supabase.co",
        "--supabase-service-role-key", "VOTRE_SERVICE_ROLE_KEY"
      ]
    }
  }
}
```

> ⚠️ Remplacer `VOTRE_PROJECT_ID` et `VOTRE_SERVICE_ROLE_KEY` par les vraies valeurs depuis [supabase.com/dashboard](https://supabase.com/dashboard) → Settings → API.

### Via `.mcp.json` dans le projet (recommandé pour Claude Code)

Créer à la racine du projet :

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--supabase-url", "${SUPABASE_URL}",
        "--supabase-service-role-key", "${SUPABASE_SERVICE_KEY}"
      ]
    }
  }
}
```

Les variables sont lues depuis le `.env` du projet.

---

## 2. Outils MCP disponibles

Une fois configuré, Claude Code peut utiliser ces outils directement :

### Inspection du schéma
```
mcp_supabase_list_tables          → lister toutes les tables
mcp_supabase_list_columns(table)  → colonnes d'une table
mcp_supabase_list_functions       → fonctions SQL
```

### Exécution SQL
```
mcp_supabase_execute_sql(query)   → requête directe
```

### Migrations
```
mcp_supabase_apply_migration(sql) → migration versionnée
```

### Gestion des données
```
mcp_supabase_select(table, filter)
mcp_supabase_insert(table, data)
mcp_supabase_update(table, filter, data)
mcp_supabase_delete(table, filter)
```

---

## 3. Workflow recommandé avec MCP

### Initialisation (Session 1)
```
1. Demander à Claude Code :
   "Exécute le fichier supabase/schema.sql via MCP Supabase"

2. Vérifier :
   "Liste les tables Supabase et vérifie que le schéma correspond à supabase/schema.sql"

3. Seeder les experts :
   "Insère les experts dans la table experts : 
    - Prénom Nom, initiales TTI, role teacher
    - Expert 1, initiales FHE, role expert  
    - Expert 2, initiales KGE, role expert"
```

### Modifications de schéma
Toujours passer par une migration :
```
"Ajoute une colonne 'notes' (text, nullable) à la table oral_sessions 
via une migration Supabase nommée 'add-notes-to-oral-sessions'"
```

### Débogage
```
"Exécute cette requête SQL et montre-moi le résultat :
SELECT * FROM student_score_summary WHERE student_id = '...'"
```

---

## 4. Tables du projet VueGrade

### `experts`
| Colonne | Type | Description |
|---|---|---|
| id | uuid | PK auto |
| name | text | Nom complet |
| initials | text | ex: KGE, FHE, TTI |
| role | text | 'teacher' ou 'expert' |
| created_at | timestamptz | Auto |

### `students`
| Colonne | Type | Description |
|---|---|---|
| id | uuid | PK auto |
| name | text | Nom complet |
| github_username | text | Username GitHub |
| repo_url | text | URL du repo |
| deploy_url | text | URL GitHub Pages |
| project_description | text | Description projet |
| api_name | text | Nom de l'API |
| api_url | text | URL doc API |
| teacher_api_key | text | Clé API enseignant |
| passage_order | int | Ordre de passage |
| passage_time | text | ex: "08:20" |

### `questions`
| Colonne | Type | Description |
|---|---|---|
| id | uuid | PK auto |
| type | text | 'theoretical' ou 'practical' |
| ref | text | ex: T-1, P-4 |
| title | text | Titre court |
| question | text | Texte complet |
| expected_answer | text | Réponse attendue |
| hint | text | Indice (optionnel) |
| code_snippet | text | Code de référence |
| code_language | text | vue/js/ts/html |
| student_id | uuid | null = pool commun |
| tags | text[] | Tableau de tags |

### `oral_sessions`
| Colonne | Type | Description |
|---|---|---|
| id | uuid | PK auto |
| student_id | uuid | FK → students |
| question_ids | uuid[] | Questions sélectionnées |
| status | text | pending/in_progress/completed |
| notes | text | Notes libres |
| total_score | numeric(3,1) | Note finale calculée |
| started_at | timestamptz | Début session |
| completed_at | timestamptz | Fin session |

### `oral_grades`
| Colonne | Type | Description |
|---|---|---|
| id | uuid | PK auto |
| session_id | uuid | FK → oral_sessions |
| student_id | uuid | FK → students |
| question_id | uuid | FK → questions |
| expert_id | uuid | FK → experts |
| score | int | Note 1-6 |
| comment | text | Commentaire optionnel |

### Vue `student_score_summary`
```sql
SELECT student_id, student_name, session_id, status,
       questions_graded, average_score, total_score
FROM student_score_summary
```

---

## 5. Realtime Supabase (à implémenter en Session 2+)

Pour synchroniser les notes entre les 3 experts en temps réel :

```typescript
// Dans OralPanel.vue
const supabase = useSupabaseClient()

// S'abonner aux changements de notes pour cette session
supabase
  .channel(`oral-grades-${sessionId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'oral_grades',
    filter: `session_id=eq.${sessionId}`
  }, (payload) => {
    // Mettre à jour les scores locaux
    refreshGrades(payload)
  })
  .subscribe()
```

---

## 6. Dépannage courant

**Erreur "permission denied"** → Vérifier que RLS est configuré avec les bonnes policies (voir `supabase/schema.sql` — policies `allow_all_*`)

**Erreur "relation does not exist"** → Le schéma n'a pas été exécuté, relancer `supabase/schema.sql`

**Clé anon vs service role** :
- `SUPABASE_ANON_KEY` → côté client (Nuxt UI, navigateur)
- `SUPABASE_SERVICE_KEY` → côté serveur uniquement + MCP

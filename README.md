# F1 2026 Friends 🏎️

Une application minimaliste et dynamique pour gérer les pronostics de Formule 1 entre amis (Saison 2026). 

L'application permet à chaque joueur de saisir ses pronostics (Top 10 Qualifs, Top 10 Course, et un pari spécial) pour chaque Grand Prix. Les données sont partagées entre tous les joueurs via Supabase, et un tableau de bord analytique permet de comparer les performances des joueurs par session (Expert Qualifs, Maître de la Course, etc.).

## 🛠️ Technologies Utilisées

- **Frontend** : Next.js (React), Tailwind CSS, Framer Motion, Recharts
- **Backend & Base de Données** : Supabase (PostgreSQL)

## 🚀 Installation locale

1. **Cloner le dépôt et installer les dépendances** :
   ```bash
   npm install
   ```

2. **Configuration Supabase (Obligatoire)** :
   L'application nécessite une base de données Supabase pour sauvegarder les pronostics. Créez un projet sur [Supabase](https://supabase.com/), puis exécutez le contenu de [`supabase_schema.sql`](supabase_schema.sql) dans l'onglet **SQL Editor**. Il crée les trois tables (`predictions`, `race_results`, `races`) et leurs règles d'accès.

   - Base existante créée avant l'ajout des réactions émojis : lancez la migration indiquée en commentaire dans le script (`alter table predictions add column if not exists reactions ...`).
   - La table `races` (calendrier) doit être remplie avec les Grands Prix de la saison (`round`, `name`, `date_string`, `race_start`, `quali_start`). Les horaires peuvent ensuite être ajustés depuis l'app via le bouton **Mettre à jour**.

3. **Variables d'Environnement** :
   Créez un fichier `.env.local` à la racine du projet. Copiez vos identifiants Supabase (trouvables dans *Project Settings > API*) :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase_ici
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_ici
   ```
   > ⚠️ **Note de Sécurité** : Le fichier `.env.local` est ignoré par Git (grâce au fichier `.gitignore`). Vos identifiants ne seront donc jamais publiés sur GitHub.

4. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```
   L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

## 👥 Joueurs

La liste des joueurs (nom, couleur, accords au féminin) se trouve dans [`src/lib/players.ts`](src/lib/players.ts) : c'est le seul fichier à modifier pour ajouter un joueur. Pour en renommer un, pensez aussi à mettre à jour `player_name` dans la table `predictions`, sinon ses anciens pronostics ne lui seront plus rattachés.

## 📝 Évolutions

### 2026-11-17

- Tableau de bord : après « Enregistrer les résultats », la page se met à jour sans repasser par l'écran de chargement, et l'historique des GP affiche tout de suite les paris validés.
- Historique des GP : les flèches suivent le calendrier (du premier au dernier GP) au lieu d'aller de 1 à 22 en dur.
- Joueurs : nom, couleur et accords au féminin regroupés dans `src/lib/players.ts`.
- Nettoyage : suppression du code et des styles inutilisés, et des dépendances `dotenv`, `@supabase/ssr`, `clsx` et `tailwind-merge`.
- README : l'installation renvoie vers `supabase_schema.sql` au lieu d'une copie du SQL qui n'était plus à jour.

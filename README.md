# F1 2026 Friends 🏎️

Une application minimaliste et dynamique pour gérer les pronostics de Formule 1 entre amis (Saison 2026). 

L'application permet à chaque joueur de saisir ses pronostics (Top 10 Qualifs, Top 10 Course, et un pari spécial) pour chaque Grand Prix. Les données sont synchronisées en temps réel entre tous les utilisateurs, et un tableau de bord analytique permet de comparer les performances des joueurs par session (Expert Qualifs, Maître de la Course, etc.).

## 🛠️ Technologies Utilisées

- **Frontend** : Next.js (React), Tailwind CSS, Framer Motion, Recharts
- **Backend & Base de Données** : Supabase (PostgreSQL)

## 🚀 Installation locale

1. **Cloner le dépôt et installer les dépendances** :
   ```bash
   npm install
   ```

2. **Configuration Supabase (Obligatoire)** :
   L'application nécessite une base de données Supabase pour sauvegarder les pronostics. Créez un projet sur [Supabase](https://supabase.com/) et exécutez le script SQL suivant dans l'onglet **SQL Editor** :

   ```sql
   -- Table des pronostics
   create table if not exists predictions (
     id uuid default gen_random_uuid() primary key,
     round integer not null,
     player_name text not null,
     quali_positions jsonb not null,
     race_positions jsonb not null,
     special_bet text,
     bet_won boolean,
     updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
     edit_count integer default 0,
     history jsonb default '[]'::jsonb,
     unique(round, player_name)
   );

   -- Table des résultats officiels
   create table if not exists race_results (
     round integer primary key,
     quali_positions jsonb not null,
     race_positions jsonb not null,
     updated_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Activer Row Level Security (RLS) en mode public pour simplifier l'accès
   alter table predictions enable row level security;
   alter table race_results enable row level security;
   create policy "Public access for predictions" on predictions for all using (true) with check (true);
   create policy "Public access for results" on race_results for all using (true) with check (true);
   ```

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

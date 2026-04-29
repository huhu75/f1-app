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

-- Activer Row Level Security (RLS) en mode public pour simplifier l'accès entre amis
alter table predictions enable row level security;
alter table race_results enable row level security;

create policy "Public access for predictions" on predictions for all using (true) with check (true);
create policy "Public access for results" on race_results for all using (true) with check (true);

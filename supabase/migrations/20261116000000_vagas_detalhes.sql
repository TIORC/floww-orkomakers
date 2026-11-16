-- Guarda o formulário completo de abertura da vaga (local, benefícios, perfil DISC etc.),
-- para que a tela de detalhes consiga mostrar as informações depois de cadastradas.

alter table public.vagas
  add column if not exists detalhes jsonb not null default '{}'::jsonb;

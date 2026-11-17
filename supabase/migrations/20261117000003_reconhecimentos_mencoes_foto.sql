-- Foto da pessoa marcada, guardada junto da menção para aparecer no feed (ao lado da foto de quem publicou).
-- Só vale para menções do tipo 'pessoa'; setores e 'todos' usam um ícone.

alter table public.reconhecimento_mencoes add column if not exists foto_url text;

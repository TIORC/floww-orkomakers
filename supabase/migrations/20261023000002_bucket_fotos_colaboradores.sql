-- Bucket público das fotos de perfil. O envio é feito pelo servidor (service role), então não precisa de policy para o usuário.
-- A foto aparece em todo o sistema pelo campo foto_url de colaboradores_importados.
insert into storage.buckets (id, name, public)
values ('fotos-colaboradores', 'fotos-colaboradores', true)
on conflict (id) do nothing;

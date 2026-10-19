-- Setor do usuário mestre: TI / Desenvolvimento.
update public.colaboradores_importados
set departamento = 'TI / Desenvolvimento',
    atualizado_em = now()
where id_planilha = 'MASTER-001';

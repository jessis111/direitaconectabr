-- Categorias iniciais (a admin edita depois em /admin/categorias)
insert into public.categories (nome, slug, ordem, campos_extras) values
  ('Contabilidade e jurídico', 'contabilidade-juridico', 10, null),
  ('Marketing e design', 'marketing-design', 20, null),
  ('Tecnologia e software', 'tecnologia-software', 30, null),
  ('Construção e reformas', 'construcao-reformas', 40, null),
  ('Comércio e varejo', 'comercio-varejo', 50, null),
  ('Indústria e fornecedores', 'industria-fornecedores', 60, null),
  ('Saúde e bem-estar', 'saude-bem-estar', 70, null),
  ('Educação e treinamento', 'educacao-treinamento', 80, null),
  ('Agro', 'agro', 90, null),
  ('Serviços gerais', 'servicos-gerais', 100, null),
  ('Consultoria e gestão', 'consultoria-gestao', 110, null),
  ('UGC creator', 'ugc_creator', 120, '{
    "nichos": ["Moda", "Beleza", "Casa e decoração", "Alimentação", "Fitness", "Tecnologia", "Finanças", "Família e infantil", "Pets", "Negócios", "Agro", "Automotivo", "Viagem", "Saúde"],
    "formatos": ["Vídeo falado", "Review", "Unboxing", "Foto", "Roteiro", "Edição"]
  }'::jsonb),
  ('Outros', 'outros', 999, null)
on conflict (slug) do nothing;

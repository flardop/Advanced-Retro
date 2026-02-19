-- Requiere ejecutar primero: database/allow_extended_categories.sql
-- Reclasifica productos por plataforma usando el nombre del producto.

update products
set category = case
  when lower(name) like 'caja %' and name ilike '%(Game Boy Color)%' then 'cajas-gameboy-color'
  when lower(name) like 'caja %' and name ilike '%(Game Boy Advance)%' then 'cajas-gameboy-advance'
  when lower(name) like 'caja %' and name ilike '%(Super Nintendo)%' then 'cajas-super-nintendo'
  when lower(name) like 'caja %' and name ilike '%(GameCube)%' then 'cajas-gamecube'
  when name ilike '%(Game Boy Color)%' then 'juegos-gameboy-color'
  when name ilike '%(Game Boy Advance)%' then 'juegos-gameboy-advance'
  when name ilike '%(Super Nintendo)%' then 'juegos-super-nintendo'
  when name ilike '%(GameCube)%' then 'juegos-gamecube'
  when lower(name) like 'consola %' then 'consolas-retro'
  when lower(name) like 'manual %' then 'manuales'
  else category
end
where category in ('juegos-gameboy', 'cajas-gameboy', 'accesorios');

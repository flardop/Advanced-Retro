-- Amplia categories permitidas en tabla products
-- Ejecuta en Supabase SQL Editor

alter table if exists products
  drop constraint if exists products_category_check;

alter table if exists products
  add constraint products_category_check
  check (
    category in (
      'juegos-gameboy',
      'juegos-gameboy-color',
      'juegos-gameboy-advance',
      'juegos-super-nintendo',
      'juegos-gamecube',
      'cajas-gameboy',
      'cajas-gameboy-color',
      'cajas-gameboy-advance',
      'cajas-super-nintendo',
      'cajas-gamecube',
      'manuales',
      'consolas-retro',
      'cajas-misteriosas',
      'accesorios'
    )
  );

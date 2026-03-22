-- Migration: fix_usuarios_recursion
-- Desc: Soluciona el error 500 P0001 de recursividad en usuarios_plataforma

-- 1. Crear función Security Definer para chequear rol sin disparar RLS recursivo
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.usuarios_plataforma
    WHERE id = auth.uid() AND rol = 'superadmin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_vendedor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.usuarios_plataforma
    WHERE id = auth.uid() AND rol = 'vendedor'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Eliminar TODAS las políticas previas de usuarios_plataforma que causan recursividad
DROP POLICY IF EXISTS "RLS Basico usuarios_plataforma" ON public.usuarios_plataforma;
DROP POLICY IF EXISTS "Usuarios Plataforma - Superadmin All" ON public.usuarios_plataforma;
DROP POLICY IF EXISTS "Usuarios Plataforma - Superadmin lecturas" ON public.usuarios_plataforma;

-- 3. Recrear políticas de manera segura y sin loops (Usuario lee su propio perfil)
CREATE POLICY "Lectura propia perfil" 
ON public.usuarios_plataforma FOR SELECT 
USING (id = auth.uid());

-- Superadmin puede verlo todo y editar
CREATE POLICY "Acceso total Superadmin"
ON public.usuarios_plataforma FOR ALL
USING (public.is_superadmin());

-- (Opcional) Vendedores pueden verse a sí mismos, pero está cubierto por Lectura propia perfil.

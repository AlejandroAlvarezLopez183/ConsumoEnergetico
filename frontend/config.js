/* Configuración pública del sitio (estos dos valores son públicos por diseño;
   la protección de los datos está en las políticas RLS de Supabase).
   NUNCA pegues aquí la service_role key ni la contraseña de la base de datos. */
window.SNRGY_CONFIG = {
  SUPABASE_URL: "https://rvvelljbciaktloizqln.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_nbuamXB3WtMx4mvPogwuRw_fQ96UBff",
  USER_DOMAIN: "viviendas.example.com"   // debe coincidir con crear_usuarios.py
};

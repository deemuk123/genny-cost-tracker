
-- Revoke broad EXECUTE on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.validate_api_key(character varying) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_api_key_usage(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_stock_after_issue() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_stock_after_purchase() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_total_hours(uuid, date, date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_total_fuel_issued(uuid, date, date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_last_hour_reading(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_avg_fuel_cost(fuel_type, date, date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Grant back only what the app needs at runtime
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_last_hour_reading(uuid) TO authenticated;

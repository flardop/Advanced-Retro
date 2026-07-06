update public.admin_settings
set value = 'retr0ovllee@gmail.com',
    updated_at = now()
where key = 'retroville_contact_email'
  and coalesce(value, '') <> 'retr0ovllee@gmail.com';

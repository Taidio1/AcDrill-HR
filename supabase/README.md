# Konfiguracja Auth

## Zastosowanie migracji

Projekt aplikacji wskazuje Supabase `tnwgeyuxryjluocubfsj`. Zastosuj migracje
na tym projekcie:

```powershell
supabase link --project-ref tnwgeyuxryjluocubfsj
supabase db push
```

## Zmienne srodowiskowe aplikacji

Panel admina tworzy konta pracownikow przez server-only endpoint Next.js.
Poza publicznym URL i publishable key aplikacja wymaga sekretu:

```env
SUPABASE_SERVICE_ROLE_KEY=...
```

Nie dodawaj tej zmiennej z prefiksem `NEXT_PUBLIC_`. Klucz service role moze
dzialac tylko po stronie serwera.

## Utworzenie pierwszego administratora

1. W Supabase Dashboard otworz `Authentication > Users`.
2. Utworz konto e-mail i ustaw haslo.
3. W SQL Editor uruchom ponizsze zapytanie po wpisaniu adresu e-mail:

```sql
update public.profiles
set
  role = 'admin',
  job_title = 'Administrator',
  updated_at = now()
where id = (
  select id
  from auth.users
  where lower(email) = lower('admin@example.com')
);
```

Sprawdz, czy zmieniono dokladnie jeden profil:

```sql
select users.email, profiles.role, profiles.is_active
from auth.users as users
join public.profiles as profiles on profiles.id = users.id
where lower(users.email) = lower('admin@example.com');
```

Roli `admin` nie nalezy przyjmowac z `raw_user_meta_data`, poniewaz uzytkownik
moze samodzielnie zmieniac te dane.

## Blokada "Brak aktywnego zaproszenia"

Jesli Auth Logs zawieraja:

```text
Brak aktywnego zaproszenia dla adresu ...
```

zastosuj migracje:

```text
20260615202947_remove_invite_only_auth_trigger.sql
20260615203019_align_profile_trigger_with_existing_schema.sql
```

Usuwa ona tylko trigger `auth.users`, ktorego funkcja wymusza aktywne
zaproszenie. Druga migracja dopasowuje trigger profilu do istniejacej kolumny
`profiles.email` i zmienia FK profilu na `ON DELETE CASCADE`.

## Google OAuth

W Google Cloud jako autoryzowany redirect URI ustaw:

```text
https://tnwgeyuxryjluocubfsj.supabase.co/auth/v1/callback
```

W Supabase `Authentication > URL Configuration` dodaj adres aplikacji oraz:

```text
http://localhost:3000/auth/callback
https://TWOJA-DOMENA/auth/callback
```

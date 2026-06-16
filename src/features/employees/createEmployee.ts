import {
  createEmployeeSchema,
  getEmployeeInitials,
} from '@/src/features/employees/employeeSchema';
import { mapEmployee } from '@/src/services/supabaseServices';
import type { Employee } from '@/src/types/entities';

type SupabaseError = { message?: string; details?: string };
type QueryResult<T> = { data: T | null; error: SupabaseError | null };
type Row = Record<string, unknown>;

type UserClient = {
  auth: {
    getUser(): Promise<{
      data: { user?: { id: string } | null };
      error?: SupabaseError | null;
    }>;
  };
  from(table: string): any;
};

type AdminClient = {
  auth: {
    admin: {
      createUser(input: {
        email: string;
        password: string;
        email_confirm: boolean;
        user_metadata: { full_name: string };
      }): Promise<{
        data: { user?: { id: string } | null } | null;
        error: SupabaseError | null;
      }>;
    };
  };
  from(table: string): any;
};

export type CreateEmployeeAccountInput = {
  email: string;
  fullName: string;
  jobTitle: string;
  temporaryPassword: string;
};

function errorMessage(action: string, error?: SupabaseError | null): string {
  const detail = error?.message || error?.details;
  return detail ? `${action}: ${detail}` : action;
}

async function assertCurrentUserIsAdmin(client: UserClient): Promise<void> {
  const { data, error } = await client.auth.getUser();
  if (error) {
    throw new Error(errorMessage('Nie udalo sie odczytac sesji.', error));
  }
  const userId = data.user?.id;
  if (!userId) throw new Error('Brak aktywnej sesji.');

  const result = (await client
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', userId)
    .single()) as QueryResult<Row>;

  if (result.error) {
    throw new Error(
      errorMessage('Nie udalo sie sprawdzic uprawnien.', result.error),
    );
  }
  if (result.data?.role !== 'admin' || result.data?.is_active !== true) {
    throw new Error('Brak uprawnien administratora.');
  }
}

export async function createEmployeeAccount({
  userClient,
  adminClient,
  input,
}: {
  userClient: UserClient;
  adminClient: AdminClient;
  input: CreateEmployeeAccountInput;
}): Promise<Employee> {
  const data = createEmployeeSchema.parse(input);
  await assertCurrentUserIsAdmin(userClient);

  const created = await adminClient.auth.admin.createUser({
    email: data.email,
    password: data.temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: data.fullName,
    },
  });

  if (created.error) {
    throw new Error(
      errorMessage('Nie udalo sie utworzyc konta pracownika.', created.error),
    );
  }

  const userId = created.data?.user?.id;
  if (!userId) throw new Error('Supabase nie zwrocil identyfikatora konta.');

  const profileResult = (await adminClient
    .from('profiles')
    .update({
      email: data.email,
      full_name: data.fullName,
      initials: getEmployeeInitials(data.fullName),
      role: 'worker',
      job_title: data.jobTitle,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('id')
    .single()) as QueryResult<Row>;

  if (profileResult.error) {
    throw new Error(
      errorMessage('Nie udalo sie zaktualizowac profilu.', profileResult.error),
    );
  }

  const employeeResult = (await adminClient
    .from('employees')
    .select(
      'id, full_name, initials, role, job_title, tone, work_status, today, since',
    )
    .eq('id', userId)
    .maybeSingle()) as QueryResult<Row>;

  if (employeeResult.error) {
    throw new Error(
      errorMessage('Nie udalo sie pobrac nowego pracownika.', employeeResult.error),
    );
  }
  if (!employeeResult.data) {
    throw new Error('Nowy pracownik nie jest widoczny na liscie.');
  }

  return mapEmployee(employeeResult.data);
}

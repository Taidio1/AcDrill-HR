import { differenceInCalendarDays } from 'date-fns';
import { resolveProfile } from '@/src/features/auth/authService';
import { supabase } from '@/src/lib/supabase';
import type { AppServices } from '@/src/services/contracts';
import type {
  DocumentRecord,
  Employee,
  IssuePriority,
  IssueReport,
  IssueStatus,
  IssueType,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  LocationPoint,
  Payslip,
  PayslipItem,
  User,
  WorkSession,
  WorkSessionStatus,
} from '@/src/types/entities';

type SupabaseLike = {
  from(table: string): any;
  auth: {
    getUser(): Promise<{
      data: { user?: { id: string } | null };
      error?: SupabaseError | null;
    }>;
    getSession?(): Promise<{
      data: { session?: { access_token?: string } | null };
      error?: SupabaseError | null;
    }>;
  };
};
type Row = Record<string, unknown>;
type QueryResult<T> = { data: T | null; error: SupabaseError | null };
type SupabaseError = { message?: string; code?: string; details?: string };

const WORK_SESSION_COLUMNS =
  'id, user_id, started_at, ended_at, start_location, end_location, status';
const PAYSLIP_COLUMNS =
  'id, user_id, month, period, gross, net, pdf_uri, created_at, payslip_items(label, amount, position), payslip_advances(id, user_id, date, amount)';
const DOCUMENT_COLUMNS =
  'id, user_id, name, category, date, size, uri, created_at';
const LEAVE_COLUMNS =
  'id, user_id, type, date_from, date_to, comment, days, status, created_at, updated_at';
const ISSUE_COLUMNS =
  'id, user_id, type, description, priority, status, created_at, image_uri, location, profiles(full_name)';
const EMPLOYEE_COLUMNS =
  'id, full_name, initials, role, job_title, tone, work_status, today, since';

function asRow(value: unknown): Row {
  return value && typeof value === 'object' ? (value as Row) : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return 0;
}

function asArray(value: unknown): Row[] {
  return Array.isArray(value) ? value.map(asRow) : [];
}

function asLocation(value: unknown): LocationPoint | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const row = value as Row;
  const latitude = asNumber(row.latitude);
  const longitude = asNumber(row.longitude);
  const recordedAt = asString(row.recordedAt);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !recordedAt) {
    return undefined;
  }

  const location: LocationPoint = {
    latitude,
    longitude,
    recordedAt,
  };
  if (typeof row.accuracy === 'number') location.accuracy = row.accuracy;
  if (row.accuracy === null) location.accuracy = null;
  if (typeof row.label === 'string') location.label = row.label;
  if (typeof row.address === 'string') location.address = row.address;
  return location;
}

function toSupabaseError(action: string, error: SupabaseError): Error {
  const detail = error.message || error.details;
  return new Error(detail ? `${action}: ${detail}` : action);
}

function assertSuccess<T>(result: QueryResult<T>, action: string): T {
  if (result.error) throw toSupabaseError(action, result.error);
  if (result.data === null || result.data === undefined) {
    throw new Error(action);
  }
  return result.data;
}

async function getCurrentUserId(client: SupabaseLike): Promise<string> {
  const { data, error } = await client.auth.getUser();
  if (error) throw toSupabaseError('Nie udało się odczytać użytkownika.', error);
  const id = data.user?.id;
  if (!id) throw new Error('Brak zalogowanego użytkownika.');
  return id;
}

export function mapWorkSession(rowInput: unknown): WorkSession {
  const row = asRow(rowInput);
  const session: WorkSession = {
    id: asString(row.id),
    userId: asString(row.user_id),
    startedAt: asString(row.started_at),
    status: asString(row.status, 'active') as WorkSessionStatus,
  };
  const endedAt = asString(row.ended_at);
  const startLocation = asLocation(row.start_location);
  const endLocation = asLocation(row.end_location);
  if (endedAt) session.endedAt = endedAt;
  if (startLocation) session.startLocation = startLocation;
  if (endLocation) session.endLocation = endLocation;
  return session;
}

export function mapPayslip(rowInput: unknown): Payslip {
  const row = asRow(rowInput);
  const items: PayslipItem[] = asArray(row.payslip_items)
    .sort((left, right) => asNumber(left.position) - asNumber(right.position))
    .map((item) => ({
      label: asString(item.label),
      amount: asNumber(item.amount),
    }));

  const payslip: Payslip = {
    id: asString(row.id),
    userId: asString(row.user_id),
    month: asString(row.period) || asString(row.month),
    gross: asNumber(row.gross),
    net: asNumber(row.net),
    items,
    advances: asArray(row.payslip_advances).map((advance) => ({
      id: asString(advance.id),
      userId: asString(advance.user_id),
      date: asString(advance.date),
      amount: asNumber(advance.amount),
    })),
  };
  if (typeof row.pdf_uri === 'string') payslip.pdfUri = row.pdf_uri;
  return payslip;
}

export function mapDocumentRecord(
  rowInput: unknown,
  readDocumentIds: Set<string>,
): DocumentRecord {
  const row = asRow(rowInput);
  const document: DocumentRecord = {
    id: asString(row.id),
    userId: typeof row.user_id === 'string' ? row.user_id : 'all',
    name: asString(row.name),
    category: asString(row.category),
    date: asString(row.date),
    size: asString(row.size),
    isNew: !readDocumentIds.has(asString(row.id)),
  };
  if (typeof row.uri === 'string') document.uri = row.uri;
  return document;
}

export function mapLeaveRequest(rowInput: unknown): LeaveRequest {
  const row = asRow(rowInput);
  const profile = asRow(row.profiles);
  const leave: LeaveRequest = {
    id: asString(row.id),
    userId: asString(row.user_id),
    type: asString(row.type) as LeaveType,
    dateFrom: asString(row.date_from),
    dateTo: asString(row.date_to),
    comment: asString(row.comment),
    days: asNumber(row.days),
    status: asString(row.status) as LeaveStatus,
  };
  const userName = asString(profile.full_name);
  if (userName) leave.userName = userName;
  const createdAt = asString(row.created_at);
  const updatedAt = asString(row.updated_at);
  if (createdAt) leave.createdAt = createdAt;
  if (updatedAt) leave.updatedAt = updatedAt;
  return leave;
}

export function mapIssueReport(rowInput: unknown): IssueReport {
  const row = asRow(rowInput);
  const profile = asRow(row.profiles);
  const issue: IssueReport = {
    id: asString(row.id),
    userId: asString(row.user_id),
    type: asString(row.type) as IssueType,
    description: asString(row.description),
    priority: asString(row.priority) as IssuePriority,
    status: asString(row.status) as IssueStatus,
    createdAt: asString(row.created_at),
  };
  const userName = asString(profile.full_name);
  if (userName) issue.userName = userName;
  if (typeof row.image_uri === 'string') issue.imageUri = row.image_uri;
  const location = asLocation(row.location);
  if (location) issue.location = location;
  return issue;
}

export function mapEmployee(rowInput: unknown): Employee {
  const row = asRow(rowInput);
  return {
    id: asString(row.id),
    name: asString(row.full_name),
    initials: asString(row.initials),
    role: asString(row.role, 'worker') as User['role'],
    jobTitle: asString(row.job_title),
    tone: asString(row.tone, '#FF6A1A'),
    workStatus: asString(row.work_status, 'off') as Employee['workStatus'],
    today: asString(row.today, 'Wolne'),
    since: typeof row.since === 'string' ? row.since : undefined,
  };
}

async function readDocumentIds(
  client: SupabaseLike,
  userId: string | undefined,
  documentIds: string[],
): Promise<Set<string>> {
  if (!userId || documentIds.length === 0) return new Set();
  const result = (await client
    .from('document_reads')
    .select('document_id')
    .eq('user_id', userId)
    .in('document_id', documentIds)) as QueryResult<Row[]>;

  if (result.error) {
    throw toSupabaseError('Nie udało się odczytać statusu dokumentów.', result.error);
  }
  return new Set((result.data ?? []).map((row) => asString(row.document_id)));
}

async function currentUserIdOrUndefined(
  client: SupabaseLike,
): Promise<string | undefined> {
  const { data } = await client.auth.getUser();
  return data.user?.id;
}

async function attachLeaveUserNames(
  client: SupabaseLike,
  leaves: LeaveRequest[],
): Promise<LeaveRequest[]> {
  const userIds = Array.from(
    new Set(leaves.map((leave) => leave.userId).filter(Boolean)),
  );
  if (userIds.length === 0) return leaves;

  const profilesResult = (await client
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)) as QueryResult<Row[]>;

  if (profilesResult.error) return leaves;

  const profileEntries: Array<[string, string]> = [];
  for (const profile of profilesResult.data ?? []) {
    const id = asString(profile.id);
    const fullName = asString(profile.full_name);
    if (id && fullName) profileEntries.push([id, fullName]);
  }
  const namesById = new Map(profileEntries);

  return leaves.map((leave) => {
    const userName = namesById.get(leave.userId);
    return userName ? { ...leave, userName } : leave;
  });
}

export function createSupabaseServices(client: SupabaseLike): AppServices {
  return {
    auth: {
      async login(role) {
        const userId = await getCurrentUserId(client);
        const result = await resolveProfile(userId);
        if (!result.ok) throw new Error(result.error);
        if (result.user.role !== role) {
          throw new Error('Zalogowany profil ma inną rolę.');
        }
        return result.user;
      },
    },
    workSessions: {
      async list(userId) {
        let query = client
          .from('work_sessions')
          .select(WORK_SESSION_COLUMNS)
          .order('started_at', { ascending: false });
        if (userId) query = query.eq('user_id', userId);

        const result = (await query) as QueryResult<Row[]>;
        if (result.error) {
          throw toSupabaseError('Nie udało się pobrać sesji pracy.', result.error);
        }
        return (result.data ?? []).map(mapWorkSession);
      },
      async get(id) {
        const result = (await client
          .from('work_sessions')
          .select(WORK_SESSION_COLUMNS)
          .eq('id', id)
          .maybeSingle()) as QueryResult<Row>;
        if (result.error) {
          throw toSupabaseError('Nie udało się pobrać sesji pracy.', result.error);
        }
        return result.data ? mapWorkSession(result.data) : undefined;
      },
      async start(input) {
        const result = (await client
          .from('work_sessions')
          .insert({
            user_id: input.userId,
            started_at: input.startedAt,
            start_location: input.startLocation ?? null,
            status: 'active',
          })
          .select(WORK_SESSION_COLUMNS)
          .single()) as QueryResult<Row>;
        return mapWorkSession(
          assertSuccess(result, 'Nie udało się rozpocząć sesji pracy.'),
        );
      },
      async stop(id, input) {
        const result = (await client
          .from('work_sessions')
          .update({
            ended_at: input.endedAt,
            end_location: input.endLocation ?? null,
            status: 'completed',
          })
          .eq('id', id)
          .select(WORK_SESSION_COLUMNS)
          .single()) as QueryResult<Row>;
        return mapWorkSession(
          assertSuccess(result, 'Nie udało się zakończyć sesji pracy.'),
        );
      },
      async update(id, input) {
        const patch: Row = {};
        if (input.userId) patch.user_id = input.userId;
        if (input.startedAt) patch.started_at = input.startedAt;
        if (input.endedAt !== undefined) patch.ended_at = input.endedAt ?? null;
        if (input.startLocation !== undefined) {
          patch.start_location = input.startLocation ?? null;
        }
        if (input.endLocation !== undefined) {
          patch.end_location = input.endLocation ?? null;
        }
        if (input.status) patch.status = input.status;
        if (input.endedAt && !input.status) patch.status = 'completed';
        patch.updated_at = new Date().toISOString();

        const result = (await client
          .from('work_sessions')
          .update(patch)
          .eq('id', id)
          .select(WORK_SESSION_COLUMNS)
          .single()) as QueryResult<Row>;
        return mapWorkSession(
          assertSuccess(result, 'Nie udało się zaktualizować sesji pracy.'),
        );
      },
    },
    payslips: {
      async list(userId) {
        let query = client
          .from('payslips')
          .select(PAYSLIP_COLUMNS)
          .order('created_at', { ascending: false });
        if (userId) query = query.eq('user_id', userId);

        const result = (await query) as QueryResult<Row[]>;
        if (result.error) {
          throw toSupabaseError('Nie udało się pobrać pasków wypłat.', result.error);
        }
        return (result.data ?? []).map(mapPayslip);
      },
      async get(id) {
        const result = (await client
          .from('payslips')
          .select(PAYSLIP_COLUMNS)
          .eq('id', id)
          .maybeSingle()) as QueryResult<Row>;
        if (result.error) {
          throw toSupabaseError('Nie udało się pobrać paska wypłaty.', result.error);
        }
        return result.data ? mapPayslip(result.data) : undefined;
      },
      async create(input) {
        const payslipResult = (await client
          .from('payslips')
          .insert({
            user_id: input.userId,
            period: input.month,
            gross: input.gross,
            net: input.net,
            pdf_uri: input.pdfUri ?? null,
          })
          .select('id')
          .single()) as QueryResult<Row>;
        const payslipId = asString(
          assertSuccess(payslipResult, 'Nie udało się utworzyć paska wypłaty.').id,
        );

        if (input.items.length) {
          const itemResult = (await client.from('payslip_items').insert(
            input.items.map((item, index) => ({
              payslip_id: payslipId,
              label: item.label,
              amount: item.amount,
              position: index,
            })),
          )) as QueryResult<null>;
          if (itemResult.error) {
            throw toSupabaseError('Nie udało się zapisać składników wypłaty.', itemResult.error);
          }
        }

        if (input.advances.length) {
          const advanceResult = (await client.from('payslip_advances').insert(
            input.advances.map((advance) => ({
              payslip_id: payslipId,
              user_id: input.userId,
              date: advance.date,
              amount: advance.amount,
            })),
          )) as QueryResult<null>;
          if (advanceResult.error) {
            throw toSupabaseError('Nie udało się zapisać zaliczek.', advanceResult.error);
          }
        }

        const created = await this.get(payslipId);
        if (!created) throw new Error('Nie znaleziono utworzonego paska wypłaty.');
        return created;
      },
      async addAdvance(payslipId, amount, date) {
        const payslip = await this.get(payslipId);
        if (!payslip) throw new Error('Nie znaleziono paska wypłaty.');

        const result = (await client.from('payslip_advances').insert({
          payslip_id: payslipId,
          user_id: payslip.userId,
          amount,
          date,
        })) as QueryResult<null>;
        if (result.error) {
          throw toSupabaseError('Nie udało się dodać zaliczki.', result.error);
        }

        const updated = await this.get(payslipId);
        if (!updated) throw new Error('Nie znaleziono zaktualizowanego paska wypłaty.');
        return updated;
      },
    },
    documents: {
      async list(userId) {
        const readerId = userId ?? (await currentUserIdOrUndefined(client));
        let query = client
          .from('documents')
          .select(DOCUMENT_COLUMNS)
          .order('date', { ascending: false });
        if (userId) query = query.or(`user_id.eq.${userId},user_id.is.null`);

        const result = (await query) as QueryResult<Row[]>;
        if (result.error) {
          throw toSupabaseError('Nie udało się pobrać dokumentów.', result.error);
        }
        const rows = result.data ?? [];
        const readIds = await readDocumentIds(
          client,
          readerId,
          rows.map((row) => asString(row.id)),
        );
        return rows.map((row) => mapDocumentRecord(row, readIds));
      },
      async get(id) {
        const readerId = await currentUserIdOrUndefined(client);
        const result = (await client
          .from('documents')
          .select(DOCUMENT_COLUMNS)
          .eq('id', id)
          .maybeSingle()) as QueryResult<Row>;
        if (result.error) {
          throw toSupabaseError('Nie udało się pobrać dokumentu.', result.error);
        }
        if (!result.data) return undefined;
        const readIds = await readDocumentIds(client, readerId, [id]);
        return mapDocumentRecord(result.data, readIds);
      },
      async markRead(id) {
        const userId = await getCurrentUserId(client);
        const result = (await client.from('document_reads').upsert(
          {
            document_id: id,
            user_id: userId,
            read_at: new Date().toISOString(),
          },
          { onConflict: 'document_id,user_id' },
        )) as QueryResult<null>;
        if (result.error) {
          throw toSupabaseError('Nie udało się oznaczyć dokumentu jako przeczytany.', result.error);
        }

        const document = await this.get(id);
        if (!document) throw new Error('Nie znaleziono dokumentu.');
        return { ...document, isNew: false };
      },
      async create(input) {
        const result = (await client
          .from('documents')
          .insert({
            user_id: input.userId === 'all' ? null : input.userId,
            name: input.name,
            category: input.category,
            date: input.date,
            size: input.size,
            uri: input.uri ?? null,
          })
          .select(DOCUMENT_COLUMNS)
          .single()) as QueryResult<Row>;
        return mapDocumentRecord(
          assertSuccess(result, 'Nie udało się utworzyć dokumentu.'),
          new Set(),
        );
      },
    },
    leaves: {
      async list(userId) {
        let query = client
          .from('leave_requests')
          .select(LEAVE_COLUMNS)
          .order('date_from', { ascending: false });
        if (userId) query = query.eq('user_id', userId);

        const result = (await query) as QueryResult<Row[]>;
        if (result.error) {
          throw toSupabaseError('Nie udało się pobrać wniosków urlopowych.', result.error);
        }
        return attachLeaveUserNames(
          client,
          (result.data ?? []).map(mapLeaveRequest),
        );
      },
      async balance(userId) {
        const balanceResult = (await client
          .from('leave_balances')
          .select('annual')
          .eq('user_id', userId)
          .maybeSingle()) as QueryResult<Row>;
        if (balanceResult.error) {
          throw toSupabaseError('Nie udało się pobrać salda urlopu.', balanceResult.error);
        }

        const leavesResult = (await client
          .from('leave_requests')
          .select('days, type')
          .eq('user_id', userId)
          .eq('status', 'approved')) as QueryResult<Row[]>;
        if (leavesResult.error) {
          throw toSupabaseError('Nie udało się policzyć wykorzystanego urlopu.', leavesResult.error);
        }

        const annual = balanceResult.data ? asNumber(balanceResult.data.annual) : 26;
        const used = (leavesResult.data ?? [])
          .filter((row) => row.type !== 'unpaid')
          .reduce((sum, row) => sum + asNumber(row.days), 0);
        return {
          annual,
          used,
          available: Math.max(0, annual - used),
        };
      },
      async create(input) {
        const result = (await client
          .from('leave_requests')
          .insert({
            user_id: input.userId,
            type: input.type,
            date_from: input.dateFrom,
            date_to: input.dateTo,
            comment: input.comment,
            status: 'pending',
          })
          .select(LEAVE_COLUMNS)
          .single()) as QueryResult<Row>;
        if (result.data && typeof result.data.days === 'undefined') {
          result.data.days =
            differenceInCalendarDays(input.dateTo, input.dateFrom) + 1;
        }
        return mapLeaveRequest(
          assertSuccess(result, 'Nie udało się wysłać wniosku urlopowego.'),
        );
      },
      async decide(id, status) {
        const result = (await client
          .from('leave_requests')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select(LEAVE_COLUMNS)
          .single()) as QueryResult<Row>;
        return mapLeaveRequest(
          assertSuccess(result, 'Nie udało się zmienić statusu wniosku.'),
        );
      },
    },
    issues: {
      async list(userId) {
        let query = client
          .from('issue_reports')
          .select(ISSUE_COLUMNS)
          .order('created_at', { ascending: false });
        if (userId) query = query.eq('user_id', userId);

        const result = (await query) as QueryResult<Row[]>;
        if (result.error) {
          throw toSupabaseError('Nie udało się pobrać zgłoszeń.', result.error);
        }
        return (result.data ?? []).map(mapIssueReport);
      },
      async create(input) {
        const result = (await client
          .from('issue_reports')
          .insert({
            user_id: input.userId,
            type: input.type,
            description: input.description,
            priority: input.priority,
            status: 'new',
            image_uri: input.imageUri ?? null,
            location: input.location ?? null,
          })
          .select(ISSUE_COLUMNS)
          .single()) as QueryResult<Row>;
        return mapIssueReport(
          assertSuccess(result, 'Nie udało się wysłać zgłoszenia.'),
        );
      },
      async updateStatus(id, status) {
        const result = (await client
          .from('issue_reports')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select(ISSUE_COLUMNS)
          .single()) as QueryResult<Row>;
        return mapIssueReport(
          assertSuccess(result, 'Nie udało się zmienić statusu zgłoszenia.'),
        );
      },
      async remove(id) {
        const result = (await client
          .from('issue_reports')
          .delete()
          .eq('id', id)) as QueryResult<Row>;
        if (result.error) {
          throw toSupabaseError('Nie udało się usunąć zgłoszenia.', result.error);
        }
      },
    },
    employees: {
      async list() {
        const result = (await client
          .from('employees')
          .select(EMPLOYEE_COLUMNS)
          .order('full_name', { ascending: true })) as QueryResult<Row[]>;
        if (result.error) {
          throw toSupabaseError('Nie udało się pobrać pracowników.', result.error);
        }
        return (result.data ?? []).map(mapEmployee);
      },
      async get(id) {
        const result = (await client
          .from('employees')
          .select(EMPLOYEE_COLUMNS)
          .eq('id', id)
          .maybeSingle()) as QueryResult<Row>;
        if (result.error) {
          throw toSupabaseError('Nie udało się pobrać pracownika.', result.error);
        }
        return result.data ? mapEmployee(result.data) : undefined;
      },
      async create(input) {
        const getSession = client.auth.getSession;
        if (!getSession) throw new Error('Brak obslugi sesji Supabase.');

        const sessionResult = await getSession.call(client.auth);
        if (sessionResult.error) {
          throw toSupabaseError(
            'Nie udalo sie odczytac sesji.',
            sessionResult.error,
          );
        }
        const token = sessionResult.data.session?.access_token;
        if (!token) throw new Error('Brak aktywnej sesji administratora.');

        const response = await fetch('/api/admin/employees', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        });
        const body = (await response.json().catch(() => ({}))) as {
          employee?: Employee;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(body.error ?? 'Nie udalo sie utworzyc pracownika.');
        }
        if (!body.employee) {
          throw new Error('Serwer nie zwrocil utworzonego pracownika.');
        }
        return body.employee;
      },
    },
    pushSubscriptions: {
      async save(input) {
        const userId = await getCurrentUserId(client);
        const result = (await client.from('push_subscriptions').upsert(
          {
            user_id: userId,
            endpoint: input.endpoint,
            auth_key: input.authKey,
            p256dh_key: input.p256dhKey,
            user_agent: input.userAgent ?? null,
          },
          { onConflict: 'endpoint' },
        )) as QueryResult<null>;
        if (result.error) {
          throw toSupabaseError(
            'Nie udało się zapisać subskrypcji powiadomień.',
            result.error,
          );
        }
      },
      async remove(endpoint) {
        const result = (await client
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', endpoint)) as QueryResult<Row>;
        if (result.error) {
          throw toSupabaseError(
            'Nie udało się usunąć subskrypcji powiadomień.',
            result.error,
          );
        }
      },
    },
  };
}

export const supabaseServices = createSupabaseServices(supabase);

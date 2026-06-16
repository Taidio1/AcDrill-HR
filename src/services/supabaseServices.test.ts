import {
  createSupabaseServices,
  mapDocumentRecord,
  mapIssueReport,
  mapLeaveRequest,
  mapPayslip,
  mapWorkSession,
} from '@/src/services/supabaseServices';

describe('supabaseServices mappers', () => {
  it('maps work session rows from snake_case to app entities', () => {
    expect(
      mapWorkSession({
        id: 'session-1',
        user_id: 'user-1',
        started_at: '2026-06-16T06:00:00.000Z',
        ended_at: '2026-06-16T14:00:00.000Z',
        start_location: {
          latitude: 52.1,
          longitude: 20.9,
          recordedAt: '2026-06-16T06:00:00.000Z',
          address: 'ul. Wiertnicza 12, Płock',
        },
        end_location: null,
        status: 'completed',
      }),
    ).toEqual({
      id: 'session-1',
      userId: 'user-1',
      startedAt: '2026-06-16T06:00:00.000Z',
      endedAt: '2026-06-16T14:00:00.000Z',
      startLocation: {
        latitude: 52.1,
        longitude: 20.9,
        recordedAt: '2026-06-16T06:00:00.000Z',
        address: 'ul. Wiertnicza 12, Płock',
      },
      status: 'completed',
    });
  });

  it('maps payslip relations into items and advances', () => {
    expect(
      mapPayslip({
        id: 'pay-1',
        user_id: 'user-1',
        month: 'Maj 2026',
        gross: '8200',
        net: 6380,
        pdf_uri: 'https://example.test/pay.pdf',
        payslip_items: [
          { label: 'Premia', amount: '500', position: 2 },
          { label: 'Podstawa', amount: 6500, position: 1 },
        ],
        payslip_advances: [
          {
            id: 'advance-1',
            user_id: 'user-1',
            date: '2026-05-12',
            amount: '1000',
          },
        ],
      }),
    ).toMatchObject({
      id: 'pay-1',
      userId: 'user-1',
      items: [
        { label: 'Podstawa', amount: 6500 },
        { label: 'Premia', amount: 500 },
      ],
      advances: [{ id: 'advance-1', userId: 'user-1', amount: 1000 }],
    });
  });

  it('maps legacy payslip period into month when month is missing', () => {
    expect(
      mapPayslip({
        id: 'pay-1',
        user_id: 'user-1',
        period: 'Czerwiec 2026',
        gross: 8200,
        net: 6380,
        payslip_items: [],
        payslip_advances: [],
      }).month,
    ).toBe('Czerwiec 2026');
  });

  it('prefers the text period over a legacy date month', () => {
    expect(
      mapPayslip({
        id: 'pay-1',
        user_id: 'user-1',
        month: '2026-06-01',
        period: 'Czerwiec 2026',
        gross: 8200,
        net: 6380,
        payslip_items: [],
        payslip_advances: [],
      }).month,
    ).toBe('Czerwiec 2026');
  });

  it('marks document as new until current user has a read row', () => {
    const row = {
      id: 'doc-1',
      user_id: null,
      name: 'Regulamin',
      category: 'PDF',
      date: '2026-06-01',
      size: '120 KB',
      uri: null,
    };

    expect(mapDocumentRecord(row, new Set()).isNew).toBe(true);
    expect(mapDocumentRecord(row, new Set(['doc-1'])).isNew).toBe(false);
    expect(mapDocumentRecord(row, new Set()).userId).toBe('all');
  });

  it('maps issue reporter full name from the joined profile', () => {
    expect(
      mapIssueReport({
        id: 'issue-1',
        user_id: 'user-1',
        type: 'breakdown',
        description: 'Spadek cisnienia',
        priority: 'high',
        status: 'new',
        created_at: '2026-06-16T08:00:00.000Z',
        profiles: {
          full_name: 'Mariusz Kowalczyk',
        },
      }),
    ).toMatchObject({
      id: 'issue-1',
      userId: 'user-1',
      userName: 'Mariusz Kowalczyk',
    });
  });

  it('maps leave request audit fields and worker full name', () => {
    expect(
      mapLeaveRequest({
        id: 'leave-1',
        user_id: 'user-1',
        type: 'vacation',
        date_from: '2026-07-01',
        date_to: '2026-07-05',
        comment: 'Wakacje',
        days: 5,
        status: 'approved',
        created_at: '2026-06-16T08:00:00.000Z',
        updated_at: '2026-06-16T09:00:00.000Z',
        profiles: {
          full_name: 'Mariusz Kowalczyk',
        },
      }),
    ).toEqual({
      id: 'leave-1',
      userId: 'user-1',
      userName: 'Mariusz Kowalczyk',
      type: 'vacation',
      dateFrom: '2026-07-01',
      dateTo: '2026-07-05',
      comment: 'Wakacje',
      days: 5,
      status: 'approved',
      createdAt: '2026-06-16T08:00:00.000Z',
      updatedAt: '2026-06-16T09:00:00.000Z',
    });
  });
});

describe('createSupabaseServices', () => {
  it('starts work sessions by inserting snake_case payload and mapping response', async () => {
    const calls: Array<{ method: string; value: unknown }> = [];
    const query = {
      insert(value: unknown) {
        calls.push({ method: 'insert', value });
        return this;
      },
      select(value: string) {
        calls.push({ method: 'select', value });
        return this;
      },
      single() {
        return Promise.resolve({
          data: {
            id: 'session-1',
            user_id: 'user-1',
            started_at: '2026-06-16T06:00:00.000Z',
            ended_at: null,
            start_location: null,
            end_location: null,
            status: 'active',
          },
          error: null,
        });
      },
    };
    const client = {
      from: jest.fn(() => query),
      auth: {
        getUser: jest.fn(),
      },
    };

    const services = createSupabaseServices(client);
    const session = await services.workSessions.start({
      userId: 'user-1',
      startedAt: '2026-06-16T06:00:00.000Z',
    });

    expect(client.from).toHaveBeenCalledWith('work_sessions');
    expect(calls[0]).toEqual({
      method: 'insert',
      value: {
        user_id: 'user-1',
        started_at: '2026-06-16T06:00:00.000Z',
        start_location: null,
        status: 'active',
      },
    });
    expect(session).toMatchObject({
      id: 'session-1',
      userId: 'user-1',
      status: 'active',
    });
  });

  it('creates payslips with the text period column only', async () => {
    const calls: Array<{ method: string; value: unknown }> = [];
    const payslipQuery = {
      insert(value: unknown) {
        calls.push({ method: 'insert', value });
        return this;
      },
      select(value: string) {
        calls.push({ method: 'select', value });
        return this;
      },
      single() {
        return Promise.resolve({
          data: { id: 'pay-1' },
          error: null,
        });
      },
      eq(field: string, value: string) {
        calls.push({ method: 'eq', value: { field, value } });
        return this;
      },
      maybeSingle() {
        return Promise.resolve({
          data: {
            id: 'pay-1',
            user_id: 'user-1',
            month: '2026-06-01',
            period: 'Czerwiec 2026',
            gross: 8200,
            net: 6380,
            payslip_items: [],
            payslip_advances: [],
          },
          error: null,
        });
      },
    };
    const client = {
      from: jest.fn(() => payslipQuery),
      auth: {
        getUser: jest.fn(),
      },
    };

    const services = createSupabaseServices(client);
    await services.payslips.create({
      userId: 'user-1',
      month: 'Czerwiec 2026',
      gross: 8200,
      net: 6380,
      items: [],
      advances: [],
    });

    expect(client.from).toHaveBeenCalledWith('payslips');
    expect(calls[0]).toEqual({
      method: 'insert',
      value: {
        user_id: 'user-1',
        period: 'Czerwiec 2026',
        gross: 8200,
        net: 6380,
        pdf_uri: null,
      },
    });
  });

  it('creates employees through the server API with the current access token', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        employee: {
          id: 'worker-1',
          name: 'Jan Kowalski',
          initials: 'JK',
          role: 'worker',
          jobTitle: 'Operator',
          tone: '#FF6A1A',
          workStatus: 'off',
          today: 'Wolne',
        },
      }),
    });
    const originalFetch = global.fetch;
    global.fetch = fetchMock as typeof fetch;
    const client = {
      from: jest.fn(),
      auth: {
        getUser: jest.fn(),
        getSession: jest.fn().mockResolvedValue({
          data: { session: { access_token: 'access-token-1' } },
          error: null,
        }),
      },
    };

    try {
      const services = createSupabaseServices(client);
      const employee = await services.employees.create({
        email: 'jan@example.com',
        fullName: 'Jan Kowalski',
        jobTitle: 'Operator',
        temporaryPassword: 'TempPass123!',
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/admin/employees', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer access-token-1',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'jan@example.com',
          fullName: 'Jan Kowalski',
          jobTitle: 'Operator',
          temporaryPassword: 'TempPass123!',
        }),
      });
      expect(employee).toMatchObject({
        id: 'worker-1',
        name: 'Jan Kowalski',
      });
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('lists leave requests without requiring an embedded profiles relationship', async () => {
    const calls: Array<{ method: string; value: unknown }> = [];
    const leaveQuery = {
      select(value: string) {
        calls.push({ method: 'select', value });
        return this;
      },
      order(field: string, options: unknown) {
        calls.push({ method: 'order', value: { field, options } });
        return this;
      },
      then(resolve: (value: unknown) => void) {
        const selectCall = calls.find((call) => call.method === 'select');
        if (String(selectCall?.value).includes('profiles(')) {
          resolve({
            data: null,
            error: {
              message:
                "Could not find a relationship between 'leave_requests' and 'profiles'",
            },
          });
          return;
        }
        resolve({
          data: [
            {
              id: 'leave-1',
              user_id: 'user-1',
              type: 'vacation',
              date_from: '2026-07-01',
              date_to: '2026-07-05',
              comment: '',
              days: 5,
              status: 'pending',
              created_at: '2026-06-16T08:00:00.000Z',
              updated_at: '2026-06-16T08:00:00.000Z',
            },
          ],
          error: null,
        });
      },
    };
    const profilesQuery = {
      select(value: string) {
        calls.push({ method: 'profiles.select', value });
        return this;
      },
      in(field: string, value: string[]) {
        calls.push({ method: 'profiles.in', value: { field, value } });
        return Promise.resolve({
          data: [{ id: 'user-1', full_name: 'Mariusz Kowalczyk' }],
          error: null,
        });
      },
    };
    const client = {
      from: jest.fn((table: string) =>
        table === 'profiles' ? profilesQuery : leaveQuery,
      ),
      auth: {
        getUser: jest.fn(),
      },
    };

    const services = createSupabaseServices(client);
    const leaves = await services.leaves.list();

    expect(calls.find((call) => call.method === 'select')?.value).not.toContain(
      'profiles(',
    );
    expect(leaves).toEqual([
      expect.objectContaining({
        id: 'leave-1',
        userName: 'Mariusz Kowalczyk',
      }),
    ]);
  });

  it('creates leave requests without requiring an embedded profiles relationship', async () => {
    const calls: Array<{ method: string; value: unknown }> = [];
    const query = {
      insert(value: unknown) {
        calls.push({ method: 'insert', value });
        return this;
      },
      select(value: string) {
        calls.push({ method: 'select', value });
        return this;
      },
      single() {
        const selectCall = calls.find((call) => call.method === 'select');
        if (String(selectCall?.value).includes('profiles(')) {
          return Promise.resolve({
            data: null,
            error: {
              message:
                "Could not find a relationship between 'leave_requests' and 'profiles'",
            },
          });
        }
        return Promise.resolve({
          data: {
            id: 'leave-1',
            user_id: 'user-1',
            type: 'care',
            date_from: '2026-07-01',
            date_to: '2026-07-01',
            comment: '',
            days: 1,
            status: 'pending',
            created_at: '2026-06-16T08:00:00.000Z',
            updated_at: '2026-06-16T08:00:00.000Z',
          },
          error: null,
        });
      },
    };
    const client = {
      from: jest.fn(() => query),
      auth: {
        getUser: jest.fn(),
      },
    };

    const services = createSupabaseServices(client);
    const leave = await services.leaves.create({
      userId: 'user-1',
      type: 'care',
      dateFrom: '2026-07-01',
      dateTo: '2026-07-01',
      comment: '',
    });

    expect(calls.find((call) => call.method === 'select')?.value).not.toContain(
      'profiles(',
    );
    expect(leave).toMatchObject({
      id: 'leave-1',
      status: 'pending',
    });
  });

  it('decides leave requests with status and updated_at and returns enriched leave data', async () => {
    const calls: Array<{ method: string; value: unknown }> = [];
    const query = {
      update(value: unknown) {
        calls.push({ method: 'update', value });
        return this;
      },
      eq(field: string, value: string) {
        calls.push({ method: 'eq', value: { field, value } });
        return this;
      },
      select(value: string) {
        calls.push({ method: 'select', value });
        return this;
      },
      single() {
        const selectCall = calls.find((call) => call.method === 'select');
        if (String(selectCall?.value).includes('profiles(')) {
          return Promise.resolve({
            data: null,
            error: {
              message:
                "Could not find a relationship between 'leave_requests' and 'profiles'",
            },
          });
        }
        return Promise.resolve({
          data: {
            id: 'leave-1',
            user_id: 'user-1',
            type: 'care',
            date_from: '2026-07-01',
            date_to: '2026-07-01',
            comment: '',
            days: 1,
            status: 'approved',
            created_at: '2026-06-16T08:00:00.000Z',
            updated_at: '2026-06-16T09:00:00.000Z',
          },
          error: null,
        });
      },
    };
    const client = {
      from: jest.fn(() => query),
      auth: {
        getUser: jest.fn(),
      },
    };

    const services = createSupabaseServices(client);
    const leave = await services.leaves.decide('leave-1', 'approved');

    expect(client.from).toHaveBeenCalledWith('leave_requests');
    expect(calls[0]).toMatchObject({
      method: 'update',
      value: {
        status: 'approved',
        updated_at: expect.any(String),
      },
    });
    const selectCall = calls.find((call) => call.method === 'select');
    expect(selectCall?.value).toContain('updated_at');
    expect(selectCall?.value).not.toContain('profiles(');
    expect(leave).toMatchObject({
      id: 'leave-1',
      status: 'approved',
      updatedAt: '2026-06-16T09:00:00.000Z',
    });
  });
});

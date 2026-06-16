import { createEmployeeAccount } from '@/src/features/employees/createEmployee';

function queryReturning(data: unknown, error: unknown = null) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error }),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  };
}

describe('createEmployeeAccount', () => {
  test('odrzuca tworzenie pracownika przez konto bez roli admin', async () => {
    const userClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'worker-1' } },
          error: null,
        }),
      },
      from: jest.fn(() =>
        queryReturning({
          id: 'worker-1',
          role: 'worker',
          is_active: true,
        }),
      ),
    };
    const adminClient = {
      auth: {
        admin: {
          createUser: jest.fn(),
        },
      },
      from: jest.fn(),
    };

    await expect(
      createEmployeeAccount({
        userClient,
        adminClient,
        input: {
          email: 'worker@example.com',
          fullName: 'Jan Kowalski',
          jobTitle: 'Operator',
          temporaryPassword: 'TempPass123!',
        },
      }),
    ).rejects.toThrow('Brak uprawnien administratora.');

    expect(adminClient.auth.admin.createUser).not.toHaveBeenCalled();
  });

  test('tworzy potwierdzone konto worker i zwraca nowy wiersz employees', async () => {
    const calls: Array<{ table: string; method: string; value: unknown }> = [];
    const adminProfileQuery = queryReturning({
      id: 'admin-1',
      role: 'admin',
      is_active: true,
    });
    const userClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'admin-1' } },
          error: null,
        }),
      },
      from: jest.fn(() => adminProfileQuery),
    };
    let profileUpdateQuery: {
      update: jest.Mock;
      eq: jest.Mock;
      select: jest.Mock;
      single: jest.Mock;
    };
    profileUpdateQuery = {
      update: jest.fn((value: unknown) => {
        calls.push({ table: 'profiles', method: 'update', value });
        return profileUpdateQuery;
      }),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'worker-1' },
        error: null,
      }),
    };
    const employeeQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: 'worker-1',
          full_name: 'Jan Kowalski',
          initials: 'JK',
          role: 'worker',
          job_title: 'Operator',
          tone: '#FF6A1A',
          work_status: 'off',
          today: 'Wolne',
          since: null,
        },
        error: null,
      }),
    };
    const adminClient = {
      auth: {
        admin: {
          createUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'worker-1' } },
            error: null,
          }),
        },
      },
      from: jest.fn((table: string) =>
        table === 'profiles' ? profileUpdateQuery : employeeQuery,
      ),
    };

    const employee = await createEmployeeAccount({
      userClient,
      adminClient,
      input: {
        email: '  Worker@Gmail.com  ',
        fullName: 'Jan Kowalski',
        jobTitle: 'Operator',
        temporaryPassword: 'TempPass123!',
      },
    });

    expect(adminClient.auth.admin.createUser).toHaveBeenCalledWith({
      email: 'worker@gmail.com',
      password: 'TempPass123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Jan Kowalski',
      },
    });
    expect(calls[0]).toEqual({
      table: 'profiles',
      method: 'update',
      value: {
        email: 'worker@gmail.com',
        full_name: 'Jan Kowalski',
        initials: 'JK',
        role: 'worker',
        job_title: 'Operator',
        is_active: true,
        updated_at: expect.any(String),
      },
    });
    expect(employee).toMatchObject({
      id: 'worker-1',
      name: 'Jan Kowalski',
      role: 'worker',
      jobTitle: 'Operator',
    });
  });
});

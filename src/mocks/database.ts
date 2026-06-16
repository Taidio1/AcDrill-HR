import type {
  DocumentRecord,
  Employee,
  IssueReport,
  LeaveRequest,
  Payslip,
  User,
  WorkSession,
} from '@/src/types/entities';

interface MockDatabase {
  users: User[];
  employees: Employee[];
  sessions: WorkSession[];
  payslips: Payslip[];
  documents: DocumentRecord[];
  leaves: LeaveRequest[];
  issues: IssueReport[];
}

const initial = (): MockDatabase => ({
  users: [
    {
      id: 'worker-1',
      name: 'Mariusz Kowalczyk',
      initials: 'MK',
      role: 'worker',
      jobTitle: 'Operator wiertnicy',
    },
    {
      id: 'admin-1',
      name: 'Adam Cieślak',
      initials: 'AC',
      role: 'admin',
      jobTitle: 'Właściciel',
    },
  ] satisfies User[],
  employees: [
    {
      id: 'worker-1',
      name: 'Mariusz Kowalczyk',
      initials: 'MK',
      role: 'worker',
      jobTitle: 'Operator wiertnicy',
      tone: '#FF6A1A',
      workStatus: 'working',
      since: '07:15',
      today: '02:38',
    },
    {
      id: 'worker-2',
      name: 'Grzegorz Dąbrowski',
      initials: 'GD',
      role: 'worker',
      jobTitle: 'Brygadzista',
      tone: '#2563A8',
      workStatus: 'working',
      since: '07:00',
      today: '02:53',
    },
    {
      id: 'worker-3',
      name: 'Krzysztof Lewandowski',
      initials: 'KL',
      role: 'worker',
      jobTitle: 'Operator HDD',
      tone: '#157F4E',
      workStatus: 'working',
      since: '06:50',
      today: '03:03',
    },
    {
      id: 'worker-4',
      name: 'Tomasz Wiśniewski',
      initials: 'TW',
      role: 'worker',
      jobTitle: 'Pomocnik / sygnalista',
      tone: '#7C3AED',
      workStatus: 'working',
      since: '07:20',
      today: '02:33',
    },
    {
      id: 'worker-5',
      name: 'Paweł Zieliński',
      initials: 'PZ',
      role: 'worker',
      jobTitle: 'Pomocnik',
      tone: '#0E7490',
      workStatus: 'working',
      since: '07:25',
      today: '02:28',
    },
    {
      id: 'worker-6',
      name: 'Adam Nowak',
      initials: 'AN',
      role: 'worker',
      jobTitle: 'Kierowca / operator',
      tone: '#B7791F',
      workStatus: 'leave',
      today: 'Urlop',
    },
    {
      id: 'worker-7',
      name: 'Robert Kamiński',
      initials: 'RK',
      role: 'worker',
      jobTitle: 'Operator wiertnicy',
      tone: '#BE185D',
      workStatus: 'off',
      today: 'Wolne',
    },
  ] satisfies Employee[],
  sessions: [
    [
      '2026-06-13T05:05:00.000Z',
      '2026-06-13T15:20:00.000Z',
      'Pruszków, ul. Przemysłowa 14',
    ],
    [
      '2026-06-12T05:10:00.000Z',
      '2026-06-12T14:40:00.000Z',
      'Pruszków, ul. Przemysłowa 14',
    ],
    [
      '2026-06-11T04:55:00.000Z',
      '2026-06-11T13:30:00.000Z',
      'Grodzisk Maz., ul. Kolejowa',
    ],
    [
      '2026-06-10T05:00:00.000Z',
      '2026-06-10T15:05:00.000Z',
      'Grodzisk Maz., ul. Kolejowa',
    ],
    [
      '2026-06-09T05:15:00.000Z',
      '2026-06-09T14:45:00.000Z',
      'Warszawa, Wesoła',
    ],
  ].map(
    ([startedAt, endedAt, label], index) =>
      ({
        id: `session-${index + 1}`,
        userId: 'worker-1',
        startedAt,
        endedAt,
        status: 'completed',
        startLocation: {
          latitude: 52.1675 + index * 0.01,
          longitude: 20.812,
          recordedAt: startedAt,
          address: label,
        },
        endLocation: {
          latitude: 52.1676 + index * 0.01,
          longitude: 20.8121,
          recordedAt: endedAt,
          address: label,
        },
      }) satisfies WorkSession,
  ),
  payslips: [
    {
      id: 'pay-1',
      userId: 'worker-1',
      month: 'Maj 2026',
      gross: 8200,
      net: 6380,
      items: [
        { label: 'Wynagrodzenie zasadnicze', amount: 6500 },
        { label: 'Nadgodziny (18h)', amount: 1100 },
        { label: 'Dodatek za delegacje', amount: 600 },
        { label: 'Składki i zaliczka PIT', amount: -1820 },
      ],
      advances: [
        { id: 'adv-1', userId: 'worker-1', date: '2026-05-12', amount: 1000 },
        { id: 'adv-2', userId: 'worker-1', date: '2026-05-22', amount: 500 },
      ],
    },
    {
      id: 'pay-2',
      userId: 'worker-1',
      month: 'Kwiecień 2026',
      gross: 7900,
      net: 6120,
      items: [],
      advances: [],
    },
    {
      id: 'pay-3',
      userId: 'worker-1',
      month: 'Marzec 2026',
      gross: 8450,
      net: 6540,
      items: [],
      advances: [],
    },
  ] satisfies Payslip[],
  documents: [
    {
      id: 'doc-1',
      userId: 'worker-1',
      name: 'Umowa o pracę',
      category: 'PDF',
      date: '2024-01-02',
      size: '240 KB',
      isNew: false,
    },
    {
      id: 'doc-2',
      userId: 'worker-1',
      name: 'Aneks do umowy — stawka 2026',
      category: 'PDF',
      date: '2026-01-03',
      size: '180 KB',
      isNew: true,
    },
    {
      id: 'doc-3',
      userId: 'all',
      name: 'Szkolenie BHP — zaświadczenie',
      category: 'PDF',
      date: '2026-04-15',
      size: '320 KB',
      isNew: true,
    },
    {
      id: 'doc-4',
      userId: 'worker-1',
      name: 'Badania okresowe',
      category: 'PDF',
      date: '2025-09-12',
      size: '90 KB',
      isNew: false,
    },
  ] satisfies DocumentRecord[],
  leaves: [
    {
      id: 'leave-1',
      userId: 'worker-1',
      type: 'vacation',
      dateFrom: '2026-07-14',
      dateTo: '2026-07-18',
      comment: '',
      days: 5,
      status: 'pending',
    },
    {
      id: 'leave-2',
      userId: 'worker-1',
      type: 'on_demand',
      dateFrom: '2026-05-02',
      dateTo: '2026-05-02',
      comment: '',
      days: 1,
      status: 'approved',
    },
    {
      id: 'leave-3',
      userId: 'worker-1',
      type: 'unpaid',
      dateFrom: '2026-03-10',
      dateTo: '2026-03-10',
      comment: 'Sprawy osobiste',
      days: 1,
      status: 'rejected',
    },
  ] satisfies LeaveRequest[],
  issues: [
    {
      id: 'issue-1',
      userId: 'worker-1',
      userName: 'Mariusz Kowalczyk',
      type: 'breakdown',
      description: 'Vermeer D24x40 — spadek ciśnienia płuczki',
      priority: 'high',
      status: 'in_progress',
      createdAt: '2026-06-14T14:20:00.000Z',
    },
    {
      id: 'issue-2',
      userId: 'worker-4',
      userName: 'Tomasz Wiśniewski',
      type: 'materials',
      description: 'Żerdzie wiertnicze Ø50 — 20 szt.',
      priority: 'medium',
      status: 'new',
      createdAt: '2026-06-15T08:10:00.000Z',
    },
    {
      id: 'issue-3',
      userId: 'worker-2',
      userName: 'Grzegorz Dąbrowski',
      type: 'breakdown',
      description: 'Agregat prądotwórczy — nie odpala',
      priority: 'medium',
      status: 'closed',
      createdAt: '2026-06-09T11:30:00.000Z',
    },
  ] satisfies IssueReport[],
});

export let db = initial();
export function resetDatabase() {
  db = initial();
}

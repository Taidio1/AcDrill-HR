import { differenceInCalendarDays } from 'date-fns';

import type { AppServices } from '@/src/services/contracts';
import { db, resetDatabase } from './database';

const wait = async () => new Promise((resolve) => setTimeout(resolve, 30));
const id = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const mockServices: AppServices = {
  auth: {
    async login(role) {
      await wait();
      return db.users.find((user) => user.role === role)!;
    },
  },
  workSessions: {
    async list(userId) {
      await wait();
      return [...db.sessions]
        .filter((session) => !userId || session.userId === userId)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    },
    async get(sessionId) {
      await wait();
      return db.sessions.find((session) => session.id === sessionId);
    },
    async start(input) {
      await wait();
      const session = {
        ...input,
        id: id('session'),
        status: 'active' as const,
      };
      db.sessions.unshift(session);
      return session;
    },
    async stop(sessionId, input) {
      await wait();
      const session = db.sessions.find((item) => item.id === sessionId);
      if (!session) throw new Error('Nie znaleziono sesji.');
      Object.assign(session, input, { status: 'completed' as const });
      return session;
    },
    async update(sessionId, input) {
      await wait();
      const session = db.sessions.find((item) => item.id === sessionId);
      if (!session) throw new Error('Nie znaleziono sesji.');
      Object.assign(session, input);
      return session;
    },
  },
  payslips: {
    async list(userId) {
      await wait();
      return db.payslips.filter((item) => !userId || item.userId === userId);
    },
    async get(payslipId) {
      await wait();
      return db.payslips.find((item) => item.id === payslipId);
    },
    async create(input) {
      await wait();
      const payslip = { ...input, id: id('pay') };
      db.payslips.unshift(payslip);
      return payslip;
    },
    async addAdvance(payslipId, amount, date) {
      await wait();
      const payslip = db.payslips.find((item) => item.id === payslipId);
      if (!payslip) throw new Error('Nie znaleziono paska.');
      payslip.advances.push({
        id: id('adv'),
        userId: payslip.userId,
        amount,
        date,
      });
      return payslip;
    },
  },
  documents: {
    async list(userId) {
      await wait();
      return db.documents.filter(
        (item) => !userId || item.userId === userId || item.userId === 'all',
      );
    },
    async get(documentId) {
      await wait();
      return db.documents.find((item) => item.id === documentId);
    },
    async markRead(documentId) {
      await wait();
      const document = db.documents.find((item) => item.id === documentId);
      if (!document) throw new Error('Nie znaleziono dokumentu.');
      document.isNew = false;
      return document;
    },
    async create(input) {
      await wait();
      const document = { ...input, id: id('doc') };
      db.documents.unshift(document);
      return document;
    },
  },
  leaves: {
    async list(userId) {
      await wait();
      return db.leaves.filter((item) => !userId || item.userId === userId);
    },
    async balance() {
      await wait();
      return { available: 18, used: 8, annual: 26 };
    },
    async create(input) {
      await wait();
      const leave = {
        ...input,
        id: id('leave'),
        days: differenceInCalendarDays(input.dateTo, input.dateFrom) + 1,
        status: 'pending' as const,
      };
      db.leaves.unshift(leave);
      return leave;
    },
    async decide(leaveId, status) {
      await wait();
      const leave = db.leaves.find((item) => item.id === leaveId);
      if (!leave) throw new Error('Nie znaleziono wniosku.');
      leave.status = status;
      return leave;
    },
  },
  issues: {
    async list(userId) {
      await wait();
      return db.issues.filter((item) => !userId || item.userId === userId);
    },
    async create(input) {
      await wait();
      const employee = db.employees.find((item) => item.id === input.userId);
      const issue = {
        ...input,
        userName: input.userName ?? employee?.name,
        id: id('issue'),
        createdAt: new Date().toISOString(),
        status: 'new' as const,
      };
      db.issues.unshift(issue);
      return issue;
    },
    async updateStatus(issueId, status) {
      await wait();
      const issue = db.issues.find((item) => item.id === issueId);
      if (!issue) throw new Error('Nie znaleziono zgłoszenia.');
      issue.status = status;
      return issue;
    },
    async remove(issueId) {
      await wait();
      const index = db.issues.findIndex((item) => item.id === issueId);
      if (index === -1) throw new Error('Nie znaleziono zgłoszenia.');
      db.issues.splice(index, 1);
    },
  },
  employees: {
    async list() {
      await wait();
      return [...db.employees];
    },
    async get(employeeId) {
      await wait();
      return db.employees.find((item) => item.id === employeeId);
    },
    async create(input) {
      await wait();
      const parts = input.fullName.trim().split(/\s+/);
      const employee = {
        id: id('worker'),
        name: input.fullName.trim(),
        initials:
          parts
            .slice(0, 2)
            .map((part) => part.charAt(0).toLocaleUpperCase('pl'))
            .join('') || 'P',
        role: 'worker' as const,
        jobTitle: input.jobTitle.trim(),
        tone: '#FF6A1A',
        workStatus: 'off' as const,
        today: 'Wolne',
      };
      db.employees.unshift(employee);
      return employee;
    },
  },
  pushSubscriptions: {
    async save() {
      await wait();
    },
    async remove() {
      await wait();
    },
  },
};

export function resetMockDatabase() {
  resetDatabase();
}

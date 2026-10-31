import { Repository } from '../types/vva';

export const SAMPLE_REPOSITORIES: Repository[] = [
  {
    id: 'minidesk',
    name: 'MiniDesk',
    description: 'Cloud ticket-management and customer support orchestrator',
    path: '/workspace/projects/minidesk',
    currentBranch: 'main',
    branches: ['main', 'feature/ticket-filter', 'fix/validation-bug'],
    commits: [
      {
        hash: 'e8f190c74b88d423984501a239b03947e5b290df',
        shortHash: 'e8f190c',
        parentHash: '7a2c89b418d193d5089f2a44bb012c85e2b92134',
        author: 'Abhiram Binil',
        email: 'Abhirambinil1@gmail.com',
        date: '2026-10-19 10:45:00 UTC',
        message: 'Add ticket filtering and status query parameters',
        branch: 'main',
        diffSummary: {
          filesChanged: 2,
          insertions: 38,
          deletions: 4,
        },
        changedFiles: [
          {
            file: 'src/tickets/ticket.controller.js',
            status: 'M',
            additions: 26,
            deletions: 4,
            content: `import { TicketService } from '../services/ticket.service.js';
import { validateFilterQuery } from '../middleware/filterValidator.js';

export class TicketController {
  constructor() {
    this.ticketService = new TicketService();
  }

  async getTickets(req, res) {
    try {
      const { status, priority, assigneeId, search, page = 1, limit = 20 } = req.query;
      
      const filterCriteria = {
        ...(status && { status: status.toUpperCase() }),
        ...(priority && { priority: priority.toLowerCase() }),
        ...(assigneeId && { assigneeId }),
        ...(search && { searchTerm: search.trim() })
      };

      const result = await this.ticketService.findTicketsWithFilters({
        filters: filterCriteria,
        pagination: { page: Number(page), limit: Number(limit) }
      });

      return res.status(200).json({
        success: true,
        data: result.tickets,
        meta: result.pagination
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}`,
            diff: `@@ -12,8 +12,30 @@ export class TicketController {
   async getTickets(req, res) {
     try {
-      const tickets = await this.ticketService.findAll();
-      return res.status(200).json({ success: true, data: tickets });
+      const { status, priority, assigneeId, search, page = 1, limit = 20 } = req.query;
+      
+      const filterCriteria = {
+        ...(status && { status: status.toUpperCase() }),
+        ...(priority && { priority: priority.toLowerCase() }),
+        ...(assigneeId && { assigneeId }),
+        ...(search && { searchTerm: search.trim() })
+      };
+
+      const result = await this.ticketService.findTicketsWithFilters({
+        filters: filterCriteria,
+        pagination: { page: Number(page), limit: Number(limit) }
+      });
+
+      return res.status(200).json({
+        success: true,
+        data: result.tickets,
+        meta: result.pagination
+      });
     } catch (error) {
       return res.status(500).json({ error: error.message });
     }`
          },
          {
            file: 'src/tickets/ticket.service.js',
            status: 'M',
            additions: 12,
            deletions: 0,
            content: `export class TicketService {
  // ... existing database pool logic ...
  
  async findTicketsWithFilters({ filters, pagination }) {
    const query = this.db('tickets');
    
    if (filters.status) query.where('status', filters.status);
    if (filters.priority) query.where('priority', filters.priority);
    if (filters.assigneeId) query.where('assignee_id', filters.assigneeId);
    if (filters.searchTerm) {
      query.whereILike('subject', \`%\${filters.searchTerm}%\`);
    }

    const tickets = await query
      .offset((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit);

    return { tickets, pagination };
  }
}`,
            diff: `@@ -45,4 +45,16 @@ export class TicketService {
+  async findTicketsWithFilters({ filters, pagination }) {
+    const query = this.db('tickets');
+    if (filters.status) query.where('status', filters.status);
+    if (filters.priority) query.where('priority', filters.priority);
+    if (filters.assigneeId) query.where('assignee_id', filters.assigneeId);
+    if (filters.searchTerm) {
+      query.whereILike('subject', \`%\${filters.searchTerm}%\`);
+    }
+    const tickets = await query.offset((pagination.page - 1) * pagination.limit).limit(pagination.limit);
+    return { tickets, pagination };
+  }`
          }
        ]
      },
      {
        hash: '7a2c89b418d193d5089f2a44bb012c85e2b92134',
        shortHash: '7a2c89b',
        parentHash: '4d8f1e63a19b2c3408a0ef98c91a0b380f551c90',
        author: 'Abhiram Binil',
        email: 'Abhirambinil1@gmail.com',
        date: '2026-10-18 16:30:10 UTC',
        message: 'Fix ticket assignment race condition and update status enum',
        branch: 'main',
        diffSummary: {
          filesChanged: 1,
          insertions: 14,
          deletions: 5,
        },
        changedFiles: [
          {
            file: 'src/tickets/assignment.worker.js',
            status: 'M',
            additions: 14,
            deletions: 5,
            content: `export async function assignTicketSafely(ticketId, agentId) {
  return await db.transaction(async (trx) => {
    const lockedTicket = await trx('tickets')
      .where({ id: ticketId })
      .forUpdate()
      .first();

    if (lockedTicket.assignee_id) {
      throw new Error('Ticket is already claimed by another agent');
    }

    return await trx('tickets')
      .where({ id: ticketId })
      .update({ assignee_id: agentId, status: 'IN_PROGRESS', updated_at: new Date() });
  });
}`,
            diff: `@@ -8,5 +8,14 @@ export async function assignTicket(ticketId, agentId) {
-  const ticket = await db('tickets').where({ id: ticketId }).first();
-  return await db('tickets').where({ id: ticketId }).update({ assignee_id: agentId });
+  return await db.transaction(async (trx) => {
+    const lockedTicket = await trx('tickets').where({ id: ticketId }).forUpdate().first();
+    if (lockedTicket.assignee_id) {
+      throw new Error('Ticket is already claimed by another agent');
+    }
+    return await trx('tickets').where({ id: ticketId }).update({ assignee_id: agentId, status: 'IN_PROGRESS', updated_at: new Date() });
+  });`
          }
        ]
      },
      {
        hash: '4d8f1e63a19b2c3408a0ef98c91a0b380f551c90',
        shortHash: '4d8f1e6',
        parentHash: '1a90c4f801e8a93cb029a1738c8290192837bcde',
        author: 'Abhiram Binil',
        email: 'Abhirambinil1@gmail.com',
        date: '2026-10-17 14:15:00 UTC',
        message: 'Remove deprecated legacy XML exporter module',
        branch: 'main',
        diffSummary: {
          filesChanged: 1,
          insertions: 0,
          deletions: 42,
        },
        changedFiles: [
          {
            file: 'src/legacy/xmlExporter.js',
            status: 'D', // Deleted file edge-case
            additions: 0,
            deletions: 42,
            content: `// [VVA Collector Note: Captured from parent commit 1a90c4f8 before deletion]
export function exportToLegacyXml(ticketList) {
  let xml = '<tickets>';
  for (const t of ticketList) {
    xml += \`<ticket id="\${t.id}"><title>\${t.title}</title></ticket>\`;
  }
  return xml + '</tickets>';
}`,
            diff: `@@ -1,42 +0,0 @@
-// Legacy XML Exporter - superseded by JSON/PDF pipeline
-export function exportToLegacyXml(ticketList) {
-  let xml = '<tickets>';
-  for (const t of ticketList) {
-    xml += \`<ticket id="\${t.id}"><title>\${t.title}</title></ticket>\`;
-  }
-  return xml + '</tickets>';
-}`
          }
        ]
      }
    ]
  },
  {
    id: 'authvault',
    name: 'AuthVault',
    description: 'Stateless OAuth2 & JWT Identity Provider Microservice',
    path: '/workspace/projects/authvault',
    currentBranch: 'main',
    branches: ['main', 'security-audit'],
    commits: [
      {
        hash: '3c91af20b4109e8d35091823019fba82910381fa',
        shortHash: '3c91af2',
        parentHash: '9b183a0429f9821a8901239841029cba8712398a',
        author: 'Abhiram Binil',
        email: 'Abhirambinil1@gmail.com',
        date: '2026-10-19 09:12:30 UTC',
        message: 'Implement JWT authentication and refresh token rotation',
        branch: 'main',
        diffSummary: {
          filesChanged: 2,
          insertions: 64,
          deletions: 8,
        },
        changedFiles: [
          {
            file: 'src/auth/jwt.js',
            status: 'A', // Added file
            additions: 44,
            deletions: 0,
            content: `import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_vva';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev_refresh_key_vva';

export function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
    algorithm: 'HS256'
  });
}

export function signRefreshToken(userId) {
  const token = crypto.randomBytes(40).toString('hex');
  return {
    refreshToken: token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}`,
            diff: `@@ -0,0 +1,44 @@
+import jwt from 'jsonwebtoken';
+import crypto from 'crypto';
+
+const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_vva';
+const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev_refresh_key_vva';
+
+export function signAccessToken(payload) {
+  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m', algorithm: 'HS256' });
+}
+
+export function signRefreshToken(userId) {
+  const token = crypto.randomBytes(40).toString('hex');
+  return { refreshToken: token, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) };
+}`
          },
          {
            file: 'src/auth/login.js',
            status: 'M',
            additions: 20,
            deletions: 8,
            content: `import bcrypt from 'bcrypt';
import { signAccessToken, signRefreshToken } from './jwt.js';
import { db } from '../db.js';

export async function loginHandler(req, res) {
  const { email, password } = req.body;
  const user = await db('users').where({ email }).first();

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const { refreshToken, expiresAt } = signRefreshToken(user.id);

  await db('refresh_tokens').insert({ user_id: user.id, token: refreshToken, expires_at: expiresAt });

  return res.json({ accessToken, refreshToken });
}`,
            diff: `@@ -6,8 +6,20 @@ export async function loginHandler(req, res) {
   if (!user || !(await bcrypt.compare(password, user.password_hash))) {
     return res.status(401).json({ error: 'Invalid credentials' });
   }
-  req.session.userId = user.id;
-  return res.json({ status: 'ok' });
+  const accessToken = signAccessToken({ id: user.id, role: user.role });
+  const { refreshToken, expiresAt } = signRefreshToken(user.id);
+  await db('refresh_tokens').insert({ user_id: user.id, token: refreshToken, expires_at: expiresAt });
+  return res.json({ accessToken, refreshToken });
 }`
          }
        ]
      }
    ]
  }
];

export const INITIAL_VVA_CONFIG = {
  version: '1.0.0-rc1',
  defaultFormat: 'all' as const,
  outputDir: '.vva/output',
  aiProvider: 'nvidia' as const,
  aiModel: 'openai/gpt-oss-20b',
  maxDiffSizeBytes: 1048576, // 1MB payload cap
  includePreviousVersionOnDelete: true,
  team: {
    leadOrchestration: 'Abhiram Binil (Person 1)',
    aiEngine: 'Vishnu G Pillai (Person 2)',
    documentEngine: 'Vinay Bisht (Person 3)'
  }
};

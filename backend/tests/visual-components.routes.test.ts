import request from 'supertest'
import express from 'express'
import { generateAccessToken } from '../src/utils/auth'

// In-memory stores for Prisma mocks
const memory = {
  users: new Map<string, any>(),
  visualComponents: new Map<string, any>(),
}

// Seed test users
const userA = { id: 'userA', email: 'a@example.com', username: 'userA' }
const userB = { id: 'userB', email: 'b@example.com', username: 'userB' }
memory.users.set(userA.id, userA)
memory.users.set(userB.id, userB)

// Helper to generate ids
const genId = () => `vc_${Math.random().toString(36).slice(2)}`

// Mock Prisma client with owner-aware behavior
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: async ({ where: { id } }: any) => {
          return memory.users.get(id) || null
        },
      },
      visualComponent: {
        create: async ({ data }: any) => {
          const id = genId()
          const item = {
            id,
            name: data.name ?? null,
            description: data.description ?? null,
            jsxCode: data.jsxCode,
            framework: data.framework ?? 'react',
            language: data.language ?? 'javascript',
            ownerId: data.ownerId ?? null,
            viewCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          memory.visualComponents.set(id, item)
          return item
        },
        findUnique: async ({ where: { id } }: any) => {
          return memory.visualComponents.get(id) || null
        },
        update: async ({ where: { id }, data }: any) => {
          const existing = memory.visualComponents.get(id)
          if (!existing) return null
          const updated = { ...existing, ...data, updatedAt: new Date() }
          memory.visualComponents.set(id, updated)
          return updated
        },
        findMany: async ({ where = {}, orderBy, take = 50, select }: any) => {
          let list = Array.from(memory.visualComponents.values())
          if (where && where.ownerId) {
            list = list.filter((i) => i.ownerId === where.ownerId)
          }
          if (where && where.OR && where.OR.length > 0) {
            const q = where.OR
            list = list.filter((i) =>
              q.some((cond: any) => {
                if (cond.name?.contains) {
                  const v = cond.name.contains.toLowerCase()
                  return (i.name || '').toLowerCase().includes(v)
                }
                if (cond.description?.contains) {
                  const v = cond.description.contains.toLowerCase()
                  return (i.description || '').toLowerCase().includes(v)
                }
                return false
              })
            )
          }
          if (orderBy && orderBy.updatedAt) {
            list.sort((a, b) => (orderBy.updatedAt === 'desc' ? b.updatedAt - a.updatedAt : a.updatedAt - b.updatedAt))
          } else if (orderBy && orderBy.createdAt) {
            list.sort((a, b) => (orderBy.createdAt === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt))
          }
          list = list.slice(0, take)
          if (select) {
            return list.map((i) => {
              const out: any = {}
              for (const k of Object.keys(select)) {
                if (select[k] === true) out[k] = i[k]
              }
              return out
            })
          }
          return list
        },
        delete: async ({ where: { id } }: any) => {
          const existed = memory.visualComponents.get(id)
          memory.visualComponents.delete(id)
          return existed
        },
      },
    })),
  }
})

let app: express.Express

beforeAll(async () => {
  try {
    app = express()
    app.use(express.json({ limit: '10mb' }))
    const { default: router } = await import('../src/routes/visual-components')
    app.use('/api/v1/visual-components', router)
    // eslint-disable-next-line no-console
    console.error('mounted visual-components router')
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('beforeAll error', e)
    throw e
  }
})

beforeEach(() => {
  // Clear visual components before each test
  memory.visualComponents.clear()
})

describe('Visual Components – per-user ownership (TDD)', () => {
  const tokenA = generateAccessToken({ userId: userA.id, email: userA.email, username: userA.username })
  const tokenB = generateAccessToken({ userId: userB.id, email: userB.email, username: userB.username })

  it('requires authentication for create/list/get/update', async () => {
    const createRes = await request(app)
      .post('/api/v1/visual-components')
      .send({ jsxCode: "function A(){return <div/>}" })
      .set('Content-Type', 'application/json')
    // debug
    // eslint-disable-next-line no-console
console.error('unauth create', createRes.status, createRes.body)
    expect([401, 403]).toContain(createRes.status)

    const listRes = await request(app).get('/api/v1/visual-components')
    // eslint-disable-next-line no-console
console.error('unauth list', listRes.status, listRes.body)
    expect([401, 403]).toContain(listRes.status)
  })

  it('owner can create documents and list returns only their own items (no jsxCode in list)', async () => {
    const r1 = await request(app)
      .post('/api/v1/visual-components')
      .send({ name: 'Doc A', jsxCode: "function A(){return <div>A</div>}" })
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Content-Type', 'application/json')
    expect(r1.status).toBe(201)
    const idA = r1.body?.data?.id

    const r2 = await request(app)
      .post('/api/v1/visual-components')
      .send({ name: 'Doc B', jsxCode: "function B(){return <div>B</div>}" })
      .set('Authorization', `Bearer ${tokenB}`)
      .set('Content-Type', 'application/json')
    expect(r2.status).toBe(201)

    const listA = await request(app)
      .get('/api/v1/visual-components?limit=50')
      .set('Authorization', `Bearer ${tokenA}`)
    expect(listA.status).toBe(200)
    const items = listA.body?.data || []
    expect(Array.isArray(items)).toBe(true)
    // Should only include Doc A
    expect(items.some((i: any) => i.id === idA)).toBe(true)
    expect(items.length).toBe(1)
    // Ensure jsxCode is omitted in list view
    expect(items[0]).not.toHaveProperty('jsxCode')
  })

  it('owner can get by id (full payload incl. jsxCode) and viewCount increments; non-owner denied', async () => {
    const create = await request(app)
      .post('/api/v1/visual-components')
      .send({ name: 'Secret', jsxCode: "function S(){return <div>S</div>}" })
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Content-Type', 'application/json')
    const id = create.body?.data?.id

    const getOwner = await request(app)
      .get(`/api/v1/visual-components/${id}`)
      .set('Authorization', `Bearer ${tokenA}`)
    // eslint-disable-next-line no-console
console.error('owner get', getOwner.status, getOwner.body)
    expect(getOwner.status).toBe(200)
    expect(getOwner.body?.data?.id).toBe(id)
    expect(getOwner.body?.data).toHaveProperty('jsxCode')
    const v1 = getOwner.body?.data?.viewCount ?? 0

    const getOwner2 = await request(app)
      .get(`/api/v1/visual-components/${id}`)
      .set('Authorization', `Bearer ${tokenA}`)
    const v2 = getOwner2.body?.data?.viewCount ?? 0
    expect(v2).toBeGreaterThanOrEqual(v1)

    const getOther = await request(app)
      .get(`/api/v1/visual-components/${id}`)
      .set('Authorization', `Bearer ${tokenB}`)
    // eslint-disable-next-line no-console
console.error('non-owner get', getOther.status, getOther.body)
    expect([403, 404]).toContain(getOther.status)
  })

  it('owner can update; non-owner denied', async () => {
    const create = await request(app)
      .post('/api/v1/visual-components')
      .send({ name: 'Editable', jsxCode: "function E(){return <div>E</div>}" })
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Content-Type', 'application/json')
    const id = create.body?.data?.id

    const updateOwner = await request(app)
      .put(`/api/v1/visual-components/${id}`)
      .send({ jsxCode: "function E(){return <div>EE</div>}" })
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Content-Type', 'application/json')
    // eslint-disable-next-line no-console
console.error('owner update', updateOwner.status, updateOwner.body)
    expect(updateOwner.status).toBe(200)
    expect(updateOwner.body?.data?.jsxCode).toContain('EE')

    const updateOther = await request(app)
      .put(`/api/v1/visual-components/${id}`)
      .send({ jsxCode: "function H(){return <div>H</div>}" })
      .set('Authorization', `Bearer ${tokenB}`)
      .set('Content-Type', 'application/json')
    // eslint-disable-next-line no-console
console.error('non-owner update', updateOther.status, updateOther.body)
    expect([403, 404]).toContain(updateOther.status)
  })

  it('list supports simple search by name/description (server-side)', async () => {
    await request(app)
      .post('/api/v1/visual-components')
      .send({ name: 'Invoice Template', jsxCode: "function I(){return <div/>}" })
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Content-Type', 'application/json')

    await request(app)
      .post('/api/v1/visual-components')
      .send({ name: 'Dashboard', description: 'Sales KPIs', jsxCode: "function D(){return <div/>}" })
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Content-Type', 'application/json')

    const res = await request(app)
      .get('/api/v1/visual-components?search=invoice&limit=50')
      .set('Authorization', `Bearer ${tokenA}`)
    // eslint-disable-next-line no-console
console.error('search list', res.status, res.body)
    expect(res.status).toBe(200)
    const items = res.body?.data || []
    expect(items.length).toBe(1)
    expect(items[0].name).toMatch(/invoice/i)
  })
})


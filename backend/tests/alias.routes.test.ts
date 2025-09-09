import request from 'supertest'
import express from 'express'
// Mock Prisma to avoid real DB in tests
const memoryStore: Record<string, any> = {}

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      visualComponent: {
        create: async ({ data }: any) => {
          const id = `test_${Math.random().toString(36).slice(2)}`
          const item = {
            id,
            name: data.name ?? null,
            jsxCode: data.jsxCode,
            description: data.description ?? null,
            framework: data.framework ?? 'react',
            language: data.language ?? 'javascript',
            viewCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          memoryStore[id] = item
          return item
        },
        findUnique: async ({ where: { id } }: any) => memoryStore[id] || null,
        update: async ({ where: { id }, data }: any) => {
          const existing = memoryStore[id]
          if (!existing) return null
          const updated = { ...existing, ...data, updatedAt: new Date() }
          memoryStore[id] = updated
          return updated
        },
      },
    })),
  }
})

// Build a minimal app mounting only the alias routes under /api/v1
let app: express.Express

beforeAll(async () => {
  app = express()
  app.use(express.json({ limit: '10mb' }))
  try {
    const { default: aliasRouter } = await import('../src/routes/aliases')
    app.use('/api/v1', aliasRouter)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('beforeAll import error:', e)
    throw e
  }
})

describe('Alias API routes (/component, /preview)', () => {
  const jsxA = "function A(){return <div>Hello</div>}"
  const jsxB = "function A(){return <span>Updated</span>}"
  let createdId: string

  it('POST /api/v1/component should create a component and return 201 with id', async () => {
    const res = await request(app)
      .post('/api/v1/component')
      .send({ jsxCode: jsxA, name: 'TestComponent' })
      .set('Content-Type', 'application/json')

    if (res.status !== 201) {
      // eslint-disable-next-line no-console
      console.error('Create response:', res.status, res.body)
    }
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('success', true)
    expect(res.body).toHaveProperty('data')
    createdId = res.body.data.id
    expect(typeof createdId).toBe('string')
    expect(createdId.length).toBeGreaterThan(0)
  })

  it('GET /api/v1/preview/:id should fetch the created component', async () => {
    const res = await request(app).get(`/api/v1/preview/${createdId}`)
    if (res.status !== 200) {
      // eslint-disable-next-line no-console
      console.error('Preview response:', res.status, res.body)
    }
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('success', true)
    expect(res.body.data).toHaveProperty('id', createdId)
    expect(res.body.data).toHaveProperty('jsxCode')
  })

  it('PUT /api/v1/component/:id should update jsxCode', async () => {
    const res = await request(app)
      .put(`/api/v1/component/${createdId}`)
      .send({ jsxCode: jsxB })
      .set('Content-Type', 'application/json')

    if (res.status !== 200) {
      // eslint-disable-next-line no-console
      console.error('Update response:', res.status, res.body)
    }
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('success', true)
    expect(res.body.data).toHaveProperty('id', createdId)
    expect(res.body.data).toHaveProperty('jsxCode')
  })

  it('POST /api/v1/component should 400 when jsxCode missing', async () => {
    const res = await request(app)
      .post('/api/v1/component')
      .send({})
      .set('Content-Type', 'application/json')

    if (res.status !== 400) {
      // eslint-disable-next-line no-console
      console.error('Validation response:', res.status, res.body)
    }
    expect(res.status).toBe(400)
  })

  it('GET /api/v1/preview/:id should 404 for unknown id', async () => {
    const res = await request(app).get('/api/v1/preview/unknown_id')
    if (![404, 400].includes(res.status)) {
      // eslint-disable-next-line no-console
      console.error('Not found response:', res.status, res.body)
    }
    expect([404, 400]).toContain(res.status)
  })
})

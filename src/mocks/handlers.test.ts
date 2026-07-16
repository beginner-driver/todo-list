import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

beforeEach(() => {
  localStorage.clear()
})

describe('GET /api/todos', () => {
  it('빈 목록을 반환한다', async () => {
    const res = await fetch('/api/todos')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })
})

describe('POST /api/todos', () => {
  it('title이 있으면 201과 생성된 todo를 반환한다', async () => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '할 일 1' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.title).toBe('할 일 1')
  })

  it('title이 비어있으면 400을 반환한다', async () => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/todos/:id', () => {
  it('존재하지 않는 id면 404를 반환한다', async () => {
    const res = await fetch('/api/todos/없는id', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/todos/:id', () => {
  it('존재하지 않는 id면 404를 반환한다', async () => {
    const res = await fetch('/api/todos/없는id', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })
})

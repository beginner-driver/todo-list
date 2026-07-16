import { http, HttpResponse } from 'msw'
import { getAll, create, update, remove } from './db'

export const handlers = [
  http.get('/api/todos', () => {
    return HttpResponse.json(getAll())
  }),

  http.post('/api/todos', async ({ request }) => {
    const body = (await request.json()) as { title?: string }
    if (!body.title || !body.title.trim()) {
      return HttpResponse.json({ message: 'title is required' }, { status: 400 })
    }
    return HttpResponse.json(create(body.title.trim()), { status: 201 })
  }),

  http.patch('/api/todos/:id', async ({ params, request }) => {
    const body = (await request.json()) as { title?: string; completed?: boolean }
    if (body.title !== undefined && !body.title.trim()) {
      return HttpResponse.json({ message: 'title is required' }, { status: 400 })
    }
    const updated = update(params.id as string, body)
    if (!updated) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 })
    }
    return HttpResponse.json(updated)
  }),

  http.delete('/api/todos/:id', ({ params }) => {
    const ok = remove(params.id as string)
    if (!ok) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),
]

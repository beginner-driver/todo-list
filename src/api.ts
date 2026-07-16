import type { Todo } from './types'

const BASE = '/api/todos'

export async function getTodos(): Promise<Todo[]> {
  const res = await fetch(BASE)
  if (!res.ok) throw new Error('failed to fetch todos')
  return res.json()
}

export async function createTodo(title: string): Promise<Todo> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error('failed to create todo')
  return res.json()
}

export async function updateTodo(
  id: string,
  patch: Partial<Pick<Todo, 'title' | 'completed'>>,
): Promise<Todo> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('failed to update todo')
  return res.json()
}

export async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('failed to delete todo')
}

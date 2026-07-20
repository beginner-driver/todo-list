# todo-list 전체 소스 코드

beginner-driver/todo-list 저장소의 전체 프로그램 코드 모음. lock 파일과 빌드 산출물(dist, .tsbuildinfo, 컴파일된 vite.config.js/d.ts)은 제외했다.

## `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## `.gitignore`

```
node_modules
dist
dist-ssr
*.local
.DS_Store
*.tsbuildinfo
vite.config.js
vite.config.d.ts
```

## `index.html`

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Todo 앱</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## `package.json`

```json
{
  "name": "todo-list",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "msw": "^2.4.9"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.2",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.9",
    "vitest": "^2.1.3"
  },
  "msw": {
    "workerDirectory": [
      "public"
    ]
  }
}```

## `public/mock-data/todos.json`

```json
[
  { "id": "seed-1", "title": "Todo 앱 PRD 만들기", "completed": true, "createdAt": "2026-07-16T00:00:00.000Z" },
  { "id": "seed-2", "title": "프론트엔드/백엔드 프레임워크 결정", "completed": false, "createdAt": "2026-07-16T00:00:00.000Z" }
]
```

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "types": ["vitest/globals", "vite/client"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## `tsconfig.node.json`

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

## `vite.config.ts`

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/todo-list/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

## `src/main.tsx`

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { seedIfEmpty } from './mocks/db'

async function seedInitialData() {
  const res = await fetch(`${import.meta.env.BASE_URL}mock-data/todos.json`)
  const initial = await res.json()
  seedIfEmpty(initial)
}

async function enableMocking() {
  const { worker } = await import('./mocks/browser')
  return worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
}

async function bootstrap() {
  await seedInitialData()
  await enableMocking()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
```

## `src/App.tsx`

```tsx
import { useEffect, useState } from 'react'
import type { Filter, Todo } from './types'
import { getTodos, createTodo, updateTodo, deleteTodo } from './api'
import TodoForm from './components/TodoForm'
import TodoList from './components/TodoList'
import FilterBar from './components/FilterBar'
import './App.css'

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    getTodos().then(setTodos)
  }, [])

  async function handleAdd(title: string) {
    const todo = await createTodo(title)
    setTodos((prev) => [...prev, todo])
  }

  async function handleToggle(id: string, completed: boolean) {
    const updated = await updateTodo(id, { completed })
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)))
  }

  async function handleEdit(id: string, title: string) {
    const updated = await updateTodo(id, { title })
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)))
  }

  async function handleDelete(id: string) {
    await deleteTodo(id)
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const visibleTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  return (
    <div className="app">
      <h1>Todo</h1>
      <TodoForm onAdd={handleAdd} />
      <FilterBar value={filter} onChange={setFilter} />
      <TodoList
        todos={visibleTodos}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}

export default App
```

## `src/App.css`

```css
.app {
  max-width: 480px;
  margin: 40px auto;
  padding: 0 16px;
}

.todo-form {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.todo-form input {
  flex: 1;
}

.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-bar button.active {
  font-weight: bold;
  text-decoration: underline;
}

.todo-list {
  list-style: none;
  padding: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.todo-item .completed {
  text-decoration: line-through;
  color: #888;
}
```

## `src/App.test.tsx`

```tsx
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'
import { seedIfEmpty } from './mocks/db'
import App from './App'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

beforeEach(() => {
  localStorage.clear()
  seedIfEmpty([
    { id: '1', title: '완료된 일', completed: true, createdAt: '2026-01-01T00:00:00.000Z' },
    { id: '2', title: '미완료 일', completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
  ])
})

describe('필터', () => {
  it('완료 필터를 누르면 완료된 항목만 보인다', async () => {
    render(<App />)
    await waitFor(() => screen.getByText('완료된 일'))

    fireEvent.click(screen.getByText('완료'))

    expect(screen.getByText('완료된 일')).toBeInTheDocument()
    expect(screen.queryByText('미완료 일')).not.toBeInTheDocument()
  })

  it('미완료 필터를 누르면 미완료 항목만 보인다', async () => {
    render(<App />)
    await waitFor(() => screen.getByText('완료된 일'))

    fireEvent.click(screen.getByText('미완료'))

    expect(screen.queryByText('완료된 일')).not.toBeInTheDocument()
    expect(screen.getByText('미완료 일')).toBeInTheDocument()
  })
})
```

## `src/api.ts`

```ts
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
```

## `src/api.test.ts`

```ts
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'
import { getTodos, createTodo, updateTodo, deleteTodo } from './api'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

beforeEach(() => {
  localStorage.clear()
})

describe('api client', () => {
  it('createTodo -> getTodos로 조회된다', async () => {
    await createTodo('장보기')
    const todos = await getTodos()
    expect(todos).toHaveLength(1)
    expect(todos[0].title).toBe('장보기')
  })

  it('updateTodo로 완료 처리한다', async () => {
    const todo = await createTodo('장보기')
    const updated = await updateTodo(todo.id, { completed: true })
    expect(updated.completed).toBe(true)
  })

  it('deleteTodo로 삭제한다', async () => {
    const todo = await createTodo('장보기')
    await deleteTodo(todo.id)
    expect(await getTodos()).toHaveLength(0)
  })
})
```

## `src/types.ts`

```ts
export interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

export type Filter = 'all' | 'active' | 'completed'
```

## `src/index.css`

```css
body {
  margin: 0;
  font-family: system-ui, sans-serif;
}
```

## `src/components/TodoForm.tsx`

```tsx
import { useState } from 'react'
import type { FormEvent } from 'react'

interface Props {
  onAdd: (title: string) => void
}

function TodoForm({ onAdd }: Props) {
  const [title, setTitle] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd(title.trim())
    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} className="todo-form">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="할 일을 입력하세요"
      />
      <button type="submit">추가</button>
    </form>
  )
}

export default TodoForm
```

## `src/components/TodoList.tsx`

```tsx
import type { Todo } from '../types'
import TodoItem from './TodoItem'

interface Props {
  todos: Todo[]
  onToggle: (id: string, completed: boolean) => void
  onEdit: (id: string, title: string) => void
  onDelete: (id: string) => void
}

function TodoList({ todos, onToggle, onEdit, onDelete }: Props) {
  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}

export default TodoList
```

## `src/components/TodoItem.tsx`

```tsx
import { useState } from 'react'
import type { Todo } from '../types'

interface Props {
  todo: Todo
  onToggle: (id: string, completed: boolean) => void
  onEdit: (id: string, title: string) => void
  onDelete: (id: string) => void
}

function TodoItem({ todo, onToggle, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)

  function handleEditSubmit() {
    if (draft.trim()) onEdit(todo.id, draft.trim())
    setEditing(false)
  }

  return (
    <li className="todo-item">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={(e) => onToggle(todo.id, e.target.checked)}
      />
      {editing ? (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleEditSubmit}
          onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
          autoFocus
        />
      ) : (
        <span
          className={todo.completed ? 'completed' : ''}
          onDoubleClick={() => setEditing(true)}
        >
          {todo.title}
        </span>
      )}
      <button onClick={() => onDelete(todo.id)}>삭제</button>
    </li>
  )
}

export default TodoItem
```

## `src/components/FilterBar.tsx`

```tsx
import type { Filter } from '../types'

interface Props {
  value: Filter
  onChange: (filter: Filter) => void
}

const OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '미완료' },
  { value: 'completed', label: '완료' },
]

function FilterBar({ value, onChange }: Props) {
  return (
    <div className="filter-bar">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={opt.value === value ? 'active' : ''}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default FilterBar
```

## `src/mocks/browser.ts`

```ts
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

## `src/mocks/db.ts`

```ts
import type { Todo } from '../types'

const STORAGE_KEY = 'todos'

function readAll(): Todo[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw) as Todo[]) : []
}

function writeAll(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

export function seedIfEmpty(initial: Todo[]): void {
  if (localStorage.getItem(STORAGE_KEY) === null) {
    writeAll(initial)
  }
}

export function getAll(): Todo[] {
  return readAll()
}

export function create(title: string): Todo {
  const todo: Todo = {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  }
  const todos = readAll()
  todos.push(todo)
  writeAll(todos)
  return todo
}

export function update(
  id: string,
  patch: Partial<Pick<Todo, 'title' | 'completed'>>,
): Todo | null {
  const todos = readAll()
  const idx = todos.findIndex((t) => t.id === id)
  if (idx === -1) return null
  todos[idx] = { ...todos[idx], ...patch }
  writeAll(todos)
  return todos[idx]
}

export function remove(id: string): boolean {
  const todos = readAll()
  const next = todos.filter((t) => t.id !== id)
  if (next.length === todos.length) return false
  writeAll(next)
  return true
}
```

## `src/mocks/db.test.ts`

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { seedIfEmpty, getAll, create, update, remove } from './db'

beforeEach(() => {
  localStorage.clear()
})

describe('seedIfEmpty', () => {
  it('localStorage가 비어있으면 초기 데이터를 채운다', () => {
    seedIfEmpty([{ id: '1', title: '시드', completed: false, createdAt: '2026-01-01T00:00:00.000Z' }])
    expect(getAll()).toHaveLength(1)
  })

  it('이미 데이터가 있으면 덮어쓰지 않는다', () => {
    seedIfEmpty([{ id: '1', title: '시드', completed: false, createdAt: '2026-01-01T00:00:00.000Z' }])
    seedIfEmpty([{ id: '2', title: '다른시드', completed: false, createdAt: '2026-01-01T00:00:00.000Z' }])
    expect(getAll()).toHaveLength(1)
    expect(getAll()[0].id).toBe('1')
  })
})

describe('create', () => {
  it('새 todo를 추가하고 반환한다', () => {
    const todo = create('할 일 1')
    expect(todo.title).toBe('할 일 1')
    expect(todo.completed).toBe(false)
    expect(getAll()).toHaveLength(1)
  })
})

describe('update', () => {
  it('존재하는 todo를 수정한다', () => {
    const todo = create('할 일 1')
    const updated = update(todo.id, { completed: true })
    expect(updated?.completed).toBe(true)
    expect(getAll()[0].completed).toBe(true)
  })

  it('존재하지 않는 id면 null을 반환한다', () => {
    expect(update('없는id', { completed: true })).toBeNull()
  })
})

describe('remove', () => {
  it('존재하는 todo를 삭제하고 true를 반환한다', () => {
    const todo = create('할 일 1')
    expect(remove(todo.id)).toBe(true)
    expect(getAll()).toHaveLength(0)
  })

  it('존재하지 않는 id면 false를 반환한다', () => {
    expect(remove('없는id')).toBe(false)
  })
})
```

## `src/mocks/handlers.ts`

```ts
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
```

## `src/mocks/handlers.test.ts`

```ts
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

  it('빈 제목이면 400을 반환한다', async () => {
    const created = await (
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '할 일 1' }),
      })
    ).json()

    const res = await fetch(`/api/todos/${created.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '   ' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/todos/:id', () => {
  it('존재하지 않는 id면 404를 반환한다', async () => {
    const res = await fetch('/api/todos/없는id', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })
})
```


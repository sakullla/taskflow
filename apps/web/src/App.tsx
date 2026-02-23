import { FormEvent, useMemo, useState } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";
import { Task, TaskDefaults, TodoList } from "./models";


const DEFAULT_LIST_ID = "inbox";
const todayIso = new Date().toISOString().slice(0, 10);

const initialLists: TodoList[] = [
  {
    id: DEFAULT_LIST_ID,
    name: "Tasks",
    color: "#2563eb",
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "work",
    name: "Work",
    color: "#7c3aed",
    isDefault: false,
    createdAt: new Date().toISOString()
  }
];

const initialTasks: Task[] = [
  {
    id: "task-1",
    listId: "work",
    title: "Review sprint backlog",
    isCompleted: false,
    isImportant: true,
    inMyDay: true,
    dueDate: todayIso,
    createdAt: new Date().toISOString()
  },
  {
    id: "task-2",
    listId: DEFAULT_LIST_ID,
    title: "Write API contract draft",
    isCompleted: false,
    isImportant: false,
    inMyDay: false,
    dueDate: null,
    createdAt: new Date().toISOString()
  }
];

const pages = [
  { path: "/", label: "My Day" },
  { path: "/important", label: "Important" },
  { path: "/planned", label: "Planned" },
  { path: "/tasks", label: "All Tasks" }
];

interface TaskViewConfig {
  title: string;
  emptyText: string;
  filter: (task: Task) => boolean;
  defaults: TaskDefaults;
}

const viewConfigs: Record<string, TaskViewConfig> = {
  myDay: {
    title: "My Day",
    emptyText: "No tasks in My Day yet.",
    filter: (task) => task.inMyDay,
    defaults: { inMyDay: true, listId: DEFAULT_LIST_ID }
  },
  important: {
    title: "Important",
    emptyText: "No important tasks yet.",
    filter: (task) => task.isImportant,
    defaults: { isImportant: true, listId: DEFAULT_LIST_ID }
  },
  planned: {
    title: "Planned",
    emptyText: "No planned tasks yet.",
    filter: (task) => Boolean(task.dueDate),
    defaults: { dueDate: todayIso, listId: DEFAULT_LIST_ID }
  },
  tasks: {
    title: "All Tasks",
    emptyText: "No tasks yet. Add your first one.",
    filter: () => true,
    defaults: { listId: DEFAULT_LIST_ID }
  }
};

function buildTask(title: string, defaults: TaskDefaults): Task {
  return {
    id: crypto.randomUUID(),
    listId: defaults.listId ?? DEFAULT_LIST_ID,
    title,
    isCompleted: false,
    isImportant: defaults.isImportant ?? false,
    inMyDay: defaults.inMyDay ?? false,
    dueDate: defaults.dueDate ?? null,
    createdAt: new Date().toISOString()
  };
}

function Sidebar({
  lists,
  onAddList,
  onRenameList,
  onDeleteList
}: {
  lists: TodoList[];
  onAddList: (name: string) => void;
  onRenameList: (listId: string, name: string) => void;
  onDeleteList: (listId: string) => void;
}) {
  const [newListName, setNewListName] = useState("");
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAddList = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newListName.trim();
    if (!name) {
      return;
    }

    onAddList(name);
    setNewListName("");
  };

  const startRename = (list: TodoList) => {
    setEditingListId(list.id);
    setEditingName(list.name);
  };

  const handleRename = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingListId) {
      return;
    }

    const name = editingName.trim();
    if (!name) {
      return;
    }

    onRenameList(editingListId, name);
    setEditingListId(null);
    setEditingName("");
  };

  return (
    <aside className="sidebar">
      <h1>To-Do</h1>
      <nav className="system-nav">
        {pages.map((page) => (
          <NavLink
            key={page.path}
            to={page.path}
            end={page.path === "/"}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {page.label}
          </NavLink>
        ))}
      </nav>

      <section className="lists-panel">
        <header>
          <h3>Lists</h3>
        </header>

        <div className="lists-body">
          {lists.map((list) => {
            if (editingListId === list.id) {
              return (
                <form key={list.id} className="list-edit" onSubmit={handleRename}>
                  <input
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    aria-label="Rename list"
                    autoFocus
                  />
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditingListId(null)}>
                    Cancel
                  </button>
                </form>
              );
            }

            return (
              <div key={list.id} className="list-row">
                <NavLink
                  to={`/lists/${list.id}`}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  {list.name}
                </NavLink>
                <div className="list-actions">
                  <button type="button" onClick={() => startRename(list)}>
                    Rename
                  </button>
                  {!list.isDefault ? (
                    <button type="button" onClick={() => onDeleteList(list.id)}>
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <form className="list-add" onSubmit={handleAddList}>
          <input
            value={newListName}
            onChange={(event) => setNewListName(event.target.value)}
            placeholder="New list"
            aria-label="New list name"
          />
          <button type="submit">Add</button>
        </form>
      </section>
    </aside>
  );
}

function TaskScreen({
  title,
  emptyText,
  tasks,
  onAddTask,
  onToggleTask
}: {
  title: string;
  emptyText: string;
  tasks: Task[];
  onAddTask: (title: string) => void;
  onToggleTask: (id: string) => void;
}) {
  const [newTitle, setNewTitle] = useState("");

  const orderedTasks = useMemo(
    () => [...tasks].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted)),
    [tasks]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const titleToAdd = newTitle.trim();
    if (!titleToAdd) {
      return;
    }

    onAddTask(titleToAdd);
    setNewTitle("");
  };

  return (
    <section className="task-screen">
      <h2>{title}</h2>
      <form className="quick-add" onSubmit={handleSubmit}>
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Add a task"
          aria-label={`Add task in ${title}`}
        />
        <button type="submit">Add</button>
      </form>

      {orderedTasks.length === 0 ? (
        <p className="empty-text">{emptyText}</p>
      ) : (
        <ul className="task-list">
          {orderedTasks.map((task) => (
            <li key={task.id} className={task.isCompleted ? "task-item done" : "task-item"}>
              <label>
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => onToggleTask(task.id)}
                />
                <span>{task.title}</span>
              </label>
              {task.dueDate ? <small>Due: {task.dueDate}</small> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ListRouteScreen({
  lists,
  tasks,
  onAddTask,
  onToggleTask
}: {
  lists: TodoList[];
  tasks: Task[];
  onAddTask: (title: string, defaults: TaskDefaults) => void;
  onToggleTask: (id: string) => void;
}) {
  const { listId } = useParams();

  if (!listId) {
    return <Navigate to={`/lists/${DEFAULT_LIST_ID}`} replace />;
  }

  const list = lists.find((item) => item.id === listId);

  if (!list) {
    return (
      <section className="task-screen">
        <h2>List not found</h2>
        <p className="empty-text">Choose another list from the sidebar.</p>
      </section>
    );
  }

  return (
    <TaskScreen
      title={list.name}
      emptyText="No tasks in this list yet."
      tasks={tasks.filter((task) => task.listId === list.id)}
      onAddTask={(title) => onAddTask(title, { listId: list.id })}
      onToggleTask={onToggleTask}
    />
  );
}

export function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [lists, setLists] = useState<TodoList[]>(initialLists);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleTask = (id: string) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
  };

  const addTask = (title: string, defaults: TaskDefaults) => {
    const listExists = defaults.listId
      ? lists.some((list) => list.id === defaults.listId)
      : true;

    setTasks((current) => [
      buildTask(title, {
        ...defaults,
        listId: listExists ? defaults.listId : DEFAULT_LIST_ID
      }),
      ...current
    ]);
  };

  const addList = (name: string) => {
    const nextList: TodoList = {
      id: crypto.randomUUID(),
      name,
      color: "#0f766e",
      isDefault: false,
      createdAt: new Date().toISOString()
    };

    setLists((current) => [...current, nextList]);
    navigate(`/lists/${nextList.id}`);
  };

  const renameList = (listId: string, name: string) => {
    setLists((current) =>
      current.map((list) => (list.id === listId ? { ...list, name } : list))
    );
  };

  const deleteList = (listId: string) => {
    const list = lists.find((item) => item.id === listId);
    if (!list || list.isDefault) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${list.name}"? Tasks will move to Tasks list.`
    );

    if (!shouldDelete) {
      return;
    }

    setLists((current) => current.filter((item) => item.id !== list.id));
    setTasks((current) =>
      current.map((task) =>
        task.listId === list.id ? { ...task, listId: DEFAULT_LIST_ID } : task
      )
    );

    if (location.pathname === `/lists/${list.id}`) {
      navigate(`/lists/${DEFAULT_LIST_ID}`, { replace: true });
    }
  };

  return (
    <div className="layout">
      <Sidebar
        lists={lists}
        onAddList={addList}
        onRenameList={renameList}
        onDeleteList={deleteList}
      />
      <main className="content">
        <Routes>
          <Route
            path="/"
            element={
              <TaskScreen
                title={viewConfigs.myDay.title}
                emptyText={viewConfigs.myDay.emptyText}
                tasks={tasks.filter(viewConfigs.myDay.filter)}
                onAddTask={(title) => addTask(title, viewConfigs.myDay.defaults)}
                onToggleTask={toggleTask}
              />
            }
          />
          <Route
            path="/important"
            element={
              <TaskScreen
                title={viewConfigs.important.title}
                emptyText={viewConfigs.important.emptyText}
                tasks={tasks.filter(viewConfigs.important.filter)}
                onAddTask={(title) => addTask(title, viewConfigs.important.defaults)}
                onToggleTask={toggleTask}
              />
            }
          />
          <Route
            path="/planned"
            element={
              <TaskScreen
                title={viewConfigs.planned.title}
                emptyText={viewConfigs.planned.emptyText}
                tasks={tasks.filter(viewConfigs.planned.filter)}
                onAddTask={(title) => addTask(title, viewConfigs.planned.defaults)}
                onToggleTask={toggleTask}
              />
            }
          />
          <Route
            path="/tasks"
            element={
              <TaskScreen
                title={viewConfigs.tasks.title}
                emptyText={viewConfigs.tasks.emptyText}
                tasks={tasks.filter(viewConfigs.tasks.filter)}
                onAddTask={(title) => addTask(title, viewConfigs.tasks.defaults)}
                onToggleTask={toggleTask}
              />
            }
          />
          <Route
            path="/lists/:listId"
            element={
              <ListRouteScreen
                lists={lists}
                tasks={tasks}
                onAddTask={addTask}
                onToggleTask={toggleTask}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

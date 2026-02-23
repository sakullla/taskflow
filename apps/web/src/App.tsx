import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";
import {
  createListApi,
  createTaskApi,
  deleteListApi,
  fetchBootstrapData,
  updateListApi,
  updateTaskApi
} from "./lib/api";
import { trackEvent } from "./lib/telemetry";
import { Task, TaskDefaults, TaskPriority, TodoList } from "./models";

const DEFAULT_LIST_ID = "inbox";
const todayIso = new Date().toISOString().slice(0, 10);
const LISTS_CACHE_KEY = "todo.cache.lists.v1";
const TASKS_CACHE_KEY = "todo.cache.tasks.v1";

function readCache<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota and serialization issues.
  }
}

type TaskPatch = Partial<
  Pick<
    Task,
    "title" | "note" | "dueDate" | "reminderAt" | "priority" | "isImportant" | "inMyDay" | "isCompleted"
  >
>;

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
    note: "Prepare risks and blockers before standup.",
    isCompleted: false,
    isImportant: true,
    inMyDay: true,
    dueDate: todayIso,
    reminderAt: `${todayIso}T09:00`,
    priority: "high",
    createdAt: new Date().toISOString()
  },
  {
    id: "task-2",
    listId: DEFAULT_LIST_ID,
    title: "Write API contract draft",
    note: "Cover list/task/step payloads.",
    isCompleted: false,
    isImportant: false,
    inMyDay: false,
    dueDate: null,
    reminderAt: null,
    priority: "normal",
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

function buildTask(title: string, defaults: TaskDefaults, id = crypto.randomUUID()): Task {
  return {
    id,
    listId: defaults.listId ?? DEFAULT_LIST_ID,
    title,
    note: defaults.note ?? "",
    isCompleted: false,
    isImportant: defaults.isImportant ?? false,
    inMyDay: defaults.inMyDay ?? false,
    dueDate: defaults.dueDate ?? null,
    reminderAt: defaults.reminderAt ?? null,
    priority: defaults.priority ?? "normal",
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

function TaskDetailPanel({
  task,
  onUpdateTask,
  onClearSelection
}: {
  task: Task | null;
  onUpdateTask: (id: string, patch: TaskPatch) => void;
  onClearSelection: () => void;
}) {
  if (!task) {
    return (
      <aside className="task-detail empty">
        <h3>Task details</h3>
        <p className="empty-text">Select a task to edit title, note, date, reminder, and priority.</p>
      </aside>
    );
  }

  const changePriority = (value: string) => {
    onUpdateTask(task.id, { priority: value as TaskPriority });
  };

  return (
    <aside className="task-detail">
      <header className="detail-header">
        <h3>Task details</h3>
        <button type="button" onClick={onClearSelection}>
          Close
        </button>
      </header>

      <label>
        Title
        <input
          value={task.title}
          onChange={(event) => onUpdateTask(task.id, { title: event.target.value })}
          placeholder="Task title"
        />
      </label>

      <label>
        Note
        <textarea
          value={task.note}
          onChange={(event) => onUpdateTask(task.id, { note: event.target.value })}
          placeholder="Add details"
          rows={4}
        />
      </label>

      <label>
        Due date
        <input
          type="date"
          value={task.dueDate ?? ""}
          onChange={(event) =>
            onUpdateTask(task.id, { dueDate: event.target.value ? event.target.value : null })
          }
        />
      </label>

      <label>
        Reminder
        <input
          type="datetime-local"
          value={task.reminderAt ?? ""}
          onChange={(event) =>
            onUpdateTask(task.id, {
              reminderAt: event.target.value ? event.target.value : null
            })
          }
        />
      </label>

      <label>
        Priority
        <select value={task.priority} onChange={(event) => changePriority(event.target.value)}>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
      </label>

      <label className="switch-row">
        <input
          type="checkbox"
          checked={task.isImportant}
          onChange={(event) => onUpdateTask(task.id, { isImportant: event.target.checked })}
        />
        Important
      </label>

      <label className="switch-row">
        <input
          type="checkbox"
          checked={task.inMyDay}
          onChange={(event) => onUpdateTask(task.id, { inMyDay: event.target.checked })}
        />
        In My Day
      </label>
    </aside>
  );
}

function TaskScreen({
  title,
  emptyText,
  tasks,
  selectedTaskId,
  onAddTask,
  onToggleTask,
  onSelectTask,
  onUpdateTask,
  onClearSelection
}: {
  title: string;
  emptyText: string;
  tasks: Task[];
  selectedTaskId: string | null;
  onAddTask: (title: string) => void;
  onToggleTask: (id: string) => void;
  onSelectTask: (id: string) => void;
  onUpdateTask: (id: string, patch: TaskPatch) => void;
  onClearSelection: () => void;
}) {
  const [newTitle, setNewTitle] = useState("");

  const orderedTasks = useMemo(
    () => [...tasks].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted)),
    [tasks]
  );

  const selectedTask = orderedTasks.find((task) => task.id === selectedTaskId) ?? null;

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
      <div className="task-layout">
        <div className="task-list-panel">
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
                <li
                  key={task.id}
                  className={
                    task.id === selectedTaskId
                      ? `task-item selected${task.isCompleted ? " done" : ""}`
                      : task.isCompleted
                        ? "task-item done"
                        : "task-item"
                  }
                  onClick={() => onSelectTask(task.id)}
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={task.isCompleted}
                      onChange={() => onToggleTask(task.id)}
                    />
                    <span>{task.title}</span>
                  </label>
                  <div className="task-meta">
                    {task.dueDate ? <small>Due: {task.dueDate}</small> : null}
                    <small className={`priority priority-${task.priority}`}>{task.priority}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <TaskDetailPanel
          task={selectedTask}
          onUpdateTask={onUpdateTask}
          onClearSelection={onClearSelection}
        />
      </div>
    </section>
  );
}

function ListRouteScreen({
  lists,
  tasks,
  selectedTaskId,
  onAddTask,
  onToggleTask,
  onSelectTask,
  onUpdateTask,
  onClearSelection
}: {
  lists: TodoList[];
  tasks: Task[];
  selectedTaskId: string | null;
  onAddTask: (title: string, defaults: TaskDefaults) => void;
  onToggleTask: (id: string) => void;
  onSelectTask: (id: string) => void;
  onUpdateTask: (id: string, patch: TaskPatch) => void;
  onClearSelection: () => void;
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
      selectedTaskId={selectedTaskId}
      onAddTask={(title) => onAddTask(title, { listId: list.id })}
      onToggleTask={onToggleTask}
      onSelectTask={onSelectTask}
      onUpdateTask={onUpdateTask}
      onClearSelection={onClearSelection}
    />
  );
}

export function App() {
  const [tasks, setTasks] = useState<Task[]>(
    () => readCache<Task[]>(TASKS_CACHE_KEY) ?? initialTasks
  );
  const [lists, setLists] = useState<TodoList[]>(
    () => readCache<TodoList[]>(LISTS_CACHE_KEY) ?? initialLists
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    writeCache(LISTS_CACHE_KEY, lists);
  }, [lists]);

  useEffect(() => {
    writeCache(TASKS_CACHE_KEY, tasks);
  }, [tasks]);

  useEffect(() => {
    let disposed = false;

    const loadData = async () => {
      try {
        const data = await fetchBootstrapData();
        if (disposed) {
          return;
        }
        setLists(data.lists);
        setTasks(data.tasks);
        setSyncNotice(null);
        trackEvent({ name: "bootstrap_sync_success" });
      } catch (error) {
        if (!disposed) {
          setSyncNotice(`API sync unavailable. Using local data. ${String(error)}`);
          trackEvent({
            name: "bootstrap_sync_failed",
            level: "warn",
            metadata: { error: String(error) }
          });
        }
      }
    };

    void loadData();

    return () => {
      disposed = true;
    };
  }, []);

  const selectTask = (id: string) => {
    setSelectedTaskId(id);
  };

  const clearSelectedTask = () => {
    setSelectedTaskId(null);
  };

  const toggleTask = (id: string) => {
    const currentTask = tasks.find((task) => task.id === id);
    if (!currentTask) {
      return;
    }

    const nextCompleted = !currentTask.isCompleted;
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, isCompleted: nextCompleted } : task
      )
    );

    void updateTaskApi(id, { isCompleted: nextCompleted })
      .then((serverTask) => {
        setTasks((current) =>
          current.map((task) => (task.id === id ? serverTask : task))
        );
      })
      .catch(() => {
        setTasks((current) =>
          current.map((task) => (task.id === id ? currentTask : task))
        );
        setSyncNotice("Failed to sync task completion. Local change was reverted.");
        trackEvent({ name: "task_toggle_sync_failed", level: "warn", metadata: { taskId: id } });
      });
  };

  const updateTask = (id: string, patch: TaskPatch) => {
    const previousTask = tasks.find((task) => task.id === id);
    if (!previousTask) {
      return;
    }

    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, ...patch } : task))
    );

    void updateTaskApi(id, patch)
      .then((serverTask) => {
        setTasks((current) =>
          current.map((task) => (task.id === id ? serverTask : task))
        );
      })
      .catch(() => {
        setTasks((current) =>
          current.map((task) => (task.id === id ? previousTask : task))
        );
        setSyncNotice("Failed to sync task updates. Local change was reverted.");
        trackEvent({ name: "task_update_sync_failed", level: "warn", metadata: { taskId: id } });
      });
  };

  const addTask = (title: string, defaults: TaskDefaults) => {
    const listExists = defaults.listId
      ? lists.some((list) => list.id === defaults.listId)
      : true;

    const optimisticTask = buildTask(
      title,
      {
        ...defaults,
        listId: listExists ? defaults.listId : DEFAULT_LIST_ID
      },
      `tmp-${crypto.randomUUID()}`
    );

    setTasks((current) => [optimisticTask, ...current]);

    void createTaskApi({ title, defaults: optimisticTask })
      .then((serverTask) => {
        setTasks((current) =>
          current.map((task) => (task.id === optimisticTask.id ? serverTask : task))
        );
      })
      .catch(() => {
        setTasks((current) => current.filter((task) => task.id !== optimisticTask.id));
        setSyncNotice("Failed to create task on server. Local task was removed.");
        trackEvent({ name: "task_create_sync_failed", level: "warn", metadata: { title } });
      });
  };

  const addList = (name: string) => {
    const tempId = `tmp-${crypto.randomUUID()}`;
    const optimisticList: TodoList = {
      id: tempId,
      name,
      color: "#0f766e",
      isDefault: false,
      createdAt: new Date().toISOString()
    };

    setLists((current) => [...current, optimisticList]);
    navigate(`/lists/${tempId}`);

    void createListApi({ name, color: optimisticList.color })
      .then((serverList) => {
        setLists((current) =>
          current.map((list) => (list.id === tempId ? serverList : list))
        );
        setTasks((current) =>
          current.map((task) =>
            task.listId === tempId ? { ...task, listId: serverList.id } : task
          )
        );
        navigate(`/lists/${serverList.id}`, { replace: true });
      })
      .catch(() => {
        setLists((current) => current.filter((list) => list.id !== tempId));
        setSyncNotice("Failed to create list on server. Local list was removed.");
        navigate(`/lists/${DEFAULT_LIST_ID}`, { replace: true });
        trackEvent({ name: "list_create_sync_failed", level: "warn", metadata: { name } });
      });
  };

  const renameList = (listId: string, name: string) => {
    const previousList = lists.find((list) => list.id === listId);
    if (!previousList) {
      return;
    }

    setLists((current) =>
      current.map((list) => (list.id === listId ? { ...list, name } : list))
    );

    void updateListApi(listId, { name }).catch(() => {
      setLists((current) =>
        current.map((list) => (list.id === listId ? previousList : list))
      );
      setSyncNotice("Failed to rename list on server. Local name was reverted.");
      trackEvent({ name: "list_rename_sync_failed", level: "warn", metadata: { listId } });
    });
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

    const previousLists = lists;
    const previousTasks = tasks;

    setLists((current) => current.filter((item) => item.id !== list.id));
    setTasks((current) =>
      current.map((task) =>
        task.listId === list.id ? { ...task, listId: DEFAULT_LIST_ID } : task
      )
    );

    if (location.pathname === `/lists/${list.id}`) {
      navigate(`/lists/${DEFAULT_LIST_ID}`, { replace: true });
    }

    void deleteListApi(listId).catch(() => {
      setLists(previousLists);
      setTasks(previousTasks);
      setSyncNotice("Failed to delete list on server. Local state was restored.");
      trackEvent({ name: "list_delete_sync_failed", level: "warn", metadata: { listId } });
    });
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
        {syncNotice ? <p className="sync-banner">{syncNotice}</p> : null}
        <Routes>
          <Route
            path="/"
            element={
              <TaskScreen
                title={viewConfigs.myDay.title}
                emptyText={viewConfigs.myDay.emptyText}
                tasks={tasks.filter(viewConfigs.myDay.filter)}
                selectedTaskId={selectedTaskId}
                onAddTask={(taskTitle) => addTask(taskTitle, viewConfigs.myDay.defaults)}
                onToggleTask={toggleTask}
                onSelectTask={selectTask}
                onUpdateTask={updateTask}
                onClearSelection={clearSelectedTask}
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
                selectedTaskId={selectedTaskId}
                onAddTask={(taskTitle) => addTask(taskTitle, viewConfigs.important.defaults)}
                onToggleTask={toggleTask}
                onSelectTask={selectTask}
                onUpdateTask={updateTask}
                onClearSelection={clearSelectedTask}
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
                selectedTaskId={selectedTaskId}
                onAddTask={(taskTitle) => addTask(taskTitle, viewConfigs.planned.defaults)}
                onToggleTask={toggleTask}
                onSelectTask={selectTask}
                onUpdateTask={updateTask}
                onClearSelection={clearSelectedTask}
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
                selectedTaskId={selectedTaskId}
                onAddTask={(taskTitle) => addTask(taskTitle, viewConfigs.tasks.defaults)}
                onToggleTask={toggleTask}
                onSelectTask={selectTask}
                onUpdateTask={updateTask}
                onClearSelection={clearSelectedTask}
              />
            }
          />
          <Route
            path="/lists/:listId"
            element={
              <ListRouteScreen
                lists={lists}
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                onAddTask={addTask}
                onToggleTask={toggleTask}
                onSelectTask={selectTask}
                onUpdateTask={updateTask}
                onClearSelection={clearSelectedTask}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

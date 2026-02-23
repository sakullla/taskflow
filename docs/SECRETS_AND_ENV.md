# Environment and Secrets

## Files
- `.env.example`: non-secret template for required variables.
- `.env` / `.env.local`: real values (never commit).

## API variables
- `PORT`: API port (default `4000`).
- `TODO_DB_PATH`: SQLite file path (default `data/todo.sqlite`).

## Web variables
- `VITE_API_BASE_URL`: API base URL for web client (default `http://localhost:4000`).

## Secret handling
- Do not store tokens, passwords, or private keys in git.
- Use CI secret store for deployment credentials.
- Rotate secrets if they are exposed in logs or commits.

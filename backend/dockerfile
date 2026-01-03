FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy dependency files first (for caching)
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen

# Copy the rest of the code
COPY . .

EXPOSE 8080

# Run uvicorn using the virtual environment created by uv
CMD [".venv/bin/uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]


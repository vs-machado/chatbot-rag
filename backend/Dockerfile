# Backend Dockerfile
FROM python:3.12-slim

# Evita buffer de output do Python (mostra logs em tempo real)
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instala dependências do sistema para psycopg2 e torch
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia requirements primeiro para aproveitar cache do Docker
COPY requirements.txt .

# Instala dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY . .

# Porta da aplicação
EXPOSE 8000

# Comando padrão para desenvolvimento
# --access-log: mostra logs de requisições HTTP
# --log-level debug: mostra logs detalhados
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--access-log", "--log-level", "debug"]

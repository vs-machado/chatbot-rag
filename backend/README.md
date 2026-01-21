# Backend - Chatbot RAG

API em FastAPI para o chatbot com RAG (Retrieval-Augmented Generation).

## Instalação

1. Crie um ambiente virtual:
```bash
python -m venv venv
```

2. Ative o ambiente virtual:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

## Execução

Execute o servidor:
```bash
python main.py
```

Ou usando uvicorn diretamente:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /` - Mensagem de boas-vindas
- `GET /health` - Verificação de saúde
- `GET /api/v1/chat` - Endpoint de chat (em desenvolvimento)

## Documentação

Com o servidor rodando, acesse:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

# Frontend - Chatbot RAG

Interface em React + TypeScript para o chatbot com RAG.

## Instalação

Instale as dependências:
```bash
npm install
```

## Execução

Execute o servidor de desenvolvimento:
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila TypeScript e cria build de produção
- `npm run lint` - Executa ESLint nos arquivos TS/TSX
- `npm run preview` - Visualiza o build de produção localmente

## Estrutura de Pastas

```
src/
├── assets/       # Imagens e arquivos estáticos
├── components/    # Componentes React
│   └── ui/        # Componentes shadcn/ui
├── lib/           # Utilitários
├── hooks/         # Custom hooks
├── App.tsx        # Componente principal
├── main.tsx       # Ponto de entrada
└── index.css      # Estilos globais
```

## Tecnologias

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui
- Lucide React (ícones)

## Desenvolvimento

Consulte `../AGENTS.md` para diretrizes de desenvolvimento.

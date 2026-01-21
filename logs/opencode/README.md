# OpenCode Session Logs

Este diretório contém logs de sessões do OpenCode em formato markdown.

## Estrutura de Arquivos

- `session-YYYY-MM-DD.md` - Log de sessão do OpenCode para a data especificada

## Como Adicionar Novos Logs

1. Ao final de cada sessão do OpenCode, execute o comando `/copy` dentro do TUI
2. Crie um novo arquivo com a data atual: `session-YYYY-MM-DD.md`
3. Cole o conteúdo copiado no arquivo
4. Faça commit do arquivo

```bash
# Dentro do OpenCode
/copy

# No terminal
echo "# Sessão OpenCode - $(date +%Y-%m-%d)" > logs/opencode/session-$(date +%Y-%m-%d).md
# Cole o conteúdo depois do cabeçalho
git add logs/opencode/session-$(date +%Y-%m-%d).md
git commit -m "docs: adiciona log de sessão do OpenCode"
```

## Propósito

- Rastrear histórico de desenvolvimento
- Documentar decisões tomadas
- Facilitar colaboração em equipe
- Auxiliar em debugging e troubleshooting

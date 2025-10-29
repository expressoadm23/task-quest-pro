# TaskQuest Pro - Gerenciador Gamificado Colaborativo

Um site gamificado de gerenciamento de tarefas com interface horizontal tipo Trello, permitindo que múltiplos usuários colaborem em tarefas e recebam notificações por email quando alguém avança em uma etapa.

## 🎯 Características

- ✅ **Autenticação de Usuários**: Sistema de login e registro seguro
- ✅ **Tarefas Compartilhadas**: Crie tarefas e convide colaboradores
- ✅ **Etapas Horizontais**: Visualize o progresso em uma linha horizontal com opção de expandir/encolher
- ✅ **Rastreamento em Tempo Real**: Veja onde cada colaborador está em cada tarefa
- ✅ **Notificações por Email**: Receba alertas quando alguém avança em uma etapa
- ✅ **Design Gamificado**: Interface colorida com identidade visual roxa e amarela
- ✅ **Banco de Dados**: SQLite para armazenamento seguro de dados

## 🚀 Como Começar

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
cd task-quest-pro
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
- `SMTP_USER`: Seu email do Gmail
- `SMTP_PASS`: Sua senha de aplicativo do Gmail
- `NOTIFICATION_EMAILS`: Emails para receber notificações

### Executar o Servidor

```bash
npm start
```

O servidor estará disponível em `http://localhost:5000`

O frontend estará disponível em `http://localhost:5000/public/index.html`

## 📋 Estrutura do Projeto

```
task-quest-pro/
├── src/
│   ├── server/
│   │   ├── index.ts      # Servidor Express principal
│   │   ├── auth.ts       # Autenticação JWT
│   │   └── email.ts      # Serviço de email
│   ├── db/
│   │   ├── index.ts      # Inicialização do banco de dados
│   │   └── schema.ts     # Schema do banco de dados
│   └── client/
│       └── (Frontend em HTML/CSS/JS)
├── public/
│   └── index.html        # Interface do usuário
├── .env                  # Variáveis de ambiente
└── package.json          # Dependências do projeto
```

## 🔐 Configuração de Email

Para usar notificações por email com Gmail:

1. Ative a autenticação de dois fatores em sua conta Google
2. Gere uma [senha de aplicativo](https://myaccount.google.com/apppasswords)
3. Use essa senha no arquivo `.env` como `SMTP_PASS`

## 📧 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login

### Tarefas
- `POST /api/tasks` - Criar nova tarefa
- `GET /api/tasks` - Listar tarefas do usuário
- `GET /api/tasks/:taskId` - Obter detalhes da tarefa

### Progresso
- `POST /api/progress/update` - Atualizar progresso do usuário
- `GET /api/tasks/:taskId/progress` - Obter progresso de todos os usuários

### Colaboradores
- `POST /api/tasks/:taskId/invite` - Convidar colaborador

## 🎨 Identidade Visual

- **Cores Primárias**: Roxo (#9333ea) e Amarelo (#fbbf24)
- **Cores Secundárias**: Lilás (#c084fc), Branco (#ffffff), Preto (#000000)
- **Design**: Moderno, gamificado e intuitivo

## 📝 Licença

MIT

## 👥 Suporte

Para suporte, entre em contato através do email ou abra uma issue no repositório.


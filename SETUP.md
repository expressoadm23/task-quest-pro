# 🚀 Guia de Setup - TaskQuest Pro

## Pré-requisitos

- **Node.js 18+** - [Download aqui](https://nodejs.org/)
- **npm** (vem com Node.js)
- Uma conta do **Gmail** para enviar notificações por email

## Instalação Rápida

### 1. Clonar ou extrair o projeto

```bash
cd task-quest-pro
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=sua-chave-super-secreta-aqui

# Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app

# Emails para notificações
NOTIFICATION_EMAILS=artrabalho3@gmail.com,rodolfomarinhomaster@gmail.com
```

### 4. Configurar Gmail para enviar emails

1. Acesse sua conta Google: https://myaccount.google.com/
2. Vá para **Segurança** (lado esquerdo)
3. Ative **Autenticação de dois fatores** (se não estiver ativada)
4. Volte para Segurança e procure por **Senhas de app**
5. Selecione "Mail" e "Windows Computer" (ou seu dispositivo)
6. Copie a senha gerada e cole no `.env` como `SMTP_PASS`

### 5. Iniciar o servidor

```bash
npm start
```

Você verá:
```
✅ Database initialized successfully
🚀 Servidor rodando em http://localhost:5000
📄 Frontend disponível em http://localhost:5000
```

### 6. Acessar a aplicação

Abra seu navegador e vá para:
```
http://localhost:5000
```

## 🎮 Como Usar

### Criar Conta

1. Clique em "Criar conta"
2. Preencha seu nome, email e senha
3. Clique em "Criar Conta"

### Criar Tarefa

1. Na seção "Nova Tarefa", insira o nome da tarefa
2. Adicione as etapas do processo (ex: Planejamento, Execução, Revisão)
3. Clique em "Criar Tarefa"

### Avançar em Etapas

1. Na tarefa, clique em qualquer etapa para avançar
2. Todos os colaboradores receberão notificação por email
3. O progresso será atualizado em tempo real

### Convidar Colaboradores

1. Na tarefa, vá até "Convidar Colaborador"
2. Insira o email do colaborador
3. Clique em "Convidar"
4. O colaborador receberá um email de convite

### Expandir/Encolher Etapas

1. Clique no botão "Encolher" para minimizar as etapas
2. Clique em "Expandir" para mostrar novamente

## 📧 Notificações por Email

Quando alguém avança em uma etapa, um email é enviado para todos os emails configurados em `NOTIFICATION_EMAILS`.

O email contém:
- Nome de quem avançou
- Nome da tarefa
- Etapa atual
- Link para acessar o painel

## 🔒 Segurança

- Senhas são criptografadas com bcrypt
- Autenticação via JWT tokens
- Tokens expiram em 7 dias
- Validação de acesso em todas as rotas protegidas

## 🐛 Troubleshooting

### "Erro ao conectar com o servidor"

Verifique se o servidor está rodando:
```bash
npm start
```

### "Erro ao enviar email"

1. Verifique se `SMTP_USER` e `SMTP_PASS` estão corretos
2. Verifique se a senha de app foi gerada corretamente no Gmail
3. Verifique se o Gmail permite acesso de apps menos seguros (pode ser necessário)

### Banco de dados corrompido

Delete o arquivo `dev.db` e reinicie o servidor:
```bash
rm dev.db
npm start
```

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona em:
- Desktop
- Tablet
- Mobile

## 🎨 Personalização

### Cores

As cores podem ser alteradas em `public/index.html` na seção `<style>`:

```css
/* Roxo primário */
#9333ea

/* Amarelo primário */
#fbbf24

/* Lilás secundário */
#c084fc
```

### Porta

Para mudar a porta, edite o `.env`:
```env
PORT=3000
```

## 📚 Estrutura do Projeto

```
task-quest-pro/
├── server.js              # Servidor principal
├── public/
│   └── index.html         # Frontend
├── src/
│   ├── server/            # Código do servidor (TypeScript)
│   └── db/                # Banco de dados
├── .env                   # Variáveis de ambiente
├── package.json           # Dependências
└── README.md              # Documentação
```

## 🚀 Deploy

Para fazer deploy em produção:

1. Use um serviço como Heroku, Railway, ou Vercel
2. Configure as variáveis de ambiente no painel do serviço
3. Certifique-se de usar um banco de dados PostgreSQL em produção
4. Use um serviço de email profissional (SendGrid, Mailgun, etc.)

## 📞 Suporte

Para problemas ou dúvidas, verifique o arquivo `README.md` ou entre em contato.

---

**Aproveite o TaskQuest Pro! 🎮**


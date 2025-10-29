# ⚡ Deploy Rápido - TaskQuest Pro

## 3 Passos para Colocar em Produção

### 1️⃣ Criar Conta no Railway (2 minutos)
- Acesse: https://railway.app
- Clique em "Start a New Project"
- Faça login com GitHub (crie conta se necessário)

### 2️⃣ Fazer Upload do Código (1 minuto)
```bash
# No seu computador, dentro da pasta task-quest-pro:
git init
git add .
git commit -m "TaskQuest Pro deployment"
git remote add origin https://github.com/SEU_USERNAME/task-quest-pro.git
git push -u origin main
```

### 3️⃣ Configurar no Railway (2 minutos)
1. No painel do Railway, selecione "Deploy from GitHub"
2. Escolha o repositório `task-quest-pro`
3. Clique em "Variables" e adicione:
   ```
   NODE_ENV=production
   JWT_SECRET=gere-uma-chave-aleatoria
   SMTP_USER=seu-email@gmail.com
   SMTP_PASS=sua-senha-de-app-do-gmail
   NOTIFICATION_EMAILS=artrabalho3@gmail.com,rodolfomarinhomaster@gmail.com
   ```
4. Clique em "Deploy"

## 🎉 Pronto!

Sua aplicação estará online em: `https://seu-app.railway.app`

## Gerar JWT_SECRET

```bash
# No terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Gerar Senha de App do Gmail

1. Acesse: https://myaccount.google.com/apppasswords
2. Selecione "Mail" e "Windows Computer"
3. Copie a senha gerada
4. Cole no Railway como `SMTP_PASS`

## Atualizar Código

```bash
git add .
git commit -m "Descrição das mudanças"
git push origin main
# Railway fará deploy automaticamente!
```

## Documentação Completa

- Ver `DEPLOY_RAILWAY.md` para instruções detalhadas
- Ver `SETUP.md` para configuração local
- Ver `README.md` para documentação técnica

---

**Dúvidas?** Consulte a documentação do Railway: https://docs.railway.app


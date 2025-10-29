# 🚀 Deploy no Heroku - Guia Completo

## O que é Heroku?

Heroku é uma plataforma PaaS que oferece:
- ✅ Deploy fácil do GitHub
- ✅ Variáveis de ambiente seguras
- ✅ Logs em tempo real
- ✅ Domínio automático (*.herokuapp.com)

**Nota**: O plano gratuito do Heroku foi descontinuado. Use Railway em vez disso.

## Alternativa: Railway

Recomendamos usar **Railway** em vez de Heroku. Veja `DEPLOY_RAILWAY.md` para instruções.

## Se ainda quiser usar Heroku:

### Pré-requisitos
1. Conta Heroku - https://www.heroku.com/
2. Heroku CLI - https://devcenter.heroku.com/articles/heroku-cli
3. Git instalado

### Passos

```bash
# Login no Heroku
heroku login

# Criar aplicação
heroku create task-quest-pro

# Configurar variáveis de ambiente
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=sua-chave-secreta
heroku config:set SMTP_USER=seu-email@gmail.com
heroku config:set SMTP_PASS=sua-senha-de-app
heroku config:set NOTIFICATION_EMAILS=artrabalho3@gmail.com,rodolfomarinhomaster@gmail.com

# Deploy
git push heroku main

# Ver logs
heroku logs --tail
```

---

**Recomendação**: Use Railway para hospedagem gratuita moderna.


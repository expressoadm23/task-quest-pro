# 🚀 Deploy no Railway - Guia Completo

## O que é Railway?

Railway é uma plataforma de hospedagem moderna que oferece:
- ✅ Plano gratuito com limite de créditos
- ✅ Deploy automático do GitHub
- ✅ Variáveis de ambiente seguras
- ✅ Logs em tempo real
- ✅ Domínio automático (*.railway.app)

## Pré-requisitos

1. **Conta GitHub** - https://github.com/signup
2. **Conta Railway** - https://railway.app
3. **Git instalado** - https://git-scm.com/download

## Passo 1: Preparar o Repositório Git

```bash
cd task-quest-pro

# Inicializar git (se ainda não foi)
git init
git add .
git commit -m "Initial commit - TaskQuest Pro"

# Adicionar repositório remoto (substitua USERNAME)
git remote add origin https://github.com/USERNAME/task-quest-pro.git
git branch -M main
git push -u origin main
```

## Passo 2: Conectar Railway ao GitHub

1. Acesse https://railway.app
2. Clique em "Start a New Project"
3. Selecione "Deploy from GitHub"
4. Autorize o Railway a acessar sua conta GitHub
5. Selecione o repositório `task-quest-pro`
6. Clique em "Deploy"

## Passo 3: Configurar Variáveis de Ambiente

No painel do Railway:

1. Vá para o projeto
2. Clique em "Variables"
3. Adicione as seguintes variáveis:

```
NODE_ENV=production
JWT_SECRET=uma-chave-super-secreta-aleatoria-aqui
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
NOTIFICATION_EMAILS=artrabalho3@gmail.com,rodolfomarinhomaster@gmail.com
```

### Gerar JWT_SECRET Seguro

```bash
# No terminal, execute:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e use como JWT_SECRET.

## Passo 4: Gerar Senha de App do Gmail

1. Acesse https://myaccount.google.com/
2. Vá para "Segurança"
3. Ative "Autenticação de dois fatores"
4. Procure por "Senhas de app"
5. Selecione "Mail" e "Windows Computer"
6. Copie a senha gerada
7. Cole no Railway como `SMTP_PASS`

## Passo 5: Deploy Automático

O Railway fará o deploy automaticamente quando você:
- Fazer push para o GitHub
- Ou clicar em "Deploy" no painel

O deploy leva cerca de 2-3 minutos.

## Passo 6: Acessar a Aplicação

Após o deploy bem-sucedido:

1. Vá para o painel do Railway
2. Clique em "Deployments"
3. Copie a URL do seu domínio (ex: `task-quest-pro-production.up.railway.app`)
4. Acesse em seu navegador

## 🎉 Pronto!

Sua aplicação está agora hospedada permanentemente no Railway!

## Monitoramento

### Ver Logs
```
No painel do Railway → Logs
```

### Reiniciar Aplicação
```
No painel do Railway → Settings → Restart
```

### Atualizar Código
```bash
git add .
git commit -m "Descrição das mudanças"
git push origin main
# Railway fará deploy automaticamente
```

## Troubleshooting

### Aplicação não inicia
1. Verifique os logs no painel
2. Confirme se todas as variáveis de ambiente estão configuradas
3. Verifique se `SMTP_PASS` está correto

### Emails não são enviados
1. Verifique se a senha de app do Gmail está correta
2. Confirme se o Gmail permite acesso de apps menos seguros
3. Verifique os logs para mensagens de erro

### Banco de dados vazio
1. O banco é criado automaticamente na primeira execução
2. Se precisar resetar, delete o arquivo `dev.db` e reinicie

## Limites do Plano Gratuito

- **Créditos**: $5/mês (geralmente suficiente)
- **Uptime**: 99.9%
- **Armazenamento**: 100GB
- **Banda**: Ilimitada

## Próximos Passos

1. **Domínio Customizado** (opcional)
   - Vá para Railway → Settings → Domains
   - Adicione seu domínio próprio

2. **Backup do Banco de Dados**
   - Faça backup regular do arquivo `dev.db`
   - Ou migre para PostgreSQL

3. **Monitoramento**
   - Configure alertas no painel
   - Monitore uso de créditos

## Suporte

- **Documentação Railway**: https://docs.railway.app
- **Comunidade Railway**: https://discord.gg/railway
- **Issues do Projeto**: GitHub Issues

---

**TaskQuest Pro está agora em produção! 🚀**


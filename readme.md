# Minecraft Server Manager

Este projeto é um **servidor Node.js em TypeScript** que expõe um frontend (`index.html`) para gerenciar servidores **PaperMC do Minecraft**, permitindo baixar automaticamente a versão desejada, configurar, monitorar e controlar o servidor de forma simples e visual.

---

## ✨ Funcionalidades

✅ **Baixar PaperMC**
- Seleciona e baixa automaticamente a versão desejada do PaperMC para seu servidor.

✅ **Configuração automática**
- Configura o `eula.txt` e `server.properties` automaticamente.
- Cria estrutura padrão de diretórios (`plugins`, `world`, etc).

✅ **Monitoramento**
- Visualiza **logs em tempo real** do servidor.
- Mostra **players online** em tempo real.

✅ **Gerenciamento**
- Botões de **start** e **stop** do servidor PaperMC diretamente pelo painel.
- Upload e gerenciamento de **plugins** diretamente pela interface.

✅ **Frontend limpo**
- Servido via Express com `index.html` e TailwindCSS.

---

## 📝 Requisitos
 - Ter instalado o Node 22 no seu sistema. Baixe ele clicando [aqui](https://nodejs.org/dist/latest-v22.x/node-v22.17.0-x86.msi)
 - Clonar o projeto para seu sistema ou baixar o .zip clicando [aqui](https://github.com/jerobas/minecraft-controller/archive/refs/heads/main.zip)
 - Descompacte o arquivo e siga os passos abaixo


## 🚀 Como rodar

### 1️⃣ Instalar dependências
```bash
npm install
```

### 2️⃣ Criar um .env
```bash
PORT=3000
JWT_SECRET=key
PASSWORD="admin_pass"
```

### 3️⃣ Executar
```bash
npm run start
```

## 🖼️ Como mudar o icone do servidor
Gere um arquivo server-icon.png com 64x64 pixels e coloque em /dist/template, substituindo o que existe lá atualmente.

## ⚙️ Tecnologias Utilizadas
  - Node.js 22
  - TypeScript
  - Express
  - TailwindCSS (no frontend)
  - Socket.IO (logs e players online em tempo real)
  - PaperMC API para download automatizado das versões
# Imagem base com Node LTS
FROM node:20-bookworm

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Instalação de dependências do sistema necessárias
RUN apt-get update && apt-get install -y \
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0 \
    libasound2 \
    libxrandr2 \
    libxkbcommon-dev \
    libxfixes3 \
    libxcomposite1 \
    libxdamage1 \
    libgbm-dev \
    libcups2 \
    libcairo2 \
    libpango-1.0-0 \
    libatk-bridge2.0-0 \
    libgl1 \
    libxi6 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Diretório de trabalho
WORKDIR /app

# Copia os arquivos de configuração de dependências
COPY package.json ./

# Instala as dependências com NPM
RUN npm install

# Copia o restante dos arquivos da aplicação
COPY . .

# Expoẽ a porta da aplicação
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "src/index.js"]

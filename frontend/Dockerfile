# Frontend Dockerfile - Multi-stage build
FROM node:22-alpine AS base

WORKDIR /app

# Copia package.json e lock para cache de dependências
COPY package.json package-lock.json ./

# ================================
# Estágio de desenvolvimento
# ================================
FROM base AS development

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["sh", "-c", "npm install && npm run dev -- --host 0.0.0.0"]

# ================================
# Estágio de build
# ================================
FROM base AS build

RUN npm ci

COPY . .

RUN npm run build

# ================================
# Estágio de produção com nginx
# ================================
FROM nginx:alpine AS production

# Copia configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia arquivos buildados
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

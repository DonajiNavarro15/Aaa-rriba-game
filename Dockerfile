FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY index.html grabar.html ./
COPY server ./server
COPY js ./js
COPY css ./css
COPY assets ./assets
USER node
EXPOSE 5500
CMD ["node", "server/index.js"]

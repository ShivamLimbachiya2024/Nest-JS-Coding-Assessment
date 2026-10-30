FROM node:24.22.2-bookworm-slim
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN chown -R node:node /workspace
USER node
CMD ["npm", "run", "start-user"]

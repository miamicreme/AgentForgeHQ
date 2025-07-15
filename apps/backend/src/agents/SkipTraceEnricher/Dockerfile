FROM node:18-slim
WORKDIR /app
COPY . .
RUN if [ -f package.json ]; then npm install && npm run build; fi
CMD ["node", "dist/index.js"]

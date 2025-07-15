FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install --global expo-cli && npm install
EXPOSE 8081
CMD ["expo", "start", "--dev-client", "--tunnel"]

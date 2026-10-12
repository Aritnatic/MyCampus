# MyCampus pilot image: the API plus the admin panel on one port.
#   docker build -t mycampus .
#   docker run -p 4000:4000 -v mycampus-data:/data --env-file .env mycampus
# See backend/DEPLOY.md for the environment variables and the first-admin step.

# ---- 1. build the admin panel (same-origin, so it talks to /api on whatever domain serves it) ----
FROM node:22-slim AS admin
WORKDIR /build
COPY admin-page/package.json admin-page/package-lock.json ./
RUN npm ci
COPY admin-page/ ./
ENV VITE_API_URL=/api
RUN npm run build

# ---- 2. the API ----
FROM node:22-slim
ENV NODE_ENV=production DATA_DIR=/data ADMIN_DIR=/app/admin PORT=4000
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
COPY backend/src ./src
COPY backend/scripts ./scripts
COPY backend/legal ./legal
COPY backend/seed-data ./seed-data
COPY --from=admin /build/dist ./admin
# Everything that must survive a redeploy (database, uploads, backups) lives in /data: mount a volume there.
VOLUME /data
EXPOSE 4000
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "--disable-warning=ExperimentalWarning", "src/server.js"]

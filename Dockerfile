FROM node:26-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable pnpm \
    && pnpm install --frozen-lockfile --prefer-offline

COPY . .
RUN pnpm build

FROM node:26-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/.output .output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]

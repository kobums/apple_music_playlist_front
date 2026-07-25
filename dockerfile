# 1단계: 정적 파일 빌드
FROM --platform=linux/amd64 node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# 2단계: nginx 로 정적 서빙
# 이전 이미지는 프로덕션에서 개발 서버(`yarn start`)를 그대로 띄웠고,
# SPA 라우트를 새로고침하면 404 가 났다.
FROM --platform=linux/amd64 nginx:1.29-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 9002

CMD ["nginx", "-g", "daemon off;"]

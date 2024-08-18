# 1단계: 빌드 단계
# Node.js 이미지를 사용하여 프로젝트를 빌드합니다.
FROM node:18-alpine AS build

# 작업 디렉토리를 설정합니다.
WORKDIR /app

# package.json과 yarn.lock 파일을 복사합니다.
COPY package.json yarn.lock ./

# 의존성을 설치합니다.
RUN yarn install --frozen-lockfile

# 소스 코드를 복사합니다.
COPY . .

# 프로젝트를 빌드합니다.
RUN yarn build

# 2단계: 배포 단계
# Nginx를 사용하여 정적 파일을 서빙합니다.
FROM nginx:stable-alpine

# 빌드된 파일을 Nginx의 기본 경로로 복사합니다.
COPY --from=build /app/build /usr/share/nginx/html

# Nginx 설정 파일을 복사합니다. (필요한 경우)
# COPY nginx.conf /etc/nginx/nginx.conf

# Nginx가 80 포트에서 동작하도록 설정합니다.
EXPOSE 80

# Nginx를 실행합니다.
CMD ["nginx", "-g", "daemon off;"]
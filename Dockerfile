FROM node:23.5 As build
WORKDIR /app

ARG API_AUTH_URI
ARG API_URI
ARG API_PROVIDER_URI
ARG BASE_SOCKET_URL

ENV API_AUTH_URI=${API_AUTH_URI}
ENV API_URI=${API_URI}
ENV API_PROVIDER_URI=${API_PROVIDER_URI}
ENV BASE_SOCKET_URL=${BASE_SOCKET_URL}

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf
# nginx:alpine runs envsubst on /etc/nginx/templates/*.template at start-up and writes the
# result to conf.d, so the Life API address can be changed with `docker run -e LIFE_API_UPSTREAM=...`
# without rebuilding. The default matches the dev proxy: Life on the same host as the main backend.
ENV LIFE_API_UPSTREAM=https://trainnyala.medcoanalytics.com
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

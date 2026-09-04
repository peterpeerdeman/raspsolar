# specify the node base image with your desired version node:<version>
#FROM arm64v8/node:22-slim
FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./

# If you have native dependencies, you'll need extra tools
# RUN apk add --no-cache make gcc g++ python3

RUN npm ci --omit=dev

# Then we copy over the modules from above onto a `slim` image
#FROM arm64v8/node:22-alpine
FROM node:22-alpine

# If possible, run your container using `docker run --init`
# Otherwise, you can use `tini`:
# RUN apk add --no-cache tini
# ENTRYPOINT ["/sbin/tini", "--"]

WORKDIR /app
COPY --from=0 /app .
COPY . .
USER node
ENTRYPOINT ["node", "raspsolar.js"]

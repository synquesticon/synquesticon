FROM node:latest
EXPOSE 3001
COPY "server.js" "/server.js"
COPY "data_exportation.js" "/data_exportation.js"
COPY "data_schema.js" "/data_schema.js"
COPY "package.json" "/package.json"
RUN ["npm", "install"]

CMD [ "node" , "server.js" ]

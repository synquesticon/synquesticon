FROM node:lts
EXPOSE 3000

RUN ["mkdir", "synquesticon"]
RUN ["mkdir", "synquesticon/src"]
RUN ["mkdir", "synquesticon/public"]

COPY "package-lock.json" "/synquesticon/package-lock.json"
COPY "package.json" "/synquesticon/package.json"
COPY ".env" "/synquesticon/.env"
ADD "src" "/synquesticon/src"
ADD "public" "/synquesticon/public"

WORKDIR "/synquesticon"

RUN ["npm", "install"]
CMD [ "npm" , "start"]

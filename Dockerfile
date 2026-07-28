FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# Build frontend
FROM node:22-alpine AS frontend-build
WORKDIR /src
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["backend/src/BuildERP.API/BuildERP.API.csproj", "src/BuildERP.API/"]
COPY ["backend/src/BuildERP.Application/BuildERP.Application.csproj", "src/BuildERP.Application/"]
COPY ["backend/src/BuildERP.Domain/BuildERP.Domain.csproj", "src/BuildERP.Domain/"]
COPY ["backend/src/BuildERP.Infrastructure/BuildERP.Infrastructure.csproj", "src/BuildERP.Infrastructure/"]
RUN dotnet restore "src/BuildERP.API/BuildERP.API.csproj"
COPY backend/ .
RUN dotnet publish "src/BuildERP.API/BuildERP.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
COPY --from=frontend-build /src/dist ./wwwroot/
ENTRYPOINT ["dotnet", "BuildERP.API.dll"]

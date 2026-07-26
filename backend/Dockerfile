FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/BuildERP.API/BuildERP.API.csproj", "src/BuildERP.API/"]
COPY ["src/BuildERP.Application/BuildERP.Application.csproj", "src/BuildERP.Application/"]
COPY ["src/BuildERP.Domain/BuildERP.Domain.csproj", "src/BuildERP.Domain/"]
COPY ["src/BuildERP.Infrastructure/BuildERP.Infrastructure.csproj", "src/BuildERP.Infrastructure/"]
RUN dotnet restore "src/BuildERP.API/BuildERP.API.csproj"
COPY . .
RUN dotnet publish "src/BuildERP.API/BuildERP.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "BuildERP.API.dll"]

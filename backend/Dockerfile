# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0.100-preview.4 AS build
WORKDIR /src

# Copy project files and restore (layer caching)
COPY src/HockeyHub.Core/HockeyHub.Core.csproj src/HockeyHub.Core/
COPY src/HockeyHub.Data/HockeyHub.Data.csproj src/HockeyHub.Data/
COPY src/HockeyHub.Api/HockeyHub.Api.csproj src/HockeyHub.Api/
RUN dotnet restore src/HockeyHub.Api/HockeyHub.Api.csproj

# Copy everything and publish
COPY src/ src/
RUN dotnet publish src/HockeyHub.Api/HockeyHub.Api.csproj -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0.0-preview.4 AS runtime
WORKDIR /app

# Install EF Core tools for running migrations in CI/CD
# (migrations are applied via a separate step, not on container startup)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .

USER app
ENTRYPOINT ["dotnet", "HockeyHub.Api.dll"]

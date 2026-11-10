FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# The csproj links ../Sources/Welcome_1080.png, so Sources/ must sit next to the project folder.
COPY Before-The-Winter-Backend/Before-The-Winter-Backend.csproj Before-The-Winter-Backend/
RUN dotnet restore Before-The-Winter-Backend/Before-The-Winter-Backend.csproj

COPY Sources/ Sources/
COPY Before-The-Winter-Backend/ Before-The-Winter-Backend/
RUN dotnet publish Before-The-Winter-Backend/Before-The-Winter-Backend.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app .

# Render routes traffic to port 10000 by default.
ENV ASPNETCORE_HTTP_PORTS=10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "Before-The-Winter-Backend.dll"]

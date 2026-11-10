# Before The Winter Backend

Run the ASP.NET Core application with `dotnet run --project Before-The-Winter-Backend`.
While it is running, the Telegram bot replies `Hello World!` to `/start`.

The bot token is read from `Telegram:BotToken`. For local development, set it with
`dotnet user-secrets set "Telegram:BotToken" "<token>" --project Before-The-Winter-Backend`.
For deployment, set the `Telegram__BotToken` environment variable. Run only one
instance of the bot poller for a given token.

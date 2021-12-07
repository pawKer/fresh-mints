import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import dotenv from "dotenv";
import { readCommands } from "./utils/utils";
dotenv.config();
const rest = new REST({ version: "9" }).setToken(
  process.env.DISCORD_API_SECRET!
);

const updateCommands = async (commands: string[]): Promise<void> => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationGuildCommands(
        "915621429079330868",
        "912779325235920936"
      ),
      {
        body: commands,
      }
    );

    console.log(
      `Successfully reloaded ${commands.length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
};

readCommands().then(async (commands) => {
  let deployCmds: string[] = commands.map((cmd) => cmd.data.toJSON());
  await updateCommands(deployCmds);
});

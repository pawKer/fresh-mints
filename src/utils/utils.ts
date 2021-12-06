import { Command } from "../../@types/bot";
import glob from "glob";

const isWithinMinutes = (timestamp: string, mins: number): boolean => {
  if (timestamp.length === 10) {
    timestamp = timestamp + "000";
  }
  return Date.now() - parseInt(timestamp) <= mins * 60 * 1000;
};

const readCommands = async () => {
  const commands: any[] = [];
  let res;
  if (process.env.NODE_ENV === "prod") {
    res = glob.sync(`**/*.js`, {
      cwd: `${process.cwd()}/commands/`,
    });
  } else {
    res = res = glob.sync(`**/*.ts`, {
      cwd: `${process.cwd()}/src/commands/`,
    });
  }

  for (const file of res) {
    const fileNoExt = file.substring(0, file.length - 3);

    const command: Command = (await import(`../commands/${fileNoExt}`))
      .default as Command;
    // Set a new item in the Collection
    commands.push(command);
  }
  return commands;
};

const readEvents = async () => {
  const events: any[] = [];
  let res;
  if (process.env.NODE_ENV === "prod") {
    res = glob.sync(`**/*.js`, {
      cwd: `${process.cwd()}/events/`,
    });
  } else {
    res = res = glob.sync(`**/*.ts`, {
      cwd: `${process.cwd()}/src/events/`,
    });
  }
  for (const file of res) {
    const fileNoExt = file.substring(0, file.length - 3);
    const command: Command = (await import(`../events/${fileNoExt}`))
      .default as Command;
    // Set a new item in the Collection
    events.push(command);
  }
  return events;
};

const logApiRequests = (apiClient: any) => {
  console.log("API REQUESTS in the last hour", apiClient.API_REQUEST_COUNT);
  apiClient.API_REQUEST_COUNT = 0;
};

export { isWithinMinutes, readCommands, readEvents, logApiRequests };

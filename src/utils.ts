const isWithinMinutes = (timestamp: string, mins: number): boolean => {
  if (timestamp.length === 10) {
    timestamp = timestamp + "000";
  }
  return Date.now() - parseInt(timestamp) <= mins * 60 * 1000;
};

export { isWithinMinutes };

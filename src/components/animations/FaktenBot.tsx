export type FaktenBotReaction = 0 | 5 | 10;

interface FaktenBotProperties {
  reaction?: FaktenBotReaction;
  search?: boolean;
}

const FaktenBot = (_props: FaktenBotProperties) => {
  return null;
};

export default FaktenBot;

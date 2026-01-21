export interface DisinfoPair {
  pairId: string;
  technique: string;
  misinfo: string;
  factCheck: string;
}

export interface MemoryCard {
  pairId: string;
  factCheck: string;
  instanceId: string;
  isFlipped: boolean;
  isMatched: boolean;
  cardType: "technique" | "misinfo";
  content: string;
  fullContent?: string;
}

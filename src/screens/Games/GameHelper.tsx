import { DisinfoPair, MemoryCard } from "#/types";

export const truncate = (text: string, maxLength = 30): string =>
  text.length > maxLength ? text.slice(0, maxLength) + "..." : text;

export const shuffle = <T,>(array: T[]): T[] => {
  let currentIndex = array.length,
    temporary: T,
    randomIndex: number;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    temporary = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporary;
  }
  return array;
};

export const generateDeck = (pairs: DisinfoPair[]): MemoryCard[] => {
  const deck: MemoryCard[] = [];
  for (const pair of pairs) {
    deck.push(
      {
        pairId: pair.pairId,
        factCheck: pair.factCheck,
        instanceId: `${pair.pairId}-tech`,
        isFlipped: false,
        isMatched: false,
        cardType: "technique",
        content: pair.technique,
      },
      {
        pairId: pair.pairId,
        factCheck: pair.factCheck,
        instanceId: `${pair.pairId}-mis`,
        isFlipped: false,
        isMatched: false,
        cardType: "misinfo",
        content: truncate(pair.misinfo, 30),
        fullContent: pair.misinfo,
      },
    );
  }
  return shuffle(deck);
};

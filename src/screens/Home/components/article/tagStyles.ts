import Colors from "#/constants/Colors";

/**
 * Returns the tag styles for the given color scheme and width
 * @param colorScheme The color scheme to use
 * @param width The width to use
 * @returns The tag styles
 */
const tagStyles = (colorScheme: string, width: number) => {
  const corporate = Colors[colorScheme].corporate;
  const textColor = Colors[colorScheme].text;

  return {
    a: {
      color: corporate,
      textDecorationLine: "underline" as const,
      textDecorationColor: corporate,
    },
    p: { color: textColor, padding: 10, fontSize: 18 },
    strong: {
      color: textColor,
      fontWeight: "bold" as const,
      fontFamily: "SourceSansProSemiBold",
    },
    h1: {
      textTransform: "uppercase" as const,
      color: textColor,
      padding: 10,
    },
    h2: {
      textTransform: "uppercase" as const,
      color: textColor,
      padding: 10,
      fontSize: 24,
    },
    h3: {
      textTransform: "uppercase" as const,
      color: textColor,
      padding: 10,
      fontSize: 24,
    },
    h4: {
      textTransform: "uppercase" as const,
      color: textColor,
      padding: 10,
      fontSize: 24,
    },
    h5: { color: textColor, padding: 10, fontSize: 22 },
    li: {
      color: textColor,
      paddingHorizontal: 10,
      fontSize: 18,
      marginBottom: 10,
    },
    img: { minHeight: 200 },
    figure: {
      left: 0,
    },
    div: { padding: 0, width },
    iframe: { left: 100 },
    figcaption: {
      color: textColor,
      fontSize: 14,
      padding: 10,
      textAlign: "center" as const,
    },
    blockquote: {
      color: textColor,
      fontSize: 18,
      fontStyle: "italic" as const,
      paddingLeft: 20,
      paddingRight: 10,
      paddingVertical: 15,
      marginVertical: 10,
      borderLeftWidth: 4,
      borderLeftColor: corporate,
      backgroundColor: `${corporate}10`, // 10% opacity
    },
    cite: {
      color: textColor,
      fontSize: 14,
      fontStyle: "italic" as const,
      textAlign: "right" as const,
      paddingTop: 5,
    },
  };
};

export default tagStyles;

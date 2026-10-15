import { StyleSheet, View } from "react-native";

import UiButton from "#/components/ui/UiButton";
import UiCollapsable from "#/components/ui/UiCollapsable";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { spacing } from "#/constants/Spacing";
import type { ArticlePage } from "#/helpers/utils/posts";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface PaginationProperties {
  pages: ArticlePage[];
  /** Index of the page currently shown. */
  currentPage: number;
  onSelectPage: (index: number) => void;
}

/**
 * Collapsible table of contents of a multi-page article (one entry per
 * `[nextpage]` section), with the current page highlighted.
 */
export const ArticleTableOfContents = ({
  pages,
  currentPage,
  onSelectPage,
}: PaginationProperties) => {
  const colorScheme = useAppColorScheme();
  const { linkText, primaryMuted, surface, text } = Colors[colorScheme];

  return (
    <View style={styles.tableOfContents}>
      <UiCollapsable
        title={`Inhalt · Seite ${currentPage + 1} von ${pages.length}`}
        cardBackground={surface}
      >
        <View style={styles.entries} testID="article-toc">
          {pages.map((page, index) => {
            const isCurrent = index === currentPage;
            return (
              <UiPressable
                key={page.pageNumber}
                accessibilityRole="button"
                accessibilityState={{ selected: isCurrent }}
                accessibilityLabel={`Seite ${index + 1}: ${page.title}`}
                accessibilityHint="Zeigt diese Seite des Artikels"
                onPress={() => onSelectPage(index)}
                style={[
                  styles.entry,
                  isCurrent && { backgroundColor: primaryMuted },
                ]}
              >
                <UiText
                  bold={isCurrent}
                  style={{ color: isCurrent ? text : linkText }}
                >
                  {`${index + 1}. ${page.title}`}
                </UiText>
              </UiPressable>
            );
          })}
        </View>
      </UiCollapsable>
    </View>
  );
};

/**
 * Previous/next buttons at the end of a page of a multi-page article.
 */
export const ArticlePageNavigation = ({
  pages,
  currentPage,
  onSelectPage,
}: PaginationProperties) => {
  const previous = pages[currentPage - 1];
  const next = pages[currentPage + 1];

  return (
    <View style={styles.navigation} testID="article-page-navigation">
      <UiText size="sm" style={styles.pageCount}>
        {`Seite ${currentPage + 1} von ${pages.length}`}
      </UiText>
      {next && (
        <UiButton
          label={`Weiter: ${next.title}`}
          accessibilityLabel={`Nächste Seite: ${next.title}`}
          accessibilityHint="Zeigt die nächste Seite des Artikels"
          onPress={() => onSelectPage(currentPage + 1)}
        />
      )}
      {previous && (
        <UiButton
          variant="secondary"
          label={`Zurück: ${previous.title}`}
          accessibilityLabel={`Vorherige Seite: ${previous.title}`}
          accessibilityHint="Zeigt die vorherige Seite des Artikels"
          onPress={() => onSelectPage(currentPage - 1)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tableOfContents: {
    marginVertical: spacing.md,
  },
  entries: {
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  entry: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  navigation: {
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  pageCount: {
    textAlign: "center",
  },
});

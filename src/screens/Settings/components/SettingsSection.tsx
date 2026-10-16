import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import UiCollapsable from "#/components/ui/UiCollapsable";
import UiText from "#/components/ui/UiText";
import {
  settingsTextRowStyle,
  settingsTextStyle,
} from "#/components/views/SettingsList";
import { spacing } from "#/constants/Spacing";

interface SettingsSectionProps {
  title: string;
  icon: ReactNode;
  // Intro text shown above the section's controls.
  description?: string;
  children: ReactNode;
}

/**
 * A collapsible settings section. It owns the padding of its content, so
 * every section's content sits at the same distance from its title —
 * children must not add outer padding of their own.
 */
const SettingsSection = ({
  title,
  icon,
  description,
  children,
}: SettingsSectionProps) => (
  <UiCollapsable icon={icon} title={title} borderRadius={0}>
    <View style={styles.body}>
      {description && (
        <View style={settingsTextRowStyle}>
          <UiText size="base" style={settingsTextStyle}>
            {description}
          </UiText>
        </View>
      )}
      {children}
    </View>
  </UiCollapsable>
);

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});

export default SettingsSection;

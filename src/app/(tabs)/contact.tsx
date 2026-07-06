import * as Application from "expo-application";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { ChevronIcon } from "#/components/Icons";
import AnimatedHeader from "#/components/animations/AnimatedHeader";
import AnimatedSuccess from "#/components/animations/AnimatedSuccess";
import Heading from "#/components/typography/Heading";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import UiTextInput from "#/components/ui/UiTextInput";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { globalStyles } from "#/constants/GlobalStyles";
import { registerEvent } from "#/helpers/network/Analytics";
import API from "#/helpers/network/ServerAPI";
import { appName } from "#/helpers/utils/variant";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { ContactCategory } from "#/types";

const CATEGORIES: { key: ContactCategory; label: string }[] = [
  { key: "app_feedback", label: "Feedback" },
  { key: "report_fake", label: "Fake reporten" },
  { key: "other", label: "Sonstiges" },
];

const categoryLabel = (category: ContactCategory) =>
  CATEGORIES.find(({ key }) => key === category)?.label ?? "";

const CATEGORY_TEXTS: Record<
  ContactCategory,
  { titleLabel: string; titleHint: string; messageLabel: string }
> = {
  report_fake: {
    titleLabel: "Link zum Fake",
    titleHint: "Gib einen Link ein",
    messageLabel: "Was ist daran falsch?",
  },
  app_feedback: {
    titleLabel: "Betreff",
    titleHint: "Gib einen Betreff ein",
    messageLabel: "Dein Feedback",
  },
  other: {
    titleLabel: "Betreff",
    titleHint: "Gib einen Betreff ein",
    messageLabel: "Deine Nachricht",
  },
};

const isValidCategory = (value?: string): value is ContactCategory =>
  value === "report_fake" || value === "app_feedback" || value === "other";

const ContactScreen = () => {
  // Local state variables
  const [buttonEnabled, setButtonEnabled] = useState(true);
  const [animation, setAnimation] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<ContactCategory>("app_feedback");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  // Routing and dimensions
  const parameters = useLocalSearchParams<{
    url?: string;
    index?: string;
    category?: string;
  }>();
  const { url: parameterUrl, index, category: parameterCategory } = parameters;
  const scrollOffsetY = useRef(new Animated.Value(0)).current;
  const resetTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const colorScheme = useAppColorScheme();
  const {
    accent,
    errorBackground: errorColor,
    muted,
    inputBackground,
    surface: backgroundColor,
    text: textColor,
  } = Colors[colorScheme];
  // Memoized local styles to avoid re-creating on every render
  const styles = useMemo(
    () =>
      StyleSheet.create({
        dropdown: {
          backgroundColor: inputBackground,
          borderRadius: 5,
        },
        dropdownItem: {
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between",
          padding: 10,
        },
        dropdownItemActive: {
          backgroundColor: accent,
          borderRadius: 5,
        },
        errorText: {
          color: errorColor,
          fontSize: 18,
          fontFamily: "SourceSansProBold",
          marginBottom: 20,
          paddingHorizontal: 12,
          textAlign: "center",
        },
        input: {
          ...globalStyles.input,
          backgroundColor: inputBackground,
          borderRadius: 5,
          padding: 10,
        },
        submitButton: {
          alignItems: "center",
          alignSelf: "center",
          backgroundColor: accent,
          borderRadius: 40,
          justifyContent: "center",
          margin: 20,
          paddingVertical: 10,
          width: 120,
        },
        submitButtonDisabled: {
          backgroundColor: muted,
        },
      }),
    [inputBackground, accent, muted, errorColor],
  );

  // Populate initial fields on component mount or when params change
  useEffect(() => {
    if (isValidCategory(parameterCategory)) {
      setCategory(parameterCategory);
    } else if (parameterUrl) {
      // A url without an explicit category means a fake report
      setCategory("report_fake");
    }
    if (index) {
      setMessage(`Absatz ${index}`);
    }
    if (parameterUrl) {
      if (parameterUrl.includes("http")) {
        setTitle(parameterUrl);
      } else {
        setMessage(parameterUrl);
      }
    }
  }, [parameterUrl, index, parameterCategory]);

  // Cancel the pending success-reset when the screen unmounts
  useEffect(() => () => clearTimeout(resetTimeout.current), []);

  // Callback to handle the submit action
  const onSubmit = useCallback(async () => {
    if (category === "report_fake") {
      if (!title.trim().toLowerCase().startsWith("http")) {
        setError("Bitte einen Link zum Fake eingeben");
        return;
      }
    } else if (title.trim().length === 0) {
      setError("Bitte einen Betreff eingeben");
      return;
    }
    if (message.trim().length < 10) {
      setError("Bitte eine kurze Nachricht eingeben");
      return;
    }
    if (email.trim() && !email.includes("@")) {
      setError("Bitte eine gültige E-Mail-Adresse eingeben");
      return;
    }
    setButtonEnabled(false);

    try {
      await API.postContact({
        category,
        title: title.trim(),
        message: message.trim(),
        email: email.trim(),
        app_variant: appName,
        app_version: Application?.nativeApplicationVersion ?? "",
        platform: Platform.OS,
      });
    } catch {
      setError("Senden fehlgeschlagen. Bitte versuche es später erneut.");
      setButtonEnabled(true);
      return;
    }
    registerEvent(Config.wpUrl, "Contact Submitted", {
      category,
    });

    setAnimation(true);
    setTitle("");
    setMessage("");
    setError("");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    clearTimeout(resetTimeout.current);
    resetTimeout.current = setTimeout(() => {
      setAnimation(false);
      setButtonEnabled(true);
    }, 5000);
  }, [category, title, message, email]);

  const HEADER_HEIGHT = 150;
  const texts = CATEGORY_TEXTS[category];

  return (
    <>
      <AnimatedHeader
        title="Kontakt"
        scrollOffsetY={scrollOffsetY}
        minHeight={100}
        maxHeight={HEADER_HEIGHT}
      />
      <AnimatedSuccess animated={animation} />
      <KeyboardAvoidingView
        style={globalStyles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{
            flex: 1,
            backgroundColor,
          }}
          contentContainerStyle={[
            globalStyles.content,
            { paddingTop: HEADER_HEIGHT },
          ]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
        >
          <Heading style={{ marginBottom: 10 }}>Worum geht es?</Heading>
          <View style={styles.dropdown}>
            <UiPressable
              accessibilityRole="button"
              accessibilityHint="Wähle eine Kategorie aus"
              accessibilityState={{ expanded: dropdownOpen }}
              onPress={() => setDropdownOpen(!dropdownOpen)}
              style={styles.dropdownItem}
            >
              <UiText>{categoryLabel(category)}</UiText>
              <ChevronIcon
                color={textColor}
                direction={dropdownOpen ? "up" : "down"}
                size={16}
              />
            </UiPressable>
            {dropdownOpen &&
              CATEGORIES.map(({ key, label }) => (
                <UiPressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === key }}
                  onPress={() => {
                    setCategory(key);
                    setDropdownOpen(false);
                    setError("");
                  }}
                  style={[
                    styles.dropdownItem,
                    category === key && styles.dropdownItemActive,
                  ]}
                >
                  <UiText
                    style={
                      category === key ? globalStyles.whiteText : undefined
                    }
                  >
                    {label}
                  </UiText>
                </UiPressable>
              ))}
          </View>
          <UiSpace size={20} />
          <Heading style={{ marginBottom: 10 }}>{texts.titleLabel}</Heading>
          <UiTextInput
            accessibilityLabel="Text input field"
            accessibilityHint={texts.titleHint}
            placeholder="..."
            placeholderTextColor={textColor}
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
          <UiSpace size={20} />
          <Heading style={{ marginBottom: 10 }}>{texts.messageLabel}</Heading>
          <UiTextInput
            accessibilityLabel="Text input field"
            accessibilityHint="Gib deine Nachricht ein"
            placeholder="..."
            placeholderTextColor={textColor}
            value={message}
            onChangeText={setMessage}
            multiline
            style={[styles.input, { height: 120 }]}
          />
          <UiSpace size={20} />
          <Heading style={{ marginBottom: 10 }}>
            E-Mail für Rückfragen (optional)
          </Heading>
          <UiTextInput
            accessibilityLabel="Text input field"
            accessibilityHint="Gib deine E-Mail-Adresse ein"
            placeholder="..."
            placeholderTextColor={textColor}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={styles.input}
          />
          <UiSpace size={20} />
          {error ? (
            <UiText style={styles.errorText}>{error}</UiText>
          ) : undefined}
          <UiPressable
            accessibilityRole="button"
            disabled={!buttonEnabled}
            onPress={onSubmit}
            style={[
              styles.submitButton,
              !buttonEnabled && styles.submitButtonDisabled,
            ]}
          >
            <UiText
              style={[
                globalStyles.whiteText,
                { textAlign: "center", fontSize: 18 },
              ]}
            >
              Senden
            </UiText>
          </UiPressable>
          <UiSpace size={100} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default ContactScreen;

import * as Application from "expo-application";
import { BlurTargetView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import type { View as ViewType } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

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
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import { FetchError } from "#/helpers/utils/networking";
import { appName } from "#/helpers/utils/variant";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { ContactCategory } from "#/types";

const MIN_MESSAGE_LENGTH = 10;

const CATEGORIES: { key: ContactCategory; label: string }[] = [
  { key: "app_feedback", label: "Feedback" },
  { key: "report_fake", label: "Fake reporten" },
  { key: "other", label: "Sonstiges" },
];

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
  const [errorField, setErrorField] = useState<
    "title" | "message" | "email" | null
  >(null);
  const [category, setCategory] = useState<ContactCategory>("app_feedback");
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
  const resetTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  // Screen content behind the success overlay, blurred on Android 12+
  const blurTargetRef = useRef<ViewType>(null);
  const colorScheme = useAppColorScheme();
  const {
    accent,
    error: errorColor,
    surfaceDisabled,
    surfaceInput,
    primary,
    surface: backgroundColor,
    text: textColor,
    textMuted,
  } = Colors[colorScheme];
  // Memoized local styles to avoid re-creating on every render
  const styles = useMemo(
    () =>
      StyleSheet.create({
        categoryContainer: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        },
        categoryPill: {
          backgroundColor: surfaceInput,
          borderRadius: 20,
          paddingHorizontal: 14,
          paddingVertical: 8,
        },
        categoryPillActive: {
          backgroundColor: primary,
        },
        categoryPillLabelInactive: {
          color: textMuted,
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
          backgroundColor: surfaceInput,
          // Transparent by default so the error border causes no layout shift
          borderColor: "transparent",
          borderRadius: 5,
          borderWidth: 2,
          padding: 10,
        },
        inputError: {
          borderColor: errorColor,
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
          backgroundColor: surfaceDisabled,
        },
      }),
    [surfaceInput, accent, surfaceDisabled, errorColor, primary, textMuted],
  );

  // Populate initial fields on component mount or when params change
  useEffect(() => {
    const initialCategory = isValidCategory(parameterCategory)
      ? parameterCategory
      : parameterUrl
        ? // A url without an explicit category means a fake report
          "report_fake"
        : undefined;
    if (initialCategory) {
      setCategory(initialCategory);
    }
    // A new navigation intent replaces both fields so nothing stale from a
    // previous entry point (or an earlier draft) is submitted accidentally
    if (parameterUrl) {
      if (initialCategory === "report_fake" && parameterUrl.includes("http")) {
        // The reported url is the title of a fake report
        setTitle(parameterUrl);
        setMessage(index ? `Absatz ${index}` : "");
      } else {
        // For feedback about an article, reference the url in the text
        setTitle("");
        setMessage(
          [parameterUrl, index ? `Absatz ${index}` : ""]
            .filter(Boolean)
            .join("\n") + "\n\n",
        );
      }
    } else if (index) {
      setMessage(`Absatz ${index}`);
    }
  }, [parameterUrl, index, parameterCategory]);

  // Cancel the pending success-reset when the screen unmounts
  useEffect(() => () => clearTimeout(resetTimeout.current), []);

  // Opening the tab dismisses its "new feature" badge
  useFocusEffect(
    useCallback(() => {
      updateBadgeState({ contact: false });
    }, []),
  );

  // Callback to handle the submit action
  const showFieldError = useCallback(
    (field: "title" | "message" | "email", errorMessage: string) => {
      setErrorField(field);
      setError(errorMessage);
    },
    [],
  );

  const clearError = useCallback(() => {
    setError("");
    setErrorField(null);
  }, []);

  const onSubmit = useCallback(async () => {
    if (category === "report_fake") {
      // Same rule as the server: the url must start with http:// or https://
      if (!/^https?:\/\//i.test(title.trim())) {
        showFieldError("title", "Bitte einen Link zum Fake eingeben");
        return;
      }
    } else if (title.trim().length === 0) {
      showFieldError("title", "Bitte einen Betreff eingeben");
      return;
    }
    if (message.trim().length < MIN_MESSAGE_LENGTH) {
      showFieldError(
        "message",
        `Bitte eine kurze Nachricht eingeben (mindestens ${MIN_MESSAGE_LENGTH} Zeichen)`,
      );
      return;
    }
    if (email.trim() && !email.includes("@")) {
      showFieldError("email", "Bitte eine gültige E-Mail-Adresse eingeben");
      return;
    }
    setButtonEnabled(false);

    try {
      await API.postContact({
        category,
        title: title.trim(),
        message: message.trim(),
        // Omitted entirely when the optional field is left blank
        ...(email.trim() ? { email: email.trim() } : {}),
        app_variant: appName,
        app_version: Application?.nativeApplicationVersion ?? "",
        platform: Platform.OS,
      });
    } catch (error_) {
      setErrorField(null);
      setError(
        error_ instanceof FetchError && error_.status === 429
          ? "Zu viele Anfragen. Bitte warte eine Minute und versuche es dann erneut."
          : "Senden fehlgeschlagen. Bitte versuche es später erneut.",
      );
      setButtonEnabled(true);
      return;
    }
    registerEvent(Config.wpUrl, "Contact Submitted", {
      category,
    });

    setAnimation(true);
    setTitle("");
    setMessage("");
    setEmail("");
    clearError();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    clearTimeout(resetTimeout.current);
    resetTimeout.current = setTimeout(() => {
      setAnimation(false);
      setButtonEnabled(true);
    }, 5000);
  }, [category, title, message, email, showFieldError, clearError]);

  const HEADER_HEIGHT = 150;
  const texts = CATEGORY_TEXTS[category];

  return (
    <BlurTargetView ref={blurTargetRef} style={globalStyles.container}>
      <AnimatedHeader
        title="Kontakt"
        scrollOffsetY={scrollOffsetY}
        minHeight={100}
        maxHeight={HEADER_HEIGHT}
      />
      <AnimatedSuccess
        animated={animation}
        subtitle="Deine Nachricht ist bei uns eingegangen!"
        blurTargetRef={blurTargetRef}
      />
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
          <Heading style={{ marginBottom: 10 }}>Thema wählen:</Heading>
          <View style={styles.categoryContainer}>
            {CATEGORIES.map(({ key, label }) => (
              <UiPressable
                key={key}
                accessibilityRole="button"
                accessibilityState={{ selected: category === key }}
                onPress={() => {
                  setCategory(key);
                  clearError();
                }}
                style={[
                  styles.categoryPill,
                  category === key && styles.categoryPillActive,
                ]}
              >
                <UiText
                  style={[
                    globalStyles.pillLabel,
                    category === key
                      ? globalStyles.whiteText
                      : styles.categoryPillLabelInactive,
                  ]}
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
            onChangeText={(value) => {
              setTitle(value);
              if (errorField === "title") clearError();
            }}
            style={[styles.input, errorField === "title" && styles.inputError]}
          />
          <UiSpace size={20} />
          <Heading style={{ marginBottom: 10 }}>{texts.messageLabel}</Heading>
          <UiTextInput
            accessibilityLabel="Text input field"
            accessibilityHint="Gib deine Nachricht ein"
            placeholder="..."
            placeholderTextColor={textColor}
            value={message}
            onChangeText={(value) => {
              setMessage(value);
              if (errorField === "message") clearError();
            }}
            multiline
            style={[
              styles.input,
              { height: 120 },
              errorField === "message" && styles.inputError,
            ]}
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
            onChangeText={(value) => {
              setEmail(value);
              if (errorField === "email") clearError();
            }}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={[styles.input, errorField === "email" && styles.inputError]}
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
    </BlurTargetView>
  );
};

export default ContactScreen;

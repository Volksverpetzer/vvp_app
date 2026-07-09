import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import AnimatedHeader from "#/components/animations/AnimatedHeader";
import AnimatedSuccess from "#/components/animations/AnimatedSuccess";
import Heading from "#/components/typography/Heading";
import UiCheckbox from "#/components/ui/UiCheckbox";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import UiTextInput from "#/components/ui/UiTextInput";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { globalStyles } from "#/constants/GlobalStyles";
import NotificationManager from "#/helpers/Notifications";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import { registerEvent } from "#/helpers/network/Analytics";
import API from "#/helpers/network/ServerAPI";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import ReportStatusList from "#/screens/ReportTab/components/ReportStatusList";

interface Report {
  id: string;
}

const ReportScreen = () => {
  // Local state variables
  const [reports, setReports] = useState<Report[]>([]);
  const [buttonEnabled, setButtonEnabled] = useState(true);
  const [animation, setAnimation] = useState(false);
  const [error, setError] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [moreInfo, setMoreInfo] = useState("");
  const [allowedPublic, setAllowedPublic] = useState(false);

  // Routing and dimensions
  const parameters = useLocalSearchParams<{ url: string; index: string }>();
  const { url: parameterUrl, index } = parameters;
  const scrollOffsetY = useRef(new Animated.Value(0)).current;
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

  // Populate initial fields and load reports on component mount or when params change
  useEffect(() => {
    if (index) {
      setDescription(`Absatz ${index}`);
    }
    if (parameterUrl) {
      if (parameterUrl.includes("http")) {
        setUrl(parameterUrl);
      } else {
        setDescription(parameterUrl);
      }
    }
    PersonalStore.getReports().then((storedReports) => {
      setReports(storedReports || []);
    });
  }, [parameterUrl, index]);

  // Callback to handle the submit action
  const onSubmit = useCallback(async () => {
    if (description.trim().length < 10) {
      setError("Bitte eine kurze Zusammenfassung eingeben");
      return;
    }
    if (
      !url.toLowerCase().trim().startsWith("http://") &&
      !url.toLowerCase().trim().startsWith("https://")
    ) {
      setError("Bitte einen gültigen Link eingeben (http:// oder https://)");
      return;
    }
    setButtonEnabled(false);

    let token: string | undefined;
    try {
      token = await NotificationManager.getToken();
    } catch (error) {
      console.warn("Failed to get notification token:", error);
    }

    const data = await API.reportFake({
      description,
      more_info: moreInfo,
      url,
      allowed_public: allowedPublic,
      token,
    });
    registerEvent(Config.wpUrl, "Report Submitted", {
      allowed_public: allowedPublic,
      has_url: url.trim().length > 0,
    });
    const updatedReports = [...reports, data];
    setReports(updatedReports);
    await PersonalStore.setReports(updatedReports);

    setAnimation(true);
    setDescription("");
    setUrl("");
    setMoreInfo("");
    setError("");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setAnimation(false);
      setButtonEnabled(true);
    }, 5000);
  }, [description, moreInfo, url, allowedPublic, reports]);

  const HEADER_HEIGHT = 150;

  return (
    <>
      <AnimatedHeader
        title="Melden"
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
          <Heading style={{ marginBottom: 10 }}>Zusammenfassung</Heading>
          <UiTextInput
            accessibilityLabel="Text input field"
            accessibilityHint="Gib eine kurze Zusammenfassung ein"
            placeholder="..."
            placeholderTextColor={textColor}
            value={description}
            onChangeText={setDescription}
            multiline
            style={[styles.input, { height: 80 }]}
          />
          <UiSpace size={20} />
          <Heading style={{ marginBottom: 10 }}>Link zum Fake</Heading>
          <UiTextInput
            accessibilityLabel="Text input field"
            accessibilityHint="Gib einen Link ein"
            placeholder="..."
            placeholderTextColor={textColor}
            value={url}
            onChangeText={setUrl}
            style={styles.input}
          />
          <UiSpace size={20} />
          <Heading style={{ marginBottom: 10 }}>Links zum Thema</Heading>
          <UiTextInput
            accessibilityLabel="Text input field"
            accessibilityHint="Gib Links zum Thema ein"
            placeholder="..."
            placeholderTextColor={textColor}
            value={moreInfo}
            onChangeText={setMoreInfo}
            multiline
            style={[styles.input, { height: 80 }]}
          />
          <UiSpace size={20} />
          {error ? (
            <UiText style={styles.errorText}>{error}</UiText>
          ) : undefined}
          <UiCheckbox
            checked={allowedPublic}
            onChange={(checked: boolean) => setAllowedPublic(checked)}
          >
            {/* ensure the text wraps and doesn't overflow */}
            <UiText style={{ flex: 1 }}>
              Der Report darf veröffentlicht werden, sodass andere ihn
              kommentieren können.
            </UiText>
          </UiCheckbox>
          <UiSpace size={20} />
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
              Report
            </UiText>
          </UiPressable>
          <ReportStatusList reports={reports} />
          <UiSpace size={100} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default ReportScreen;

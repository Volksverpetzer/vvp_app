import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import AnimatedHeader from "#/components/animations/AnimatedHeader";
import AnimatedSuccess from "#/components/animations/AnimatedSuccess";
import Checkbox from "#/components/design/Checkbox";
import Space from "#/components/design/Space";
import TextInput from "#/components/design/TextInput";
import Heading from "#/components/typography/Heading";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import PersonalStore from "#/helpers/Stores/PersonalStore";
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
  const pressedButtonColor = inputBackground;

  // Memoized local styles to avoid re-creating on every render
  const localStyles = useMemo(
    () =>
      StyleSheet.create({
        errorText: {
          color: errorColor,
          fontSize: 18,
          fontWeight: "bold",
          marginBottom: 20,
          paddingHorizontal: 12,
          textAlign: "center",
        },
        input: {
          ...styles.input,
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
    setButtonEnabled(false);

    const data = await API.reportFake({
      description,
      more_info: moreInfo,
      url,
      allowed_public: allowedPublic,
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
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{
            flex: 1,
            backgroundColor,
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
          contentContainerStyle={{
            ...styles.feed,
            paddingTop: HEADER_HEIGHT,
          }}
        >
          <Heading style={{ marginBottom: 10 }}>Zusammenfassung</Heading>
          <TextInput
            accessibilityLabel="Text input field"
            accessibilityHint="Gib eine kurze Zusammenfassung ein"
            placeholder="..."
            placeholderTextColor={textColor}
            value={description}
            onChangeText={setDescription}
            multiline
            style={[localStyles.input, { height: 80 }]}
          />
          <Space size={20} />
          <Heading style={{ marginBottom: 10 }}>Link zum Fake</Heading>
          <TextInput
            accessibilityLabel="Text input field"
            accessibilityHint="Gib einen Link ein"
            placeholder="..."
            placeholderTextColor={textColor}
            value={url}
            onChangeText={setUrl}
            style={localStyles.input}
          />
          <Space size={20} />
          <Heading style={{ marginBottom: 10 }}>Links zum Thema</Heading>
          <TextInput
            accessibilityLabel="Text input field"
            accessibilityHint="Gib Links zum Thema ein"
            placeholder="..."
            placeholderTextColor={textColor}
            value={moreInfo}
            onChangeText={setMoreInfo}
            multiline
            style={[localStyles.input, { height: 80 }]}
          />
          <Space size={20} />
          {error ? (
            <UiText style={localStyles.errorText}>{error}</UiText>
          ) : undefined}
          <Checkbox
            checked={allowedPublic}
            onChange={(checked: boolean) => setAllowedPublic(checked)}
          >
            {/* ensure the text wraps and doesn't overflow */}
            <UiText style={{ flex: 1 }}>
              Der Report darf veröffentlicht werden, sodass andere ihn
              kommentieren können.
            </UiText>
          </Checkbox>
          <Space size={20} />
          <Pressable
            accessibilityRole="button"
            disabled={!buttonEnabled}
            onPress={onSubmit}
            style={({ pressed }) => [
              localStyles.submitButton,
              !buttonEnabled && localStyles.submitButtonDisabled,
              pressed &&
                buttonEnabled && { backgroundColor: pressedButtonColor },
            ]}
          >
            <UiText
              style={{
                ...styles.whiteText,
                textAlign: "center",
                fontSize: 18,
              }}
            >
              Report
            </UiText>
          </Pressable>
          <ReportStatusList reports={reports} />
          <Space size={100} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default ReportScreen;

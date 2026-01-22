import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import AnimatedHeader from "#/components/animations/AnimatedHeader";
import AnimatedSuccess from "#/components/animations/AnimatedSuccess";
import Checkbox from "#/components/design/Checkbox";
import Space from "#/components/design/Space";
import Text from "#/components/design/Text";
import TextInput from "#/components/design/TextInput";
import View from "#/components/design/View";
import Heading from "#/components/typography/Heading";
import Colors from "#/constants/Colors";
import { styles as globalStyles, styles } from "#/constants/Styles";
import API from "#/helpers/Networking/ServerAPI";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import useColorScheme from "#/hooks/useColorScheme";
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
  const { height } = useWindowDimensions();
  const colorScheme = useColorScheme();

  // Color constants
  const highlight = Colors[colorScheme].highlight;
  const grayedOut = Colors[colorScheme].grayedOut;
  const inputBackground = Colors[colorScheme].background;
  const backgroundColor = Colors[colorScheme].secondaryBackground;
  const textColor = Colors[colorScheme].text;

  // Memoized local styles to avoid re-creating on every render
  const localStyles = useMemo(
    () =>
      StyleSheet.create({
        errorText: {
          color: highlight,
          textAlign: "center",
        },
        input: {
          ...globalStyles.input,
          backgroundColor: inputBackground,
          borderRadius: 5,
          margin: 0,
          paddingLeft: 13,
          padding: 10,
          width: "100%",
        },
        submitButton: {
          alignItems: "center",
          alignSelf: "center",
          backgroundColor: highlight,
          borderRadius: 40,
          justifyContent: "center",
          margin: 20,
          paddingVertical: 10,
          width: 120,
        },
        submitButtonDisabled: {
          backgroundColor: grayedOut,
        },
      }),
    [inputBackground, highlight, grayedOut],
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
        style={globalStyles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{
            flex: 1,
            paddingTop: HEADER_HEIGHT,
            height,
            paddingHorizontal: 12,
            paddingRight: 24,
            backgroundColor,
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
        >
          <Heading>Zusammenfassung</Heading>
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
          <Heading>Link zum Fake</Heading>
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
          <Heading>Links zum Thema</Heading>
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
            <Text style={localStyles.errorText}>{error}</Text>
          ) : undefined}
          <View
            style={{
              ...globalStyles.row,
              width: "85%",
              paddingHorizontal: 12,
              ...styles.noBackground,
            }}
          >
            <Checkbox
              checked={allowedPublic}
              onChange={(checked: boolean) => setAllowedPublic(checked)}
            />
            <View style={{ width: 20 }} />
            <Text>
              Der Report darf veröffentlicht werden, sodass andere ihn
              kommentieren können.
            </Text>
          </View>
          <Space size={20} />
          <Pressable
            accessibilityRole="button"
            disabled={!buttonEnabled}
            onPress={onSubmit}
            style={({ pressed }) => [
              localStyles.submitButton,
              !buttonEnabled && localStyles.submitButtonDisabled,
              pressed && buttonEnabled && { backgroundColor: inputBackground },
            ]}
          >
            <Text
              style={{ textAlign: "center", fontSize: 18, ...styles.whiteText }}
            >
              Report
            </Text>
          </Pressable>
          <ReportStatusList reports={reports} />
          <Space size={300} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default ReportScreen;

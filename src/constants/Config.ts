import Constants from "expo-constants";

import type { ExtraConfigType } from "#/types";

// this provides the extra config from app.json with types
const Config: ExtraConfigType = Constants.expoConfig.extra as ExtraConfigType;

export default Config;

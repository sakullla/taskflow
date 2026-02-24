import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import zhCommon from "@/locales/zh-CN/common.json";
import zhNav from "@/locales/zh-CN/navigation.json";
import zhTasks from "@/locales/zh-CN/tasks.json";
import zhSettings from "@/locales/zh-CN/settings.json";

import enCommon from "@/locales/en/common.json";
import enNav from "@/locales/en/navigation.json";
import enTasks from "@/locales/en/tasks.json";
import enSettings from "@/locales/en/settings.json";

const resources = {
  "zh-CN": {
    common: zhCommon,
    navigation: zhNav,
    tasks: zhTasks,
    settings: zhSettings,
  },
  en: {
    common: enCommon,
    navigation: enNav,
    tasks: enTasks,
    settings: enSettings,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "zh-CN",
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import zhCommon from "@/locales/zh-CN/common.json";
import zhNav from "@/locales/zh-CN/navigation.json";
import zhTasks from "@/locales/zh-CN/tasks.json";

import enCommon from "@/locales/en/common.json";
import enNav from "@/locales/en/navigation.json";
import enTasks from "@/locales/en/tasks.json";

const resources = {
  "zh-CN": {
    common: zhCommon,
    navigation: zhNav,
    tasks: zhTasks,
  },
  en: {
    common: enCommon,
    navigation: enNav,
    tasks: enTasks,
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

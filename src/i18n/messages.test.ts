/**
 * Guards against shipping a page that references a translation key which
 * doesn't exist in messages/en.json — next-intl fails at render time
 * otherwise, and that failure is easy to miss until the page is opened.
 */
import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";

describe("en messages", () => {
  it("has every key the landing page reads", () => {
    for (const key of [
      "eyebrow",
      "heroHeadline",
      "getStarted",
      "letsTalk",
      "imageLabel",
      "testimonialQuote",
      "testimonialAttribution",
      "ctaBarBody",
      "aboutTitle",
      "aboutBody",
      "value1Title",
      "value1Body",
      "value2Title",
      "value2Body",
      "value3Title",
      "value3Body",
      "value4Title",
      "value4Body",
      "ctaTitle",
      "ctaBody",
      "footer",
    ] as const) {
      expect(en.landing[key]).toBeTruthy();
    }
  });

  it("has every key the login page reads", () => {
    for (const key of [
      "title",
      "subtitle",
      "emailLabel",
      "emailPlaceholder",
      "passwordLabel",
      "submit",
      "comingSoon",
      "backToHome",
      "noAccount",
      "signUp",
    ] as const) {
      expect(en.login[key]).toBeTruthy();
    }
  });

  it("has every key the signup page reads", () => {
    for (const key of [
      "title",
      "subtitle",
      "nameLabel",
      "namePlaceholder",
      "orgLabel",
      "orgPlaceholder",
      "emailLabel",
      "emailPlaceholder",
      "passwordLabel",
      "submit",
      "comingSoon",
      "backToHome",
      "hasAccount",
      "signIn",
    ] as const) {
      expect(en.signup[key]).toBeTruthy();
    }
  });

  it("has every key the about page reads", () => {
    for (const key of [
      "eyebrow",
      "heroTitle",
      "bodyLeft",
      "bodyRight",
      "imageLabel",
      "numbered1Title",
      "numbered1Body",
      "numbered2Title",
      "numbered2Body",
      "numbered3Title",
      "numbered3Body",
      "missionTitle",
      "missionBody",
      "rolesTitle",
      "roleMemberTitle",
      "roleMemberBody",
      "rolePartnerTitle",
      "rolePartnerBody",
      "roleLeadTitle",
      "roleLeadBody",
      "roleAdminTitle",
      "roleAdminBody",
      "aiTitle",
      "aiBody",
    ] as const) {
      expect(en.about[key]).toBeTruthy();
    }
  });

  it("has every key the contact page reads", () => {
    for (const key of [
      "eyebrow",
      "title",
      "subtitle",
      "nameLabel",
      "namePlaceholder",
      "emailLabel",
      "emailPlaceholder",
      "orgLabel",
      "orgPlaceholder",
      "messageLabel",
      "messagePlaceholder",
      "submit",
      "thankYouTitle",
      "thankYouBody",
      "directTitle",
      "directEmail",
    ] as const) {
      expect(en.contact[key]).toBeTruthy();
    }
  });

  it("has every key the chat widget reads", () => {
    for (const key of [
      "launcherLabel",
      "panelTitle",
      "panelSubtitle",
      "disclaimer",
      "inputPlaceholder",
      "thinking",
      "genericError",
      "close",
    ] as const) {
      expect(en.chat[key]).toBeTruthy();
    }
  });

  it("has the shared nav and app name", () => {
    expect(en.common.appName).toBe("CIRCLE");
    expect(en.nav.announcement).toBeTruthy();
    expect(en.nav.announcementCta).toBeTruthy();
    expect(en.nav.home).toBeTruthy();
    expect(en.nav.about).toBeTruthy();
    expect(en.nav.contact).toBeTruthy();
    expect(en.nav.signIn).toBeTruthy();
    expect(en.nav.signUp).toBeTruthy();
  });
});

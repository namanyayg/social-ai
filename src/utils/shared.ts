import { notyf } from "../chrome/content_script";
import { Config } from "./config";
import { Domains, TOAST_CLASSNAME } from "./constants";
import { HashtagOptions } from "./options";
import { WELCOME_PAGE } from "./constants";
import { createPrompt, generateErrorMessage } from "./generators";
import OpenAI from "openai";

export const getComment = async (
  config: Config,
  domain: Domains,
  content: string
): Promise<string> => {
  const openai = new OpenAI({
    apiKey: config["social-comments-openapi-key"],
    dangerouslyAllowBrowser: true
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: createPrompt(domain, config, content) }],
      temperature: 0,
      max_tokens: 3000,
    });

    let comment = completion.choices[0]?.message?.content || "";
    comment = comment.trim().replace(/(^"|"$)/g, "");

    if (config["opt-hashtag-option"] === HashtagOptions.NO) {
      comment = comment.replace(/#\w+/g, "").replace("Comment: ", "");
    }

    return comment;
  } catch (error: any) {
    const status = error?.status || 500;
    const { title, message } = generateErrorMessage(status);
    console.log(error);
    notyf?.error({
      duration: 0,
      dismissible: true,
      message: `<div class="title">ERROR${title}</div><p>${message}</p><p class="small">See <a href="https://help.openai.com/en/articles/6891839-api-error-code-guidance" target="_blank">OpenAI API error guidance</a> for more info.</p>`,
      className: `${TOAST_CLASSNAME} ${domain.replace(/([.]\w+)$/, "")}`,
      ripple: false,
    });
    return "";
  }
};

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const closestSibling = (
  element: Element,
  query: string
): Element | null => {
  const parent = element.parentElement;
  if (parent === null) return null;
  const sibling = parent.querySelector(query);
  if (sibling !== null) return sibling;
  return closestSibling(parent, query);
};

export const setInnerHTML = (element: Element, html: string) => {
  try {
    element.innerHTML = html;
  } catch {}
};

export const imitateKeyInput = (el: HTMLTextAreaElement, keyChar: string) => {
  const keyboardEventInit = {
    bubbles: false,
    cancelable: false,
    composed: false,
    key: "",
    code: "",
    location: 0,
  };
  el.dispatchEvent(new KeyboardEvent("keydown", keyboardEventInit));
  el.value = keyChar;
  el.dispatchEvent(new KeyboardEvent("keyup", keyboardEventInit));
  el.dispatchEvent(new Event("change", { bubbles: true }));
};

export const showAPIKeyError = (domain: Domains) => {
  notyf?.error({
    duration: 3000,
    dismissible: true,
    message: `<div class="title">API key is not set</div><p>Please set OpenAI API key in the popup.</p><p class="small">See <a href="${WELCOME_PAGE}" target="_blank">onboarding</a> for more info.</p>`,
    className: `${TOAST_CLASSNAME} ${domain.replace(/([.]\w+)$/, "")}`,
    ripple: false,
  });
};

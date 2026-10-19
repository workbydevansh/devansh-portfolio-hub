import { useEffect, useState } from "react";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase/browser";
import type { SocialLink } from "@/lib/supabase/types";
import { getErrorMessage } from "@/lib/utils";

export function normalizePlatform(platform: string) {
  return platform.trim().toLowerCase();
}

export function isEmailPlatform(platform: string) {
  return ["email", "mail"].includes(normalizePlatform(platform));
}

// Email links open a Gmail draft; every other platform links straight out.
export function getContactHref(link: SocialLink) {
  const url = link.url.trim();

  if (!isEmailPlatform(link.platform)) {
    return url;
  }

  const emailAddress = url.replace(/^mailto:/i, "").split("?")[0].trim();
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    emailAddress,
  )}`;
}

// First link (in display order) whose platform matches one of the keys.
export function findSocialLink(links: SocialLink[], platformKeys: string[]) {
  return links.find((link) =>
    platformKeys.includes(normalizePlatform(link.platform)),
  );
}

let socialLinksRequest: Promise<SocialLink[]> | undefined;

// Shared by the footer and the contact page, so a page that shows both
// fetches the links once instead of twice.
function fetchSocialLinks() {
  socialLinksRequest ??= Promise.resolve(
    getSupabaseBrowserClient()
      .from("social_links")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ).then(({ data, error }) => {
    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as SocialLink[];
  });

  return socialLinksRequest;
}

export function useSocialLinks() {
  const [state, setState] = useState({
    links: [] as SocialLink[],
    isLoading: hasSupabaseConfig,
    error: "",
  });

  useEffect(() => {
    if (!hasSupabaseConfig) {
      return;
    }

    let isCurrent = true;

    fetchSocialLinks().then(
      (links) => {
        if (isCurrent) {
          setState({ links, isLoading: false, error: "" });
        }
      },
      (error: unknown) => {
        socialLinksRequest = undefined;

        if (isCurrent) {
          setState({
            links: [],
            isLoading: false,
            error: getErrorMessage(error, "Unable to load contact links."),
          });
        }
      },
    );

    return () => {
      isCurrent = false;
    };
  }, []);

  return state;
}

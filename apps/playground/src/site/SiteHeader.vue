<script lang="ts">
import type { FunctionalComponent } from "vue";
import type { PlaygroundRoute } from "../navigation";
import { renderSiteHeader, type SiteSection } from "./header";
import "./header.css";

const routes = {
  docs: { view: "docs" }, catalog: { view: "docs", section: "components" }, recipes: { view: "docs", section: "recipes" }
} as const;

interface HeaderProps {
  language: string;
  route: PlaygroundRoute;
  dark: boolean;
  onNavigate: (route: PlaygroundRoute) => void;
  onToggleTheme: () => void;
}

const SiteHeader: FunctionalComponent<HeaderProps> = (props) => {
  const { view, component, section } = props.route;
  const active = view !== "docs" ? undefined : section === "recipes" ? "recipes" : component || section === "components" ? "catalog" : "docs";
  return renderSiteHeader(props.language === "ru" ? "ru" : "en", import.meta.env.BASE_URL, active, props.dark, {
    navigate(event: MouseEvent, key: SiteSection) {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      props.onNavigate(routes[key]);
    },
    toggleTheme: props.onToggleTheme
  });
};
SiteHeader.props = ["language", "route", "dark", "onNavigate", "onToggleTheme"];
SiteHeader.inheritAttrs = false;
export default SiteHeader;
</script>

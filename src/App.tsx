import { useEffect } from "react";
import { useRoute } from "./router";
import { settings } from "./state/settings";
import { MidiProvider } from "./midi/MidiProvider";
import { setSustain } from "./audio/synth";
import { Home } from "./screens/Home";
import { Songs } from "./screens/Songs";
import { LessonScreen } from "./screens/LessonScreen";
import { FreePiano } from "./screens/FreePiano";
import { ProgressScreen } from "./screens/ProgressScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { IconRotate } from "./components/Icons";
import { PwaToast } from "./components/PwaToast";
import { CourseMap } from "./screens/CourseMap";
import { CourseItemScreen, CourseTestScreen } from "./screens/CourseItem";

export default function App() {
  const route = useRoute();
  const { theme } = settings.use();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  // cada pantalla empieza arriba
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.name]);

  let screen;
  switch (route.name) {
    case "songs":
      screen = <Songs />;
      break;
    case "lesson":
      screen = <LessonScreen songId={route.songId} />;
      break;
    case "piano":
      screen = <FreePiano />;
      break;
    case "progress":
      screen = <ProgressScreen />;
      break;
    case "settings":
      screen = <SettingsScreen />;
      break;
    case "course":
      screen = <CourseMap />;
      break;
    case "courseItem":
      screen = <CourseItemScreen key={route.itemId} itemId={route.itemId} />;
      break;
    case "courseTest":
      screen = <CourseTestScreen key={route.unitId} unitId={route.unitId} />;
      break;
    default:
      screen = <Home />;
  }

  return (
    <MidiProvider onPedal={setSustain}>
      <div className="app">{screen}</div>
      <PwaToast route={route} />
      <div className="rotate">
        <span className="rotate-brand">Tecla</span>
        <IconRotate />
        <h2>Gira el móvil</h2>
        <p>Tecla necesita la pantalla en horizontal para que quepan la partitura y el teclado.</p>
      </div>
    </MidiProvider>
  );
}

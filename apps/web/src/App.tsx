import Phaser from "phaser";
import { useEffect, useRef } from "react";
import { DemoScene } from "./game/DemoScene";
import { initDiscordSdk } from "./lib/discord/bootstrap";

function App() {
  const gameContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!gameContainerRef.current) {
      return;
    }

    let game: Phaser.Game | null = null;
    let disposed = false;

    const bootstrap = async () => {
      await initDiscordSdk();
      if (disposed || !gameContainerRef.current) {
        return;
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: gameContainerRef.current,
        backgroundColor: "#0f172a",
        render: {
          pixelArt: true,
          antialias: false,
          roundPixels: false,
        },
        scale: {
          mode: Phaser.Scale.RESIZE,
          width: window.innerWidth,
          height: window.innerHeight,
        },
        scene: DemoScene,
      });
    };

    void bootstrap();

    return () => {
      disposed = true;
      game?.destroy(true);
    };
  }, []);

  return (
    <main className="h-screen w-screen overflow-hidden bg-slate-950">
      <div ref={gameContainerRef} className="h-full w-full" />
    </main>
  );
}

export default App;

import Phaser from "phaser";
import { useEffect, useRef } from "react";
import { DemoScene } from "./game/DemoScene";

function App() {
  const gameContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!gameContainerRef.current) {
      return;
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      backgroundColor: "#0f172a",
      render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true,
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: window.innerWidth,
        height: window.innerHeight,
      },
      scene: DemoScene,
    });

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <main className="h-screen w-screen overflow-hidden bg-slate-950">
      <div ref={gameContainerRef} className="h-full w-full" />
    </main>
  );
}

export default App;

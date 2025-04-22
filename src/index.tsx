import React from "react";
import { AppUiProvider } from "@canva/app-ui-kit";
import { createRoot, Root } from "react-dom/client";
import { App } from "./app";
import "@canva/app-ui-kit/styles.css";
import { AppI18nProvider } from "@canva/app-i18n-kit";

// 1. Importe le SDK principal de Canva
import * as Canva from "@canva/editing-extensions-api-typings"; // Ou le package runtime correspondant si différent

let reactRoot: Root | null = null;

function renderApp() {
  if (!reactRoot) {
    console.error("Erreur critique : la racine React n'a pas été initialisée avant le rendu.");
    return;
  }
  console.log("Attempting to render React application...");
  reactRoot.render(
    <React.StrictMode>
      <AppI18nProvider>
        <AppUiProvider>
          <App />
        </AppUiProvider>
      </AppI18nProvider>
    </React.StrictMode>
  );
  console.log("React application rendered successfully.");
}

// 2. Utilise Canva.App.onReady comme point d'entrée
console.log("Waiting for Canva SDK (Canva.App.onReady) to be called...");
Canva.App.onReady(async (opts) => { // Utilise Canva.App.onReady ici
  console.log("Canva.App.onReady callback executed. Initializing React root...", opts);
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    console.error(
      "Erreur critique : Impossible de trouver l'élément DOM avec l'ID 'root'."
    );
    // Tu pourrais vouloir retourner une erreur ou lancer une exception ici
    // pour signaler à Canva que l'initialisation a échoué.
    // Par exemple : throw new Error("Root element not found");
    return {
      // Optionnellement, définir un état d'erreur si l'API le permet.
      // Sinon, juste loguer et ne rien faire pourrait être suffisant.
    };
  }

  // Crée la racine React seulement maintenant, à l'intérieur de onReady
  reactRoot = createRoot(rootElement);

  // Effectue le premier rendu
  renderApp();

  // 3. Retourne les callbacks nécessaires (au minimum onUnload pour nettoyer)
  return {
    onUnload: () => {
      console.log("Unloading application...");
      if (reactRoot) {
        reactRoot.unmount();
        reactRoot = null; // Nettoie la référence
        console.log("React root unmounted.");
      } else {
        console.warn("Attempted to unmount, but React root was already null.");
      }
    },
    // Ajoute d'autres callbacks si ton application en a besoin (onConfigure, etc.)
  };
});

// La partie HMR est toujours commentée, c'est correct pour le build de production.
/*
if (process.env.NODE_ENV !== 'production') {
  // ... HMR code ...
}
*/
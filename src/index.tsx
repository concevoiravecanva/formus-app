import React from "react"; // Important d'importer React pour JSX et StrictMode
import { AppUiProvider } from "@canva/app-ui-kit";
import { createRoot, Root } from "react-dom/client"; // Importe le type Root pour plus de clarté
import { App } from "./app";
import "@canva/app-ui-kit/styles.css";
import { AppI18nProvider } from "@canva/app-i18n-kit";
import { onReady } from "@canva/platform";

// Déclare une variable pour stocker la racine React, initialement null
let reactRoot: Root | null = null;

/**
 * Fonction dédiée au rendu de l'application React.
 * Elle sera appelée initialement par onReady.
 * (La partie HMR qui appelait aussi cette fonction est maintenant commentée)
 */
function renderApp() {
  // Vérifie si la racine React a été initialisée avant de rendre
  if (!reactRoot) {
    console.error("Erreur critique : la racine React n'a pas été initialisée avant le rendu.");
    return;
  }

  console.log("Attempting to render React application..."); // Log pour le suivi

  // Utilise StrictMode en développement pour des vérifications supplémentaires
  // Note: StrictMode lui-même est éliminé en production.
  reactRoot.render(
    <React.StrictMode>
      <AppI18nProvider>
        <AppUiProvider>
          <App />
        </AppUiProvider>
      </AppI18nProvider>
    </React.StrictMode>
  );
  console.log("React application rendered successfully."); // Log de succès
}

// Attend que le SDK Canva soit prêt avant d'initialiser et de rendre l'application
console.log("Waiting for Canva SDK to be ready...");
onReady(async () => {
  console.log("Canva SDK is ready. Initializing React root...");
  const rootElement = document.getElementById("root");

  // Vérification cruciale que l'élément racine existe dans le DOM
  if (!rootElement) {
    console.error(
      "Erreur critique : Impossible de trouver l'élément DOM avec l'ID 'root'. " +
      "Assurez-vous qu'il existe dans votre index.html."
    );
    return; // Arrête l'exécution si l'élément racine n'est pas trouvé
  }

  // Crée la racine React et la stocke dans la variable `reactRoot`
  reactRoot = createRoot(rootElement);

  // Effectue le premier rendu de l'application
  renderApp();
});

// --- Gestion du Hot Module Replacement (HMR) pour le développement ---
// --- BLOQUÉ POUR TEST DE PRODUCTION ---
/*  <-- Début du commentaire
if (process.env.NODE_ENV !== 'production') {
  if (module.hot) {
      console.log("HMR support enabled.");
      module.hot.accept("./app", () => {
        console.log("HMR update detected for './app'. Re-rendering...");
        renderApp();
      });
      // Optionnel : Vous pourriez ajouter d'autres modules à surveiller si nécessaire
      // module.hot.accept(['./autre-module', './encore-un-autre'], renderApp);
  }
}
*/ // <-- Fin du commentaire
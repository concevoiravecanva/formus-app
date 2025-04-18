// src/app.tsx
import React from 'react';
// Gardons UN seul import simple d'une librairie que vous utilisez pour tester
import { Text } from "@canva/app-ui-kit";

export const App = () => {
  // Pas d'états, pas d'effets, pas de refs, pas de fonctions complexes pour l'instant
  console.log('--- RENDERING MINIMAL APP ---'); // Ajoutez un log pour être sûr

  return (
    <div>
      <Text>Application en cours de chargement...</Text>
      {/* <p>Si vous voyez ceci, le composant App de base fonctionne.</p> */}
      {/* Ne mettez RIEN d'autre ici pour l'instant */}
    </div>
  );
};
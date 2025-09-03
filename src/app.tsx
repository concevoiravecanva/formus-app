import React, { useState } from 'react';
import { Button, FormField, Select, TextInput } from '@canva/app-ui-kit';
// import { useSelection } from 'canva-app-development/api';

const FontoApp = () => {
  const [selectedLetter, setSelectedLetter] = useState('A');
  const [selectedFont, setSelectedFont] = useState('Roboto');
  const [selectedAction, setSelectedAction] = useState(2); // 0: Ajouter, 1: Supprimer, 2: Déplacer
  // const { addNativeElement } = useSelection();
  
  const fonts = [
    'Roboto',
    'Open Sans',
    'Montserrat',
    'Lato',
    'Playfair Display',
    // Plus de polices Google Fonts
  ];
  
  const handleAddToCanva = () => {
    // Ici, vous enverriez la lettre modifiée à Canva
  // addNativeElement({
  //   type: 'TEXT',
  //   children: [selectedLetter],
  //   fontFamily: selectedFont,
  //   // Autres propriétés avec les modifications Bézier
  // });
  };
  
  return (
    <div style={{ padding: '16px' }}>
      <FormField
        label="Lettre à modifier"
        description="Sélectionnez une lettre"
        control={() => (
          <TextInput
            value={selectedLetter}
            onChange={setSelectedLetter}
            maxLength={1}
          />
        )}
      />
      
      <FormField
        label="Police d'écriture"
        description="Choisissez une police Google Fonts"
        control={() => (
          <Select
            options={fonts.map(font => ({ value: font, label: font }))}
            value={selectedFont}
            onChange={setSelectedFont}
          />
        )}
      />
      
      {/* Ici viendrait le composant d'édition Bézier */}
      <div style={{ 
        height: '300px', 
        border: '1px dashed #ccc', 
        margin: '16px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '240px', // 2x larger
        fontFamily: selectedFont
      }}>
        {selectedLetter}
      </div>

        {/* Ligne de boutons pour les actions sur les points */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {['Ajouter un point', 'Supprimer un point', 'Déplacer un point'].map((action, idx) => (
            <Button
              key={action}
              variant={selectedAction === idx ? 'primary' : 'secondary'}
              onClick={() => setSelectedAction(idx)}
            >
              {action}
            </Button>
          ))}
        </div>
      
      <Button 
        variant="primary" 
        onClick={handleAddToCanva}
        stretch
      >
        Ajouter à Canva
      </Button>
    </div>
  );
};

export default FontoApp;
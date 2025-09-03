import React, { useState, useEffect } from 'react';
import opentype from 'opentype.js';
import { Button, Select, TextInput } from '@canva/app-ui-kit';

// import { useSelection } from 'canva-app-development/api';

const FontoApp = () => {
  const [draggedPointIdx, setDraggedPointIdx] = useState<number|null>(null);
  const [selectedLetter, setSelectedLetter] = useState('A');
  const [selectedFont, setSelectedFont] = useState('Roboto');
  const [selectedVariant, setSelectedVariant] = useState('normal');
  const [selectedAction, setSelectedAction] = useState(2); // 0: Ajouter, 1: Supprimer, 2: Déplacer
  const [svgPath, setSvgPath] = useState('');
  const [bezierPoints, setBezierPoints] = useState<opentype.PathCommand[]>([]);
  // Mapping des polices et variantes Google Fonts
  const fontOptions = [
    {
      name: 'Roboto',
      variants: {
        normal: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxM.ttf',
        bold: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc9.ttf',
        italic: 'https://fonts.gstatic.com/s/roboto/v30/KFOkCnqEu92Fr1Mu51xIIzc.ttf'
      }
    },
    {
      name: 'Open Sans',
      variants: {
        normal: 'https://fonts.gstatic.com/s/opensans/v29/mem8YaGs126MiZpBA-UFVZ0e.ttf',
        bold: 'https://fonts.gstatic.com/s/opensans/v29/mem5YaGs126MiZpBA-UN7rgOUuhp.ttf',
        italic: 'https://fonts.gstatic.com/s/opensans/v29/mem6YaGs126MiZpBA-UFUK0Zdc1UAw.ttf'
      }
    },
    {
      name: 'Montserrat',
      variants: {
        normal: 'https://fonts.gstatic.com/s/montserrat/v25/JTUQjIg1_i6t8kCHKm45_Q.ttf',
        bold: 'https://fonts.gstatic.com/s/montserrat/v25/JTURjIg1_i6t8kCHKm45_cJD6g.ttf',
        italic: 'https://fonts.gstatic.com/s/montserrat/v25/JTUOjIg1_i6t8kCHKm45x4w.ttf'
      }
    },
    {
      name: 'Lato',
      variants: {
        normal: 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjxAwXiWtFCc.ttf',
        bold: 'https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVSwiPHA.ttf',
        italic: 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjxAwXiWtFchv.ttf'
      }
    },
    {
      name: 'Playfair Display',
      variants: {
        normal: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYh2I.ttf',
        bold: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFkD-vYSZviVYUb_rj3ij__anPXDTzYh2Iu7g.ttf',
        italic: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFjD-vYSZviVYUb_rj3ij__anPXDTzYh2Iu6g.ttf'
      }
    }
  ];

  // Liste des polices pour le Select
  const fonts = fontOptions.map(f => f.name);

  // Variantes possibles
  const variantLabels = {
    normal: 'Normal',
    bold: 'Gras',
    italic: 'Italique'
  };

  // Variantes disponibles pour la police sélectionnée
  const selectedFontObj = fontOptions.find(f => f.name === selectedFont);
  const availableVariants = selectedFontObj ? Object.keys(selectedFontObj.variants) : [];

  useEffect(() => {
    if (!selectedFontObj) return;
    const fontUrl = selectedFontObj.variants[selectedVariant];
    opentype.load(fontUrl, (err, font) => {
      if (err || !font) {
        setSvgPath('');
        setBezierPoints([]);
        return;
      }
      // Génère le chemin et centre la lettre dans le canvas
      const fontSize = 240;
      const x = 0, y = 200;
      const path = font.getPath(selectedLetter, x, y, fontSize);
      // Calcul du bounding box
      const bbox = path.getBoundingBox();
      // Centre la lettre dans le SVG (300x300)
      const dx = 150 - (bbox.x1 + bbox.x2) / 2;
      const dy = 150 - (bbox.y1 + bbox.y2) / 2;
      // Applique la translation
      path.commands.forEach(cmd => {
        if (cmd.x !== undefined) cmd.x += dx;
        if (cmd.y !== undefined) cmd.y += dy;
        if (cmd.x1 !== undefined) cmd.x1 += dx;
        if (cmd.y1 !== undefined) cmd.y1 += dy;
        if (cmd.x2 !== undefined) cmd.x2 += dx;
        if (cmd.y2 !== undefined) cmd.y2 += dy;
      });
      setSvgPath(path.toPathData());
      setBezierPoints([...path.commands]);
    });
  }, [selectedLetter, selectedFont, selectedVariant]);
  // const { addNativeElement } = useSelection();
  
  
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
      {/* Ligne unique pour choisir lettre, variante et police */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
        <TextInput
          value={selectedLetter}
          onChange={setSelectedLetter}
          maxLength={1}
          placeholder="Lettre"
        />
        <Select
          options={Object.keys(variantLabels).map(variant => ({
            value: variant,
            label: variantLabels[variant],
            disabled: !availableVariants.includes(variant),
            style: !availableVariants.includes(variant) ? { color: '#ccc', background: '#f9f9f9' } : {}
          }))}
          value={selectedVariant}
          onChange={setSelectedVariant}
        />
        <Select
          options={fonts.map(font => ({ value: font, label: font }))}
          value={selectedFont}
          onChange={setSelectedFont}
        />
  </div>
      <div style={{ 
        height: '300px', 
        border: '1px dashed #ccc', 
        margin: '16px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff'
      }}>
        {svgPath ? (
          <svg
            width="100%" height="100%" viewBox="0 0 300 300"
            style={{ cursor: draggedPointIdx != null ? 'grabbing' : 'default' }}
            onMouseMove={e => {
              if (draggedPointIdx != null && selectedAction === 2) {
                const rect = (e.target as SVGElement).getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                setBezierPoints(points => {
                  const updated = [...points];
                  if (updated[draggedPointIdx]) {
                    updated[draggedPointIdx] = { ...updated[draggedPointIdx], x, y };
                  }
                  return updated;
                });
              }
            }}
            onMouseUp={() => setDraggedPointIdx(null)}
          >
            <path d={svgPath} fill="#222" stroke="#888" strokeWidth={2} />
            {/* Affichage des points de Bézier */}
            {bezierPoints.map((cmd, i) => (
              cmd.x !== undefined && cmd.y !== undefined ? (
                <circle
                  key={i}
                  cx={cmd.x}
                  cy={cmd.y}
                  r={4}
                  fill={draggedPointIdx == i ? "#2196f3" : "#ff4081"}
                  style={{ cursor: selectedAction === 2 ? 'pointer' : 'not-allowed', opacity: selectedAction === 2 ? 1 : 0.5 }}
                  onMouseDown={selectedAction === 2 ? (e) => { e.stopPropagation(); setDraggedPointIdx(i); } : undefined}
                />
              ) : null
            ))}
          </svg>
        ) : (
          <span style={{ color: '#888' }}>
            La lettre ne peut pas être affichée (police non chargée ou chemin SVG vide).
          </span>
        )}
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
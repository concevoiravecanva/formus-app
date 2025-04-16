import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Circle, Path, Line, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import {
	Button, Rows, Text, Alert,
	PlusIcon, PencilIcon, TrashIcon, UndoIcon, RedoIcon,
	GridIcon, ImageIcon
	// LockOpenIcon, LockClosedIcon removed
} from "@canva/app-ui-kit";
import { addElementAtPoint } from "@canva/design";
import * as styles from "styles/components.css";


// --- Types --- (Keep existing types)
interface Point { x: number; y: number; }
interface AnchorData { id: string; anchor: Point; cpIn: Point; cpOut: Point; }
type DraggedPointType = 'anchor' | 'cpIn' | 'cpOut';
interface DraggedPointInfo { anchorId: string; pointType: DraggedPointType; }
interface HistoryState {
  anchors: AnchorData[];
  isClosed: boolean;
}
type ToolMode = 'add' | 'select';
type BgDragConstraint = 'none' | 'horizontal' | 'vertical';


// Helper ID (Keep existing)
let idCounter = 0;
const generateId = () => `id-${idCounter++}`;


// --- Constantes --- (Keep existing)
const SELECTED_ANCHOR_COLOR = "#f5a623";
const ANCHOR_COLOR = "red";
const STAGE_HEIGHT = 300;
// Removed color constants as we now rely on Button variants


// --- Composant Principal ---
export const App = () => {
  // États Forme (Keep existing)
  const [anchors, setAnchors] = useState<AnchorData[]>([]);
  const [pathData, setPathData] = useState<string>('');
  const [viewBox, setViewBox] = useState<{ width: number, height: number } | null>(null);
  const [minCoords, setMinCoords] = useState<{ x: number, y: number } | null>(null);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [toolMode, setToolMode] = useState<ToolMode>('add');
  const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(null);


  // États UI & Général (Keep existing)
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([{ anchors: [], isClosed: false }]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [dynamicStageWidth, setDynamicStageWidth] = useState<number>(300);
  const stageContainerRef = useRef<HTMLDivElement>(null);


  // États Image Fond (Keep existing)
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [bgImageOpacity, setBgImageOpacity] = useState<number>(1);
  const [isBgMoveModeActive, setIsBgMoveModeActive] = useState<boolean>(false);
  const [bgImagePosition, setBgImagePosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [bgImageSize, setBgImageSize] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
  const [bgImageDragConstraint, setBgImageDragConstraint] = useState<BgDragConstraint>('none');


  // Refs (Keep existing)
  const stageRef = useRef<Konva.Stage>(null);
  const draggedPointRef = useRef<DraggedPointInfo | null>(null);


  // --- Gestion de l'Historique --- (Keep existing)
  const saveHistory = useCallback((newAnchors: AnchorData[], newIsClosed: boolean) => {
	setError(null);
	const currentState: HistoryState = { anchors: newAnchors, isClosed: newIsClosed };
	const newHistory = history.slice(0, historyIndex + 1);
	newHistory.push(currentState);
	setHistory(newHistory);
	setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);


  // --- Fonctions Annuler / Rétablir --- (Keep existing)
  const handleUndo = () => {
	if (historyIndex > 0 && !isBgMoveModeActive) {
  	setError(null); const newIndex = historyIndex - 1;
  	const prevState = history[newIndex]; setAnchors(prevState.anchors);
  	setIsClosed(prevState.isClosed); setHistoryIndex(newIndex); setSelectedAnchorId(null);
	}
  };
  const handleRedo = () => {
	if (historyIndex < history.length - 1 && !isBgMoveModeActive) {
  	setError(null); const newIndex = historyIndex + 1;
  	const nextState = history[newIndex]; setAnchors(nextState.anchors);
  	setIsClosed(nextState.isClosed); setHistoryIndex(newIndex); setSelectedAnchorId(null);
	}
  };


  // --- Handlers for Tool Buttons --- (Keep existing)
  const handleSetTool = (newMode: ToolMode) => {
  	if (isBgMoveModeActive) return; setSelectedAnchorId(null); setToolMode(newMode);
  }
  const toggleGrid = () => {
  	if (isBgMoveModeActive) return; setShowGrid(prev => !prev);
  }


  // --- Calcul taille/contrainte Image Fond --- (Keep existing)
  useEffect(() => {
	if (backgroundImage && dynamicStageWidth > 0 && STAGE_HEIGHT > 0) {
    	const imgWidth = backgroundImage.naturalWidth; const imgHeight = backgroundImage.naturalHeight;
    	const canvasWidth = dynamicStageWidth; const canvasHeight = STAGE_HEIGHT;
    	if (imgWidth <= 0 || imgHeight <= 0) {
        	setBgImageSize({ width: 0, height: 0}); setBgImageDragConstraint('none');
        	setBgImagePosition({ x: 0, y: 0 }); setIsBgMoveModeActive(false); return;
    	}
    	const imgRatio = imgWidth / imgHeight; let newWidth = canvasWidth; let newHeight = canvasHeight; let constraint: BgDragConstraint = 'none';
    	if (imgRatio > 1) { newHeight = canvasHeight; newWidth = newHeight * imgRatio; if (newWidth > canvasWidth) { constraint = 'horizontal'; } else { newWidth = canvasWidth; newHeight = newWidth / imgRatio; constraint = 'none'; }}
    	else if (imgRatio < 1) { newWidth = canvasWidth; newHeight = newWidth / imgRatio; if (newHeight > canvasHeight) { constraint = 'vertical'; } else { newHeight = canvasHeight; newWidth = newHeight * imgRatio; constraint = 'none'; }}
    	else { if (canvasWidth >= canvasHeight) { newWidth = canvasWidth; newHeight = canvasWidth; } else { newHeight = canvasHeight; newWidth = canvasHeight; } constraint = 'none'; }
    	setBgImageSize({ width: Math.round(newWidth), height: Math.round(newHeight) }); setBgImageDragConstraint(constraint);
    	setBgImagePosition({ x: 0, y: 0 }); setIsBgMoveModeActive(false);
	} else {
    	setBgImageSize({ width: 0, height: 0}); setBgImageDragConstraint('none');
    	setBgImagePosition({ x: 0, y: 0 }); setIsBgMoveModeActive(false);
	}
  }, [backgroundImage, dynamicStageWidth]);


  // --- Gestion des Interactions Stage (Points) --- (Keep existing)
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
	if (isBgMoveModeActive) { return; }
	setError(null);
	if (toolMode === 'select') {
  	if (e.target === stageRef.current) { setSelectedAnchorId(null); }
  	return;
	}
	if (toolMode === 'add') {
  	const stage = stageRef.current; if (!stage) return;
  	const pos = stage.getPointerPosition(); if (!pos || isClosed) return;
  	const stageW = dynamicStageWidth; const stageH = STAGE_HEIGHT;
  	const initialX = Math.max(0, Math.min(stageW, pos.x)); const initialY = Math.max(0, Math.min(stageH, pos.y));
  	const newAnchorId = generateId();
  	const newAnchor: AnchorData = { id: newAnchorId, anchor: { x: initialX, y: initialY }, cpIn: { x: initialX, y: initialY }, cpOut: { x: initialX, y: initialY }, };
  	let updatedAnchors = [...anchors];
  	if (updatedAnchors.length > 0) {
    	const prevAnchorIndex = updatedAnchors.length - 1; const prevAnchor = updatedAnchors[prevAnchorIndex];
    	updatedAnchors[prevAnchorIndex] = { ...prevAnchor, cpOut: { ...prevAnchor.anchor } };
  	}
  	updatedAnchors.push(newAnchor); setAnchors(updatedAnchors);
  	setSelectedAnchorId(null); saveHistory(updatedAnchors, isClosed);
	}
  };
  // --- Drag Handlers --- (Keep existing)
  const handleDragStart = (anchorId: string, pointType: DraggedPointType) => {
	if (isBgMoveModeActive) return; setError(null);
	draggedPointRef.current = { anchorId, pointType };
	if (toolMode === 'select' && pointType === 'anchor') { setSelectedAnchorId(anchorId); }
  };
  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
	const dragInfo = draggedPointRef.current; if (!dragInfo || isBgMoveModeActive) return;
	const target = e.target as Konva.Circle; const stageW = dynamicStageWidth; const stageH = STAGE_HEIGHT;
	let rawX = target.x(); let rawY = target.y();
	const clampedX = Math.max(0, Math.min(stageW, rawX)); const clampedY = Math.max(0, Math.min(stageH, rawY));
	const newPos = { x: clampedX, y: clampedY };
	setAnchors(prevAnchors => prevAnchors.map(a => { if (a.id === dragInfo.anchorId) { return { ...a, [dragInfo.pointType]: newPos }; } return a; }));
	target.position({ x: clampedX, y: clampedY });
  };
  const handleDragEnd = () => {
	if (!draggedPointRef.current || isBgMoveModeActive) return;
	draggedPointRef.current = null; saveHistory(anchors, isClosed);
  };
  // --- Delete Point --- (Keep existing)
  const handleDeletePoint = () => {
	if (selectedAnchorId && toolMode === 'select' && !isBgMoveModeActive) {
    	const newAnchors = anchors.filter(a => a.id !== selectedAnchorId); setAnchors(newAnchors);
    	const currentIsClosed = newAnchors.length < 2 ? false : isClosed;
    	if (newAnchors.length < 2) { setIsClosed(false); }
    	setSelectedAnchorId(null); saveHistory(newAnchors, currentIsClosed);
	}
  };
  // --- Toggle Path Closure --- (Keep existing logic)
  const toggleClosePath = () => {
	if (anchors.length >= 2 && !isBgMoveModeActive) {
    	const newIsClosed = !isClosed; setIsClosed(newIsClosed); saveHistory(anchors, newIsClosed);
	}
  };
  const isToggleCloseDisabled = anchors.length < 2 || isBgMoveModeActive;


  // --- Calcul du Path Data et ViewBox --- (Keep existing)
  useEffect(() => {
	if (anchors.length === 0) { setPathData(''); setViewBox(null); setMinCoords(null); return; }
	const allPoints: Point[] = [];
	anchors.forEach(a => { if (a.anchor) allPoints.push(a.anchor); if (a.cpIn) allPoints.push(a.cpIn); if (a.cpOut) allPoints.push(a.cpOut); });
	if (allPoints.length === 0) { setPathData(''); setViewBox(null); setMinCoords(null); return; }
	let minX = allPoints[0].x, minY = allPoints[0].y, maxX = allPoints[0].x, maxY = allPoints[0].y;
	allPoints.forEach(p => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
	const calculatedViewBox = { width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
	const calculatedMinCoords = { x: minX, y: minY };
	const makeRelative = (p: Point | undefined): Point | null => { if (!p) return null; return { x: p.x - calculatedMinCoords.x, y: p.y - calculatedMinCoords.y }; };
	const firstAnchorRelative = makeRelative(anchors[0]?.anchor); if (!firstAnchorRelative) { setPathData(''); setViewBox(null); setMinCoords(null); return; }
	let d = `M ${firstAnchorRelative.x} ${firstAnchorRelative.y}`;
	for (let i = 0; i < anchors.length - 1; i++) {
  	const p1 = anchors[i]; const p2 = anchors[i + 1];
  	const cp1 = makeRelative(p1?.cpOut); const cp2 = makeRelative(p2?.cpIn); const p2Rel = makeRelative(p2?.anchor);
  	if (cp1 && cp2 && p2Rel) { d += ` C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${p2Rel.x},${p2Rel.y}`; }
  	else { console.warn(`Données manquantes pour segment ${i}`); break; }
	}
	if (isClosed && anchors.length >= 2) {
  	const pLast = anchors[anchors.length - 1]; const pFirst = anchors[0];
  	const cpLast = makeRelative(pLast?.cpOut); const cpFirst = makeRelative(pFirst?.cpIn); const pFirstRelLoop = makeRelative(pFirst?.anchor);
  	if (cpLast && cpFirst && pFirstRelLoop) { d += ` C ${cpLast.x},${cpLast.y} ${cpFirst.x},${cpFirst.y} ${pFirstRelLoop.x},${pFirstRelLoop.y}`; }
  	else { console.warn("Données manquantes pour fermer le chemin, utilisation de 'Z'"); d += ' Z'; }
	} else if (isClosed) { d += ' Z'; }
	setPathData(d); setViewBox(calculatedViewBox); setMinCoords(calculatedMinCoords);
  }, [anchors, isClosed]);


  // --- useEffect pour mesurer la largeur du conteneur --- (Keep existing)
  useEffect(() => {
	const container = stageContainerRef.current;
	if (container) {
  	setDynamicStageWidth(container.offsetWidth);
  	const resizeObserver = new ResizeObserver(entries => { for (let entry of entries) { setDynamicStageWidth(Math.floor(entry.contentRect.width)); } });
  	resizeObserver.observe(container); return () => resizeObserver.disconnect();
	}
  }, []);


  // --- Fonctions pour l'image de fond --- (Keep existing)
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
	if (isBgMoveModeActive) return; setError(null); const file = event.target.files?.[0];
	if (file && file.type.startsWith('image/')) {
  	const reader = new FileReader();
  	reader.onload = (e) => {
    	const img = new window.Image(); img.onload = () => { setBackgroundImage(img); setBgImageOpacity(1); };
    	img.onerror = () => { setError("Erreur chargement image."); setBackgroundImage(null); };
    	if (typeof e.target?.result === 'string') { img.src = e.target.result; }
    	else { setError("Erreur lecture fichier (résultat invalide)."); setBackgroundImage(null); }
  	};
  	reader.onerror = () => { setError("Erreur lecture fichier."); setBackgroundImage(null); }; reader.readAsDataURL(file);
	} else if (file) { setError("Fichier non image."); }
	if (event.target) { event.target.value = ''; }
  };
  const triggerImageUpload = () => { if (isBgMoveModeActive) return; setError(null); inputFileRef.current?.click(); };
  const removeBackgroundImage = () => {
	if (isBgMoveModeActive) return; setBackgroundImage(null); setBgImageOpacity(1);
	if (inputFileRef.current) { inputFileRef.current.value = ''; } setIsBgMoveModeActive(false);
  };
  const toggleBgMoveMode = () => { if (backgroundImage && bgImageDragConstraint !== 'none') { setIsBgMoveModeActive(prev => !prev); setSelectedAnchorId(null); } };
  const handleBgImageDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => { setBgImagePosition({ x: e.target.x(), y: e.target.y() }); };
  const bgImageDragBoundFunc = (pos: { x: number, y: number }): { x: number, y: number } => {
  	const canvasWidth = dynamicStageWidth; const canvasHeight = STAGE_HEIGHT;
  	const imgWidth = bgImageSize.width; const imgHeight = bgImageSize.height;
  	const minX = canvasWidth - imgWidth; const maxX = 0; const minY = canvasHeight - imgHeight; const maxY = 0;
  	let newX = pos.x; let newY = pos.y;
  	switch (bgImageDragConstraint) {
      	case 'horizontal': newX = Math.max(minX, Math.min(pos.x, maxX)); newY = bgImagePosition.y; break;
      	case 'vertical': newX = bgImagePosition.x; newY = Math.max(minY, Math.min(pos.y, maxY)); break;
      	case 'none': default: newX = bgImagePosition.x; newY = bgImagePosition.y; break;
  	}
  	return { x: newX, y: newY };
  };


  // --- Ajout à Canva --- (Keep existing)
  const addCustomFrame = async () => {
	if (!isClosed) { setError("Le chemin doit être fermé pour être ajouté comme cadre."); return; }
	if (isBgMoveModeActive) { setError("Désactivez le mode déplacement de l'arrière-plan."); return; }
	setError(null); if (!pathData || !viewBox || anchors.length < 1) { setError("Veuillez créer une forme valide."); return; }
	try {
  	const aspectRatio = viewBox.width / viewBox.height; const targetWidth = 200;
  	const initialWidth = Math.max(1, Math.min(viewBox.width, targetWidth));
  	const initialHeight = aspectRatio > 0 ? Math.max(1, initialWidth / aspectRatio) : Math.max(1, Math.min(viewBox.height, targetWidth));
  	await addElementAtPoint({ type: "shape", top: 50, left: 50, width: initialWidth, height: initialHeight,
    	viewBox: { top: 0, left: 0, width: viewBox.width, height: viewBox.height },
    	paths: [{ d: pathData, fill: { dropTarget: true } }],
  	}); console.log("Cadre personnalisé ajouté !");
	} catch (err) {
  	console.error("Erreur lors de l'ajout du cadre :", err); let errorMessage = "Erreur inconnue.";
  	if (err instanceof Error) { const canvaErrorMatch = err.message.match(/\[.*?\]:\s*(.*)/); errorMessage = canvaErrorMatch ? canvaErrorMatch[1] : err.message; }
  	else { errorMessage = String(err); } setError(`Erreur ajout: ${errorMessage}`);
	}
  };


   // --- Effacer tout --- (Keep existing)
   const clearShape = () => {
	if (isBgMoveModeActive) return; setError(null);
	const initialState: HistoryState = { anchors: [], isClosed: false };
	setAnchors(initialState.anchors); setIsClosed(initialState.isClosed);
	setSelectedAnchorId(null); setToolMode('add');
	setHistory([initialState]); setHistoryIndex(0);
	setShowGrid(false); removeBackgroundImage(); setIsBgMoveModeActive(false);
   };


  // --- Rendu Grille --- (Keep existing)
  const gridSpacing = 20; const gridStroke = '#e0e0e0'; const gridStrokeWidth = 0.5;
  const renderGrid = (width: number, height: number, spacing: number) => {
  	const lines = []; const numVertical = Math.ceil(width / spacing);
  	for (let i = 1; i < numVertical; i++) { const x = i * spacing; lines.push(<Line key={`v-${i}`} points={[x, 0, x, height]} stroke={gridStroke} strokeWidth={gridStrokeWidth} listening={false}/>); }
  	const numHorizontal = Math.ceil(height / spacing);
  	for (let j = 1; j < numHorizontal; j++) { const y = j * spacing; lines.push(<Line key={`h-${j}`} points={[0, y, width, y]} stroke={gridStroke} strokeWidth={gridStrokeWidth} listening={false}/>); }
  	return lines;
  };


  // --- Déterminer le curseur --- (Keep existing)
  let stageCursor = toolMode === 'add' ? 'crosshair' : 'default';
  if (isBgMoveModeActive) { if (bgImageDragConstraint === 'horizontal') stageCursor = 'ew-resize'; else if (bgImageDragConstraint === 'vertical') stageCursor = 'ns-resize'; else stageCursor = 'grab'; }
  else if (toolMode === 'select') { stageCursor = 'default'; }


  // --- Rendu JSX ---
  return (
	<div className={styles.scrollContainer}>
	<Rows spacing="1u"> {/* Main container using Rows for vertical stacking */}
    	{/* Zone d'erreur */}
    	{error && <Alert tone="critical">{error}</Alert>}

    	{/* Input fichier caché */}
    	<input type="file" ref={inputFileRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} disabled={isBgMoveModeActive} />

    	{/* Barre d'outils - Main unchanged */}
    	<div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '4px', paddingBottom: '8px', borderBottom: '1px solid #e0e0e0', marginBottom: '8px' }}>
        	<Button icon={PlusIcon} tooltip="Ajouter Point" variant={toolMode === 'add' ? 'primary' : 'secondary'} onClick={() => handleSetTool('add')} disabled={isBgMoveModeActive || isClosed} />
        	<Button icon={PencilIcon} tooltip="Modifier/Sélectionner" variant={toolMode === 'select' ? 'primary' : 'secondary'} onClick={() => handleSetTool('select')} disabled={isBgMoveModeActive} />
        	<Button icon={TrashIcon} tooltip="Supprimer Point Sélectionné" variant="secondary" onClick={handleDeletePoint} disabled={toolMode !== 'select' || !selectedAnchorId || isBgMoveModeActive} />
        	<Button icon={UndoIcon} tooltip="Annuler" variant="secondary" onClick={handleUndo} disabled={historyIndex <= 0 || isBgMoveModeActive} />
        	<Button icon={RedoIcon} tooltip="Rétablir" variant="secondary" onClick={handleRedo} disabled={historyIndex >= history.length - 1 || isBgMoveModeActive} />
        	<Button icon={GridIcon} tooltip={showGrid ? "Masquer la grille" : "Afficher la grille"} variant="secondary" onClick={toggleGrid} disabled={isBgMoveModeActive} />
        	<Button icon={ImageIcon} tooltip="Charger Image Fond" variant="secondary" onClick={triggerImageUpload} disabled={isBgMoveModeActive} />
    	</div>

    	{/* Zone de dessin (Stage Konva) - Unchanged */}
    	<div ref={stageContainerRef} style={{ border: '1px solid #ccc', width: '100%', height: STAGE_HEIGHT, marginBottom: '1rem', cursor: stageCursor, borderRadius: '8px', overflow: 'hidden', position: 'relative', backgroundColor: '#f8f8f8' }}>
        	{dynamicStageWidth > 0 && (
            	<Stage ref={stageRef} width={dynamicStageWidth} height={STAGE_HEIGHT} onMouseDown={handleStageClick}>
                	{/* Couche Image Fond */}
                	{backgroundImage && bgImageSize.width > 0 && (
                    	<Layer listening={isBgMoveModeActive}>
                        	<KonvaImage image={backgroundImage} x={bgImagePosition.x} y={bgImagePosition.y} width={bgImageSize.width} height={bgImageSize.height} opacity={bgImageOpacity} draggable={isBgMoveModeActive && bgImageDragConstraint !== 'none'} onDragEnd={handleBgImageDragEnd} dragBoundFunc={bgImageDragBoundFunc} listening={isBgMoveModeActive} />
                    	</Layer>
                	)}
                	{/* Couche Grille */}
                	{showGrid && (
                    	<Layer key="grid-layer" listening={false}>
                        	{renderGrid(dynamicStageWidth, STAGE_HEIGHT, gridSpacing)}
                    	</Layer>
                	)}
                	{/* Couche Forme */}
                	<Layer onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
                    	{anchors.map(a => { /* ... Rendu des points/contrôles inchangé ... */
                        	const isSelected = selectedAnchorId === a.id;
                        	const isAnchorInteractive = toolMode === 'select' && !isBgMoveModeActive;
                        	const isControlPointInteractive = isSelected && toolMode === 'select' && !isBgMoveModeActive;
                        	return (a && a.anchor && a.cpIn && a.cpOut) ? (
                            	<React.Fragment key={`vis-${a.id}`}>
                                	<Line points={[a.anchor.x, a.anchor.y, a.cpIn.x, a.cpIn.y]} stroke="rgba(0,0,255,0.5)" strokeWidth={1} visible={isSelected} listening={false}/>
                                	<Line points={[a.anchor.x, a.anchor.y, a.cpOut.x, a.cpOut.y]} stroke="rgba(0,0,255,0.5)" strokeWidth={1} visible={isSelected} listening={false}/>
                                	<Circle id={a.id} x={a.anchor.x} y={a.anchor.y} radius={5} fill={isSelected ? SELECTED_ANCHOR_COLOR : ANCHOR_COLOR} draggable={isAnchorInteractive} onDragStart={() => handleDragStart(a.id, 'anchor')} onClick={() => { if (isAnchorInteractive) setSelectedAnchorId(a.id); }} onTap={() => { if (isAnchorInteractive) setSelectedAnchorId(a.id); }} listening={isAnchorInteractive} shadowColor={isSelected ? 'rgba(0,0,0,0.3)' : 'transparent'} shadowBlur={isSelected ? 5 : 0}/>
                                	<Circle id={`${a.id}-cpIn`} x={a.cpIn.x} y={a.cpIn.y} radius={4} stroke="blue" strokeWidth={1.5} fill="white" visible={isSelected} draggable={isControlPointInteractive} onDragStart={() => handleDragStart(a.id, 'cpIn')} listening={isControlPointInteractive}/>
                                	<Circle id={`${a.id}-cpOut`} x={a.cpOut.x} y={a.cpOut.y} radius={4} stroke="blue" strokeWidth={1.5} fill="white" visible={isSelected} draggable={isControlPointInteractive} onDragStart={() => handleDragStart(a.id, 'cpOut')} listening={isControlPointInteractive}/>
                            	</React.Fragment>
                        	) : null;
                    	})}
                    	{pathData && minCoords && ( <Path data={pathData} stroke="black" strokeWidth={2} x={minCoords.x} y={minCoords.y} listening={false} /> )}
                	</Layer>
            	</Stage>
        	)}
    	</div>

    	{/* Section Image Fond - Controls (Keep existing) */}
    	{backgroundImage && (
        	<Rows spacing="0.5u" attributes={{ style: { marginTop: '0.5rem', padding:'8px', border: '1px dashed #ccc', borderRadius: '4px'} }}>
             	<Text size="small" weight='bold'>Options Arrière-plan :</Text>
             	<Button variant={isBgMoveModeActive ? "primary" : "secondary"} onClick={toggleBgMoveMode} stretch disabled={bgImageDragConstraint === 'none'}>
                 	{isBgMoveModeActive ? "Arrêter déplacement Fond" : "Déplacer Image Fond"}
                 	{bgImageDragConstraint === 'horizontal' && !isBgMoveModeActive && " (↔)"}
                 	{bgImageDragConstraint === 'vertical' && !isBgMoveModeActive && " (↕)"}
                 	{bgImageDragConstraint === 'none' && " (Non déplaçable)"}
             	</Button>
             	<Button variant="secondary" onClick={removeBackgroundImage} stretch disabled={isBgMoveModeActive}> Supprimer Image Fond </Button>
             	<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 	<Text size="xsmall" align="end" attributes={{style: { minWidth: '50px'}}}>Opacité:</Text>
                 	<input type="range" min="0" max="1" step="0.05" value={bgImageOpacity} onChange={(e) => setBgImageOpacity(parseFloat(e.target.value))} style={{ flexGrow: 1, cursor: 'pointer', height:'16px' }} disabled={isBgMoveModeActive}/>
             	</div>
        	</Rows>
    	)}

		{/* --- REVERTED: Retour à la structure verticale --- */}
		{/* Bouton Ouvrir/Fermer dans son propre conteneur (pour espacement correct via Rows parent) */}
		<div style={{ marginTop: '0.5rem', marginBottom: '0rem' }}> {/* Ajusté le margin bottom */}
			<Button
				variant="tertiary"
				onClick={toggleClosePath}
				stretch // Pour prendre toute la largeur
				disabled={isToggleCloseDisabled}
			>
				{isClosed ? "Ouvrir le chemin" : "Fermer le chemin"}
			</Button>
		</div>

		{/* Boutons Ajouter et Effacer dans un Rows pour l'empilement vertical */}
		<Rows spacing="1u" attributes={{ style: { marginTop: '1rem' } }}> {/* Ajusté le margin top */}
			<Button
				variant="primary"
				onClick={addCustomFrame}
				stretch // Pour prendre toute la largeur
				disabled={anchors.length < 1 || !pathData || !isClosed || isBgMoveModeActive}
				tooltip={!isClosed && anchors.length > 0 ? "Le chemin doit être fermé pour l'ajouter comme cadre." : undefined}
			>
				Ajouter comme Cadre
			</Button>
			<Button
				variant="tertiary"
				onClick={clearShape}
				stretch // Pour prendre toute la largeur
				disabled={(anchors.length === 0 && historyIndex === 0 && !backgroundImage) || isBgMoveModeActive}
			>
				Effacer la forme
			</Button>
		</Rows>
		{/* --- FIN REVERTED --- */}

	</Rows> {/* Close main Rows container */}
	</div>
  );
};

// Assurez-vous d'avoir un fichier styles/components.css avec au moins ceci :
/* styles/components.css */
// .scrollContainer {
//  	overflow-y: auto; /* ou scroll */
//  	/* Ajoutez d'autres styles si nécessaire, comme max-height */
// }
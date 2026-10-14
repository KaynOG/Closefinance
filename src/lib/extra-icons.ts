import {
  AirVent, AlarmClock, Ambulance, Anchor, Atom, AudioLines, Backpack, Bath,
  BatteryCharging, Binoculars, CookingPot, Cake, Clapperboard, Compass, Container,
  Cpu, Croissant, Database, Drill, FerrisWheel, Fish, FlaskConical, Headphones,
  Hospital, LampDesk, Microscope, Package, Printer, Refrigerator, WashingMachine,
} from "lucide-react";

// Stable IDs are saved with the record and shared by every picker and renderer.
export const EXTRA_ICON_OPTIONS = [
  { id: "air-vent", label: "Climatização", icon: AirVent },
  { id: "alarm-clock", label: "Despertador", icon: AlarmClock },
  { id: "ambulance", label: "Ambulância", icon: Ambulance },
  { id: "anchor", label: "Âncora", icon: Anchor },
  { id: "atom", label: "Ciência", icon: Atom },
  { id: "audio-lines", label: "Áudio", icon: AudioLines },
  { id: "backpack", label: "Mochila", icon: Backpack },
  { id: "bath", label: "Banheira", icon: Bath },
  { id: "battery-charging", label: "Bateria", icon: BatteryCharging },
  { id: "binoculars", label: "Binóculos", icon: Binoculars },
  { id: "cooking-pot", label: "Panela", icon: CookingPot },
  { id: "cake", label: "Bolo", icon: Cake },
  { id: "clapperboard", label: "Cinema", icon: Clapperboard },
  { id: "compass", label: "Bússola", icon: Compass },
  { id: "container", label: "Armazenamento", icon: Container },
  { id: "cpu", label: "Processador", icon: Cpu },
  { id: "croissant", label: "Padaria", icon: Croissant },
  { id: "database", label: "Dados", icon: Database },
  { id: "drill", label: "Furadeira", icon: Drill },
  { id: "ferris-wheel", label: "Parque de diversões", icon: FerrisWheel },
  { id: "fish", label: "Peixe", icon: Fish },
  { id: "flask-conical", label: "Laboratório", icon: FlaskConical },
  { id: "headphones", label: "Fones de ouvido", icon: Headphones },
  { id: "hospital", label: "Hospital", icon: Hospital },
  { id: "lamp-desk", label: "Luminária", icon: LampDesk },
  { id: "microscope", label: "Pesquisa", icon: Microscope },
  { id: "package", label: "Encomenda", icon: Package },
  { id: "printer", label: "Impressora", icon: Printer },
  { id: "refrigerator", label: "Geladeira", icon: Refrigerator },
  { id: "washing-machine", label: "Máquina de lavar", icon: WashingMachine },
];
export const EXTRA_ICONS = Object.fromEntries(EXTRA_ICON_OPTIONS.map(({ id, icon }) => [id, icon]));
export const EXTRA_GOAL_ICONS = Object.fromEntries(EXTRA_ICON_OPTIONS.map(({ id, icon, label }) => [id, { icon, label }]));
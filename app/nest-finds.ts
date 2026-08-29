export type NestFindRarity='common'|'uncommon'|'rare'|'duo';
export type NestFindMeta={id:string;name:string;hint:string;time:'morning'|'day'|'evening'|'night'|'duo';rarity:NestFindRarity};

export const NEST_FIND_META:NestFindMeta[]=[
  {id:'feather',name:'Morgenfeder',hint:'Federleicht und noch sonnenwarm.',time:'morning',rarity:'common'},
  {id:'sun-button',name:'Sonnenknopf',hint:'Glitzert am liebsten vor dem Frühstück.',time:'morning',rarity:'common'},
  {id:'seed-letter',name:'Saatbrief',hint:'Ein winziges Versprechen mit Blattstempel.',time:'morning',rarity:'rare'},
  {id:'dew-pearl',name:'Tautropfenperle',hint:'Ein Morgenlicht, das nicht verdunstet.',time:'morning',rarity:'uncommon'},
  {id:'yarn-pompom',name:'Flauschgarn',hint:'Verdächtig weich. Flauschi bestreitet alles.',time:'day',rarity:'common'},
  {id:'tiny-key',name:'Winziger Schlüssel',hint:'Zu klein für jede bekannte Tür.',time:'day',rarity:'rare'},
  {id:'leaf-medallion',name:'Blattabdruck',hint:'Ein grüner Gruß vom Fensterbrett.',time:'day',rarity:'common'},
  {id:'lucky-pebble',name:'Glücksstein',hint:'Liegt exakt richtig in der Pfote.',time:'day',rarity:'uncommon'},
  {id:'amber-bead',name:'Bernsteinperle',hint:'Hält die goldene Stunde ein bisschen fest.',time:'evening',rarity:'uncommon'},
  {id:'tea-star',name:'Teestern',hint:'Riecht ganz leicht nach Feierabend.',time:'evening',rarity:'common'},
  {id:'velvet-ribbon',name:'Samtband',hint:'Für besonders elegante Nesttage.',time:'evening',rarity:'common'},
  {id:'golden-leaf',name:'Goldblatt',hint:'Raschelt nur, wenn niemand hinsieht.',time:'evening',rarity:'rare'},
  {id:'moon-button',name:'Mondknopf',hint:'Flauschi behauptet, er leuchte im Traum.',time:'night',rarity:'common'},
  {id:'glow-pebble',name:'Glühstein',hint:'Ein sanftes Licht für späte Heimkehrer.',time:'night',rarity:'uncommon'},
  {id:'dream-fluff',name:'Traumflaum',hint:'So weich, dass Gedanken leiser werden.',time:'night',rarity:'common'},
  {id:'star-fragment',name:'Sternenschnipsel',hint:'Ein seltenes Stück vom Nachthimmel.',time:'night',rarity:'rare'},
  {id:'together-acorn',name:'Zusammen-Eicheln',hint:'Zwei kleine Funde, fest verbunden.',time:'duo',rarity:'duo'},
  {id:'home-charm',name:'Zuhause-Anhänger',hint:'Leuchtet nur, wenn ihr beide da wart.',time:'duo',rarity:'duo'},
  {id:'leaf-heart',name:'Blattherz',hint:'Zwei Wege, ein gemütliches Zuhause.',time:'duo',rarity:'duo'},
  {id:'duo-star',name:'Doppelstern',hint:'Sonja und Johannes – zusammen selten gut.',time:'duo',rarity:'duo'},
];

export const NEST_FIND_MAP=Object.fromEntries(NEST_FIND_META.map((item)=>[item.id,item])) as Record<string,NestFindMeta>;
export const NEST_FIND_TOTAL=NEST_FIND_META.length;
export function nestFindImage(id:string){return `/nest-finds/${id}.webp`}

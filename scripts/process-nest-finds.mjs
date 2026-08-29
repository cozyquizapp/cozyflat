import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const [mainSheet,duoSheet]=process.argv.slice(2);
if(!mainSheet||!duoSheet)throw new Error('Usage: node scripts/process-nest-finds.mjs <4x4-sheet> <2x2-sheet>');

const output=path.resolve('public/nest-finds');
await fs.mkdir(output,{recursive:true});

const mainNames=[
  'feather','sun-button','seed-letter','dew-pearl',
  'yarn-pompom','tiny-key','leaf-medallion','lucky-pebble',
  'amber-bead','tea-star','velvet-ribbon','golden-leaf',
  'moon-button','glow-pebble','dream-fluff','star-fragment',
];
const duoNames=['together-acorn','home-charm','leaf-heart','duo-star'];

async function cropSheet(source,names,columns,rows) {
  const metadata=await sharp(source).metadata();
  if(!metadata.width||!metadata.height)throw new Error(`Invalid sheet: ${source}`);
  const cellWidth=Math.floor(metadata.width/columns);
  const cellHeight=Math.floor(metadata.height/rows);
  const inset=Math.round(Math.min(cellWidth,cellHeight)*.025);
  await Promise.all(names.map(async(name,index)=>{
    const column=index%columns;
    const row=Math.floor(index/columns);
    const left=column*cellWidth+inset;
    const top=row*cellHeight+inset;
    const width=(column===columns-1?metadata.width-column*cellWidth:cellWidth)-inset*2;
    const height=(row===rows-1?metadata.height-row*cellHeight:cellHeight)-inset*2;
    await sharp(source)
      .extract({left,top,width,height})
      .resize(320,320,{fit:'cover'})
      .webp({quality:88,smartSubsample:true})
      .toFile(path.join(output,`${name}.webp`));
  }));
}

await cropSheet(mainSheet,mainNames,4,4);
await cropSheet(duoSheet,duoNames,2,2);
console.log(`Created ${mainNames.length+duoNames.length} Nestschatz assets in ${output}`);

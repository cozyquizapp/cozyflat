import sharp from 'sharp';

const jobs = [
  {
    input:'C:/Users/hornu/.codex/generated_images/01a03820-aa79-7c40-aade-e4df34b3e522/exec-0c073f97-4fa2-4913-868c-d4761143be85.png',
    output:'public/flauschi-idle-v2.webp',
    width:640,
    height:640,
  },
  {
    input:'C:/Users/hornu/.codex/generated_images/01a03820-aa79-7c40-aade-e4df34b3e522/exec-e7dba124-35e6-4dba-b1a2-198b1cff717b.png',
    output:'public/flauschi-blink-v2.webp',
    width:640,
    height:640,
  },
  {
    input:'C:/Users/hornu/.codex/generated_images/01a03820-aa79-7c40-aade-e4df34b3e522/exec-9eb8fe61-56eb-47bf-93dd-ae26e53eb0f0.png',
    output:'public/flauschi-bite-open-v2.webp',
    width:640,
    height:640,
  },
  {
    input:'C:/Users/hornu/.codex/generated_images/01a03820-aa79-7c40-aade-e4df34b3e522/exec-2d85101e-bc7b-4649-bcda-8e8ae5b61509.png',
    output:'public/flauschi-chew-v2.webp',
    width:640,
    height:640,
  },
  {
    input:'C:/Users/hornu/.codex/generated_images/01a03820-aa79-7c40-aade-e4df34b3e522/exec-e7dba124-35e6-4dba-b1a2-198b1cff717b.png',
    output:'public/flauschi-petted-v2.webp',
    width:640,
    height:640,
  },
  {
    input:'C:/Users/hornu/.codex/generated_images/01a03820-aa79-7c40-aade-e4df34b3e522/exec-84b7132d-6ee6-43fc-bc94-45efd56d180b.png',
    output:'public/flauschi-sleep-v1.webp',
    width:640,
    height:640,
  },
  {
    input:'C:/Users/hornu/.codex/generated_images/01a03820-aa79-7c40-aade-e4df34b3e522/exec-b919fd4c-603d-4b2e-b37f-07c696cd874b.png',
    output:'public/flauschi-cheer-v1.webp',
    width:640,
    height:640,
  },
  {
    input:'C:/Users/hornu/.codex/generated_images/01a03820-aa79-7c40-aade-e4df34b3e522/exec-2cf3078d-c81a-44da-81ec-da86932b7c6d.png',
    output:'public/flauschi-decor-garland-v1.webp',
    width:900,
    height:360,
  },
  {
    input:'C:/Users/hornu/.codex/generated_images/01a03820-aa79-7c40-aade-e4df34b3e522/exec-6fd7f6ea-2d8b-4188-bcee-f72f1a964579.png',
    output:'public/flauschi-decor-toy-basket-v1.webp',
    width:420,
    height:360,
  },
  {
    input:'C:/Users/hornu/.codex/generated_images/01a03820-aa79-7c40-aade-e4df34b3e522/exec-583e8d51-dbea-421f-af48-882b9a364b4d.png',
    output:'public/flauschi-decor-window-lights-v1.webp',
    width:500,
    height:780,
  },
  {
    input:'C:/Users/hornu/.codex/generated_images/01a03820-aa79-7c40-aade-e4df34b3e522/exec-e753fbdb-7107-4828-b98a-5fe7b30f603d.png',
    output:'public/flauschi-decor-star-pillow-v1.webp',
    width:420,
    height:360,
  },
];

const clamp = (value,minimum,maximum) => Math.max(minimum,Math.min(maximum,value));

async function extract({input,output,width,height}) {
  const {data,info}=await sharp(input).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const rgba=Buffer.alloc(info.width*info.height*4);
  for(let pixel=0;pixel<info.width*info.height;pixel+=1) {
    const source=pixel*3;
    const target=pixel*4;
    const red=data[source];
    const green=data[source+1];
    const blue=data[source+2];
    const minimum=Math.min(red,green,blue);
    const maximum=Math.max(red,green,blue);
    const saturation=maximum-minimum;
    // Generated transparent assets sometimes contain a baked white/grey
    // checkerboard. Real subjects retain either color or tonal detail.
    const subjectSignal=Math.max(saturation*2.8,(242-minimum)*1.5);
    const alpha=Math.round(clamp((subjectSignal-10)*5,0,255));
    rgba[target]=red;
    rgba[target+1]=green;
    rgba[target+2]=blue;
    rgba[target+3]=alpha;
  }

  await sharp(rgba,{raw:{width:info.width,height:info.height,channels:4}})
    .trim({background:{r:0,g:0,b:0,alpha:0},threshold:8})
    .extend({top:24,bottom:24,left:24,right:24,background:{r:0,g:0,b:0,alpha:0}})
    .resize(width,height,{fit:'contain',background:{r:0,g:0,b:0,alpha:0},withoutEnlargement:true})
    .webp({quality:92,alphaQuality:100,smartSubsample:true})
    .toFile(output);
}

await Promise.all(jobs.map(extract));
console.log(`Processed ${jobs.length} Flauschi assets.`);

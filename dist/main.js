// @bun
import UV from"command-line-args";import{chdir as XV,cwd as YV}from"process";import{copyFileSync as MV,existsSync as E,mkdirSync as K,readdirSync as NV,rmdirSync as AV,writeFile as g}from"fs";import{cwd as BV}from"process";import L from"path";import s from"@fullhuman/postcss-purgecss";import r from"@rollup/plugin-node-resolve";import{svelte as h,vitePreprocess as p}from"@sveltejs/vite-plugin-svelte";import d from"autoprefixer";import{readFileSync as l,writeFile as i}from"fs";import Y from"path";import{preprocess as o}from"svelte/compiler";import{render as a}from"svelte/server";import t from"tailwindcss";import{defineConfig as e}from"vite";import{parse as T}from"@/node_modules/svelte/src/compiler/phases/1-parse/index.js";import{remove_typescript_nodes as Z}from"@/node_modules/svelte/src/compiler/phases/1-parse/remove_typescript_nodes.js";import{analyze_component as _}from"@/node_modules/svelte/src/compiler/phases/2-analyze/index.js";import{transform_component as w}from"@/node_modules/svelte/src/compiler/phases/3-transform/index.js";import{reset as C,reset_warning_filter as y}from"@/node_modules/svelte/src/compiler/state.js";import{validate_component_options as u}from"@/node_modules/svelte/src/compiler/validate-options.js";import{walk as x}from"estree-walker";import q from"path";import{walk as F}from"zimmerframe";function W(G,J,V){y(J.warningFilter);const H=u(J,"");C(G,H);let I=T(G);const{customElement:N,...M}=I.options||{},A={...H,...M,customElementOptions:N};if(I=f(I,V),I.metadata.ts)I={...I,fragment:I.fragment&&Z(I.fragment),instance:I.instance&&Z(I.instance),module:I.module&&Z(I.module)};const S=_(I,G,A),B=w(S,G,A);return B.ast=v(I),B}function v(G){const J=(V)=>{delete V.metadata,delete V.parent};return G.options?.attributes.forEach((V)=>{if(J(V),J(V.value),Array.isArray(V.value))V.value.forEach(J)}),F(G,null,{_(V,{next:H}){J(V),H()}})}function f(G,J){return x(G,{enter(V,H){if(V.type==="ImportDeclaration"){if(!V.source.value||!V.source.raw)return;if(V.source.value.match($))V.source.value=V.source.value.replace($,(N,M,A)=>{return X(M,J,"js")}),V.source.raw=V.source.raw.replace($,(N,M,A)=>{return X(M,J,"js")}),V.source.value=V.source.value.replace(z,(N,M,A)=>{return X(M,J,A)}),V.source.raw=V.source.raw.replace(z,(N,M,A)=>{return X(M,J,A)});else{const N=import.meta.require.resolve(V.source.value,{paths:[q.dirname(J)]}),M=q.relative(q.dirname(J),N).replaceAll(q.sep,q.posix.sep);V.source.value=`../${M}`,V.source.raw=`"../${M}"`}}}})}function X(G,J,V){return`./${q.relative(q.dirname(J),q.join(G)).replaceAll(q.sep,q.posix.sep)}.${V}`}var $=/@\/src\/lib\/([a-zA-Z0-9_\/]+)\.(svelte)(?!\.)/g,z=/@\/src\/lib\/([a-zA-Z0-9_\/]+)\.(mjs|cjs|js)/g;function c(G){return G.replaceAll(P,(J,V,H)=>H)}function n(G){return G.replaceAll(m,(J,V,H)=>H)}function O(){return{markup({content:G}){return{code:c(n(G))}}}}var m=/<!--\s+CSR\s+-->([\s\S]*?)<!--\s+SSR\s+-->([\s\S]*?)<!--\s+END\s+-->/gm,P=/\/\/\s+CSR\s*([\s\S]*?)\/\/\s+SSR\s*([\s\S]*?)\/\/\s+END/gm;function GV(G){if(D)return D;else if(G)return R(G);else throw new Error("Preprocessor config not set")}function R(G){return D=[O(),p({style:e({plugins:[VV,s({})],css:{postcss:{plugins:[t(G),d()]}},resolve:{alias:{"@":Y.resolve(__dirname,"./")}},build:{commonjsOptions:{include:[/linked-dep/,/node_modules/]},ssr:!0,rollupOptions:{input:"./index.html",output:{entryFileNames:"assets/[name].js",chunkFileNames:"assets/[name].js",assetFileNames:"assets/[name].[ext]"},plugins:[r({browser:!0,exportConditions:["svelte"],extensions:[".svelte"]})]}}})})]}async function b(G,J,V,H){let I=l(G,"utf8");if(V){const S=I.match(IV),B=`<link rel="modulepreload" as="script" href="/assets/${Y.basename(J)}"/>`;if(S)I=I.replace(S[0],`${S[0]}\n${B}`);else I=I.concat(`<svelte:head>${B}</svelte:head>`)}const N=Y.basename(G),{code:M}=await o(I,GV(),{filename:N}),{js:A}=W(M,{filename:N,generate:"ssr",dev:!1,discloseVersion:!1,modernAst:!0},J.replace(H,""));await i(J,A.code,()=>{})}async function k(G){const J=(await import(Y.join(process.cwd(),G))).default,V=a(J,{});V.head=V.head.replaceAll(HV,"");const H=new Set;let I;while(I=JV.exec(V.head))H.add(I[0]);return V.head=Array.from(H).join("\n"),V}var __dirname="C:\\Users\\Jakub\\Documents\\GitHub\\svelte-ssr\\rendering",VV=h({compilerOptions:{modernAst:!0},prebundleSvelteLibraries:!0}),D=null,IV=/<svelte:head>([\s\S]*?)<\/svelte:head>/,JV=/<[^>]+>/g,HV=/<!--[\s\S]*?-->/g;async function j({componentPath:G,compilePath:J,tailwindConfig:V,clean:H}){const I=new Promise((B)=>{import(L.join(BV(),V)).then((Q)=>{B(Q.default)})});if(!E(J))K(J,{recursive:!0});else if(H)AV(J,{recursive:!0}),K(J,{recursive:!0});const N=NV(G,{recursive:!0,withFileTypes:!0}),M=QV(N,G),A=[],S=[];for(let B of M){const Q=L.dirname(B);if(Q!=="."){const U=L.join(J,Q);if(!E(U))K(U,{recursive:!0})}if(B.endsWith(".svelte")){A.push(B);continue}S.push(new Promise((U)=>{MV(`${G}${B}`,`${J}${B}`),U(!0)}))}await Promise.all(S),R(await I),await LV(A,G,J),await qV(A,J)}function qV(G,J){const V=[];for(let H=0;H<G.length;H++){const I=J+G[H].split(".")[0];V.push(k(I+".js").then((N)=>{g(I+".html",N.html,()=>{}),g(I+".head",N.head,()=>{})}))}return Promise.all(V)}function LV(G,J,V){const H=[];for(let I=0;I<G.length;I++){const N=G[I],M=N.split(".")[0],A=J+N,S=V+M+".js";H.push(b(A,S,!0,V))}return Promise.all(H)}function QV(G,J){let V="",H="",I="";const N=[];for(let M=0;M<G.length;M++){const A=G[M];if(!A.isFile())continue;for(let S of SV){if(!A.name.endsWith(S))continue;if(H=A.parentPath.replaceAll(L.sep,L.posix.sep).replaceAll(J.slice(2,-1),""),V=A.name.replaceAll(L.sep,L.posix.sep),V.startsWith("/"))V=V.slice(1);if(I=L.join(H,V).replaceAll(L.sep,L.posix.sep),I.startsWith("/"))I=I.slice(1);N.push(I);break}}return N}var SV=[".svelte",".js",".cjs",".mjs",".css",".html",".json"];var ZV=[{name:"componentPath",type:String,alias:"i",defaultValue:"./src/lib/"},{name:"compilePath",type:String,alias:"o",defaultValue:"./compile/"},{name:"tailwindConfig",type:String,alias:"t",defaultValue:"tailwind.config.ts"},{name:"clean",type:Boolean,alias:"c",defaultValue:!1}],$V=UV(ZV);XV(YV());j($V);

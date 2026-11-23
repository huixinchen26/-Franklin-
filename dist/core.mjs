import {questions,memories} from './content.mjs';
export const initialState=()=>({answers:{},visited:[]});
export function restore(raw){
 try{const v=JSON.parse(raw);const s=initialState();if(!v||typeof v!=='object')return s;
 for(const q of questions)if([0,1].includes(v.answers?.[q.id]))s.answers[q.id]=v.answers[q.id];
 s.visited=memories.map(m=>m.id).filter(id=>Array.isArray(v.visited)&&v.visited.includes(id));return s;
 }catch{return initialState();}
}
export function answer(s,id,choice){
 if(!questions.some(q=>q.id===id)||![0,1].includes(choice)||Object.hasOwn(s.answers,id))return s;
 return {...s,answers:{...s.answers,[id]:choice}};
}
export function visit(s,id){return memories.some(m=>m.id===id)&&!s.visited.includes(id)?{...s,visited:[...s.visited,id]}:s;}
export function score(s){return questions.filter(q=>s.answers[q.id]===q.correct).length;}
export function canOpenLetter(s){return questions.every(q=>Object.hasOwn(s.answers,q.id))&&memories.every(m=>s.visited.includes(m.id));}

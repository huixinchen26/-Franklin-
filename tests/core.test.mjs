import test from 'node:test';
import assert from 'node:assert/strict';
import { restore, answer, visit, canOpenLetter, score, initialState } from '../dist/core.mjs';
import { questions } from '../dist/content.mjs';
test('unknown or malformed saved progress restores safely',()=>{
 assert.deepEqual(restore('{'),initialState());
 assert.deepEqual(restore(JSON.stringify({answers:{q1:99,unknown:0},visited:['unknown'],game:123})),initialState());
});
test('only first answer counts, including wrong answers; eight answers complete the quiz',()=>{
 let s=initialState(); s=answer(s,questions[0].id,1); s=answer(s,questions[0].id,0);
 assert.equal(s.answers[questions[0].id],1);
 for(const q of questions.slice(1)) s=answer(s,q.id,q.correct);
 assert.equal(Object.keys(s.answers).length,8); assert.equal(score(s),7);
});
test('letter unlock requires quiz completion and three distinct memories, irrespective of score',()=>{
 let s=initialState(); for(const q of questions) s=answer(s,q.id,1-q.correct);
 assert.equal(canOpenLetter(s),false);
 s=visit(visit(visit(s,'singapore'),'malaysia'),'singapore'); assert.equal(canOpenLetter(s),false);
 s=visit(s,'indonesia'); assert.equal(canOpenLetter(s),true); assert.equal(score(s),0);
});
test('unverified prompts cannot become scored questions',()=>{
 assert.equal(questions.length,8); assert.ok(questions.every(q=>q.source&&q.options.length===2&&[0,1].includes(q.correct)));
 const s=answer(initialState(),'group-size',0); assert.equal(Object.keys(s.answers).length,0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createQuizAdvance} from '../dist/quiz-flow.mjs';
function fixture(enabled=true){let advances=0,id=0;const tasks=new Map();const c=createQuizAdvance({enabled,advance:()=>advances++,schedule:fn=>{tasks.set(++id,fn);return id;},cancel:i=>tasks.delete(i)});return{c,tasks,run:()=>{for(const fn of [...tasks.values()])fn();},get count(){return advances;}};}
test('one choice schedules only one transition and advances once',()=>{const f=fixture();assert.equal(f.c.answer(),true);assert.equal(f.c.answer(),false);assert.equal(f.tasks.size,1);f.run();f.c.next();assert.equal(f.count,1);});
test('turning auto off preserves the answered question until manual next',()=>{const f=fixture();f.c.answer();assert.equal(f.c.toggle(),false);assert.equal(f.tasks.size,0);f.run();assert.equal(f.count,0);f.c.next();assert.equal(f.count,1);});
test('closing the quiz cancels pending advance even if an old callback fires',()=>{const f=fixture();f.c.answer();const callback=[...f.tasks.values()][0];f.c.dispose();callback();assert.equal(f.count,0);assert.equal(f.tasks.size,0);});
test('turning auto on after answering schedules a fresh transition',()=>{const f=fixture(false);f.c.answer();assert.equal(f.tasks.size,0);assert.equal(f.c.toggle(),true);assert.equal(f.tasks.size,1);f.run();assert.equal(f.count,1);});
